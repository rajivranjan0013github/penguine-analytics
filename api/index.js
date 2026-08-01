import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import { getSummary } from './controllers/analyticsController.js';
import { getUsers, getUserDetails } from './controllers/userController.js';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
const app = express();
const PORT = process.env.PORT || 5001;
const SESSION_COOKIE = 'penguine_admin_session';
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 10;
const loginAttempts = new Map();

let connectionPromise;
const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8_000,
  });

  try {
    await connectionPromise;
  } catch (err) {
    connectionPromise = undefined;
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Analytics API is running' });
});

const safeEqual = (provided, expected) => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer);
};

const getAdminCredentials = () => {
  const adminId = (process.env.ADMIN_ID || '').trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();

  if (!adminId || !adminPassword) {
    return null;
  }

  return { adminId, adminPassword };
};

const signSessionPayload = (payload, secret) => (
  createHmac('sha256', secret).update(payload).digest('base64url')
);

const createSessionToken = ({ adminId, adminPassword }) => {
  const payload = Buffer.from(JSON.stringify({
    id: adminId,
    expiresAt: Date.now() + (SESSION_DURATION_SECONDS * 1000),
  })).toString('base64url');
  return `${payload}.${signSessionPayload(payload, adminPassword)}`;
};

const getCookie = (req, name) => {
  const cookieHeader = req.headers.cookie || '';
  for (const cookie of cookieHeader.split(';')) {
    const [key, ...valueParts] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(valueParts.join('='));
  }
  return '';
};

const isValidSession = (token, credentials) => {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = signSessionPayload(payload, credentials.adminPassword);
  if (!safeEqual(signature, expectedSignature)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return safeEqual(String(session.id || ''), credentials.adminId)
      && Number(session.expiresAt) > Date.now();
  } catch {
    return false;
  }
};

const sessionCookie = (token, maxAge = SESSION_DURATION_SECONDS) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
};

const clientAddress = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
  .split(',')[0]
  .trim();

const loginIsRateLimited = (req) => {
  const key = clientAddress(req);
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > LOGIN_ATTEMPT_LIMIT;
};

const authenticateAdmin = (req, res, next) => {
  const credentials = getAdminCredentials();
  if (!credentials) {
    console.error('[AUTH] ADMIN_ID and ADMIN_PASSWORD must both be configured');
    return res.status(503).json({ error: 'Analytics authentication is not configured' });
  }

  const token = getCookie(req, SESSION_COOKIE);

  if (!isValidSession(token, credentials)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }

  next();
};

app.post('/api/auth/login', (req, res) => {
  const credentials = getAdminCredentials();
  if (!credentials) {
    console.error('[AUTH] ADMIN_ID and ADMIN_PASSWORD must both be configured');
    return res.status(503).json({ error: 'Analytics authentication is not configured' });
  }

  if (loginIsRateLimited(req)) {
    res.set('Retry-After', String(LOGIN_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Too many login attempts' });
  }

  const providedId = String(req.body?.id || '').trim();
  const providedPassword = String(req.body?.password || '').trim();
  if (!safeEqual(providedId, credentials.adminId)
    || !safeEqual(providedPassword, credentials.adminPassword)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }

  loginAttempts.delete(clientAddress(req));
  res.set('Set-Cookie', sessionCookie(createSessionToken(credentials)));
  return res.json({ authenticated: true });
});

app.get('/api/auth/session', authenticateAdmin, (req, res) => {
  res.json({ authenticated: true });
});

app.post('/api/auth/logout', (req, res) => {
  res.set('Set-Cookie', sessionCookie('', 0));
  res.status(204).end();
});

app.use('/api/analytics', authenticateAdmin);

app.use('/api/analytics', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// --- Analytics Routes ---
app.get('/api/analytics/summary', getSummary);
app.get('/api/analytics/users', getUsers);
app.get('/api/analytics/users/:id', getUserDetails);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
  });
}

export default app;
