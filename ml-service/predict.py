"""Serve recursive, leakage-safe forecasts from KisanSetu's model artifact."""
from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import HTTPException

from train import ARTIFACT_VERSION, FEATURE_COLUMNS, MODEL_PATH, make_feature_row, train_model


def _load_artifact(model_path=MODEL_PATH):
    path = Path(model_path)
    if not path.exists():
        train_model(model_path=path)
    try:
        return joblib.load(path)
    except Exception:
        # A local artifact can be interrupted or left from an older Python
        # process. Recreate it from the tracked demo history instead of making
        # the dashboard depend on a manually deleted model file.
        train_model(model_path=path)
        return joblib.load(path)


def recursive_forecast(model, details: dict, days: int) -> list[dict]:
    """Forecast future dates recursively, never using unknown future actuals."""
    start = datetime.strptime(details["last_date"], "%Y-%m-%d")
    history = [float(value) for value in details.get("recent_price_history", [])]
    if not history:
        history = [float(details["last_price"])]

    values = []
    for day in range(1, days + 1):
        future_date = start + timedelta(days=day)
        if len(history) >= 7:
            row = make_feature_row(
                history,
                future_date,
                time_index=int(details.get("observations", len(history))) + day - 1,
            )
            prediction_frame = pd.DataFrame(
                [[row[column] for column in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS
            )
            predicted = float(model.predict(prediction_frame)[0])
        else:
            # Only applies to a deliberately small-history baseline artifact.
            predicted = history[-1]

        if not np.isfinite(predicted):
            predicted = history[-1]
        predicted = max(0, round(predicted))
        history.append(float(predicted))
        history = history[-7:]
        values.append(
            {
                "date": future_date.strftime("%Y-%m-%d"),
                "day": f"+{day} day",
                "predictedPrice": int(predicted),
            }
        )
    return values


def _legacy_forecast(model, details: dict, days: int) -> list[dict]:
    """Read older day-index artifacts without breaking the old API contract."""
    start = datetime.strptime(details["last_date"], "%Y-%m-%d")
    values = []
    for day in range(1, days + 1):
        predicted = max(0, round(float(model.predict([[details["last_index"] + day]])[0])))
        values.append(
            {
                "date": (start + timedelta(days=day)).strftime("%Y-%m-%d"),
                "day": f"+{day} day",
                "predictedPrice": int(predicted),
            }
        )
    return values


def forecast(crop: str, days: int = 7, model_path=MODEL_PATH):
    """Return the original forecast contract plus transparent model metadata."""
    if not isinstance(days, int) or days < 1:
        raise ValueError("Forecast days must be a positive integer.")

    artifact = _load_artifact(model_path)
    key = crop.strip().lower()
    if key not in artifact.get("models", {}):
        raise HTTPException(status_code=404, detail=f"No training data available for {crop}.")

    model = artifact["models"][key]
    details = artifact["metadata"][key]
    is_current = artifact.get("artifact_version") == ARTIFACT_VERSION
    values = recursive_forecast(model, details, days) if is_current else _legacy_forecast(model, details, days)
    peak = max(values, key=lambda item: item["predictedPrice"])

    response = {
        # Original frontend/backend fields remain unchanged.
        "crop": details["display_name"],
        "unit": "INR/quintal",
        "model": details.get("selected_model", "Linear Regression"),
        "trainingObservations": int(details["observations"]),
        "currentPrice": int(details["last_price"]),
        "forecast": values,
        "predictedPeak": int(peak["predictedPrice"]),
        # Additive metadata makes the demo honest and distinguishes the backend fallback.
        "source": "ml-service",
        "predictedPeakDay": peak["day"],
        "forecastStrategy": "recursive one-step-ahead" if is_current else "legacy day-index model",
    }
    if is_current:
        response.update(
            {
                "validationMAE": details.get("validation_mae"),
                "validationMethod": details.get("validation_method"),
                "modelComparisonMAE": details.get("model_comparison_mae", {}),
                "selectionReason": details.get("selection_reason"),
                "lastKnownDate": details.get("last_date"),
            }
        )
    return response
