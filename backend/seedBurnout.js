require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seedBurnout() {
  const client = await pool.connect();
  try {
    console.log('🔌 Connected to PostgreSQL...\n');

    // Get Alice's ID (she will be overloaded)
    const { rows: users } = await client.query('SELECT id, name FROM users ORDER BY id');
    const alice = users.find(u => u.name === 'Alice Johnson');
    const bob   = users.find(u => u.name === 'Bob Smith');
    const david = users.find(u => u.name === 'David Lee');

    if (!alice) { console.error('❌ Alice not found. Run initDb.js first.'); return; }

    // Get project 1 ID
    const { rows: projects } = await client.query('SELECT id FROM projects ORDER BY id LIMIT 1');
    const proj1 = projects[0];
    if (!proj1) { console.error('❌ No projects found. Run initDb.js first.'); return; }

    console.log(`🔥 Adding overload tasks for ${alice.name} (id: ${alice.id})...`);
    console.log('   Goal: >5 In-Progress tasks → triggers burnout pulse animation\n');

    // Add 6 more "inprogress" tasks for Alice (she already has 1, so total will be 7)
    const aliceBurnoutTasks = [
      { title: 'Fix critical production bug',         description: 'Memory leak causing server crashes every 2 hours.', priority: 'high',   due_date: '2026-10-07' },
      { title: 'Refactor authentication module',      description: 'Move from session-based auth to JWT tokens.', priority: 'high',   due_date: '2026-10-09' },
      { title: 'Code review for PR #42',              description: 'Review backend changes from team members.', priority: 'medium', due_date: '2026-10-08' },
      { title: 'Update dependencies & security audit',description: 'Bump all packages and fix 3 high vulnerabilities.', priority: 'high',   due_date: '2026-10-08' },
      { title: 'Write unit tests for API routes',     description: 'Achieve 80% test coverage for all Express routes.', priority: 'medium', due_date: '2026-10-11' },
      { title: 'Set up monitoring & alerting',        description: 'Configure Sentry for error tracking and Uptime alerts.', priority: 'medium', due_date: '2026-10-13' },
    ];

    let pos = 3; // Continue from existing positions
    for (const t of aliceBurnoutTasks) {
      await client.query(
        `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, position)
         VALUES ($1, $2, 'inprogress', $3, $4, $5, $6, $7)`,
        [t.title, t.description, t.priority, t.due_date, proj1.id, alice.id, pos++]
      );
      console.log(`  ✅ [ALICE - INPROGRESS] ${t.title}`);
    }

    // Also give Bob 4 in-progress (just under the limit - no pulse)
    console.log(`\n😐 Adding normal load for ${bob?.name} (id: ${bob?.id}) — 3 more In Progress (stays under limit)...`);
    if (bob) {
      const bobTasks = [
        { title: 'Configure Nginx reverse proxy', description: 'Set up Nginx to route API and frontend traffic.', priority: 'medium', due_date: '2026-10-14' },
        { title: 'Deploy staging environment',    description: 'Deploy to staging server and run smoke tests.',    priority: 'high',   due_date: '2026-10-10' },
        { title: 'Database backup automation',    description: 'Set up daily automated backups to S3.',            priority: 'low',    due_date: '2026-10-20' },
      ];
      let bpos = 2;
      for (const t of bobTasks) {
        await client.query(
          `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, position)
           VALUES ($1, $2, 'inprogress', $3, $4, $5, $6, $7)`,
          [t.title, t.description, t.priority, t.due_date, proj1.id, bob.id, bpos++]
        );
        console.log(`  ✅ [BOB - INPROGRESS] ${t.title}`);
      }
    }

    // A few more To-Do tasks
    console.log('\n📋 Adding extra To-Do tasks...');
    const todoTasks = [
      { title: 'Design email templates',     description: 'Create branded HTML email templates for notifications.', priority: 'low',    assigned_to: david?.id, due_date: '2026-10-25' },
      { title: 'Mobile responsiveness audit',description: 'Test and fix UI on iOS and Android browsers.',            priority: 'medium', assigned_to: alice.id,  due_date: '2026-10-22' },
      { title: 'Performance optimization',   description: 'Optimize bundle size and add lazy loading.',              priority: 'medium', assigned_to: bob?.id,   due_date: '2026-10-19' },
    ];
    let tpos = 3;
    for (const t of todoTasks) {
      await client.query(
        `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, position)
         VALUES ($1, $2, 'todo', $3, $4, $5, $6, $7)`,
        [t.title, t.description, t.priority, t.due_date, proj1.id, t.assigned_to ?? null, tpos++]
      );
      console.log(`  ✅ [TODO] ${t.title}`);
    }

    // Summary query
    console.log('\n📊 Current In-Progress task counts per user:');
    const { rows: workload } = await client.query(`
      SELECT u.name, COUNT(t.id) AS inprogress_count
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id AND t.status = 'inprogress'
      GROUP BY u.id, u.name
      ORDER BY inprogress_count DESC
    `);
    workload.forEach(w => {
      const count = parseInt(w.inprogress_count);
      const flag  = count > 5 ? ' 🔥 BURNOUT ALERT! (avatar will pulse red)' : count > 0 ? ' 😐 Normal' : ' 😴 No tasks';
      console.log(`  ${w.name.padEnd(20)} → ${count} in-progress${flag}`);
    });

    console.log('\n🎉 Done! Refresh http://localhost:5173 to see the burnout pulse on Alice\'s avatar.\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedBurnout();
