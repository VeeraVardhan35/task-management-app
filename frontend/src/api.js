import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const getTasks = (params) => api.get('/tasks', { params });
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const moveTask = (id, data) => api.patch(`/tasks/${id}/move`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const getWorkload = (params) => api.get('/tasks/workload/users', { params });

// ─── Projects ─────────────────────────────────────────────────────────────────
export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addMember = (projectId, data) => api.post(`/projects/${projectId}/members`, data);
export const removeMember = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`);

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

export default api;
