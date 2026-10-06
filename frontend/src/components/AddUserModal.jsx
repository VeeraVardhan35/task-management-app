import React, { useState, useEffect } from 'react';

export default function AddUserModal({ isOpen, onClose, onAddUser, onCreateUser, users }) {
  const [tab, setTab] = useState('existing'); // 'existing' | 'new'
  const [selectedUser, setSelectedUser] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', avatar_color: '#6366f1' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

  useEffect(() => {
    if (!isOpen) {
      setSelectedUser('');
      setNewUser({ name: '', email: '', avatar_color: '#6366f1' });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddExisting = async () => {
    if (!selectedUser) { setError('Please select a user'); return; }
    setLoading(true);
    try {
      await onAddUser(parseInt(selectedUser));
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user');
    } finally { setLoading(false); }
  };

  const handleCreateNew = async () => {
    if (!newUser.name || !newUser.email) { setError('Name and email are required'); return; }
    setLoading(true);
    try {
      await onCreateUser(newUser);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">👤 Add Team Member</h2>
          <button className="modal-close" onClick={onClose} id="add-user-close-btn">✕</button>
        </div>

        <div className="tab-row">
          <button
            className={`tab-btn ${tab === 'existing' ? 'active' : ''}`}
            onClick={() => setTab('existing')}
            id="tab-existing"
          >
            Add Existing User
          </button>
          <button
            className={`tab-btn ${tab === 'new' ? 'active' : ''}`}
            onClick={() => setTab('new')}
            id="tab-new"
          >
            Create New User
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {tab === 'existing' ? (
          <div className="modal-form">
            <div className="form-group">
              <label htmlFor="select-user">Select User</label>
              <select
                id="select-user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">-- Choose a user --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddExisting} disabled={loading} id="add-existing-user-btn">
                {loading ? 'Adding...' : 'Add to Project'}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-form">
            <div className="form-group">
              <label htmlFor="new-user-name">Full Name *</label>
              <input
                id="new-user-name"
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-user-email">Email *</label>
              <input
                id="new-user-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label>Avatar Color</label>
              <div className="color-picker">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${newUser.avatar_color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewUser((p) => ({ ...p, avatar_color: c }))}
                    id={`color-${c.replace('#','')}`}
                  />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateNew} disabled={loading} id="create-new-user-btn">
                {loading ? 'Creating...' : 'Create & Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
