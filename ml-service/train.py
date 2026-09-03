"""Train one linear-regression price model per crop from mandi-price history."""
from pathlib import Path
import joblib
import pandas as pd
from sklearn.linear_model import LinearRegression

ROOT = Path(__file__).parent
DATA_PATH = ROOT / "data" / "mandi_price_history.csv"
MODEL_PATH = ROOT / "models" / "price_model.joblib"


def train_model(data_path=DATA_PATH, model_path=MODEL_PATH):
    prices = pd.read_csv(data_path, parse_dates=["date"])
    models = {}
    metadata = {}
    for crop, group in prices.groupby("crop"):
        group = group.sort_values("date").reset_index(drop=True)
        model = LinearRegression().fit(group.index.to_frame(), group["modal_price"])
        models[crop.lower()] = model
        metadata[crop.lower()] = {
            "display_name": crop,
            "last_date": group["date"].iloc[-1].strftime("%Y-%m-%d"),
            "last_price": int(group["modal_price"].iloc[-1]),
            "observations": len(group),
            "last_index": int(group.index[-1]),
        }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"models": models, "metadata": metadata}, model_path)
    return metadata


if __name__ == "__main__":
    print(f"Trained models: {train_model()}")
