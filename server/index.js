import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helmet — headers de segurança
app.use(helmet());

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
app.use(cookieParser());

// Rate limiting — limite global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Rate limiting — mais restritivo para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 tentativas de login por IP por 15min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

app.use('/api', globalLimiter);

// ============================================================================
// JWT AUTH MIDDLEWARE
// ============================================================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Cookie options para httpOnly
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: '/',
};

// Helper: seta o cookie auth_token na resposta
function setAuthCookie(res, token) {
  res.cookie('auth_token', token, COOKIE_OPTIONS);
}

// Helper: limpa o cookie auth_token
function clearAuthCookie(res) {
  res.clearCookie('auth_token', { path: '/' });
}

function authenticateToken(req, res, next) {
  // 1. Tenta ler do cookie httpOnly (preferido)
  let token = req.cookies?.auth_token;

  // 2. Fallback: Bearer header (para scripts/API clients externos)
  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ============================================================================
// VALIDAÇÃO DE INPUT — schemas zod
// ============================================================================

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(254).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  cpf: z.string().max(20).optional().or(z.literal('')),
  stage: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(5000).optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
  assigned_to: z.string().max(100).optional().or(z.literal('')),
}).passthrough(); // permite campos extras do frontend

const taskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional().or(z.literal('')),
  status: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
  due_date: z.string().max(50).optional().or(z.literal('')),
  contact_id: z.string().max(100).optional().or(z.literal('')),
  assigned_to: z.string().max(100).optional().or(z.literal('')),
}).passthrough();

const conversationSchema = z.object({
  contact_id: z.string().max(100).optional(),
  message: z.string().max(10000).optional().or(z.literal('')),
  channel: z.string().max(50).optional(),
  direction: z.string().max(20).optional(),
}).passthrough();

// Mapa de schemas por collection
const validationSchemas = {
  contacts: contactSchema,
  tasks: taskSchema,
  conversations: conversationSchema,
};

// Middleware de validação — aplica schema se existir para a collection
function validateBody(collectionName) {
  return (req, res, next) => {
    const schema = validationSchemas[collectionName];
    if (!schema || req.method === 'GET' || req.method === 'DELETE') return next();

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    req.body = result.data;
    next();
  };
}

// ============================================================================
// AUDIT LOG — registra ações de escrita
// ============================================================================

const AUDIT_LOG_FILE = join(__dirname, 'db', 'audit.log');

async function auditLog(action, { userId, userEmail, method, path, entityId, ip }) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    userId: userId || 'anonymous',
    userEmail: userEmail || 'unknown',
    method,
    path,
    entityId: entityId || null,
    ip,
  });

  try {
    await fs.appendFile(AUDIT_LOG_FILE, entry + '\n');
  } catch {
    console.error('Failed to write audit log');
  }
}

// Middleware de auditoria — registra POST, PUT, DELETE
function auditMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    res.json = (body) => {
      auditLog(req.method, {
        userId: req.user?.id,
        userEmail: req.user?.email,
        method: req.method,
        path: req.originalUrl,
        entityId: req.params?.id || body?.id,
        ip: req.ip,
      });
      return originalJson(body);
    };
  }

  next();
}

app.use('/api', auditMiddleware);

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
// AUTH ROUTES — JWT real com bcrypt
// ============================================================================

// Helper: gera JWT com dados do usuário
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper: retorna user sem o campo password_hash
function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/auth/register — criar conta com senha real
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await readDB();
    if (!db.users) db.users = [];

    if (db.users.find((u) => u.email === email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = {
      id: generateId(),
      email,
      full_name: full_name || email.split('@')[0],
      password_hash,
      role: db.users.length === 0 ? 'admin' : 'user', // primeiro user é admin
      status: 'online',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    db.users.push(user);
    await writeDB(db);

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login — login com verificação de senha
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await readDB();
    const user = db.users?.find((u) => u.email === email);

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout — limpa o cookie
app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me — usuário atual (requer JWT válido)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users?.find((u) => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/auth/me — atualizar perfil (requer JWT válido)
app.put('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = await readDB();
    const index = db.users?.findIndex((u) => u.id === req.user.id);

    if (index === -1 || index === undefined) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Não permite alterar campos sensíveis via esta rota
    const { password_hash, role, id, email, ...allowedUpdates } = req.body;

    db.users[index] = {
      ...db.users[index],
      ...allowedUpdates,
      updated_date: new Date().toISOString(),
    };

    await writeDB(db);
    res.json(sanitizeUser(db.users[index]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENTITY ROUTES
// ============================================================================

app.use('/api/contacts', authenticateToken, validateBody('contacts'), createCRUDRoutes('Contact', 'contacts'));
app.use('/api/conversations', authenticateToken, validateBody('conversations'), createCRUDRoutes('Conversation', 'conversations'));
app.use('/api/tasks', authenticateToken, validateBody('tasks'), createCRUDRoutes('Task', 'tasks'));
app.use('/api/users', authenticateToken, createCRUDRoutes('User', 'users'));
app.use('/api/templates', authenticateToken, createCRUDRoutes('Template', 'templates'));
app.use('/api/aiconfigs', authenticateToken, createCRUDRoutes('AIConfig', 'aiconfigs'));
app.use('/api/notifications', authenticateToken, createCRUDRoutes('Notification', 'notifications'));

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
