from datetime import datetime, timedelta
from pathlib import Path
import joblib
from fastapi import HTTPException

ROOT = Path(__file__).parent
MODEL_PATH = ROOT / "models" / "price_model.joblib"


def forecast(crop: str, days: int = 7):
    artifact = joblib.load(MODEL_PATH)
    key = crop.lower()
    if key not in artifact["models"]:
        raise HTTPException(status_code=404, detail=f"No training data available for {crop}.")
    model, details = artifact["models"][key], artifact["metadata"][key]
    start = datetime.strptime(details["last_date"], "%Y-%m-%d")
    values = []
    for day in range(1, days + 1):
        predicted = max(0, round(float(model.predict([[details["last_index"] + day]])[0])))
        values.append({"date": (start + timedelta(days=day)).strftime("%Y-%m-%d"), "day": f"+{day} day", "predictedPrice": predicted})
    return {"crop": details["display_name"], "unit": "INR/quintal", "model": "Linear Regression", "trainingObservations": details["observations"], "currentPrice": details["last_price"], "forecast": values, "predictedPeak": max(item["predictedPrice"] for item in values)}
