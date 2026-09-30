@echo off
REM =====================================================================
REM Hyperlocal Monsoon Intelligence Prototype Batch Launcher
REM Starts Python FastAPI ML Service, Express Backend API, and Vite UI.
REM =====================================================================
echo =====================================================================
echo  Starting MoES / NCMRWF Hyperlocal Monsoon Prediction Prototype
echo =====================================================================
echo.

echo [1/3] Launching FastAPI ML Service on Port 8008...
start "MoES ML Service (FastAPI)" cmd /k "cd ml-service && python -m uvicorn main:app --host 0.0.0.0 --port 8008 --reload"

echo [2/3] Launching Express Backend API on Port 5005...
start "MoES Backend (Express API)" cmd /k "cd backend && npm start"

echo [3/3] Launching React Vite Frontend on Port 3000...
start "MoES Decision Support UI (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo  All services started!
echo  Frontend Web App:  http://localhost:3000
echo  Backend REST API:  http://localhost:5005/api
echo  FastAPI ML Docs:   http://localhost:8008/docs
echo =====================================================================
