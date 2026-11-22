
from pathlib import Path
from typing import Optional
import json
import logging
import joblib
import numpy as np
import pandas as pd
import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================
# LOGGING CONFIGURATION
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("retail_api")


def get_memory_mb():
    try:
        import psutil
        return round(psutil.Process(os.getpid()).memory_info().rss / 1e6, 1)
    except Exception:
        return None


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = PROJECT_ROOT / "backend" / "models" / "xgboost_weekly_sales.joblib"
METRICS_PATH = PROJECT_ROOT / "reports" / "forecasting" / "model_metrics.json"
PREDICTIONS_PATH = PROJECT_ROOT / "reports" / "forecasting" / "validation_predictions.csv"
PREPARED_CACHE_PATH = PROJECT_ROOT / "reports" / "forecasting" / "weekly_sales_prepared.csv.gz"

# Dataset paths
TRAIN_DATA_PATH = PROJECT_ROOT / "dataset" / "train.csv"
STORE_DATA_PATH = PROJECT_ROOT / "dataset" / "store.csv"


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Trained model not found: {MODEL_PATH}")

logger.info(f"Loading trained XGBoost model from {MODEL_PATH}...")
artifact = joblib.load(MODEL_PATH)

model = artifact["model"]
FEATURES = artifact["features"]

CATEGORICAL_FEATURES = artifact["categorical_features"]
NUMERIC_FEATURES = artifact["numeric_features"]

logger.info(f"Model loaded successfully. Features count: {len(FEATURES)}. Current RSS: {get_memory_mb()} MB")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Retail Analytics & Forecasting API",
    description="Retail analytics and recursive XGBoost sales forecasting.",
    version="1.2.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8501",
    "https://retail-analytics-platform-phi.vercel.app",
]

# Set FRONTEND_URL on Render.
# Multiple comma-separated frontend URLs are supported.
production_origins = os.getenv("FRONTEND_URL", "")

if production_origins:
    allowed_origins.extend(
        origin.strip().rstrip("/")
        for origin in production_origins.split(",")
        if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# CACHED HISTORICAL DATA (MEMORY OPTIMIZED)
# ============================================================

forecasting_data = None


def get_forecasting_data():
    """
    Load and cache historical forecasting data once per API process.
    Prefers pre-aggregated weekly dataset (reports/forecasting/weekly_sales_prepared.csv.gz)
    to avoid spiking memory above 512MB on Render.
    Falls back to running memory-optimized prepare_forecasting_data if cache is missing.
    """

    global forecasting_data

    if forecasting_data is None:
        logger.info(f"Initializing forecasting dataset (Current RSS: {get_memory_mb()} MB)...")

        if PREPARED_CACHE_PATH.exists():
            logger.info(f"Loading pre-aggregated dataset from {PREPARED_CACHE_PATH}")
            forecasting_data = pd.read_csv(PREPARED_CACHE_PATH, compression="gzip")
        else:
            if not TRAIN_DATA_PATH.exists():
                raise FileNotFoundError(
                    f"Training dataset not found: {TRAIN_DATA_PATH}"
                )

            if not STORE_DATA_PATH.exists():
                raise FileNotFoundError(
                    f"Store dataset not found: {STORE_DATA_PATH}"
                )

            from backend.forecasting.features import (
                prepare_forecasting_data
            )

            forecasting_data = prepare_forecasting_data(use_cache=True, save_cache=True)

        forecasting_data["Store"] = (
            forecasting_data["Store"].astype(str)
        )

        forecasting_data["WeekStart"] = pd.to_datetime(
            forecasting_data["WeekStart"]
        )

        logger.info(
            f"Forecasting dataset ready: {len(forecasting_data):,} rows. "
            f"RSS: {get_memory_mb()} MB"
        )

    return forecasting_data


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class PredictionRequest(BaseModel):
    records: list[dict] = Field(
        ...,
        min_length=1,
        max_length=5000
    )


class FutureWeekInputs(BaseModel):
    promo_days: int = Field(ge=0, le=7)
    school_holiday_days: int = Field(ge=0, le=7)
    state_holiday_days: int = Field(ge=0, le=7)


class ForecastRequest(BaseModel):
    store_id: int = Field(gt=0)
    horizon_weeks: int = Field(default=4, ge=1, le=12)

    future_schedule: list[FutureWeekInputs] = Field(
        ...,
        min_length=1,
        max_length=12
    )


# ============================================================
# ROOT AND HEALTH
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Retail Analytics & Forecasting API",
        "status": "running",
        "documentation": "/docs"
    }


@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_name": "XGBoost Weekly Sales Forecasting",
        "memory_rss_mb": get_memory_mb(),
        "forecast_horizon_weeks": artifact.get(
            "forecast_horizon_weeks"
        )
    }


# ============================================================
# MODEL METRICS
# ============================================================

@app.get("/metrics")
def get_model_metrics():

    if not METRICS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Model metrics file not found."
        )

    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as file:
            metrics = json.load(file)

        return {
            "model": "XGBoost",
            "evaluation": metrics
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# MODEL FEATURES
# ============================================================

@app.get("/model/features")
def get_model_features():

    return {
        "total_features": len(FEATURES),
        "categorical_features": CATEGORICAL_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "required_features": FEATURES
    }


# ============================================================
# DIRECT MODEL PREDICTION
# ============================================================

@app.post("/predict")
def predict_sales(request: PredictionRequest):

    try:
        records = request.records

        for index, record in enumerate(records):

            missing = [
                feature for feature in FEATURES
                if feature not in record
            ]

            if missing:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "record": index,
                        "missing_features": missing
                    }
                )

        input_data = pd.DataFrame(
            records,
            columns=FEATURES
        )

        input_data["Store"] = (
            input_data["Store"].astype(str)
        )

        predictions = model.predict(input_data)

        results = []

        for index, prediction in enumerate(predictions):

            results.append({
                "record": index,
                "store": input_data.iloc[index]["Store"],
                "predicted_weekly_sales": round(
                    max(0.0, float(prediction)), 2
                )
            })

        return {
            "status": "success",
            "predictions_count": len(results),
            "predictions": results
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {error}"
        )


# ============================================================
# RECURSIVE HISTORICAL FEATURE GENERATION
# ============================================================

def get_historical_features(store_history, week):
    """
    Generate exact calendar-week lag and rolling features.
    Missing historical weeks remain NaN.
    """

    def get_sales(weeks_back):

        previous_week = week - pd.Timedelta(
            weeks=weeks_back
        )

        return store_history.get(previous_week)

    lag_1 = get_sales(1)
    lag_2 = get_sales(2)
    lag_4 = get_sales(4)
    lag_8 = get_sales(8)

    previous_4 = [
        get_sales(i) for i in range(1, 5)
    ]

    previous_8 = [
        get_sales(i) for i in range(1, 9)
    ]

    rolling_4 = (
        float(np.mean(previous_4))
        if all(v is not None for v in previous_4)
        else np.nan
    )

    rolling_8 = (
        float(np.mean(previous_8))
        if all(v is not None for v in previous_8)
        else np.nan
    )

    return {
        "Sales_Lag_1": lag_1 if lag_1 is not None else np.nan,
        "Sales_Lag_2": lag_2 if lag_2 is not None else np.nan,
        "Sales_Lag_4": lag_4 if lag_4 is not None else np.nan,
        "Sales_Lag_8": lag_8 if lag_8 is not None else np.nan,
        "Sales_Rolling_Mean_4": rolling_4,
        "Sales_Rolling_Mean_8": rolling_8
    }


# ============================================================
# AUTOMATIC WEEKLY SALES FORECAST
# ============================================================

@app.post("/forecast")
def forecast_weekly_sales(request: ForecastRequest):

    if len(request.future_schedule) != request.horizon_weeks:
        raise HTTPException(
            status_code=422,
            detail=(
                "future_schedule must contain exactly one "
                "entry for every forecast week."
            )
        )

    try:
        logger.info(
            f"Forecasting request for Store {request.store_id} "
            f"({request.horizon_weeks} weeks). Initial RSS: {get_memory_mb()} MB"
        )

        data = get_forecasting_data()

        store_id = str(request.store_id)

        store_data = data[
            data["Store"] == store_id
        ].copy()

        if store_data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"Store {store_id} was not found."
            )

        store_data = store_data.sort_values(
            "WeekStart"
        )

        latest_week = data["WeekStart"].max()

        latest_store_row = store_data[
            store_data["WeekStart"] == latest_week
        ]

        if latest_store_row.empty:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Store {store_id} has no historical sales "
                    f"record for the latest dataset week "
                    f"({latest_week.date()}). Forecasting cannot "
                    "start reliably from this history."
                )
            )

        store_info = latest_store_row.iloc[0]

        history = {}

        for row in store_data[
            ["WeekStart", "WeeklySales"]
        ].itertuples(index=False):

            history[pd.Timestamp(row.WeekStart)] = float(
                row.WeeklySales
            )

        predictions = []

        forecast_week = (
            pd.Timestamp(latest_week)
            + pd.Timedelta(weeks=1)
        )

        for week_number, schedule in enumerate(
            request.future_schedule,
            start=1
        ):

            week = (
                forecast_week
                + pd.Timedelta(weeks=week_number - 1)
            )

            historical_features = get_historical_features(
                history,
                week
            )

            if pd.isna(
                historical_features["Sales_Lag_1"]
            ):
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Cannot forecast week {week.date()}: "
                        "the immediately preceding calendar "
                        "week has no sales history."
                    )
                )

            promo_days = schedule.promo_days

            features = {

                "Store": store_id,

                "StoreType": store_info["StoreType"],
                "Assortment": store_info["Assortment"],
                "PromoInterval": store_info["PromoInterval"],

                "CompetitionDistance": store_info[
                    "CompetitionDistance"
                ],

                "CompetitionOpenSinceMonth": store_info[
                    "CompetitionOpenSinceMonth"
                ],

                "CompetitionOpenSinceYear": store_info[
                    "CompetitionOpenSinceYear"
                ],

                "Promo2": store_info["Promo2"],
                "Promo2SinceWeek": store_info["Promo2SinceWeek"],
                "Promo2SinceYear": store_info["Promo2SinceYear"],

                "Year": week.year,
                "Month": week.month,
                "Quarter": week.quarter,
                "WeekOfYear": int(week.isocalendar().week),

                "HasPromotion": int(promo_days > 0),
                "PromoDays": promo_days,

                "SchoolHolidayDays": (
                    schedule.school_holiday_days
                ),

                "StateHolidayDays": (
                    schedule.state_holiday_days
                )
            }

            features.update(historical_features)

            input_data = pd.DataFrame(
                [features],
                columns=FEATURES
            )

            predicted_sales = max(
                0.0,
                float(model.predict(input_data)[0])
            )

            predicted_sales = round(
                predicted_sales, 2
            )

            predictions.append({
                "store_id": request.store_id,
                "week_start": week.date().isoformat(),
                "predicted_weekly_sales": predicted_sales
            })

            history[week] = predicted_sales

        total_forecast = sum(
            item["predicted_weekly_sales"]
            for item in predictions
        )

        logger.info(
            f"Forecast completed for Store {request.store_id} "
            f"({request.horizon_weeks} weeks, Total: {round(total_forecast, 2)}). "
            f"Final RSS: {get_memory_mb()} MB"
        )

        return {
            "status": "success",
            "model": "XGBoost",
            "store_id": request.store_id,
            "historical_data_through": (
                latest_week.date().isoformat()
            ),
            "forecast_horizon_weeks": request.horizon_weeks,
            "total_predicted_sales": round(
                total_forecast, 2
            ),
            "weekly_forecasts": predictions
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Forecasting failed: {error}"
        )


# ============================================================
# VALIDATION PREDICTIONS
# ============================================================

@app.get("/validation")
def get_validation_predictions(
    limit: int = Query(default=100, ge=1, le=5000)
):

    if not PREDICTIONS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Validation predictions file not found."
        )

    try:

        predictions = pd.read_csv(
            PREDICTIONS_PATH
        )

        predictions["WeekStart"] = (
            predictions["WeekStart"].astype(str)
        )

        selected = predictions.head(limit)

        return {
            "total_records": len(predictions),
            "returned_records": len(selected),
            "predictions": selected.to_dict(
                orient="records"
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
