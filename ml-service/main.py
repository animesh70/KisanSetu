from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from predict import MODEL_PATH, forecast
from train import train_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not Path(MODEL_PATH).exists():
        train_model()
    yield


app = FastAPI(title="KisanSetu ML Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"status": "ok", "modelReady": Path(MODEL_PATH).exists()}


@app.get("/predict")
def predict(crop: str = Query("Onion"), days: int = Query(7, ge=1, le=30)):
    return forecast(crop, days)


@app.post("/train")
def train():
    return {"message": "Model trained successfully", "crops": train_model()}
