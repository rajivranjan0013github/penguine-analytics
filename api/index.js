import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getSummary } from './controllers/analyticsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config(); 
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to igbackend MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

app.use(cors());
app.use(express.json());

// --- Analytics Routes ---
app.get('/api/analytics/summary', getSummary);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Analytics Backend is running' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Analytics Server is running on port ${PORT}`);
  });
}

export default app;
