import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — whitelist de origens permitidas
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Permite requests sem origin (curl, server-to-server, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));

// Database file path (JSON file for simplicity)
const DB_DIR = join(__dirname, 'db');
const DB_FILE = join(DB_DIR, 'database.json');

// Initial database structure
const INITIAL_DB = {
  contacts: [],
  conversations: [],
  tasks: [],
  users: [],
  templates: [],
  aiconfigs: [],
  notifications: [],
};

// Ensure database directory and file exist
async function initDatabase() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });

    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
      console.log('📦 Database initialized');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Read database
async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { ...INITIAL_DB };
  }
}

// Write database
async function writeDB(data) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
}

// Generate ID
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Parse sort parameter
function parseSort(sortParam) {
  if (!sortParam) return { field: 'created_date', direction: 'desc' };
  const direction = sortParam.startsWith('-') ? 'desc' : 'asc';
  const field = sortParam.startsWith('-') ? sortParam.slice(1) : sortParam;
  return { field, direction };
}

// Sort array
function sortArray(array, sortParam) {
  const { field, direction } = parseSort(sortParam);
  return [...array].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (direction === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
}

// Generic CRUD factory
function createCRUDRoutes(entityName, collectionName) {
  const router = express.Router();

  // List
  router.get('/', async (req, res) => {
    try {
      const db = await readDB();
      const { sort, limit, ...filters } = req.query;

      let items = db[collectionName] || [];

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        items = items.filter((item) => item[key] == value);
      });

      // Sort
      items = sortArray(items, sort);

      // Limit
      if (limit) {
        items = items.slice(0, parseInt(limit, 10));
      }

      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get by ID
  router.get('/:id', async (req, res) => {
    try {
      const db = await readDB();
      const item = (db[collectionName] || []).find((i) => i.id === req.params.id);

      if (!item) {
        return res.status(404).json({ error: `${entityName} not found` });
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create
  router.post('/', async (req, res) => {
    try {
      const db = await readDB();
      if (!db[collectionName]) db[collectionName] = [];

      const now = new Date().toISOString();
      const newItem = {
        id: generateId(),
        ...req.body,
        created_date: now,
        updated_date: now,
      };

      db[collectionName].push(newItem);
      await writeDB(db);

      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update
  router.put('/:id', async (req, res) => {
    try {
      const db = await readDB();
      if (!db[collectionName]) db[collectionName] = [];

      const index = db[collectionName].findIndex((i) => i.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ error: `${entityName} not found` });
      }

      db[collectionName][index] = {
        ...db[collectionName][index],
        ...req.body,
        updated_date: new Date().toISOString(),
      };

      await writeDB(db);
      res.json(db[collectionName][index]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete
  router.delete('/:id', async (req, res) => {
    try {
      const db = await readDB();
      if (!db[collectionName]) db[collectionName] = [];

      const index = db[collectionName].findIndex((i) => i.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ error: `${entityName} not found` });
      }

      const deleted = db[collectionName].splice(index, 1)[0];
      await writeDB(db);

      res.json(deleted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTH ROUTES (simplificado para desenvolvimento)
// ============================================================================

app.get('/api/auth/me', async (req, res) => {
  // Em desenvolvimento, retorna usuário mock
  // Em produção, verificar token JWT
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Simula verificação de token
    const db = await readDB();
    const user = db.users?.[0] || {
      id: 'dev-user-1',
      email: 'dev@example.com',
      full_name: 'Usuário Dev',
      role: 'admin',
      status: 'online',
    };
    res.json(user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.put('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const db = await readDB();
    // Find the first user (simplified - in production, decode JWT)
    if (db.users && db.users.length > 0) {
      db.users[0] = {
        ...db.users[0],
        ...req.body,
        updated_date: new Date().toISOString(),
      };
      await writeDB(db);
      res.json(db.users[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Em desenvolvimento, aceita qualquer login
  // Em produção, verificar credenciais no banco
  const db = await readDB();
  let user = db.users?.find((u) => u.email === email);

  if (!user) {
    // Cria usuário se não existir (modo dev)
    user = {
      id: generateId(),
      email,
      full_name: email.split('@')[0],
      role: 'admin',
      status: 'online',
      created_date: new Date().toISOString(),
    };
    if (!db.users) db.users = [];
    db.users.push(user);
    await writeDB(db);
  }

  // Gera token simples (em produção, usar JWT)
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

  res.json({ user, token });
});

// ============================================================================
// ENTITY ROUTES
// ============================================================================

app.use('/api/contacts', createCRUDRoutes('Contact', 'contacts'));
app.use('/api/conversations', createCRUDRoutes('Conversation', 'conversations'));
app.use('/api/tasks', createCRUDRoutes('Task', 'tasks'));
app.use('/api/users', createCRUDRoutes('User', 'users'));
app.use('/api/templates', createCRUDRoutes('Template', 'templates'));
app.use('/api/aiconfigs', createCRUDRoutes('AIConfig', 'aiconfigs'));
app.use('/api/notifications', createCRUDRoutes('Notification', 'notifications'));

// ============================================================================
// ADMIN MIDDLEWARE - Protege rotas administrativas com ADMIN_SECRET
// ============================================================================

function requireAdmin(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminSecret = process.env.ADMIN_SECRET;

  // Em produção, bloqueia se ADMIN_SECRET não estiver configurado
  if (isProduction && !adminSecret) {
    return res.status(403).json({ error: 'Admin routes are disabled in production' });
  }

  // Se ADMIN_SECRET está configurado, exige o header
  if (adminSecret) {
    const provided = req.headers['x-admin-secret'];
    if (provided !== adminSecret) {
      return res.status(401).json({ error: 'Invalid or missing admin secret' });
    }
  }

  next();
}

// ============================================================================
// SEED ROUTE - Initialize with mock data (protegido)
// ============================================================================

app.post('/api/seed', requireAdmin, async (req, res) => {
  try {
    const db = await readDB();

    // Seed each collection if provided
    const collections = ['contacts', 'conversations', 'tasks', 'users', 'templates', 'aiconfigs', 'notifications'];

    for (const collection of collections) {
      if (req.body[collection] && Array.isArray(req.body[collection])) {
        // Only seed if collection is empty
        if (!db[collection] || db[collection].length === 0) {
          db[collection] = req.body[collection];
        }
      }
    }

    await writeDB(db);

    res.json({
      message: 'Database seeded successfully',
      counts: Object.fromEntries(collections.map((c) => [c, (db[c] || []).length])),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RESET ROUTE - Clear database (protegido)
// ============================================================================

app.post('/api/reset', requireAdmin, async (req, res) => {
  try {
    await writeDB({ ...INITIAL_DB });
    res.json({ message: 'Database reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📦 Database: ${DB_FILE}`);
    console.log(`✅ API ready at http://localhost:${PORT}/api`);
  });
});
