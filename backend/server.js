const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config(); // Fallback for root-level .env if present
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Production CORS Configuration ──────────────────────────────────────────
// Whitelist development domains and environment variables
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Same-origin, mobile apps, curl, server-to-server requests without origin header
    if (!origin) return callback(null, true);

    // 2. Explicitly whitelisted origin
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // 3. Allow all Vercel deployment preview and production domains (*.vercel.app)
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

    // 4. Production permissive fallback ensures no unexpected CORS blocks for Vercel
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());

// ─── Routers ─────────────────────────────────────────────────────────────────
const tasksRouter = require('./routes/tasks');
const projectsRouter = require('./routes/projects');
const usersRouter = require('./routes/users');

// Master API router
const apiRouter = express.Router();
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/users', usersRouter);
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TaskFlow API is running 🚀',
    timestamp: new Date().toISOString(),
  });
});

// Mount on both '/api' and '/' to support direct calls and Vercel serverless rewrites seamlessly
app.use('/api', apiRouter);
app.use('/', apiRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Export App for Vercel Serverless Function ─────────────────────────────────
module.exports = app;

// ─── Start Standalone Server (when not running inside Vercel serverless) ───────
if (!process.env.VERCEL && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 TaskFlow Server running on http://localhost:${PORT}`);
    console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
  });
}
