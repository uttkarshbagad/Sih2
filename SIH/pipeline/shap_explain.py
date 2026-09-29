"""SHAP Explanation for Trained Models

Uses TreeExplainer for LightGBM models to generate SHAP values.
"""
import logging
import pandas as pd
import numpy as np
import lightgbm as lgb
import shap
from pathlib import Path
from typing import Dict, List, Optional
import json

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"


def load_model_and_metadata(target_col: str, lead_week: int) -> tuple:
    """Load LightGBM model and its metadata."""
    model_name = f"{target_col}_w{lead_week}"
    model_path = MODELS_DIR / f"{model_name}.txt"
    meta_path = MODELS_DIR / f"{model_name}_metadata.json"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    model = lgb.Booster(model_file=str(model_path))
    
    with open(meta_path) as f:
        metadata = json.load(f)
    
    return model, metadata


def compute_shap_values(model: lgb.Booster, X: pd.DataFrame, 
                         sample_size: int = 1000) -> tuple:
    """Compute SHAP values using TreeExplainer.
    
    Args:
        model: Trained LightGBM Booster
        X: Feature DataFrame
        sample_size: Number of samples to explain (for speed)
        
    Returns:
        Tuple of (shap_values, expected_value, X_sample)
    """
    # Sample data if too large
    if len(X) > sample_size:
        X_sample = X.sample(n=sample_size, random_state=42)
    else:
        X_sample = X
    
    # Create TreeExplainer
    explainer = shap.TreeExplainer(model)
    
    # Compute SHAP values
    shap_values = explainer.shap_values(X_sample)
    expected_value = explainer.expected_value
    
    return shap_values, expected_value, X_sample


def shap_summary(model: lgb.Booster, X: pd.DataFrame, 
                 target_name: str = "", output_dir: Path = None) -> Dict:
    """Generate SHAP summary statistics.
    
    Returns:
        Dict with feature importance rankings from SHAP
    """
    shap_values, expected_value, X_sample = compute_shap_values(model, X)
    
    # Mean absolute SHAP value per feature
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    
    importance_df = pd.DataFrame({
        "feature": X.columns,
        "mean_abs_shap": mean_abs_shap,
        "shap_rank": np.argsort(-mean_abs_shap) + 1
    }).sort_values("mean_abs_shap", ascending=False)
    
    # Mean SHAP value (direction)
    mean_shap = shap_values.mean(axis=0)
    importance_df["mean_shap"] = mean_shap
    importance_df["direction"] = np.where(mean_shap > 0, "increases_risk", "decreases_risk")
    
    result = {
        "target": target_name,
        "n_samples_explained": len(X_sample),
        "expected_value": float(expected_value),
        "feature_importance": importance_df.to_dict("records")
    }
    
    if output_dir:
        output_path = output_dir / f"shap_summary_{target_name}.json"
        with open(output_path, "w") as f:
            json.dump(result, f, indent=2, default=str)
        logger.info(f"Saved SHAP summary to {output_path}")
    
    return result


def shap_local_explanation(model: lgb.Booster, X: pd.DataFrame,
                           row_idx: int, feature_names: List[str] = None) -> Dict:
    """Generate SHAP explanation for a single prediction.
    
    Returns:
        Dict with feature contributions for that specific prediction
    """
    shap_values, expected_value, X_sample = compute_shap_values(model, X, sample_size=len(X))
    
    if row_idx >= len(shap_values):
        raise ValueError(f"row_idx {row_idx} >= samples {len(shap_values)}")
    
    row_shap = shap_values[row_idx]
    row_X = X.iloc[row_idx]
    
    # Create explanation
    contributions = []
    for i, feat in enumerate(X.columns):
        contributions.append({
            "feature": feat,
            "value": float(row_X[feat]),
            "shap_value": float(row_shap[i]),
            "direction": "increases_risk" if row_shap[i] > 0 else "decreases_risk"
        })
    
    # Sort by absolute SHAP value
    contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    
    return {
        "base_value": float(expected_value),
        "prediction": float(expected_value + row_shap.sum()),
        "contributions": contributions[:20]  # Top 20
    }


def explain_all_models(X: pd.DataFrame, output_dir: Path = None) -> Dict:
    """Generate SHAP explanations for all saved models."""
    if output_dir is None:
        output_dir = Path(__file__).parent / "docs" / "shap"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    targets = [
        ("break_risk_w1", 1),
        ("break_risk_w2", 2),
        ("false_onset_risk_w1", 1),
        ("false_onset_risk_w2", 2),
    ]
    
    all_results = {}
    
    for target_col, lead_week in targets:
        logger.info(f"Computing SHAP for {target_col}...")
        
        try:
            model, metadata = load_model_and_metadata(target_col, lead_week)
            
            # Global summary
            summary = shap_summary(model, X, target_col, output_dir)
            all_results[target_col] = summary
            
            # Save local explanations for a few test samples
            # (first 5 test samples)
            local_explanations = []
            for i in range(min(5, len(X))):
                local = shap_local_explanation(model, X, i)
                local_explanations.append(local)
            
            all_results[target_col]["local_explanations"] = local_explanations
            
        except Exception as e:
            logger.error(f"Failed to compute SHAP for {target_col}: {e}")
            all_results[target_col] = {"error": str(e)}
    
    # Save combined results
    if output_dir:
        output_path = output_dir / "shap_all_models.json"
        with open(output_path, "w") as f:
            json.dump(all_results, f, indent=2, default=str)
        logger.info(f"Saved all SHAP results to {output_path}")
    
    return all_results


def plot_shap_summary(shap_result: Dict, output_path: Path = None):
    """Plot SHAP feature importance bar chart."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    
    features = [f["feature"] for f in shap_result["feature_importance"][:15]]
    values = [f["mean_abs_shap"] for f in shap_result["feature_importance"][:15]]
    
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(range(len(features)), values, color="steelblue", alpha=0.7)
    ax.set_yticks(range(len(features)))
    ax.set_yticklabels(features)
    ax.set_xlabel("Mean |SHAP Value|")
    ax.set_title(f"SHAP Feature Importance: {shap_result['target']}")
    ax.invert_yaxis()
    ax.grid(True, axis="x", alpha=0.3)
    
    # Add value labels
    for bar, val in zip(bars, values):
        ax.text(val + 0.001, bar.get_y() + bar.get_height()/2,
                f"{val:.4f}", va="center", fontsize=9)
    
    plt.tight_layout()
    if output_path:
        plt.savefig(output_path, dpi=150, bbox_inches="tight")
        plt.close()
        logger.info(f"Saved SHAP plot to {output_path}")
    
    return fig


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Test with synthetic model
    import lightgbm as lgb
    np.random.seed(42)
    n = 500
    X = pd.DataFrame({f"feat_{i}": np.random.randn(n) for i in range(10)})
    y = np.random.binomial(1, 0.3, n)
    
    train_data = lgb.Dataset(X, label=y)
    model = lgb.train({"objective": "binary", "verbose": -1}, train_data, 50)
    
    # Test SHAP
    result = shap_summary(model, X, "test_target")
    print("SHAP Summary:")
    for f in result["feature_importance"][:5]:
        print(f"  {f['feature']}: {f['mean_abs_shap']:.6f} ({f['direction']})")
    
    # Test local explanation
    local = shap_local_explanation(model, X, 0)
    print(f"\nLocal explanation for sample 0:")
    print(f"  Base: {local['base_value']:.4f}, Pred: {local['prediction']:.4f}")
    for c in local["contributions"][:3]:
        print(f"  {c['feature']}: {c['shap_value']:.4f} ({c['direction']})")