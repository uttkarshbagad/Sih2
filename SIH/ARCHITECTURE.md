# Hyperlocal Monsoon Intelligence Architecture

## System Overview

```
[ React 18 + Vite + Tailwind Frontend ]
                 |
                 v
   [ Node.js Express REST Gateway ]
         /               \
        v                 v
[ Vision AI / Soil ]   [ Python FastAPI ML Microservice ]
                              |
                              v
                   [ XGBoost / SHAP / Nowcaster ]
```

## System Components

1. **Frontend Layer**: Built with React 18, Vite, and TailwindCSS. Includes specialized mobile-first view (Monsoon Saathi) for voice readout & local dialect support.
2. **Backend Gateway Layer**: Node.js + Express handling session state, data persistence, Tavily search orchestration, and soil analysis integration.
3. **ML Service Microservice**: Python FastAPI serving XGBoost forecast models, radar nowcasting algorithms, and SHAP explainability matrices.
