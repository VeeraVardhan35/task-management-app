import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import TaskModal from './TaskModal';
import TeamList from './TeamList';
import AddUserModal from './AddUserModal';
import AppLogo from './AppLogo';
import {
  getTasks, createTask, updateTask, moveTask, deleteTask, getWorkload,
  getProjects, createProject, addMember,
  getUsers, createUser,
} from '../api';

const COLUMNS = ['todo', 'inprogress', 'done'];

const PRIORITY_LABELS = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };

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
  const [boardLoading, setBoardLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (projectId) => {
    try {
      setError('');
      setBoardLoading(true);
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
      setError('Failed to load tasks. Is the backend running? (http://localhost:5000)');
    } finally {
      setBoardLoading(false);
    }
  }, [filterPriority]);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
      return res.data;
    } catch (err) {
      setError('Failed to load projects. Is the backend running?');
      return [];
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

  // ─── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [projs] = await Promise.all([fetchProjects(), fetchUsers()]);
      if (projs.length > 0) {
        setSelectedProject(projs[0].id);
      }
      setLoading(false);
    };
    init();
  }, []);

  // ─── Refetch tasks when project or filter changes ─────────────────────────
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
    const oldStatus = source.droppableId;

    // Optimistic UI update — move the card immediately
    setTasks((prev) => {
      const moving = prev.find((t) => t.id === taskId);
      if (!moving) return prev;
      const updated = prev.filter((t) => t.id !== taskId);
      const movedTask = { ...moving, status: newStatus, position: destination.index };
      updated.splice(
        updated.filter((t) => t.status === newStatus).length - 1 + destination.index,
        0,
        movedTask
      );
      return updated.map((t) =>
        t.id === taskId ? movedTask : t
      );
    });

    try {
      await moveTask(taskId, { status: newStatus, position: destination.index });
      // Refresh workload counter after a status change
      if (oldStatus !== newStatus) {
        const workloadRes = await getWorkload({ project_id: selectedProject });
        setWorkload(workloadRes.data);
        // Also refresh projects to update task count badge in sidebar
        fetchProjects();
      }
    } catch (err) {
      setError('Failed to move task. Please try again.');
      fetchAll(selectedProject);
    }
  };

  // ─── Task CRUD ─────────────────────────────────────────────────────────────
  const handleSaveTask = async (formData) => {
    if (taskModal.task) {
      await updateTask(taskModal.task.id, formData);
    } else {
      await createTask({ ...formData, project_id: selectedProject });
    }
    await fetchAll(selectedProject);
    await fetchProjects(); // refresh sidebar task count
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      const [workloadRes] = await Promise.all([
        getWorkload({ project_id: selectedProject }),
        fetchProjects(),
      ]);
      setWorkload(workloadRes.data);
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  // ─── Project CRUD ──────────────────────────────────────────────────────────
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await createProject({ name: newProjectName });
      await fetchProjects();
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
    // Refresh workload so the new member appears in the team list
    const workloadRes = await getWorkload({ project_id: selectedProject });
    setWorkload(workloadRes.data);
  };

  const handleCreateUser = async (userData) => {
    const res = await createUser(userData);
    setUsers((prev) => [...prev, res.data]);
    await addMember(selectedProject, { user_id: res.data.id });
    const workloadRes = await getWorkload({ project_id: selectedProject });
    setWorkload(workloadRes.data);
  };

  // ─── Clear priority filter ──────────────────────────────────────────────────
  const clearFilter = () => setFilterPriority('');

  // ─── Derived: group tasks by column ───────────────────────────────────────
  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks
      .filter((t) => t.status === col)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {});

  const currentProject = projects.find((p) => p.id === selectedProject);
  const totalTasks = tasks.length;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Connecting to TaskFlow...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ─── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <AppLogo size={34} />
          <div className="logo-details">
            <span className="logo-text">TaskFlow</span>
            <span className="logo-subtext">Workload OS</span>
          </div>
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

        {/* ── Filter Panel ────────────────────────────────────────────── */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>Filter by Priority</span>
            {filterPriority && (
              <button className="btn-clear-filter" onClick={clearFilter} title="Clear filter" id="clear-filter-btn">
                ✕ Clear
              </button>
            )}
          </div>
          <div className="priority-filter-list">
            {['high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                className={`priority-filter-btn priority-${p} ${filterPriority === p ? 'active' : ''}`}
                onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
                id={`filter-${p}`}
              >
                {PRIORITY_LABELS[p]}
                {filterPriority === p && <span className="filter-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Team Workload — Vibe Check feature */}
        <TeamList workload={workload} projectName={currentProject?.name} />
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="main-content">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <h1 className="board-title">
              {currentProject ? currentProject.name : 'Select a Project'}
            </h1>
            <div className="board-meta">
              {filterPriority && (
                <span className="active-filter-badge">
                  Filtering: {PRIORITY_LABELS[filterPriority]}
                  <button onClick={clearFilter} className="filter-badge-clear" id="filter-badge-clear">✕</button>
                </span>
              )}
              <span className="task-total">{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="toolbar-right">
            {/* Add User to Project */}
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

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Board loading indicator */}
        {boardLoading && <div className="board-loading-bar" />}

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
                  filterActive={!!filterPriority}
                />
              ))}
            </div>
          </DragDropContext>
        ) : (
          <div className="no-project">
            <div className="no-project-icon">📋</div>
            <h2>No Project Selected</h2>
            <p>Create a new project using the <strong>+</strong> button in the sidebar, or click an existing one.</p>
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
