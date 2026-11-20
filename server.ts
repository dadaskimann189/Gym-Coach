import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

const DATA_DIR = path.resolve(__dirname, '.data');
const DATA_FILE = path.join(DATA_DIR, 'users_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDB(): Record<string, any> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed reading DB:', err);
  }
  return {};
}

function saveDB(db: Record<string, any>) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing DB:', err);
  }
}

// API Routes
app.get('/api/users/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email).toLowerCase().trim();
  const db = loadDB();
  const userData = db[email];
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(userData);
});

app.post('/api/users/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email).toLowerCase().trim();
  const { user, workouts, weightHistory, personalRecords } = req.body;
  if (!user) {
    return res.status(400).json({ error: 'User data required' });
  }

  const db = loadDB();
  db[email] = {
    user,
    workouts: workouts || [],
    weightHistory: weightHistory || [],
    personalRecords: personalRecords || [],
    updatedAt: new Date().toISOString(),
  };
  saveDB(db);

  return res.json({ success: true, data: db[email] });
});

// Health check for Cloud Run container wake-up & liveness
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Service Worker must not be cached aggressively
    app.use((req, res, next) => {
      if (req.url === '/sw.js' || req.url.startsWith('/workbox-')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Service-Worker-Allowed', '/');
      }
      next();
    });

    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
