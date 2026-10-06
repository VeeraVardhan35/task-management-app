import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import TaskModal from './TaskModal';
import TeamList from './TeamList';
import AddUserModal from './AddUserModal';
import {
  getTasks, createTask, updateTask, moveTask, deleteTask, getWorkload,
  getProjects, createProject, addMember,
  getUsers, createUser,
} from '../api';

const COLUMNS = ['todo', 'inprogress', 'done'];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterPriority, setFilterPriority] = useState('');

  // Modals
  const [taskModal, setTaskModal] = useState({ open: false, task: null, defaultStatus: 'todo' });
  const [userModal, setUserModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showProjectInput, setShowProjectInput] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (projectId) => {
    try {
      setError('');
      const params = {};
      if (projectId) params.project_id = projectId;
      if (filterPriority) params.priority = filterPriority;

      const [tasksRes, workloadRes] = await Promise.all([
        getTasks(params),
        getWorkload(projectId ? { project_id: projectId } : {}),
      ]);
      setTasks(tasksRes.data);
      setWorkload(workloadRes.data);
    } catch (err) {
      setError('Failed to load tasks. Check your API connection.');
    }
  }, [filterPriority]);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProject) {
        setSelectedProject(res.data[0].id);
      }
    } catch (err) {
      setError('Failed to load projects.');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchUsers()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedProject !== null) {
      fetchAll(selectedProject);
    }
  }, [selectedProject, fetchAll]);

  // ─── Drag & Drop ───────────────────────────────────────────────────────────
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, position: destination.index } : t
      )
    );

    try {
      await moveTask(taskId, { status: newStatus, position: destination.index });
      // Refresh workload after move
      const workloadRes = await getWorkload(selectedProject ? { project_id: selectedProject } : {});
      setWorkload(workloadRes.data);
    } catch (err) {
      // Revert on failure
      setError('Failed to move task. Please try again.');
      fetchAll(selectedProject);
    }
  };

  // ─── Task CRUD ─────────────────────────────────────────────────────────────
  const handleSaveTask = async (formData) => {
    if (taskModal.task) {
      // Edit
      await updateTask(taskModal.task.id, formData);
    } else {
      // Create
      await createTask({ ...formData, project_id: selectedProject });
    }
    await fetchAll(selectedProject);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      const workloadRes = await getWorkload(selectedProject ? { project_id: selectedProject } : {});
      setWorkload(workloadRes.data);
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  // ─── Project creation ──────────────────────────────────────────────────────
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await createProject({ name: newProjectName });
      setProjects((prev) => [...prev, res.data]);
      setSelectedProject(res.data.id);
      setNewProjectName('');
      setShowProjectInput(false);
    } catch (err) {
      setError('Failed to create project');
    }
  };

  // ─── Add user to project ───────────────────────────────────────────────────
  const handleAddUser = async (userId) => {
    await addMember(selectedProject, { user_id: userId });
    await fetchAll(selectedProject);
  };

  const handleCreateUser = async (userData) => {
    const res = await createUser(userData);
    setUsers((prev) => [...prev, res.data]);
    await addMember(selectedProject, { user_id: res.data.id });
    await fetchAll(selectedProject);
  };

  // ─── Derived: group tasks by column ───────────────────────────────────────
  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks
      .filter((t) => t.status === col)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {});

  const currentProject = projects.find((p) => p.id === selectedProject);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">TaskFlow</span>
        </div>

        {/* Projects */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>Projects</span>
            <button
              className="btn-icon-sm"
              onClick={() => setShowProjectInput(!showProjectInput)}
              id="new-project-btn"
              title="New project"
            >
              +
            </button>
          </div>
          {showProjectInput && (
            <div className="project-input-row">
              <input
                type="text"
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                id="project-name-input"
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={handleCreateProject} id="create-project-btn">
                Create
              </button>
            </div>
          )}
          <ul className="project-list">
            {projects.map((p) => (
              <li
                key={p.id}
                className={`project-item ${selectedProject === p.id ? 'active' : ''}`}
                onClick={() => setSelectedProject(p.id)}
                id={`project-${p.id}`}
              >
                <span className="project-dot" />
                <span className="project-name">{p.name}</span>
                <span className="project-task-count">{p.task_count || 0}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Team Workload (Vibe Check) */}
        <TeamList workload={workload} />
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="main-content">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <h1 className="board-title">
              {currentProject ? currentProject.name : 'Select a Project'}
            </h1>
          </div>
          <div className="toolbar-right">
            {/* Priority Filter */}
            <select
              className="filter-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              id="priority-filter"
            >
              <option value="">All Priorities</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            {/* Add User */}
            <button
              className="btn btn-secondary"
              onClick={() => setUserModal(true)}
              disabled={!selectedProject}
              id="add-user-btn"
            >
              👤 Add User
            </button>
            {/* Create Task */}
            <button
              className="btn btn-primary"
              onClick={() => setTaskModal({ open: true, task: null, defaultStatus: 'todo' })}
              disabled={!selectedProject}
              id="create-task-btn"
            >
              + New Task
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Kanban Board */}
        {selectedProject ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
              {COLUMNS.map((col) => (
                <Column
                  key={col}
                  columnId={col}
                  tasks={tasksByColumn[col]}
                  onEdit={(task) => setTaskModal({ open: true, task, defaultStatus: task.status })}
                  onDelete={handleDeleteTask}
                  onAddTask={(status) => setTaskModal({ open: true, task: null, defaultStatus: status })}
                />
              ))}
            </div>
          </DragDropContext>
        ) : (
          <div className="no-project">
            <div className="no-project-icon">📋</div>
            <h2>No Project Selected</h2>
            <p>Create a new project or select one from the sidebar.</p>
          </div>
        )}
      </main>

      {/* ─── Modals ───────────────────────────────────────────────────── */}
      <TaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, defaultStatus: 'todo' })}
        onSave={handleSaveTask}
        task={taskModal.task}
        users={users}
        projectId={selectedProject}
        defaultStatus={taskModal.defaultStatus}
      />

      <AddUserModal
        isOpen={userModal}
        onClose={() => setUserModal(false)}
        onAddUser={handleAddUser}
        onCreateUser={handleCreateUser}
        users={users}
      />
    </div>
  );
}
