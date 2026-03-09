# Attendance System

Attendance platform with three services:

- `frontend`: React/Vite client for students, teachers, and HOD users
- `backend`: Express API with MongoDB
- `ai-server`: Flask service for camera-based headcount estimation

## Architecture

- `frontend` calls the Express API under `/api`
- `backend` handles auth, attendance, QR session flow, and proxies AI requests
- `ai-server` runs YOLO-based person detection for classroom counting

## Requirements

- Node.js 18+
- npm 9+
- Python 3.10+
- MongoDB

## Environment Variables

### Backend

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017
JWT_SECRET=replace-this-with-a-long-random-secret
AI_SERVER_URL=http://127.0.0.1:7000
AI_TIMEOUT_MS=15000
APP_VERSION=1.0.0
CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### AI Server

The AI server currently reads defaults from code. If you deploy it separately, keep it reachable from `AI_SERVER_URL`.

## Local Development

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../ai-server && python -m pip install -r requirements.txt
```

### 2. Start services

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

AI server:

```bash
cd ai-server
python app.py
```

## Production Notes

- Set `NODE_ENV=production` for the backend.
- Serve the frontend build output from a static host or CDN.
- Run backend and AI server behind a reverse proxy.
- Restrict `CLIENT_ORIGINS` to trusted frontend domains only.
- Use a strong `JWT_SECRET`.
- Keep `yolov8n.pt` available in `ai-server/`.
- Monitor backend and AI server stderr/stdout for operational errors.
- Use a process manager such as PM2, systemd, or Docker restart policies.

## Build

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
npm start
```

AI server:

```bash
cd ai-server
python app.py
```

## API Health Checks

- Backend: `GET /api/health`
- Backend version: `GET /api/version`
- AI server: `GET /health`

## Current Production Hardening

- CORS allowlist support in backend
- JSON body size limit for AI frame uploads
- `x-powered-by` disabled
- trust proxy enabled
- graceful shutdown handling for `SIGINT` and `SIGTERM`

## Known Limits

- Browser camera counting depends on client camera permission.
- AI counting is an estimate and should not be treated as the source of record.
- MongoDB indexes and deployment topology should be reviewed before large-scale rollout.
