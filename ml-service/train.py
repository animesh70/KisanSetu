"""Train lightweight, chronological price forecasters for the KisanSetu demo.

The source data is intentionally small. This module compares a persistence
baseline with a few small scikit-learn regressors using walk-forward validation
instead of presenting a complex model as automatically better. Every feature
for a target day uses only prices known before that day.
"""
from __future__ import annotations

from pathlib import Path
from typing import Callable

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression

from forecast_models import PersistenceBaseline

ROOT = Path(__file__).parent
DATA_PATH = ROOT / "data" / "mandi_price_history.csv"
MODEL_PATH = ROOT / "models" / "price_model.joblib"

ARTIFACT_VERSION = 2
MIN_HISTORY_FOR_FEATURES = 7
MIN_SUPERVISED_ROWS_FOR_VALIDATION = 12
MIN_VALIDATION_POINTS = 3
MAX_VALIDATION_POINTS = 6
SIMPLICITY_TOLERANCE_RATIO = 0.05
SIMPLICITY_TOLERANCE_MIN_RUPEES = 1.0

FEATURE_COLUMNS = (
    "lag_1",
    "lag_2",
    "lag_3",
    "rolling_mean_3",
    "rolling_mean_7",
    "previous_daily_change",
    "short_term_trend",
    "time_index",
    "day_of_week",
    "month",
)

MODEL_ORDER = (
    "Persistence baseline",
    "Linear Regression",
    "Gradient Boosting",
    "Random Forest",
)


def candidate_model_factories() -> dict[str, Callable[[], object]]:
    """Return deterministic, deliberately small candidate-model factories."""
    return {
        "Persistence baseline": PersistenceBaseline,
        "Linear Regression": LinearRegression,
        "Gradient Boosting": lambda: GradientBoostingRegressor(
            n_estimators=60,
            learning_rate=0.05,
            max_depth=2,
            min_samples_leaf=2,
            loss="huber",
            random_state=42,
        ),
        "Random Forest": lambda: RandomForestRegressor(
            n_estimators=80,
            max_depth=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=1,
        ),
    }


def prepare_history(history: pd.DataFrame) -> pd.DataFrame:
    """Validate, normalize and chronologically order one crop's price history."""
    required_columns = {"date", "modal_price"}
    missing_columns = required_columns.difference(history.columns)
    if missing_columns:
        raise ValueError(f"Price history is missing columns: {', '.join(sorted(missing_columns))}.")

    prepared = history[["date", "modal_price"]].copy()
    prepared["date"] = pd.to_datetime(prepared["date"], errors="coerce")
    prepared["modal_price"] = pd.to_numeric(prepared["modal_price"], errors="coerce")
    prepared = prepared.dropna(subset=["date", "modal_price"])
    prepared = prepared[prepared["modal_price"] > 0]
    prepared = prepared.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    prepared = prepared.reset_index(drop=True)
    if prepared.empty:
        raise ValueError("No valid positive mandi prices are available for training.")
    return prepared


def make_feature_row(history_prices, target_date, time_index: int | None = None) -> dict[str, float | int]:
    """Build one feature vector from only observations before ``target_date``."""
    values = [float(value) for value in history_prices]
    if len(values) < MIN_HISTORY_FOR_FEATURES:
        raise ValueError(
            f"At least {MIN_HISTORY_FOR_FEATURES} prior observations are required for time-series features."
        )

    target_timestamp = pd.Timestamp(target_date)
    recent_three = values[-3:]
    recent_seven = values[-7:]
    return {
        "lag_1": values[-1],
        "lag_2": values[-2],
        "lag_3": values[-3],
        "rolling_mean_3": float(np.mean(recent_three)),
        "rolling_mean_7": float(np.mean(recent_seven)),
        "previous_daily_change": values[-1] - values[-2],
        "short_term_trend": (values[-1] - values[-3]) / 2,
        "time_index": int(len(values) if time_index is None else time_index),
        "day_of_week": int(target_timestamp.dayofweek),
        "month": int(target_timestamp.month),
    }


def build_time_series_features(history: pd.DataFrame) -> pd.DataFrame:
    """Create a leakage-safe supervised frame for one chronological price series.

    The row predicting price at position ``i`` is built from positions strictly
    before ``i``. It is safe to use this frame in chronological validation
    because a validation row never contains its own target or a later target.
    """
    prepared = prepare_history(history)
    prices = prepared["modal_price"].astype(float).tolist()
    dates = prepared["date"].tolist()
    rows = []
    for position in range(MIN_HISTORY_FOR_FEATURES, len(prepared)):
        row = make_feature_row(prices[:position], dates[position], time_index=position)
        row["target"] = float(prices[position])
        row["target_date"] = dates[position]
        rows.append(row)
    return pd.DataFrame(rows, columns=[*FEATURE_COLUMNS, "target", "target_date"])


def chronological_validation_indices(sample_count: int) -> list[int]:
    """Return the final sequential rows used for one-step walk-forward testing."""
    if sample_count < MIN_SUPERVISED_ROWS_FOR_VALIDATION:
        return []
    validation_points = min(MAX_VALIDATION_POINTS, max(MIN_VALIDATION_POINTS, sample_count // 4))
    return list(range(sample_count - validation_points, sample_count))


def walk_forward_model_comparison(feature_frame: pd.DataFrame) -> tuple[dict[str, float], list[int]]:
    """Compare candidates with chronological one-step-ahead MAE validation.

    Each validation point is predicted by a freshly fitted model that only sees
    earlier rows. There is no random shuffle and no future target in training.
    """
    validation_indices = chronological_validation_indices(len(feature_frame))
    if not validation_indices:
        return {}, validation_indices

    features = feature_frame.loc[:, FEATURE_COLUMNS]
    target = feature_frame["target"]
    scores = {}
    for model_name, factory in candidate_model_factories().items():
        absolute_errors = []
        for index in validation_indices:
            model = factory()
            model.fit(features.iloc[:index], target.iloc[:index])
            prediction = float(model.predict(features.iloc[[index]])[0])
            absolute_errors.append(abs(float(target.iloc[index]) - prediction))
        scores[model_name] = round(float(np.mean(absolute_errors)), 2)
    return scores, validation_indices


def select_model_name(scores: dict[str, float]) -> tuple[str, str]:
    """Choose the simplest model statistically close to the lowest MAE."""
    if not scores:
        return "Persistence baseline", "Insufficient history for validation; using the persistence baseline."

    best_mae = min(scores.values())
    tolerance = max(SIMPLICITY_TOLERANCE_MIN_RUPEES, best_mae * SIMPLICITY_TOLERANCE_RATIO)
    eligible_models = [
        name for name in MODEL_ORDER if name in scores and scores[name] <= best_mae + tolerance
    ]
    selected_name = eligible_models[0]
    reason = (
        f"Selected the simplest model within {SIMPLICITY_TOLERANCE_RATIO:.0%} "
        f"(minimum INR {SIMPLICITY_TOLERANCE_MIN_RUPEES:.0f}/q) of the best walk-forward MAE."
    )
    return selected_name, reason


def _train_crop(crop: str, history: pd.DataFrame) -> tuple[object, dict]:
    prepared = prepare_history(history)
    feature_frame = build_time_series_features(prepared)
    scores, validation_indices = walk_forward_model_comparison(feature_frame)
    selected_name, selection_reason = select_model_name(scores)
    selected_model = candidate_model_factories()[selected_name]()

    if feature_frame.empty:
        # A persistence forecast remains safer than inventing regression output
        # when there is not enough price history for lag features.
        selected_name = "Persistence baseline"
        selected_model = PersistenceBaseline()
        selection_reason = "Insufficient history for lag features; using the persistence baseline."
        validation_mae = None
    else:
        selected_model.fit(feature_frame.loc[:, FEATURE_COLUMNS], feature_frame["target"])
        validation_mae = scores.get(selected_name)

    last_price = float(prepared["modal_price"].iloc[-1])
    metadata = {
        "display_name": str(crop),
        "last_date": prepared["date"].iloc[-1].strftime("%Y-%m-%d"),
        "last_price": int(round(last_price)),
        "observations": int(len(prepared)),
        # Retained for compatibility with artifacts produced by the original model.
        "last_index": int(len(prepared) - 1),
        "recent_price_history": [
            float(value) for value in prepared["modal_price"].tail(MIN_HISTORY_FOR_FEATURES).tolist()
        ],
        "selected_model": selected_name,
        "validation_mae": validation_mae,
        "validation_method": "chronological walk-forward one-step validation" if scores else "not enough history for validation",
        "validation_points": int(len(validation_indices)),
        "model_comparison_mae": scores,
        "selection_reason": selection_reason,
        "feature_configuration": {
            "columns": list(FEATURE_COLUMNS),
            "minimum_prior_observations": MIN_HISTORY_FOR_FEATURES,
            "uses_only_previous_observations": True,
        },
    }
    return selected_model, metadata


def train_model(data_path=DATA_PATH, model_path=MODEL_PATH):
    """Train and persist one selected lightweight model for each crop."""
    prices = pd.read_csv(data_path, parse_dates=["date"])
    if "crop" not in prices.columns:
        raise ValueError("Price history is missing the crop column.")

    models = {}
    metadata = {}
    for crop, group in prices.groupby("crop", sort=True):
        model, crop_metadata = _train_crop(str(crop), group)
        key = str(crop).lower()
        models[key] = model
        metadata[key] = crop_metadata

    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "artifact_version": ARTIFACT_VERSION,
        "models": models,
        "metadata": metadata,
        "trained_at": pd.Timestamp.now(tz="UTC").isoformat(),
    }
    joblib.dump(artifact, model_path)
    return metadata


def artifact_is_current(model_path=MODEL_PATH) -> bool:
    """Return whether a stored artifact can produce recursive feature forecasts."""
    path = Path(model_path)
    if not path.exists():
        return False
    try:
        artifact = joblib.load(path)
    except Exception:
        return False
    return artifact.get("artifact_version") == ARTIFACT_VERSION and bool(artifact.get("models"))


if __name__ == "__main__":
    print(f"Trained crops: {', '.join(train_model())}")
