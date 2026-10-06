# ⬡ TaskFlow — Intelligent Kanban & Workload Management Platform

> A fullstack, production-grade Kanban productivity platform engineered for personal workflow and team workload balancing with real-time burnout detection. Built for the **Vibe Coding** assessment.

🔗 **Live Production Demo**: [https://task-management-app-tan-three.vercel.app/](https://task-management-app-tan-three.vercel.app/)  
📡 **API Health Endpoint**: [https://task-management-app-tan-three.vercel.app/api/health](https://task-management-app-tan-three.vercel.app/api/health)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Active-brightgreen?style=for-the-badge&logo=vercel)](https://task-management-app-tan-three.vercel.app/)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon.tech-0284c7.svg)
![License](https://img.shields.io/badge/License-MIT-purple.svg)

---

## 🌟 Live Demo & Architecture Highlights

TaskFlow combines a modern, drag-and-drop Kanban interface with a relational PostgreSQL backend. It features **Workload Balancing ("The Vibe Check")**, which actively monitors tasks per team member and triggers automated burnout alerts.

- **Live Application**: [https://task-management-app-tan-three.vercel.app/](https://task-management-app-tan-three.vercel.app/)
- **Backend API**: [https://task-management-app-tan-three.vercel.app/api/health](https://task-management-app-tan-three.vercel.app/api/health)

### ✨ Key Features

1. **Kanban Board**
   - Three standard workflow columns: `To-Do`, `In Progress`, and `Done`.
   - Smooth drag-and-drop powered by `@hello-pangea/dnd` with automatic position re-indexing.
   - Column-level task counters showing live distribution.

2. **Task Cards & Rich Metadata**
   - Individual task items with color-coded priority badges (`High`, `Medium`, `Low`).
   - Due dates with visual deadline alerts (`Due Soon`, `Overdue`).
   - Detailed descriptions, assigned user avatars, and easy modal editing/deletion.

3. **User & Project Controls**
   - Interactive project switcher with quick-create drawer.
   - User assignment management (add team members directly to projects).
   - Priority filter toolbar with active filter pill indicator and instant clear.

4. **"The Vibe Check" — Automated Workload Balancing & Burnout Protection**
   - Real-time aggregation of in-progress tasks per team member via SQL grouping.
   - **Visual Burnout Warning**: When any user has **more than 5 tasks in "In Progress"**, their avatar in the Team Workload panel flashes with an active pulsing red warning halo (`@keyframes burnout-pulse`).
   - Capacity progress bars visualizing individual load relative to safe capacity limits.

---

## 🏗️ System Architecture

TaskFlow is architected as a clean fullstack repository capable of running as independent microservices or deploying as a **unified single-application deployment on Vercel**:

```
task-management-app/
├── api/                  # Vercel Serverless Function entry point (/api/index.js)
├── backend/              # Node.js + Express.js REST API
│   ├── routes/           # Tasks, Projects, Users endpoints
│   ├── db.js             # PostgreSQL Pool (Neon.tech SSL connection)
│   ├── initDb.js         # Schema migration & relational seed runner
│   ├── seedBurnout.js    # Workload demonstration seed generator
│   └── server.js         # Production Express application with CORS & health checks
├── frontend/             # React 19 + Vite Application
│   ├── public/           # Custom rare vector favicon & logo assets
│   ├── src/
│   │   ├── components/   # KanbanBoard, Column, TaskCard, TeamList, AppLogo, Modals
│   │   ├── api.js        # Adaptive Axios client (works on local & production)
│   │   ├── App.css       # Obsidian & Glassmorphism Design System
│   │   └── main.jsx      # React entry point
├── package.json          # Monorepo build orchestrator
└── vercel.json           # Unified Vercel serverless routing & static build config
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ 
- A **PostgreSQL** database (e.g., free serverless instance on [Neon.tech](https://neon.tech))

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd task-management-app

# Install root, frontend, and backend dependencies
npm run install:all
```

### 3. Configure Environment Variables
Create `backend/.env` (or copy from `.env.example`):
```env
PORT=5000
DATABASE_URL=postgres://<user>:<password>@<neon-host>/neondb?sslmode=require
CLIENT_URL=http://localhost:5173
```

### 4. Initialize Database
Run the automated migration to create all relational tables and seed initial project data:
```bash
cd backend
npm run db:init
```

*(Optional)* To demonstrate the **Burnout Pulse Alert (>5 tasks in Progress)** immediately:
```bash
node seedBurnout.js
```

### 5. Launch Development Servers
Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## ☁️ Deploying to Vercel (Unified Fullstack Deployment)

This repository is pre-configured with `vercel.json` and `api/index.js` to deploy **both the frontend and backend together as ONE unified Vercel deployment**:

1. Push your code to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import your repository.
3. Keep the **Root Directory** as `./` (default). Vercel will automatically detect `vercel.json`.
4. In **Environment Variables**, add:
   - `DATABASE_URL` = Your Neon PostgreSQL connection string (`postgres://...`)
5. Click **Deploy**!
   - Frontend is built to static edge CDN.
   - Backend runs as serverless functions on `/api/*`.
   - **Zero CORS issues** because both frontend and API share the exact same origin!

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/projects` | Fetch all projects with task counts |
| `POST` | `/api/projects` | Create a new project |
| `POST` | `/api/projects/:id/members` | Assign a user to a project |
| `GET` | `/api/tasks?project_id=:id` | Fetch all tasks for a project |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update task details |
| `PATCH` | `/api/tasks/:id/move` | Update task column status & order |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/tasks/workload/users?project_id=:id` | Calculate in-progress task counts for Vibe Check |
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Register a new user |

---

## 🛡️ Security & Production Features
- **Adaptive CORS Middleware**: Supports local development, custom domains, and dynamic Vercel preview environments with full preflight handling.
- **Relational Integrity**: Foreign keys with `ON DELETE CASCADE` prevent orphaned records.
- **SSL Verification**: Built for Neon serverless PostgreSQL connections with TLS support.
- **Responsive Theme**: Dark-mode palette with modern glassmorphism and WCAG-compliant contrast.
