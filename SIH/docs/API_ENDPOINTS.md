# API Endpoint Specifications

Comprehensive reference for backend and ML service HTTP endpoints.

## Node.js Express Backend Endpoints (`http://localhost:5000`)

### Soil Analysis API
- `POST /api/soil/analyze`: Vision AI processing, location lookup, and crop suitability calculation.
- `GET /api/soil/history`: Retrieve historical soil analysis reports.

### Weather Alerts & Forecast
- `GET /api/weather/alerts`: Fetch active weather warning alerts.
- `POST /api/weather/search`: Query location-based weather telemetry via Tavily API.

## Python FastAPI ML Microservice Endpoints (`http://localhost:8000`)

- `POST /predict`: Predict block-level monsoon onset, break, and heavy rainfall probabilities.
- `POST /explain`: Generate SHAP / LIME explainability metrics for prediction outputs.
- `POST /nowcast`: Short-term 0-6 hour radar and precipitation nowcasting.
