from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from predict import forecast
from train import MODEL_PATH, artifact_is_current, train_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Upgrade old day-index artifacts automatically, while generated model
    # files remain local and ignored by Git.
    if not artifact_is_current(MODEL_PATH):
        train_model()
    yield


app = FastAPI(title="KisanSetu ML Service", version="1.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {
        "status": "ok",
        "modelReady": MODEL_PATH.exists(),
        "artifactCurrent": artifact_is_current(MODEL_PATH),
        "source": "ml-service",
    }


@app.get("/predict")
def predict(crop: str = Query("Onion"), days: int = Query(7, ge=1, le=30)):
    return forecast(crop, days)


@app.post("/train")
def train():
    return {"message": "Model trained successfully", "crops": train_model()}
