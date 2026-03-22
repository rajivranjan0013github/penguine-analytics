# Penguine Analytics

A MERN project initialized with a structure similar to `DailyTracker`.

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

2. **Setup environment variables:**
   Update the `.env` file with your `MONGODB_URI`.

3. **Run the development server:**
   - **Frontend:** `npm run dev`
   - **Backend:** `npm run server` (runs on port 5001 by default)

## Configuration
- `vite.config.js`: Proxies `/api` requests to the local backend during development.
- `vercel.json`: Configures Vercel to treat `api/index.js` as the serverless function handler.
