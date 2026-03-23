import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getSummary } from './controllers/analyticsController.js';
import { getUsers, getUserDetails } from './controllers/userController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config(); 
const MONGODB_URI = process.env.MONGODB_URI;
const app = express();
const PORT = process.env.PORT || 5001;

let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) return;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing!');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to igbackend MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

app.use(cors());
app.use(express.json());

// Ensure DB connection for all API routes
app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// --- Admin Password Protection Middleware ---
app.use('/api/analytics', (req, res, next) => {
  const adminId = (process.env.ADMIN_ID || '').trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  
  const providedId = (req.headers['x-admin-id'] || '').trim();
  const providedPassword = (req.headers['x-admin-password'] || '').trim();

  // Special case: if BOTH are empty on server, we should probably warn or allow?
  // Usually, a missing env var in prod means security is at risk.
  if (!adminId && !adminPassword) {
    console.warn('[AUTH] WARNING: Both ADMIN_ID and ADMIN_PASSWORD are MISSING in process.env!');
  }

  const idMatch = !adminId || providedId === adminId;
  const passwordMatch = !adminPassword || providedPassword === adminPassword;

  console.log(`[AUTH] Path: ${req.path} TargetIDLen: ${adminId.length} TargetPPLen: ${adminPassword.length}`, { 
    idMatch, 
    passwordMatch 
  });

  if (idMatch && passwordMatch) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
  }
});

// --- Analytics Routes ---
app.get('/api/analytics/summary', getSummary);
app.get('/api/analytics/users', getUsers);
app.get('/api/analytics/users/:id', getUserDetails);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Analytics Backend is running' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Analytics Server is running on port ${PORT}`);
  });
}

export default app;
