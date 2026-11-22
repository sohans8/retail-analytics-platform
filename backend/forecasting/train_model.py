
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd

from xgboost import XGBRegressor

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# ============================================================
# PROJECT PATHS AND CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = PROJECT_ROOT / "backend" / "models"
REPORT_DIR = PROJECT_ROOT / "reports" / "forecasting"

MODEL_PATH = MODEL_DIR / "xgboost_weekly_sales.joblib"
METRICS_PATH = REPORT_DIR / "model_metrics.json"
PREDICTIONS_PATH = REPORT_DIR / "validation_predictions.csv"
IMPORTANCE_PATH = REPORT_DIR / "feature_importance.csv"

VALIDATION_WEEKS = 8
RANDOM_STATE = 42

TARGET = "WeeklySales"

CATEGORICAL_FEATURES = [
    "Store",
    "StoreType",
    "Assortment",
    "PromoInterval"
]

NUMERIC_FEATURES = [
    "CompetitionDistance",
    "CompetitionOpenSinceMonth",
    "CompetitionOpenSinceYear",
    "Promo2",
    "Promo2SinceWeek",
    "Promo2SinceYear",
    "Year",
    "Month",
    "Quarter",
    "WeekOfYear",
    "HasPromotion",
    "PromoDays",
    "SchoolHolidayDays",
    "StateHolidayDays",
    "Sales_Lag_1",
    "Sales_Lag_2",
    "Sales_Lag_4",
    "Sales_Lag_8",
    "Sales_Rolling_Mean_4",
    "Sales_Rolling_Mean_8"
]

FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES


# ============================================================
# 1. LOAD PREPARED DATA
# ============================================================

def load_forecasting_data():

    from backend.forecasting.features import (
        prepare_forecasting_data
    )

    print("\nLoading prepared forecasting dataset...")

    data = prepare_forecasting_data()

    if data.empty:
        raise ValueError("Forecasting dataset is empty.")

    data["WeekStart"] = pd.to_datetime(
        data["WeekStart"]
    )

    data["Store"] = data["Store"].astype(str)

    missing_features = (
        set(FEATURES + [TARGET, "WeekStart"])
        - set(data.columns)
    )

    if missing_features:
        raise ValueError(
            f"Missing model columns: {missing_features}"
        )

    return data


# ============================================================
# 2. BUILD MODEL PIPELINE
# ============================================================

def build_model():

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median")
            )
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="most_frequent")
            ),
            (
                "encoder",
                OneHotEncoder(handle_unknown="ignore")
            )
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                numeric_pipeline,
                NUMERIC_FEATURES
            ),
            (
                "categorical",
                categorical_pipeline,
                CATEGORICAL_FEATURES
            )
        ]
    )

    xgb_model = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=700,
        max_depth=8,
        learning_rate=0.04,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=5,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        tree_method="hist",
        verbosity=0
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", xgb_model)
        ]
    )

    return model


# ============================================================
# 3. RECURSIVE FEATURE GENERATION
# ============================================================

def get_historical_features(store_id, week, history):

    """
    Build lag features from exact previous calendar weeks.

    History contains actual sales before the validation period
    and model predictions during recursive validation.
    """

    store_history = history.get(store_id, {})

    def get_sales(days_back):

        previous_week = week - pd.Timedelta(
            days=days_back
        )

        return store_history.get(previous_week)

    lag_1 = get_sales(7)
    lag_2 = get_sales(14)
    lag_4 = get_sales(28)
    lag_8 = get_sales(56)

    previous_4_weeks = [
        get_sales(days)
        for days in [7, 14, 21, 28]
    ]

    previous_8_weeks = [
        get_sales(days)
        for days in [7, 14, 21, 28, 35, 42, 49, 56]
    ]

    rolling_4 = (
        float(np.mean(previous_4_weeks))
        if all(value is not None for value in previous_4_weeks)
        else np.nan
    )

    rolling_8 = (
        float(np.mean(previous_8_weeks))
        if all(value is not None for value in previous_8_weeks)
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
# 4. RECURSIVE VALIDATION
# ============================================================

def recursive_validation(model, train_data, validation_data):

    """
    Forecast validation weeks one at a time.

    Actual validation sales are never inserted into history.
    Only model predictions are used for later validation weeks.
    """

    print("\nStarting recursive validation...")

    # Initialize historical sales using training data only.
    history = {}

    for row in train_data[
        ["Store", "WeekStart", TARGET]
    ].itertuples(index=False):

        store_id = row.Store
        week = row.WeekStart
        sales = float(row.WeeklySales)

        history.setdefault(
            store_id,
            {}
        )[week] = sales

    validation_weeks = sorted(
        validation_data["WeekStart"].unique()
    )

    prediction_results = []

    for week_number, week in enumerate(
        validation_weeks,
        start=1
    ):

        week = pd.Timestamp(week)

        print(
            f"Forecasting week {week_number}/"
            f"{len(validation_weeks)}: "
            f"{week.date()}"
        )

        current_week = validation_data[
            validation_data["WeekStart"] == week
        ].copy()

        feature_rows = []
        metadata = []

        for _, row in current_week.iterrows():

            store_id = row["Store"]

            historical_features = get_historical_features(
                store_id,
                week,
                history
            )

            # Require an actual or predicted immediately
            # preceding calendar week.
            if pd.isna(
                historical_features["Sales_Lag_1"]
            ):
                continue

            features = {
                column: row[column]
                for column in FEATURES
                if column not in [
                    "Sales_Lag_1",
                    "Sales_Lag_2",
                    "Sales_Lag_4",
                    "Sales_Lag_8",
                    "Sales_Rolling_Mean_4",
                    "Sales_Rolling_Mean_8"
                ]
            }

            features.update(historical_features)

            feature_rows.append(features)

            metadata.append({
                "Store": store_id,
                "WeekStart": week,
                "ActualSales": float(row[TARGET])
            })

        if not feature_rows:
            print(
                f"Warning: No forecastable stores for {week.date()}"
            )
            continue

        X_week = pd.DataFrame(
            feature_rows,
            columns=FEATURES
        )

        predictions = model.predict(X_week)

        for item, prediction in zip(
            metadata,
            predictions
        ):

            predicted_sales = max(
                0.0,
                float(prediction)
            )

            item["PredictedSales"] = predicted_sales

            prediction_results.append(item)

            # Store the prediction, not actual validation sales.
            history.setdefault(
                item["Store"],
                {}
            )[week] = predicted_sales

    results = pd.DataFrame(
        prediction_results
    )

    if results.empty:
        raise ValueError(
            "No validation predictions were generated."
        )

    return results


# ============================================================
# 5. EVALUATE MODEL
# ============================================================

def evaluate_model(predictions):

    actual = predictions["ActualSales"]
    predicted = predictions["PredictedSales"]

    mae = mean_absolute_error(
        actual,
        predicted
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predicted
        )
    )

    r2 = r2_score(
        actual,
        predicted
    )

    total_actual = actual.sum()

    wape = (
        np.abs(actual - predicted).sum()
        / total_actual
        * 100
        if total_actual != 0
        else np.nan
    )

    metrics = {
        "R2": float(r2),
        "MAE": float(mae),
        "RMSE": float(rmse),
        "WAPE_Percent": float(wape),
        "Validation_Records": int(len(predictions)),
        "Validation_Weeks": int(
            predictions["WeekStart"].nunique()
        ),
        "Validation_Stores": int(
            predictions["Store"].nunique()
        )
    }

    return metrics


# ============================================================
# 6. SAVE MODEL AND REPORTS
# ============================================================

def save_artifacts(model, metrics, predictions, cutoff):

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    REPORT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    # Save model and metadata
    joblib.dump(
        {
            "model": model,
            "features": FEATURES,
            "categorical_features": CATEGORICAL_FEATURES,
            "numeric_features": NUMERIC_FEATURES,
            "target": TARGET,
            "validation_cutoff": str(cutoff),
            "forecast_horizon_weeks": VALIDATION_WEEKS
        },
        MODEL_PATH
    )

    # Save evaluation metrics
    with open(
        METRICS_PATH,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metrics,
            file,
            indent=4
        )

    # Save actual vs predicted values
    predictions.to_csv(
        PREDICTIONS_PATH,
        index=False
    )

    # Save feature importance
    preprocessor = model.named_steps["preprocessor"]

    feature_names = (
        preprocessor.get_feature_names_out()
    )

    importance_values = (
        model.named_steps["model"].feature_importances_
    )

    importance = pd.DataFrame({
        "Feature": feature_names,
        "Importance": importance_values
    })

    importance = importance.sort_values(
        "Importance",
        ascending=False
    )

    importance.to_csv(
        IMPORTANCE_PATH,
        index=False
    )

    print("\nSaved model:")
    print(MODEL_PATH)

    print("\nSaved metrics:")
    print(METRICS_PATH)

    print("\nSaved predictions:")
    print(PREDICTIONS_PATH)

    print("\nSaved feature importance:")
    print(IMPORTANCE_PATH)


# ============================================================
# 7. MAIN TRAINING PIPELINE
# ============================================================

def main():

    print("\n" + "=" * 65)
    print("RETAIL SALES FORECASTING - XGBOOST MODEL TRAINING")
    print("=" * 65)

    # Load dataset
    data = load_forecasting_data()

    # Chronological split
    unique_weeks = sorted(
        data["WeekStart"].unique()
    )

    if len(unique_weeks) <= VALIDATION_WEEKS:
        raise ValueError(
            "Not enough weekly observations for validation."
        )

    validation_weeks = unique_weeks[
        -VALIDATION_WEEKS:
    ]

    cutoff = pd.Timestamp(
        validation_weeks[0]
    )

    train_data = data[
        data["WeekStart"] < cutoff
    ].copy()

    validation_data = data[
        data["WeekStart"].isin(validation_weeks)
    ].copy()

    print("\nCHRONOLOGICAL DATA SPLIT")

    print(
        "Training period:",
        train_data["WeekStart"].min(),
        "to",
        train_data["WeekStart"].max()
    )

    print(
        "Validation period:",
        validation_data["WeekStart"].min(),
        "to",
        validation_data["WeekStart"].max()
    )

    print(
        "Training records:",
        f"{len(train_data):,}"
    )

    print(
        "Validation records:",
        f"{len(validation_data):,}"
    )

    # Training rows require an immediately preceding
    # calendar week of historical sales.
    train_data = train_data.dropna(
        subset=["Sales_Lag_1"]
    ).copy()

    if train_data.empty:
        raise ValueError(
            "No valid training records remain."
        )

    X_train = train_data[FEATURES].copy()
    y_train = train_data[TARGET].copy()

    # Build and train model
    print("\nBuilding XGBoost pipeline...")

    model = build_model()

    print("\nTraining XGBoost model...")

    model.fit(
        X_train,
        y_train
    )

    print("\nModel training completed.")

    # Recursive validation
    predictions = recursive_validation(
        model,
        train_data,
        validation_data
    )

    # Evaluate
    print("\n" + "=" * 65)
    print("MODEL EVALUATION RESULTS")
    print("=" * 65)

    metrics = evaluate_model(
        predictions
    )

    for name, value in metrics.items():

        if isinstance(value, float):
            print(f"{name}: {value:.4f}")
        else:
            print(f"{name}: {value}")

    # Save outputs
    print("\nSaving model artifacts...")

    save_artifacts(
        model,
        metrics,
        predictions,
        cutoff
    )

    print("\n" + "=" * 65)
    print("XGBOOST FORECASTING PIPELINE COMPLETED")
    print("=" * 65)


if __name__ == "__main__":
    main()
