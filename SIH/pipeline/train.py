"""Model Training: LightGBM Classifiers

Trains one LightGBM classifier per (target, lead week) = 4 models total.
Uses strong regularization, early stopping, fixed random seed.
Saves model + metadata (training years, feature list, git commit, date).
"""
import logging
import json
import subprocess
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics import brier_score_loss, roc_auc_score
import joblib

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# LightGBM parameters - strong regularization for small dataset
LGBM_PARAMS = {
    "objective": "binary",
    "metric": "binary_logloss",
    "boosting_type": "gbdt",
    "num_leaves": 15,              # Small trees
    "min_data_in_leaf": 50,        # Require more data per leaf
    "max_depth": 5,                # Limit depth
    "learning_rate": 0.05,
    "feature_fraction": 0.8,       # Subsample features
    "bagging_fraction": 0.8,       # Subsample rows
    "bagging_freq": 5,
    "lambda_l1": 1.0,              # L1 regularization
    "lambda_l2": 1.0,              # L2 regularization
    "min_gain_to_split": 0.01,     # Minimum gain for split
    "verbose": -1,
    "random_state": 42,
    "n_jobs": -1,
    "deterministic": True,
    "force_row_wise": True,        # For reproducibility
}

EARLY_STOPPING_ROUNDS = 50
NUM_BOOST_ROUND = 500


def get_git_commit() -> str:
    """Get current git commit hash."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True, text=True, cwd=Path(__file__).parent.parent
        )
        return result.stdout.strip()[:8] if result.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def train_lgbm(X_train: pd.DataFrame, y_train: pd.Series,
                X_val: pd.DataFrame = None, y_val: pd.Series = None,
                params: dict = None) -> lgb.Booster:
    """Train a single LightGBM model with early stopping."""
    if params is None:
        params = LGBM_PARAMS.copy()
    
    train_data = lgb.Dataset(X_train, label=y_train)
    
    valid_sets = [train_data]
    valid_names = ["train"]
    
    if X_val is not None and y_val is not None:
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
        valid_sets.append(val_data)
        valid_names.append("valid")
    
    model = lgb.train(
        params,
        train_data,
        num_boost_round=NUM_BOOST_ROUND,
        valid_sets=valid_sets,
        valid_names=valid_names,
        callbacks=[
            lgb.early_stopping(EARLY_STOPPING_ROUNDS),
            lgb.log_evaluation(0)  # Silent
        ]
    )
    
    return model


def train_target_models(X: pd.DataFrame, y: pd.DataFrame,
                         target_col: str,
                         groups: pd.Series,
                         params: dict = None) -> Dict:
    """Train models for one target using Leave-One-Year-Out CV.
    
    Returns:
        Dict with:
        - 'cv_models': List of models from each CV fold
        - 'cv_scores': Dict of Brier score, ROC-AUC per fold
        - 'best_iteration': Median best iteration
        - 'feature_importance': Mean feature importance across folds
    """
    logo = LeaveOneGroupOut()
    cv_models = []
    cv_scores = {"brier": [], "roc_auc": []}
    feature_importances = []
    best_iterations = []
    
    for fold, (train_idx, val_idx) in enumerate(logo.split(X, y[target_col], groups)):
        year = groups.iloc[val_idx[0]]
        logger.info(f"  Fold {fold+1}: Test year {year} ({len(train_idx)} train, {len(val_idx)} val)")
        
        X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_tr, y_val = y[target_col].iloc[train_idx], y[target_col].iloc[val_idx]
        
        # Check class balance
        n_pos_tr = y_tr.sum()
        n_neg_tr = len(y_tr) - n_pos_tr
        logger.info(f"    Train: {n_pos_tr} pos, {n_neg_tr} neg | Val: {y_val.sum()} pos, {len(y_val)-y_val.sum()} neg")
        
        if n_pos_tr == 0 or n_neg_tr == 0:
            logger.warning(f"  Skipping fold {fold}: only one class in training")
            continue
        
        # Train
        model = train_lgbm(X_tr, y_tr, X_val, y_val, params)
        cv_models.append(model)
        best_iterations.append(model.best_iteration)
        
        # Evaluate
        val_pred = model.predict(X_val, num_iteration=model.best_iteration)
        bs = brier_score_loss(y_val, val_pred)
        try:
            auc = roc_auc_score(y_val, val_pred)
        except ValueError:
            auc = np.nan
        
        cv_scores["brier"].append(bs)
        cv_scores["roc_auc"].append(auc)
        
        # Feature importance
        importance = pd.DataFrame({
            "feature": X.columns,
            "importance": model.feature_importance(importance_type="gain")
        })
        feature_importances.append(importance)
        
        logger.info(f"    Brier: {bs:.4f}, ROC-AUC: {auc:.4f}, Best iter: {model.best_iteration}")
    
    # Average feature importance
    if feature_importances:
        mean_importance = pd.concat(feature_importances).groupby("feature")["importance"].mean().reset_index()
        mean_importance = mean_importance.sort_values("importance", ascending=False)
    else:
        mean_importance = pd.DataFrame(columns=["feature", "importance"])
    
    return {
        "cv_models": cv_models,
        "cv_scores": cv_scores,
        "best_iteration": int(np.median(best_iterations)) if best_iterations else 100,
        "feature_importance": mean_importance
    }


def train_final_model(X: pd.DataFrame, y: pd.DataFrame,
                       target_col: str,
                       best_iteration: int,
                       params: dict = None) -> lgb.Booster:
    """Train final model on ALL data with fixed num_boost_round."""
    if params is None:
        params = LGBM_PARAMS.copy()
    
    # Use best_iteration as num_boost_round
    params_final = params.copy()
    train_data = lgb.Dataset(X, label=y[target_col])
    
    model = lgb.train(
        params_final,
        train_data,
        num_boost_round=best_iteration,
        valid_sets=[train_data],
        valid_names=["train"],
        callbacks=[lgb.log_evaluation(0)]
    )
    
    return model


def save_model(model: lgb.Booster, target_col: str, lead_week: int,
                metadata: dict, models_dir: Path = MODELS_DIR) -> Path:
    """Save model and metadata."""
    model_name = f"{target_col}_w{lead_week}"
    model_path = models_dir / f"{model_name}.txt"
    meta_path = models_dir / f"{model_name}_metadata.json"
    
    # Save model
    model.save_model(str(model_path))
    
    # Save metadata
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    
    logger.info(f"Saved {model_name} to {model_path}")
    return model_path


def load_model(target_col: str, lead_week: int, models_dir: Path = MODELS_DIR) -> Tuple[lgb.Booster, dict]:
    """Load model and metadata."""
    model_name = f"{target_col}_w{lead_week}"
    model_path = models_dir / f"{model_name}.txt"
    meta_path = models_dir / f"{model_name}_metadata.json"
    
    model = lgb.Booster(model_file=str(model_path))
    
    with open(meta_path) as f:
        metadata = json.load(f)
    
    return model, metadata


def train_all_models(X: pd.DataFrame, y: pd.DataFrame,
                      groups: pd.Series,
                      train_years: List[int],
                      spatial_unit: str,
                      feature_names: List[str],
                      params: dict = None) -> Dict:
    """Train all 4 models (2 targets x 2 leads)."""
    targets = [
        ("break_risk_w1", 1),
        ("break_risk_w2", 2),
        ("false_onset_risk_w1", 1),
        ("false_onset_risk_w2", 2),
    ]
    
    results = {}
    git_commit = get_git_commit()
    train_date = datetime.now().isoformat()
    
    for target_col, lead_week in targets:
        logger.info(f"\n=== Training {target_col} (Week {lead_week}) ===")
        
        if target_col not in y.columns:
            logger.warning(f"Target {target_col} not found, skipping")
            continue
        
        # CV training
        cv_result = train_target_models(X, y, target_col, groups, params)
        
        if not cv_result["cv_models"]:
            logger.warning(f"  No valid CV folds for {target_col}")
            continue
        
        # Compute mean CV scores
        mean_brier = np.mean(cv_result["cv_scores"]["brier"])
        mean_auc = np.nanmean(cv_result["cv_scores"]["roc_auc"])
        logger.info(f"  Mean CV Brier: {mean_brier:.4f}, ROC-AUC: {mean_auc:.4f}")
        
        # Train final model on all data
        final_model = train_final_model(X, y, target_col, cv_result["best_iteration"], params)
        
        # Prepare metadata
        metadata = {
            "target": target_col,
            "lead_week": lead_week,
            "spatial_unit": spatial_unit,
            "train_years": train_years,
            "feature_names": feature_names,
            "n_features": len(feature_names),
            "n_samples": len(X),
            "cv_brier_scores": cv_result["cv_scores"]["brier"],
            "cv_roc_auc_scores": cv_result["cv_scores"]["roc_auc"],
            "mean_cv_brier": float(mean_brier),
            "mean_cv_roc_auc": float(mean_auc),
            "best_iteration": cv_result["best_iteration"],
            "lgbm_params": params or LGBM_PARAMS,
            "git_commit": git_commit,
            "train_date": train_date,
            "model_type": "LightGBM",
            "version": "1.0"
        }
        
        # Save
        model_path = save_model(final_model, target_col, lead_week, metadata)
        
        results[target_col] = {
            "model_path": str(model_path),
            "metadata": metadata,
            "cv_result": cv_result
        }
    
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Quick test with synthetic data
    np.random.seed(42)
    n = 2000
    years = np.repeat([2020, 2021, 2022, 2023], n // 4)
    groups = pd.Series(years)
    
    X = pd.DataFrame({
        f"feat_{i}": np.random.randn(n) for i in range(10)
    })
    y = pd.DataFrame({
        "break_risk_w1": np.random.binomial(1, 0.3, n),
        "break_risk_w2": np.random.binomial(1, 0.25, n),
        "false_onset_risk_w1": np.random.binomial(1, 0.15, n),
        "false_onset_risk_w2": np.random.binomial(1, 0.1, n),
    })
    
    results = train_all_models(X, y, groups, [2020, 2021, 2022], "imd_grid", [f"feat_{i}" for i in range(10)])
    print(f"\nTrained {len(results)} models")
    for target, res in results.items():
        print(f"  {target}: Brier={res['metadata']['mean_cv_brier']:.4f}, AUC={res['metadata']['mean_cv_roc_auc']:.4f}")