from __future__ import annotations

from dataclasses import replace

from h2_analytics.detection import RuleRowDetector
from h2_analytics.events import EventAggregator
from h2_analytics.ingestion import DatasetLoader
from h2_analytics.safety import SafetyEvaluator


def test_safety_reports_passed_failed_and_warning(valid_csv: str) -> None:
    imported = DatasetLoader().import_csv(
        filename="tiny-valid-timeseries.csv", text=valid_csv
    )
    candidates = RuleRowDetector().detect(imported.rows)
    window = EventAggregator().aggregate(
        rows=imported.rows,
        candidates=candidates,
        sampling_interval_minutes=1,
    )[0]
    evaluator = SafetyEvaluator()
    provenance = imported.manifest["provenance"]

    passed = evaluator.evaluate(
        window=window,
        evidence_ids=("C03-EV-001", "C03-EV-002"),
        provenance=provenance,
    )
    assert passed[1]["status"] == "passed"

    failed_rows = tuple(
        replace(row, values={**row.values, "bess_soc_pct": 95.0})
        for row in window.rows
    )
    failed = evaluator.evaluate(
        window=replace(window, rows=failed_rows),
        evidence_ids=("C03-EV-001", "C03-EV-002"),
        provenance=provenance,
    )
    assert failed[1]["status"] == "failed"

    missing_rows = tuple(
        replace(row, values={**row.values, "bess_soc_pct": None})
        for row in window.rows
    )
    missing = evaluator.evaluate(
        window=replace(window, rows=missing_rows),
        evidence_ids=("C03-EV-001", "C03-EV-002"),
        provenance=provenance,
    )
    assert missing[1]["status"] == "warning"
    assert all(check["status"] != "unknown" for check in missing)
