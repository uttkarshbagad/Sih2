# Running the Services

## Prerequisites

- Python 3.10+ (for ML service)
- Node.js 18+ (for backend and frontend)
- npm or yarn

---

## 1. ML Microservice (FastAPI)

### Install Dependencies
```bash
cd SIH/ml-service
pip install -r requirements.txt
```

### Run Development Server
```bash
cd SIH/ml-service
python -m uvicorn main:app --host 0.0.0.0 --port 8008 --reload
```

### Verify
- Health check: `curl http://localhost:8008/health`
- Swagger docs: http://localhost:8008/docs
- Test predict: 
```bash
curl -X POST http://localhost:8008/predict \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 20.71,
    "longitude": 86.78,
    "rainfall": 18.5,
    "temperature": 34.2,
    "humidity": 65.0,
    "soil_moisture": "Low",
    "soil_moisture_value": 0.22,
    "enso": 0.8,
    "iod": -0.4,
    "mjo_phase": 4,
    "mjo_amplitude": 1.5,
    "previous_rainfall": 32.0,
    "rainfall_anomaly": -24.0,
    "forecast_horizon": 7,
    "district_name": "Kendrapara",
    "block_name": "Rajkanika"
  }'
```

---

## 2. Backend API (Node.js/Express)

### Install Dependencies
```bash
cd SIH/backend
npm install
```

### Run Development Server
```bash
cd SIH/backend
npm start
```

**Expected output**: Server starts on port 5005 (or PORT env var)

### Verify
- Health: `curl http://localhost:5005/api/system-status`
- Test predict via backend:
```bash
curl -X POST http://localhost:5005/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "district_name": "Kendrapara",
    "block_name": "Rajkanika",
    "forecast_horizon": 7
  }'
```

---

## 3. Frontend (React/Vite)

### Install Dependencies
```bash
cd SIH/frontend
npm install
```

### Run Development Server
```bash
cd SIH/frontend
npm run dev
```

**Expected output**: Vite dev server on port 3000 (or PORT env var)

### Verify
- Open http://localhost:3000 in browser

---

## 4. All Services Together (Windows)

### Option A: start-all.bat (provided)
```bash
cd SIH
start-all.bat
```

### Option B: Manual (3 terminals)
**Terminal 1 - ML Service**:
```bash
cd SIH/ml-service
python -m uvicorn main:app --host 0.0.0.0 --port 8008 --reload
```

**Terminal 2 - Backend**:
```bash
cd SIH/backend
npm start
```

**Terminal 3 - Frontend**:
```bash
cd SIH/frontend
npm run dev
```

---

## Environment Variables

### ML Service (`.env` in `SIH/ml-service/`)
```bash
# Optional: model mode
MODEL_MODE=heuristic  # or "trained" when models exist
```

### Backend (`.env` in `SIH/backend/`)
```bash
PORT=5005
ML_SERVICE_URL=http://127.0.0.1:8008
# Optional: external API keys
IPSTACK_API_KEY=your_key
SERP_API_KEY=your_key
TAVILY_API_KEY=your_key
```

### Frontend (`.env` in `SIH/frontend/`)
```bash
VITE_API_BASE_URL=http://localhost:5005/api
```

---

## Port Summary

| Service | Port | URL |
|---------|------|-----|
| ML Microservice | 8008 | http://localhost:8008 |
| Backend API | 5005 | http://localhost:5005 |
| Frontend | 3000 | http://localhost:3000 |

---

## Troubleshooting

### ML Service: "ModuleNotFoundError: No module named 'app'"
**Cause**: Running from wrong directory
**Fix**: Run from `SIH/ml-service/` directory, not `SIH/`

### Backend: "Cannot find module" / TypeScript errors
**Cause**: Dependencies not installed
**Fix**: Run `npm install` in `SIH/backend/`

### Frontend: Port 3000 already in use
**Fix**: Set `PORT=3001` in `.env` or kill existing process

### ML Service not reachable from Backend
**Check**: 
- ML service running on 0.0.0.0:8008 (not 127.0.0.1)
- `ML_SERVICE_URL` in backend `.env` matches
- No firewall blocking localhost ports

---

## Verification Checklist (Step 0.1)

- [ ] ML service `/health` returns 200
- [ ] ML service `/predict` returns valid JSON with all schema fields
- [ ] ML service `/explain` returns valid JSON with all schema fields
- [ ] Backend `/api/system-status` returns 200
- [ ] Backend `/api/predict` proxies to ML service (or falls back gracefully)
- [ ] Backend `/api/explain` proxies to ML service (or falls back gracefully)
- [ ] Frontend loads at http://localhost:3000
- [ ] Frontend can call backend API (check browser devtools Network tab)