require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔌 Connected to PostgreSQL...\n');

    // ── Create Tables ──────────────────────────────────────────────────
    console.log('📦 Creating tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        avatar_color VARCHAR(20) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  ✅ users table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  ✅ projects table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'inprogress', 'done')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        due_date DATE,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
        position INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  ✅ tasks table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      );
    `);
    console.log('  ✅ project_members table');

    // ── Create Indexes ─────────────────────────────────────────────────
    console.log('\n📑 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pm_project_id ON project_members(project_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pm_user_id ON project_members(user_id);`);
    console.log('  ✅ All indexes created');

    // ── Seed Users ─────────────────────────────────────────────────────
    console.log('\n🌱 Seeding users...');
    const usersResult = await client.query(`
      INSERT INTO users (name, email, avatar_color) VALUES
        ('Alice Johnson', 'alice@example.com', '#6366f1'),
        ('Bob Smith',     'bob@example.com',   '#10b981'),
        ('Carol White',   'carol@example.com',  '#f59e0b'),
        ('David Lee',     'david@example.com',  '#ef4444'),
        ('Eva Martinez',  'eva@example.com',    '#8b5cf6')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name;
    `);
    usersResult.rows.forEach(u => console.log(`  ✅ User: ${u.name} (id: ${u.id})`));

    // Fetch all user IDs (including pre-existing ones)
    const { rows: users } = await client.query('SELECT id, name FROM users ORDER BY id LIMIT 5');
    const [alice, bob, carol, david, eva] = users;

    // ── Seed Projects ──────────────────────────────────────────────────
    console.log('\n🌱 Seeding projects...');
    const projResult = await client.query(`
      INSERT INTO projects (name, description, created_by) VALUES
        ('TaskFlow Launch', 'Main product launch project', $1),
        ('Marketing Campaign', 'Q4 marketing push', $2)
      ON CONFLICT DO NOTHING
      RETURNING id, name;
    `, [alice?.id ?? null, bob?.id ?? null]);
    projResult.rows.forEach(p => console.log(`  ✅ Project: ${p.name} (id: ${p.id})`));

    // Fetch project IDs
    const { rows: projects } = await client.query('SELECT id, name FROM projects ORDER BY id LIMIT 2');
    const [proj1, proj2] = projects;

    if (!proj1) {
      console.log('\n⚠️  Projects already exist — skipping member & task seed.');
    } else {
      // ── Seed Project Members ───────────────────────────────────────────
      console.log('\n🌱 Adding project members...');
      const memberInserts = [];
      if (alice) memberInserts.push([proj1.id, alice.id, 'owner']);
      if (bob)   memberInserts.push([proj1.id, bob.id,   'member']);
      if (carol) memberInserts.push([proj1.id, carol.id, 'member']);
      if (david) memberInserts.push([proj1.id, david.id, 'member']);
      if (bob)   memberInserts.push([proj2?.id, bob.id,   'owner']);
      if (eva)   memberInserts.push([proj2?.id, eva.id,   'member']);

      for (const [pid, uid, role] of memberInserts) {
        if (!pid || !uid) continue;
        await client.query(
          `INSERT INTO project_members (project_id, user_id, role)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [pid, uid, role]
        );
      }
      console.log('  ✅ Members added');

      // ── Seed Tasks ─────────────────────────────────────────────────────
      console.log('\n🌱 Seeding tasks for project 1...');
      const tasks = [
        // To-Do
        { title: 'Design landing page mockup', description: 'Create wireframes and high-fidelity mockups for the homepage.', status: 'todo', priority: 'high', due_date: '2026-10-15', assigned_to: alice?.id, position: 0 },
        { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', status: 'todo', priority: 'medium', due_date: '2026-10-18', assigned_to: bob?.id, position: 1 },
        { title: 'Write API documentation', description: 'Document all endpoints using Swagger/OpenAPI spec.', status: 'todo', priority: 'low', due_date: '2026-10-20', assigned_to: carol?.id, position: 2 },

        // In Progress
        { title: 'Build Kanban board UI', description: 'Implement drag-and-drop Kanban board with React.', status: 'inprogress', priority: 'high', due_date: '2026-10-10', assigned_to: alice?.id, position: 0 },
        { title: 'Connect PostgreSQL backend', description: 'Integrate Neon.tech database with Express API.', status: 'inprogress', priority: 'high', due_date: '2026-10-08', assigned_to: bob?.id, position: 1 },
        { title: 'User authentication flow', description: 'Implement login/register with JWT tokens.', status: 'inprogress', priority: 'medium', due_date: '2026-10-12', assigned_to: david?.id, position: 2 },

        // Done
        { title: 'Project repository setup', description: 'Initialize Git repo, folder structure, and README.', status: 'done', priority: 'low', due_date: null, assigned_to: alice?.id, position: 0 },
        { title: 'Requirements gathering', description: 'Finalized feature list and acceptance criteria.', status: 'done', priority: 'medium', due_date: null, assigned_to: carol?.id, position: 1 },
      ];

      for (const t of tasks) {
        await client.query(
          `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [t.title, t.description, t.status, t.priority, t.due_date, proj1.id, t.assigned_to ?? null, t.position]
        );
        console.log(`  ✅ Task [${t.status.toUpperCase()}]: ${t.title}`);
      }
    }

    console.log('\n🎉 Database initialized successfully!');
    console.log('   You can now start both servers and open http://localhost:5173\n');
  } catch (err) {
    console.error('\n❌ Error initializing database:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
