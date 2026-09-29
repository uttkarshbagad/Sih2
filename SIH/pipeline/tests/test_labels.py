"""Unit Tests for Label Functions

Tests cover:
- Break label: clear break, no break, season boundary edge cases
- False onset label: false onset, confirmed onset, edge cases
"""
import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parents[1]))

from pipeline.labels.break_labels import compute_break_labels, compute_break_risk_labels
from pipeline.labels.false_onset import compute_onset_dates, compute_false_onset_labels, compute_false_onset_risk_labels

def load_definitions():
    import yaml
    defs_path = Path(__file__).parents[1] / "labels" / "definitions.yaml"
    with open(defs_path) as f:
        return yaml.safe_load(f)


@pytest.fixture
def definitions():
    return load_definitions()


def make_daily_df(dates, rainfall, unit_id="TEST", year=2023):
    """Helper to create test DataFrame."""
    return pd.DataFrame({
        "date": pd.to_datetime(dates),
        "unit_id": unit_id,
        "year": year,
        "rainfall_mm": rainfall
    })


class TestBreakLabels:
    
    def test_clear_break(self, definitions):
        """A clear 5+ day dry spell in window should be labeled."""
        # June 15 - Sept 15 window
        dates = pd.date_range("2023-06-10", "2023-07-10", freq="D")
        rain = np.full(len(dates), 10.0)  # Normal rain
        rain[5:15] = 0.5  # 10-day dry spell starting June 15
        
        df = make_daily_df(dates, rain)
        labels = compute_break_labels(df, definitions)
        
        # Should detect break onset on June 15 (index 5)
        break_days = labels[labels["break_onset"] == 1]
        assert len(break_days) == 1
        assert break_days.iloc[0]["date"] == pd.Timestamp("2023-06-15")
    
    def test_no_break_short_spell(self, definitions):
        """3-day dry spell (< min 5 days) should NOT be labeled."""
        dates = pd.date_range("2023-06-10", "2023-06-20", freq="D")
        rain = np.full(len(dates), 10.0)
        rain[5:8] = 0.5  # Only 3-day dry spell
        
        df = make_daily_df(dates, rain)
        labels = compute_break_labels(df, definitions)
        
        assert labels["break_onset"].sum() == 0
    
    def test_no_break_outside_window(self, definitions):
        """Dry spell outside Jun 15 - Sep 15 should NOT be labeled."""
        dates = pd.date_range("2023-05-01", "2023-05-20", freq="D")
        rain = np.full(len(dates), 0.5)  # 20-day dry spell in May
        
        df = make_daily_df(dates, rain)
        labels = compute_break_labels(df, definitions)
        
        assert labels["break_onset"].sum() == 0
    
    def test_break_with_wet_day_interruption(self, definitions):
        """A wet day (>=2.5mm) should break the dry sequence."""
        dates = pd.date_range("2023-06-10", "2023-07-10", freq="D")
        rain = np.full(len(dates), 10.0)
        rain[5:15] = 0.5  # 10-day dry spell
        rain[9] = 5.0     # Wet day on day 9 (June 19) interrupts
        
        df = make_daily_df(dates, rain)
        labels = compute_break_labels(df, definitions)
        
        # Should detect TWO breaks: Jun 15-18 (4 days, too short) and Jun 20-24 (5 days)
        # Actually: first sequence is 4 days (Jun 15-18), second is 5 days (Jun 20-24)
        # Only second qualifies (>=5 days)
        break_days = labels[labels["break_onset"] == 1]
        assert len(break_days) == 1
        assert break_days.iloc[0]["date"] == pd.Timestamp("2023-06-20")
    
    def test_season_boundary_edge(self, definitions):
        """Break starting on last day of window (Sep 15) should count.
        
        Dry spell starts Sep 15 (in window) and continues to Sep 21.
        Should detect onset on Sep 15 since >=5 dry days fall in window.
        """
        dates = pd.date_range("2023-09-10", "2023-09-25", freq="D")
        rain = np.full(len(dates), 10.0)
        # Dry spell indices 5-11 = Sep 15-21 (7 days)
        # Only Sep 15 is in window (window ends Sep 15)
        # But we need 5 dry days IN window - this only has 1 day in window
        # So this should NOT trigger a break!
        # Let's adjust: make dry spell start earlier so more days fall in window
        rain[0:7] = 0.5  # Sep 10-16: 7 days, of which Sep 10-15 (6 days) in window
        
        df = make_daily_df(dates, rain)
        labels = compute_break_labels(df, definitions)
        
        break_days = labels[labels["break_onset"] == 1]
        assert len(break_days) == 1
        assert break_days.iloc[0]["date"] == pd.Timestamp("2023-09-10")


class TestFalseOnsetLabels:
    
    def test_false_onset(self, definitions):
        """Onset followed by 7-day dry run within 20 days = false onset.
        
        Onset: 3-day cum >= 20mm. Rolling window at index i covers i-2,i-1,i.
        So if we set rain at indices 35,36,37 to [8,7,6], the rolling sum at 37 = 21.
        Onset date = index 35 (first day of window).
        """
        dates = pd.date_range("2023-05-01", "2023-07-31", freq="D")
        rain = np.full(len(dates), 2.0)
        
        # Onset: rolling 3-day sum at index 37 = 21
        # 3-day window covers indices 35,36,37 -> onset date = index 35
        onset_idx = 35  # This is the onset DATE (first day of 3-day window)
        rain[onset_idx:onset_idx+3] = [8, 7, 6]  # cum at idx 37 = 21
        
        # False onset: 7-day dry spell starting 5 days after onset
        # onset_idx=35, so dry spell starts at 40 (5 days after onset date)
        rain[onset_idx+5:onset_idx+12] = 0.5
        
        df = make_daily_df(dates, rain)
        labels = compute_false_onset_labels(df, definitions)
        
        assert len(labels) == 1
        assert labels.iloc[0]["false_onset"] == 1
        assert labels.iloc[0]["onset_date"] == pd.Timestamp("2023-06-05")  # index 35 from May 1
    
    def test_confirmed_onset(self, definitions):
        """Onset followed by sustained rain = confirmed onset (not false)."""
        dates = pd.date_range("2023-05-01", "2023-07-31", freq="D")
        rain = np.full(len(dates), 2.0)
        
        onset_idx = 35  # June 5
        rain[onset_idx:onset_idx+3] = [8, 7, 6]  # onset
        
        # Sustained rain after onset (no 7-day dry run)
        rain[onset_idx+5:onset_idx+25] = np.random.exponential(8, 20)
        
        df = make_daily_df(dates, rain)
        labels = compute_false_onset_labels(df, definitions)
        
        assert len(labels) == 1
        assert labels.iloc[0]["false_onset"] == 0
    
    def test_false_onset_dry_run_exactly_7(self, definitions):
        """Exactly 7-day dry run should trigger false onset."""
        dates = pd.date_range("2023-05-01", "2023-07-31", freq="D")
        rain = np.full(len(dates), 2.0)
        
        onset_idx = 35
        rain[onset_idx:onset_idx+3] = [8, 7, 6]
        
        # Exactly 7-day dry run
        rain[onset_idx+5:onset_idx+12] = 0.5
        rain[onset_idx+12] = 10.0  # Rain on day 8
        
        df = make_daily_df(dates, rain)
        labels = compute_false_onset_labels(df, definitions)
        
        assert labels.iloc[0]["false_onset"] == 1
    
    def test_no_onset_detected(self, definitions):
        """No onset (no 3-day cum >= 20mm) = no labels."""
        dates = pd.date_range("2023-05-01", "2023-07-31", freq="D")
        rain = np.full(len(dates), 2.0)  # Never reaches 20mm in 3 days
        
        df = make_daily_df(dates, rain)
        labels = compute_false_onset_labels(df, definitions)
        
        assert len(labels) == 0
    
    def test_onset_before_search_start(self, definitions):
        """Onset before May 1 should not be detected."""
        dates = pd.date_range("2023-04-01", "2023-04-30", freq="D")
        rain = np.full(len(dates), 10.0)  # Heavy rain in April
        
        df = make_daily_df(dates, rain)
        onsets = compute_onset_dates(df, definitions)
        
        assert len(onsets) == 0


class TestBreakRiskLabels:
    
    def test_break_risk_week1(self, definitions):
        """Break risk at 7-day lead should be 1 for dates 7 days before break.
        
        dates starts June 1. Index 20 = June 21.
        Dry spell indices 20-29 = June 21-30 (10 days).
        Break onset = June 21 (first day of qualifying dry spell).
        
        Week 1 risk (lead=7): issue dates where break starts in next 1-7 days.
        For break on June 21: issue dates June 14-20 should have risk=1.
        """
        dates = pd.date_range("2023-06-01", "2023-07-31", freq="D")
        rain = np.full(len(dates), 10.0)
        # Break starts at index 20 = June 21
        rain[20:30] = 0.5
        
        df = make_daily_df(dates, rain)
        risk = compute_break_risk_labels(df, lead_days=7, definitions=definitions)
        
        # Risk should be 1 for June 14-20 (7 days before break onset on June 21)
        risk_dates = risk[risk["break_risk_w1"] == 1]["date"]
        assert pd.Timestamp("2023-06-14") in risk_dates.values
        assert pd.Timestamp("2023-06-20") in risk_dates.values
        assert pd.Timestamp("2023-06-21") not in risk_dates.values  # Day of onset
    
    def test_break_risk_week2(self, definitions):
        """Break risk at 14-day lead should be 1 for dates 1-14 days before break.
        
        Break onset = June 21 (index 20).
        Week 2 risk (lead=14): issue dates where break starts in next 1-14 days.
        For break on June 21: issue dates June 7-20 should have risk=1.
        """
        dates = pd.date_range("2023-06-01", "2023-07-31", freq="D")
        rain = np.full(len(dates), 10.0)
        rain[20:30] = 0.5  # Break starts June 21
        
        df = make_daily_df(dates, rain)
        risk = compute_break_risk_labels(df, lead_days=14, definitions=definitions)
        
        # Risk should be 1 for June 7-20 (1-14 days before break onset on June 21)
        risk_dates = risk[risk["break_risk_w2"] == 1]["date"]
        assert pd.Timestamp("2023-06-07") in risk_dates.values
        assert pd.Timestamp("2023-06-20") in risk_dates.values


class TestFalseOnsetRiskLabels:
    
    def test_false_onset_risk_week1(self, definitions):
        """False onset risk at 7-day lead."""
        dates = pd.date_range("2023-05-01", "2023-07-31", freq="D")
        rain = np.full(len(dates), 2.0)
        
        onset_idx = 35  # June 5
        rain[onset_idx:onset_idx+3] = [8, 7, 6]
        rain[onset_idx+5:onset_idx+12] = 0.5  # False onset trigger
        
        df = make_daily_df(dates, rain)
        risk = compute_false_onset_risk_labels(df, lead_days=7, definitions=definitions)
        
        # Risk should be 1 for 7 days before onset (May 29 - June 4)
        risk_dates = risk[risk["false_onset_risk_w1"] == 1]["date"]
        assert len(risk_dates) == 7


if __name__ == "__main__":
    pytest.main([__file__, "-v"])