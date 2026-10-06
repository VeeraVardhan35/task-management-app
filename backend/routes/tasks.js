const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all tasks (optionally filter by project and/or priority)
router.get('/', async (req, res) => {
  try {
    const { project_id, priority, status } = req.query;
    let query = `
      SELECT t.*, 
        u.name AS assigned_user_name,
        u.avatar_color AS assigned_user_avatar_color,
        p.name AS project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (project_id) {
      query += ` AND t.project_id = $${idx++}`;
      values.push(project_id);
    }
    if (priority) {
      query += ` AND t.priority = $${idx++}`;
      values.push(priority);
    }
    if (status) {
      query += ` AND t.status = $${idx++}`;
      values.push(status);
    }

    query += ' ORDER BY t.position ASC, t.created_at ASC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /tasks error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET single task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, 
        u.name AS assigned_user_name,
        u.avatar_color AS assigned_user_avatar_color
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /tasks/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, due_date, project_id, assigned_to } = req.body;

    if (!title || !project_id) {
      return res.status(400).json({ error: 'Title and project_id are required' });
    }

    // Get max position in the status column
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM tasks WHERE project_id = $1 AND status = $2',
      [project_id, status || 'todo']
    );
    const position = posResult.rows[0].next_pos;

    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description || null,
        status || 'todo',
        priority || 'medium',
        due_date || null,
        project_id,
        assigned_to || null,
        position,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /tasks error:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT update a task (edit details or move between columns)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, assigned_to, position } = req.body;

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date),
           assigned_to = $6,
           position = COALESCE($7, position),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, status, priority, due_date, assigned_to ?? null, position, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /tasks/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH update task status/position (for drag-and-drop)
router.patch('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, position } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });

    const result = await pool.query(
      `UPDATE tasks SET status = $1, position = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, position ?? 0, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /tasks/:id/move error:', err.message);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

// DELETE a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully', task: result.rows[0] });
  } catch (err) {
    console.error('DELETE /tasks/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// GET workload info: count of "inprogress" tasks per user (for Vibe Check)
// Shows only project members when project_id is given; global otherwise.
router.get('/workload/users', async (req, res) => {
  try {
    const { project_id } = req.query;
    let query;
    let values;

    if (project_id) {
      // Only show members of this project; count their in-progress tasks in this project
      query = `
        SELECT u.id, u.name, u.avatar_color,
               COUNT(t.id) AS inprogress_count
        FROM users u
        INNER JOIN project_members pm ON pm.user_id = u.id AND pm.project_id = $1
        LEFT JOIN tasks t
          ON t.assigned_to = u.id
          AND t.status = 'inprogress'
          AND t.project_id = $1
        GROUP BY u.id, u.name, u.avatar_color
        ORDER BY inprogress_count DESC, u.name ASC
      `;
      values = [project_id];
    } else {
      // Global view: all users
      query = `
        SELECT u.id, u.name, u.avatar_color,
               COUNT(t.id) AS inprogress_count
        FROM users u
        LEFT JOIN tasks t ON t.assigned_to = u.id AND t.status = 'inprogress'
        GROUP BY u.id, u.name, u.avatar_color
        ORDER BY inprogress_count DESC, u.name ASC
      `;
      values = [];
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /tasks/workload/users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch workload data' });
  }
});

module.exports = router;
