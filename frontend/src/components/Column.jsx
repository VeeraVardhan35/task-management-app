import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const COLUMN_CONFIG = {
  todo:       { label: 'To-Do',       color: '#6366f1', icon: '📋' },
  inprogress: { label: 'In Progress', color: '#f59e0b', icon: '⚡' },
  done:       { label: 'Done',        color: '#10b981', icon: '✅' },
};

export default function Column({ columnId, tasks, onEdit, onDelete, onAddTask }) {
  const config = COLUMN_CONFIG[columnId];

  return (
    <div className="column">
      {/* Column Header */}
      <div className="column-header" style={{ borderTopColor: config.color }}>
        <div className="column-title-row">
          <span className="column-icon">{config.icon}</span>
          <h3 className="column-title">{config.label}</h3>
          <span
            className="column-count"
            style={{ background: config.color }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          className="btn-add-task"
          onClick={() => onAddTask(columnId)}
          id={`add-task-${columnId}`}
          title={`Add task to ${config.label}`}
          style={{ borderColor: config.color, color: config.color }}
        >
          + Add Task
        </button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            className={`task-list ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length === 0 && (
              <div className="empty-column">
                <p>No tasks here</p>
                <small>Drop tasks here or click "+ Add Task"</small>
              </div>
            )}
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
