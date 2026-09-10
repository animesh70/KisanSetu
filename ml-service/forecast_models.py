"""Small pickle-safe estimators used by the KisanSetu forecasting service."""
from __future__ import annotations

import numpy as np
import pandas as pd


class PersistenceBaseline:
    """Predict tomorrow's price as the most recently known price."""

    def fit(self, features, target):
        return self

    def predict(self, features):
        if isinstance(features, pd.DataFrame):
            return features["lag_1"].to_numpy(dtype=float)
        values = np.asarray(features, dtype=float)
        # lag_1 is deliberately the first feature in train.FEATURE_COLUMNS.
        return values[:, 0]
