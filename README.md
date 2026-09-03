# KisanSetu

**SIH 2026 — PS26132: Strengthening Market Linkages and Price Discovery for Farmers**

KisanSetu is a market-intelligence and transaction platform that helps farmers and FPOs discover fair prices, create quality-assured crop lots, find verified buyers, receive offers, coordinate logistics, and track payments.

## Project status

Phase 2 — a working sample-data backend is ready. The build plan and MVP specification are in [docs/phase-1-plan.md](docs/phase-1-plan.md).

## Proposed stack

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB
- ML service: Python + FastAPI + scikit-learn

## MVP flow

Farmer/FPO → Market prices and forecast → Crop lot → Buyer matches → Offer → Logistics → Payment tracking

## Run the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

The API runs at `http://localhost:5000`. Try `GET /api/health` or `GET /api/markets/prices?crop=Onion`.

With the API running, verify the core endpoints in a second terminal:

```powershell
cd backend
npm run test:smoke
```

## Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dashboard automatically falls back to curated demo data if the backend is unavailable.

For a production build check:

```powershell
npm run build
```

## Run the ML price-prediction service

```powershell
cd ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

It trains a small per-crop linear-regression model from [sample price history](ml-service/data/mandi_price_history.csv) on first launch. The backend calls `GET http://localhost:8000/predict?crop=Onion&days=7`; it continues with a local forecast fallback if the ML service is offline.
