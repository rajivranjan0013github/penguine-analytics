# Penguine Analytics

Private product analytics dashboard built with React, Express, and MongoDB.

## Structure
- **Root**: Vite + React frontend files.
- **`api/`**: Express backend (designed for Vercel functions).
- **`api/models/`**: Mongoose schemas.
- **`package.json`**: Unified dependencies for frontend and backend.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and configure all three values. Never commit
   `.env`.

3. **Run the development server:**
   - **Frontend:** `npm run dev`
   - **Backend:** `npm run server` (runs on port 5001 by default)

## Configuration
- `vite.config.js`: Proxies `/api` requests to the local backend during development.
- `vercel.json`: Configures Vercel to treat `api/index.js` as the serverless function handler.

## Required deployment variables

Configure these for both Preview and Production in Vercel:

- `MONGODB_URI`: MongoDB connection string.
- `ADMIN_ID`: Dashboard login identifier.
- `ADMIN_PASSWORD`: Strong dashboard password. It also signs the eight-hour
  HTTP-only admin session, so changing it immediately invalidates existing sessions.

The API fails closed with HTTP 503 if either admin credential is absent.

## Pre-deployment checks

```bash
npm ci
npm run lint
npm run build
npm audit --audit-level=high
```

Deploy the frontend and API from the same commit because the dashboard and
analytics response contract are versioned together.
