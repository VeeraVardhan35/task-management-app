const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET a single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /users/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, avatar_color } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const result = await pool.query(
      'INSERT INTO users (name, email, avatar_color) VALUES ($1, $2, $3) RETURNING *',
      [name, email, avatar_color || '#6366f1']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('POST /users error:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update a user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, avatar_color } = req.body;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        avatar_color = COALESCE($3, avatar_color)
       WHERE id = $4 RETURNING *`,
      [name, email, avatar_color, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /users/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE a user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (err) {
    console.error('DELETE /users/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
