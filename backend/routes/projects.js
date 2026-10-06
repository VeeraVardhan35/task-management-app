const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all projects (with member count and task count)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COUNT(DISTINCT pm.user_id) AS member_count,
        COUNT(DISTINCT t.id) AS task_count
      FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /projects error:', err.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET single project with members
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectResult.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const membersResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar_color, pm.role
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
    `, [id]);

    res.json({ ...projectResult.rows[0], members: membersResult.rows });
  } catch (err) {
    console.error('GET /projects/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST create a new project
router.post('/', async (req, res) => {
  try {
    const { name, description, created_by } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const result = await pool.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, created_by || null]
    );
    const project = result.rows[0];

    // If created_by is provided, add them as owner
    if (created_by) {
      await pool.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [project.id, created_by, 'owner']
      );
    }

    res.status(201).json(project);
  } catch (err) {
    console.error('POST /projects error:', err.message);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT update a project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await pool.query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /projects/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE a project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted', project: result.rows[0] });
  } catch (err) {
    console.error('DELETE /projects/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST add a user to a project
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const result = await pool.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
       RETURNING *`,
      [id, user_id, role || 'member']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /projects/:id/members error:', err.message);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE remove a user from a project
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('DELETE /projects/:id/members/:userId error:', err.message);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
