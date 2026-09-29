"""Baseline Models for Monsoon Prediction

Implements:
1. Climatology per day-of-year (historical frequency of break/false-onset)
2. Persistence (today's risk = yesterday's risk)
3. Logistic Regression with basic features
"""
import logging
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from typing import Dict, List, Optional, Tuple
import joblib

logger = logging.getLogger(__name__)


class ClimatologyBaseline:
    """Climatological baseline: historical frequency per day-of-year."""
    
    def __init__(self):
        self.climatology_ = None
        self.target_cols_ = None
    
    def fit(self, X: pd.DataFrame, y: pd.DataFrame, 
            date_col: str = "date", unit_col: str = "unit_id") -> "ClimatologyBaseline":
        """Fit climatology from training data.
        
        Args:
            X: Feature DataFrame (must have date, unit_id)
            y: Target DataFrame
            date_col: Date column name
            unit_col: Unit identifier column
        """
        self.target_cols_ = y.columns.tolist()
        
        # Combine X and y for grouping
        data = X[[date_col, unit_col]].copy()
        data[date_col] = pd.to_datetime(data[date_col])
        data["day_of_year"] = data[date_col].dt.dayofyear
        
        for col in self.target_cols_:
            data[col] = y[col].values
        
        # Compute mean per day-of-year (across all units and years)
        self.climatology_ = data.groupby("day_of_year")[self.target_cols_].mean().reset_index()
        
        logger.info(f"Fitted climatology baseline for {len(self.target_cols_)} targets")
        return self
    
    def predict_proba(self, X: pd.DataFrame, 
                       date_col: str = "date") -> Dict[str, np.ndarray]:
        """Predict probabilities using climatology."""
        X = X.copy()
        X[date_col] = pd.to_datetime(X[date_col])
        X["day_of_year"] = X[date_col].dt.dayofyear
        
        # Merge with climatology
        merged = X.merge(self.climatology_, on="day_of_year", how="left")
        
        probas = {}
        for col in self.target_cols_:
            # Climatology gives P(target=1) directly
            probas[col] = merged[col].fillna(merged[col].mean()).values
        
        return probas
    
    def predict(self, X: pd.DataFrame, date_col: str = "date", 
                threshold: float = 0.5) -> Dict[str, np.ndarray]:
        """Binary predictions."""
        probas = self.predict_proba(X, date_col)
        return {col: (p >= threshold).astype(int) for col, p in probas.items()}


class PersistenceBaseline:
    """Persistence baseline: today's risk = yesterday's observed risk."""
    
    def __init__(self):
        self.target_cols_ = None
        self.last_values_ = None
    
    def fit(self, X: pd.DataFrame, y: pd.DataFrame,
            date_col: str = "date", unit_col: str = "unit_id") -> "PersistenceBaseline":
        """Store last observed values per unit."""
        self.target_cols_ = y.columns.tolist()
        
        # Get last date per unit
        data = X[[date_col, unit_col]].copy()
        data[date_col] = pd.to_datetime(data[date_col])
        
        for col in self.target_cols_:
            data[col] = y[col].values
        
        # Sort and get last value per unit
        data = data.sort_values([unit_col, date_col])
        self.last_values_ = data.groupby(unit_col)[self.target_cols_].last()
        
        logger.info(f"Fitted persistence baseline for {len(self.target_cols_)} targets")
        return self
    
    def predict_proba(self, X: pd.DataFrame,
                       date_col: str = "date", unit_col: str = "unit_id") -> Dict[str, np.ndarray]:
        """Predict using last observed value for each unit."""
        X = X.copy()
        
        probas = {}
        for col in self.target_cols_:
            # Map last value for each unit
            unit_map = self.last_values_[col].to_dict()
            probas[col] = X[unit_col].map(unit_map).fillna(0.5).values
        
        return probas
    
    def predict(self, X: pd.DataFrame, date_col: str = "date",
                unit_col: str = "unit_id", threshold: float = 0.5) -> Dict[str, np.ndarray]:
        probas = self.predict_proba(X, date_col, unit_col)
        return {col: (p >= threshold).astype(int) for col, p in probas.items()}


class LogisticRegressionBaseline:
    """Logistic Regression with standardized features."""
    
    def __init__(self, C: float = 1.0, max_iter: int = 1000, 
                 class_weight: str = "balanced", random_state: int = 42):
        self.C = C
        self.max_iter = max_iter
        self.class_weight = class_weight
        self.random_state = random_state
        self.models_ = {}
        self.target_cols_ = None
        self.feature_names_ = None
    
    def fit(self, X: pd.DataFrame, y: pd.DataFrame) -> "LogisticRegressionBaseline":
        """Fit one LogisticRegression per target."""
        self.target_cols_ = y.columns.tolist()
        self.feature_names_ = X.columns.tolist()
        
        for col in self.target_cols_:
            # Create pipeline with scaling
            pipe = Pipeline([
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(
                    C=self.C,
                    max_iter=self.max_iter,
                    class_weight=self.class_weight,
                    random_state=self.random_state,
                    solver="lbfgs"
                ))
            ])
            
            y_col = y[col].values
            # Check class balance
            n_pos = y_col.sum()
            n_neg = len(y_col) - n_pos
            logger.info(f"  Target {col}: {n_pos} positive, {n_neg} negative")
            
            if n_pos == 0 or n_neg == 0:
                logger.warning(f"  Target {col} has only one class, using dummy model")
                # Create dummy model that always predicts majority class
                from sklearn.dummy import DummyClassifier
                pipe = DummyClassifier(strategy="prior")
                pipe.fit(X, y_col)
            
            pipe.fit(X, y_col)
            self.models_[col] = pipe
        
        logger.info(f"Fitted Logistic Regression for {len(self.target_cols_)} targets")
        return self
    
    def predict_proba(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Predict probabilities for all targets."""
        probas = {}
        for col, model in self.models_.items():
            if hasattr(model, "predict_proba"):
                probas[col] = model.predict_proba(X)[:, 1]
            else:
                # DummyClassifier
                probas[col] = np.full(len(X), model.predict(X)[0])
        return probas
    
    def predict(self, X: pd.DataFrame, threshold: float = 0.5) -> Dict[str, np.ndarray]:
        probas = self.predict_proba(X)
        return {col: (p >= threshold).astype(int) for col, p in probas.items()}
    
    def get_feature_importance(self) -> Dict[str, pd.DataFrame]:
        """Get feature coefficients for each target."""
        importance = {}
        for col, model in self.models_.items():
            if hasattr(model, "named_steps"):
                clf = model.named_steps["clf"]
                if hasattr(clf, "coef_"):
                    coef = pd.DataFrame({
                        "feature": self.feature_names_,
                        "coefficient": clf.coef_[0]
                    }).sort_values("coefficient", key=abs, ascending=False)
                    importance[col] = coef
        return importance


def evaluate_baselines(X: pd.DataFrame, y: pd.DataFrame,
                        X_test: pd.DataFrame, y_test: pd.DataFrame,
                        date_col: str = "date", unit_col: str = "unit_id") -> Dict:
    """Evaluate all baselines on test set."""
    from sklearn.metrics import brier_score_loss, roc_auc_score
    
    results = {}
    
    # 1. Climatology
    logger.info("Evaluating Climatology Baseline...")
    clim = ClimatologyBaseline()
    clim.fit(X, y, date_col, unit_col)
    clim_proba = clim.predict_proba(X_test, date_col)
    
    for col in y_test.columns:
        bs = brier_score_loss(y_test[col], clim_proba[col])
        try:
            auc = roc_auc_score(y_test[col], clim_proba[col])
        except ValueError:
            auc = np.nan
        results[f"climatology_{col}"] = {"brier_score": bs, "roc_auc": auc}
    
    # 2. Persistence
    logger.info("Evaluating Persistence Baseline...")
    pers = PersistenceBaseline()
    pers.fit(X, y, date_col, unit_col)
    pers_proba = pers.predict_proba(X_test, date_col, unit_col)
    
    for col in y_test.columns:
        bs = brier_score_loss(y_test[col], pers_proba[col])
        try:
            auc = roc_auc_score(y_test[col], pers_proba[col])
        except ValueError:
            auc = np.nan
        results[f"persistence_{col}"] = {"brier_score": bs, "roc_auc": auc}
    
    # 3. Logistic Regression
    logger.info("Evaluating Logistic Regression Baseline...")
    lr = LogisticRegressionBaseline()
    lr.fit(X, y)
    lr_proba = lr.predict_proba(X_test)
    
    for col in y_test.columns:
        bs = brier_score_loss(y_test[col], lr_proba[col])
        try:
            auc = roc_auc_score(y_test[col], lr_proba[col])
        except ValueError:
            auc = np.nan
        results[f"logreg_{col}"] = {"brier_score": bs, "roc_auc": auc}
    
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Quick test
    np.random.seed(42)
    n = 1000
    X = pd.DataFrame({
        "feat1": np.random.randn(n),
        "feat2": np.random.randn(n),
        "date": pd.date_range("2023-01-01", periods=n, freq="D"),
        "unit_id": np.random.choice(["A", "B"], n)
    })
    y = pd.DataFrame({
        "target1": np.random.binomial(1, 0.3, n),
        "target2": np.random.binomial(1, 0.2, n)
    })
    
    # Test climatology
    clim = ClimatologyBaseline()
    clim.fit(X, y)
    probas = clim.predict_proba(X)
    print("Climatology probas:", {k: v.mean() for k, v in probas.items()})
    
    # Test persistence
    pers = PersistenceBaseline()
    pers.fit(X, y)
    probas = pers.predict_proba(X)
    print("Persistence probas:", {k: v.mean() for k, v in probas.items()})
    
    # Test logistic regression
    lr = LogisticRegressionBaseline()
    lr.fit(X, y)
    probas = lr.predict_proba(X)
    print("LogReg probas:", {k: v.mean() for k, v in probas.items()})