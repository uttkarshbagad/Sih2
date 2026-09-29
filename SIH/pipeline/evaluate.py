"""Model Evaluation: LOYO CV + Held-out Test + Bootstrap CI

Computes:
- Brier Score, Brier Skill Score vs climatology
- ROC-AUC
- Reliability curve data
- Hit Rate (POD), False Alarm Ratio
- Bootstrap CI over years for BSS
"""
import logging
import json
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import LeaveOneGroupOut
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

logger = logging.getLogger(__name__)

RESULTS_DIR = Path(__file__).parent / "docs"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

MODELS_DIR = Path(__file__).parent / "models"


def reliability_curve(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> Dict:
    """Compute reliability curve (calibration) data.
    
    Returns:
        Dict with bin_edges, bin_centers, observed_freq, predicted_freq, bin_counts
    """
    bins = np.linspace(0, 1, n_bins + 1)
    bin_centers = (bins[:-1] + bins[1:]) / 2
    
    observed = []
    predicted = []
    counts = []
    
    for i in range(n_bins):
        mask = (y_prob >= bins[i]) & (y_prob < bins[i+1])
        if i == n_bins - 1:
            mask = (y_prob >= bins[i]) & (y_prob <= bins[i+1])
        
        count = mask.sum()
        counts.append(count)
        
        if count > 0:
            observed.append(y_true[mask].mean())
            predicted.append(y_prob[mask].mean())
        else:
            observed.append(np.nan)
            predicted.append(np.nan)
    
    return {
        "bin_edges": bins.tolist(),
        "bin_centers": bin_centers.tolist(),
        "observed_frequency": observed,
        "predicted_frequency": predicted,
        "bin_counts": counts
    }


def hit_rate_false_alarm(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    """Compute Hit Rate (POD) and False Alarm Ratio.
    
    Hit Rate = TP / (TP + FN) = P(predicted=1 | actual=1)
    False Alarm Ratio = FP / (TP + FP) = P(predicted=1 | actual=0)
    """
    tp = ((y_true == 1) & (y_pred == 1)).sum()
    fp = ((y_true == 0) & (y_pred == 1)).sum()
    fn = ((y_true == 1) & (y_pred == 0)).sum()
    tn = ((y_true == 0) & (y_pred == 0)).sum()
    
    hit_rate = tp / (tp + fn) if (tp + fn) > 0 else 0
    false_alarm = fp / (tp + fp) if (tp + fp) > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = hit_rate
    
    return {
        "hit_rate": hit_rate,
        "false_alarm_ratio": false_alarm,
        "precision": precision,
        "recall": recall,
        "tp": int(tp), "fp": int(fp), "fn": int(fn), "tn": int(tn)
    }


def brier_skill_score(y_true: np.ndarray, y_prob: np.ndarray, 
                       clim_prob: float = None) -> Dict:
    """Compute Brier Score and Brier Skill Score vs climatology.
    
    BSS = 1 - BS_model / BS_climatology
    BSS > 0 means model beats climatology.
    """
    bs_model = brier_score_loss(y_true, y_prob)
    
    if clim_prob is None:
        clim_prob = y_true.mean()
    
    bs_clim = brier_score_loss(y_true, np.full_like(y_true, clim_prob))
    
    if bs_clim == 0:
        bss = 0
    else:
        bss = 1 - bs_model / bs_clim
    
    return {
        "brier_score": bs_model,
        "brier_score_climatology": bs_clim,
        "brier_skill_score": bss,
        "climatology_prob": clim_prob
    }


def bootstrap_bss_ci(y_true: np.ndarray, y_prob: np.ndarray, 
                      groups: np.ndarray, n_bootstrap: int = 1000,
                      confidence: float = 0.95) -> Dict:
    """Bootstrap BSS confidence interval over years (groups).
    
    Resamples years with replacement to estimate BSS uncertainty.
    """
    unique_years = np.unique(groups)
    n_years = len(unique_years)
    
    bss_samples = []
    clim_prob = y_true.mean()
    
    for _ in range(n_bootstrap):
        # Sample years with replacement
        sampled_years = np.random.choice(unique_years, size=n_years, replace=True)
        
        # Build bootstrap sample
        sample_mask = np.isin(groups, sampled_years)
        # Need to handle duplicate years - use indices
        sample_indices = np.where(np.isin(groups, sampled_years))[0]
        # Since we sample years, we might have different counts
        # Simpler: resample indices directly grouped by year
        bs_indices = []
        for yr in sampled_years:
            yr_indices = np.where(groups == yr)[0]
            bs_indices.extend(np.random.choice(yr_indices, size=len(yr_indices), replace=True))
        
        bs_true = y_true[bs_indices]
        bs_prob = y_prob[bs_indices]
        
        bs_result = brier_skill_score(bs_true, bs_prob, clim_prob)
        bss_samples.append(bs_result["brier_skill_score"])
    
    alpha = (1 - confidence) / 2
    ci_lower = np.percentile(bss_samples, alpha * 100)
    ci_upper = np.percentile(bss_samples, (1 - alpha) * 100)
    mean_bss = np.mean(bss_samples)
    
    return {
        "mean": mean_bss,
        "ci_lower": ci_lower,
        "ci_upper": ci_upper,
        "confidence": confidence,
        "n_bootstrap": n_bootstrap
    }


def evaluate_model(model: lgb.Booster, X: pd.DataFrame, y: pd.Series,
                   groups: pd.Series = None, target_name: str = "",
                   climatology_prob: float = None) -> Dict:
    """Comprehensive evaluation of a single model."""
    y_prob = model.predict(X, num_iteration=model.best_iteration)
    y_pred = (y_prob >= 0.5).astype(int)
    
    # Brier Score & BSS
    bss_result = brier_skill_score(y.values, y_prob, climatology_prob)
    
    # ROC-AUC
    try:
        auc = roc_auc_score(y, y_prob)
    except ValueError:
        auc = np.nan
    
    # Hit Rate / False Alarm
    hr_fa = hit_rate_false_alarm(y.values, y_pred)
    
    # Reliability curve
    rel = reliability_curve(y.values, y_prob)
    
    result = {
        "target": target_name,
        "n_samples": len(X),
        "n_positive": int(y.sum()),
        "prevalence": float(y.mean()),
        **bss_result,
        "roc_auc": float(auc),
        "hit_rate": hr_fa["hit_rate"],
        "false_alarm_ratio": hr_fa["false_alarm_ratio"],
        "precision": hr_fa["precision"],
        "reliability_curve": rel
    }
    
    # Bootstrap CI if groups provided
    if groups is not None:
        bs_ci = bootstrap_bss_ci(y.values, y_prob, groups.values)
        result["bss_bootstrap_ci"] = bs_ci
    
    return result


def evaluate_all_models(X: pd.DataFrame, y: pd.DataFrame,
                         groups: pd.Series,
                         test_years: List[int] = None,
                         spatial_unit: str = "imd_grid") -> Dict:
    """Evaluate all saved models on test data.
    
    Args:
        X: Full feature DataFrame
        y: Full label DataFrame
        groups: Year groups for each sample
        test_years: Years to use as held-out test (default: last 2 years)
        spatial_unit: Spatial unit identifier
        
    Returns:
        Dict with all evaluation results
    """
    if test_years is None:
        # Use last 2 years as test
        all_years = sorted(groups.unique())
        test_years = all_years[-2:]
    
    logger.info(f"Test years: {test_years}")
    
    test_mask = groups.isin(test_years)
    train_mask = ~test_mask
    
    X_test, X_train = X[test_mask], X[train_mask]
    y_test, y_train = y[test_mask], y[train_mask]
    groups_test, groups_train = groups[test_mask], groups[train_mask]
    
    logger.info(f"Train: {len(X_train)} samples ({groups_train.nunique()} years)")
    logger.info(f"Test: {len(X_test)} samples ({groups_test.nunique()} years)")
    
    # Compute climatology from training data
    clim_probs = {}
    for col in y.columns:
        clim_probs[col] = y_train[col].mean()
    
    targets = [
        ("break_risk_w1", 1),
        ("break_risk_w2", 2),
        ("false_onset_risk_w1", 1),
        ("false_onset_risk_w2", 2),
    ]
    
    all_results = {
        "spatial_unit": spatial_unit,
        "test_years": test_years,
        "train_years": sorted(groups_train.unique().tolist()),
        "test_samples": len(X_test),
        "train_samples": len(X_train),
        "targets": {}
    }
    
    for target_col, lead_week in targets:
        if target_col not in y.columns:
            logger.warning(f"Target {target_col} not in data")
            continue
        
        logger.info(f"\n=== Evaluating {target_col} ===")
        
        # Load model
        model_name = f"{target_col}_w{lead_week}"
        model_path = MODELS_DIR / f"{model_name}.txt"
        
        if not model_path.exists():
            logger.warning(f"Model not found: {model_path}")
            continue
        
        model = lgb.Booster(model_file=str(model_path))
        
        # Evaluate on test set
        result = evaluate_model(
            model, X_test, y_test[target_col],
            groups=groups_test,
            target_name=target_col,
            climatology_prob=clim_probs.get(target_col)
        )
        
        all_results["targets"][target_col] = result
        
        # Log summary
        logger.info(f"  Test Brier: {result['brier_score']:.4f}")
        logger.info(f"  Test BSS: {result['brier_skill_score']:.4f} (Clim BS: {result['brier_score_climatology']:.4f})")
        logger.info(f"  Test ROC-AUC: {result['roc_auc']:.4f}")
        logger.info(f"  Hit Rate: {result['hit_rate']:.4f}, FAR: {result['false_alarm_ratio']:.4f}")
        if "bss_bootstrap_ci" in result:
            ci = result["bss_bootstrap_ci"]
            logger.info(f"  BSS Bootstrap CI: [{ci['ci_lower']:.4f}, {ci['ci_upper']:.4f}]")
    
    return all_results


def save_evaluation_results(results: Dict, output_path: Path = None) -> Path:
    """Save evaluation results to JSON."""
    if output_path is None:
        output_path = RESULTS_DIR / "validation_results.json"
    
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    logger.info(f"Saved evaluation results to {output_path}")
    return output_path


def generate_validation_report(results: Dict, output_path: Path = None) -> str:
    """Generate human-readable validation report (Markdown)."""
    if output_path is None:
        output_path = RESULTS_DIR / "VALIDATION.md"
    
    lines = [
        "# Model Validation Report",
        "",
        f"**Spatial Unit**: {results['spatial_unit']}",
        f"**Training Years**: {results['train_years']}",
        f"**Test Years**: {results['test_years']}",
        f"**Train Samples**: {results['train_samples']:,}",
        f"**Test Samples**: {results['test_samples']:,}",
        "",
        "## Summary Table",
        "",
        "| Target | Lead | Brier Score | BSS vs Clim | ROC-AUC | Hit Rate | FAR | BSS 95% CI |",
        "|--------|------|-------------|-------------|---------|----------|-----|------------|"
    ]
    
    for target, res in results["targets"].items():
        lead = "Week 1" if "w1" in target else "Week 2"
        bs = res["brier_score"]
        bss = res["brier_skill_score"]
        auc = res["roc_auc"]
        hr = res["hit_rate"]
        far = res["false_alarm_ratio"]
        
        ci = res.get("bss_bootstrap_ci", {})
        ci_str = f"[{ci.get('ci_lower', 'N/A'):.3f}, {ci.get('ci_upper', 'N/A'):.3f}]" if ci else "N/A"
        
        lines.append(f"| {target} | {lead} | {bs:.4f} | {bss:.4f} | {auc:.4f} | {hr:.3f} | {far:.3f} | {ci_str} |")
    
    lines.extend([
        "",
        "## Detailed Results",
        ""
    ])
    
    for target, res in results["targets"].items():
        lines.append(f"### {target}")
        lines.append(f"- **Brier Score**: {res['brier_score']:.4f}")
        lines.append(f"- **Climatology Brier**: {res['brier_score_climatology']:.4f}")
        lines.append(f"- **Brier Skill Score**: {res['brier_skill_score']:.4f}")
        lines.append(f"- **ROC-AUC**: {res['roc_auc']:.4f}")
        lines.append(f"- **Hit Rate (POD)**: {res['hit_rate']:.4f}")
        lines.append(f"- **False Alarm Ratio**: {res['false_alarm_ratio']:.4f}")
        lines.append(f"- **Precision**: {res['precision']:.4f}")
        lines.append(f"- **Prevalence**: {res['prevalence']:.4f}")
        lines.append(f"- **Test Samples**: {res['n_samples']:,} ({res['n_positive']:,} positive)")
        
        if "bss_bootstrap_ci" in res:
            ci = res["bss_bootstrap_ci"]
            lines.append(f"- **BSS 95% Bootstrap CI**: [{ci['ci_lower']:.4f}, {ci['ci_upper']:.4f}] (mean={ci['mean']:.4f})")
        
        lines.append("")
        
        # Reliability curve summary
        rel = res["reliability_curve"]
        lines.append("#### Reliability Curve")
        lines.append("| Bin | Predicted | Observed | Count |")
        lines.append("|-----|-----------|----------|-------|")
        for i in range(len(rel["bin_centers"])):
            pc = rel["predicted_frequency"][i]
            oc = rel["observed_frequency"][i]
            cnt = rel["bin_counts"][i]
            lines.append(f"| {rel['bin_centers'][i]:.2f} | {pc:.3f} | {oc:.3f} | {cnt} |")
        lines.append("")
    
    # Add disclaimer
    lines.extend([
        "---",
        "",
        "**Disclaimer**: This is a prototype system. BSS ≤ 0 indicates no skill beyond climatology.",
        "See `docs/OPEN_QUESTIONS.md` for known limitations."
    ])
    
    content = "\n".join(lines)
    
    with open(output_path, "w") as f:
        f.write(content)
    
    logger.info(f"Generated validation report: {output_path}")
    return content


def plot_reliability_curves(results: Dict, output_dir: Path = None):
    """Plot reliability curves for all targets."""
    if output_dir is None:
        output_dir = RESULTS_DIR
    
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    axes = axes.flatten()
    
    for idx, (target, res) in enumerate(results["targets"].items()):
        ax = axes[idx]
        rel = res["reliability_curve"]
        
        centers = np.array(rel["bin_centers"])
        predicted = np.array(rel["predicted_frequency"])
        observed = np.array(rel["observed_frequency"])
        counts = np.array(rel["bin_counts"])
        
        # Plot
        mask = ~np.isnan(observed) & (counts > 0)
        if mask.any():
            ax.scatter(predicted[mask], observed[mask], s=counts[mask]*2, alpha=0.6, label="Bins")
            ax.plot([0, 1], [0, 1], "k--", alpha=0.5, label="Perfect calibration")
            
            ax.set_xlabel("Predicted Probability")
            ax.set_ylabel("Observed Frequency")
            ax.set_title(f"{target}\nBSS={res['brier_skill_score']:.3f}, AUC={res['roc_auc']:.3f}")
            ax.legend(fontsize=8)
            ax.grid(True, alpha=0.3)
            ax.set_xlim(-0.05, 1.05)
            ax.set_ylim(-0.05, 1.05)
    
    plt.tight_layout()
    plot_path = output_dir / "reliability_curves.png"
    plt.savefig(plot_path, dpi=150, bbox_inches="tight")
    plt.close()
    
    logger.info(f"Saved reliability curves to {plot_path}")
    return plot_path


def plot_skill_scores(results: Dict, output_dir: Path = None):
    """Plot Brier Skill Scores with confidence intervals."""
    if output_dir is None:
        output_dir = RESULTS_DIR
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    targets = list(results["targets"].keys())
    bss_values = [results["targets"][t]["brier_skill_score"] for t in targets]
    
    # Shorten labels
    short_labels = [t.replace("_risk_", " ").replace("_", " ").title() for t in targets]
    
    colors = ["green" if b > 0 else "red" for b in bss_values]
    bars = ax.barh(short_labels, bss_values, color=colors, alpha=0.7, edgecolor="black")
    
    # Add CI error bars
    for i, target in enumerate(targets):
        if "bss_bootstrap_ci" in results["targets"][target]:
            ci = results["targets"][target]["bss_bootstrap_ci"]
            ax.errorbar(bss_values[i], i, 
                       xerr=[[bss_values[i] - ci['ci_lower']], [ci['ci_upper'] - bss_values[i]]],
                       fmt="none", color="black", capsize=5)
    
    ax.axvline(x=0, color="black", linestyle="-", linewidth=0.5)
    ax.set_xlabel("Brier Skill Score (vs Climatology)")
    ax.set_title(f"Model Skill by Target ({results['spatial_unit']})")
    ax.grid(True, axis="x", alpha=0.3)
    
    # Add value labels
    for bar, val in zip(bars, bss_values):
        ax.text(val + (0.01 if val >= 0 else -0.01), bar.get_y() + bar.get_height()/2,
                f"{val:.3f}", va="center", ha="left" if val >= 0 else "right")
    
    plt.tight_layout()
    plot_path = output_dir / "skill_scores.png"
    plt.savefig(plot_path, dpi=150, bbox_inches="tight")
    plt.close()
    
    logger.info(f"Saved skill scores plot to {plot_path}")
    return plot_path


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Quick test
    np.random.seed(42)
    n = 1000
    y_true = np.random.binomial(1, 0.3, n)
    y_prob = np.random.beta(2, 5, n)
    groups = np.repeat([2020, 2021, 2022, 2023], n // 4)
    
    print("Brier Skill Score:", brier_skill_score(y_true, y_prob))
    print("Hit Rate/FAR:", hit_rate_false_alarm(y_true, (y_prob >= 0.5).astype(int)))
    print("Reliability:", reliability_curve(y_true, y_prob))
    print("Bootstrap CI:", bootstrap_bss_ci(y_true, y_prob, groups, n_bootstrap=100))