"""Lightweight checks for chronological KisanSetu ML forecasting."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from predict import forecast, recursive_forecast  # noqa: E402
from train import (  # noqa: E402
    FEATURE_COLUMNS,
    build_time_series_features,
    chronological_validation_indices,
    train_model,
    walk_forward_model_comparison,
)


def make_history(points=30):
    dates = pd.date_range("2026-01-01", periods=points, freq="D")
    fluctuations = [0, 11, -7, 4, -5, 8, -3]
    prices = [2000 + day * 5 + fluctuations[day % len(fluctuations)] for day in range(points)]
    return pd.DataFrame({"date": dates, "crop": "Test crop", "modal_price": prices})


class IncrementFromLagModel:
    """A predictable test double proving recursive predictions become history."""

    def predict(self, features):
        return (features["lag_1"] + 10).to_numpy()


class ForecastingTests(unittest.TestCase):
    def test_feature_rows_use_only_prior_observations(self):
        history = make_history(16)
        feature_frame = build_time_series_features(history)
        first_row = feature_frame.iloc[0]
        expected_prior_prices = history["modal_price"].iloc[:7]

        self.assertEqual(first_row["lag_1"], expected_prior_prices.iloc[-1])
        self.assertAlmostEqual(first_row["rolling_mean_7"], expected_prior_prices.mean())
        self.assertEqual(first_row["target"], history["modal_price"].iloc[7])

        changed_future = history.copy()
        changed_future.loc[10, "modal_price"] += 10000
        changed_frame = build_time_series_features(changed_future)
        for column in FEATURE_COLUMNS:
            self.assertEqual(first_row[column], changed_frame.iloc[0][column])

    def test_validation_indices_are_chronological(self):
        feature_frame = build_time_series_features(make_history(30))
        scores, validation_indices = walk_forward_model_comparison(feature_frame)

        self.assertEqual(validation_indices, sorted(validation_indices))
        self.assertEqual(validation_indices, chronological_validation_indices(len(feature_frame)))
        self.assertTrue(all(index < len(feature_frame) for index in validation_indices))
        self.assertEqual(
            set(scores),
            {"Persistence baseline", "Linear Regression", "Gradient Boosting", "Random Forest"},
        )

    def test_recursive_forecast_reuses_each_predicted_day(self):
        details = {
            "last_date": "2026-01-07",
            "last_price": 100,
            "observations": 7,
            "recent_price_history": [94, 95, 96, 97, 98, 99, 100],
        }
        result = recursive_forecast(IncrementFromLagModel(), details, 3)
        self.assertEqual([item["predictedPrice"] for item in result], [110, 120, 130])

    def test_trained_response_keeps_compatible_fields_and_metadata(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            data_path = Path(temp_dir) / "prices.csv"
            model_path = Path(temp_dir) / "model.joblib"
            make_history(30).to_csv(data_path, index=False)
            metadata = train_model(data_path=data_path, model_path=model_path)
            result = forecast("Test crop", days=5, model_path=model_path)

        self.assertIn("test crop", metadata)
        for field in (
            "crop",
            "unit",
            "model",
            "trainingObservations",
            "currentPrice",
            "forecast",
            "predictedPeak",
        ):
            self.assertIn(field, result)
        self.assertEqual(result["source"], "ml-service")
        self.assertEqual(result["forecastStrategy"], "recursive one-step-ahead")
        self.assertEqual(len(result["forecast"]), 5)
        self.assertIsInstance(result["modelComparisonMAE"], dict)


if __name__ == "__main__":
    unittest.main()
