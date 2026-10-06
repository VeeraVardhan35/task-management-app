import React, { useState, useEffect } from 'react';

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
];

export default function TaskModal({ isOpen, onClose, onSave, task, users, projectId, defaultStatus }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: defaultStatus || 'todo',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        assigned_to: task.assigned_to || '',
      });
    } else {
      setForm({
        title: '',
        description: '',
        status: defaultStatus || 'todo',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
      });
    }
    setError('');
  }, [task, isOpen, defaultStatus]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        project_id: projectId,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? '✏️ Edit Task' : '➕ Create Task'}</h2>
          <button className="modal-close" onClick={onClose} id="modal-close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select id="task-status" name="status" value={form.status} onChange={handleChange}>
                <option value="todo">📋 To-Do</option>
                <option value="inprogress">⚡ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-due-date">Due Date</label>
              <input
                id="task-due-date"
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-assigned">Assign To</label>
              <select id="task-assigned" name="assigned_to" value={form.assigned_to} onChange={handleChange}>
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} id="cancel-task-btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-task-btn">
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
