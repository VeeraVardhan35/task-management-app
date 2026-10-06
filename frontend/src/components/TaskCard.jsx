import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#ef4444', bg: '#fef2f2' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fffbeb' },
  low:    { label: 'Low',    color: '#10b981', bg: '#f0fdf4' },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function TaskCard({ task, index, onEdit, onDelete }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {/* Priority badge */}
          <span
            className="priority-badge"
            style={{ color: priority.color, background: priority.bg }}
          >
            {priority.label}
          </span>

          {/* Title */}
          <h4 className="task-title">{task.title}</h4>

          {/* Description */}
          {task.description && (
            <p className="task-desc">{task.description}</p>
          )}

          {/* Footer: due date + assignee + actions */}
          <div className="task-footer">
            <div className="task-meta">
              {task.due_date && (
                <span className={`due-date ${overdue ? 'overdue' : ''}`}>
                  📅 {formatDate(task.due_date)}
                  {overdue && ' ⚠️'}
                </span>
              )}
              {task.assigned_user_name && (
                <span
                  className="assignee-chip"
                  style={{ background: task.assigned_user_avatar_color || '#6366f1' }}
                  title={task.assigned_user_name}
                >
                  {task.assigned_user_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="task-actions">
              <button
                className="btn-icon"
                onClick={() => onEdit(task)}
                title="Edit task"
                id={`edit-task-${task.id}`}
              >
                ✏️
              </button>
              <button
                className="btn-icon btn-danger"
                onClick={() => onDelete(task.id)}
                title="Delete task"
                id={`delete-task-${task.id}`}
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
