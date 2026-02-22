from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import joblib
import numpy as np

app = FastAPI()

# Load model and scaler (if exists)
MODEL_NAME = "best_model_name_placeholder"  # Will be replaced after loading
MODEL_FILE = None
SCALER_FILE = None

# Try to find the exported model and scaler files
import os
for fname in os.listdir():
    if fname.endswith("_model.joblib"):
        MODEL_FILE = fname
        MODEL_NAME = fname.replace("_model.joblib", "").replace("_", " ")
    if fname.endswith("_scaler.joblib"):
        SCALER_FILE = fname

if MODEL_FILE is None:
    raise RuntimeError("No model file found. Please export the best model as joblib.")

model = joblib.load(MODEL_FILE)
scaler = joblib.load(SCALER_FILE) if SCALER_FILE else None

# Feature engineering function (must match notebook)
def create_features(df):
    df = df.copy()
    df['month']         = df['ds'].dt.month
    df['quarter']       = df['ds'].dt.quarter
    df['year']          = df['ds'].dt.year
    df['month_sin']     = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos']     = np.cos(2 * np.pi * df['month'] / 12)
    df['trend']         = np.arange(len(df))
    # Lag/rolling features are not used for future prediction
    return df

# Input schema
class PredictionRequest(BaseModel):
    months: List[int]  # Month numbers (e.g., 1, 2, 3, ...)

@app.post("/predict")
def predict(request: PredictionRequest):
    try:
        months = request.months
        # For continual forecast, use months as input
        X = np.array(months).reshape(-1, 1)
        if scaler is not None:
            X = scaler.transform(X)
        preds = model.predict(X)
        result = [{"month": int(m), "consumption": float(p)} for m, p in zip(months, preds)]
        return {"forecast": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def root():
    return {"message": "Time Series Forecast API. POST to /predict with months."}
