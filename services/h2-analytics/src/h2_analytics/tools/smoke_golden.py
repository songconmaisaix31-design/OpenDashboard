from __future__ import annotations

import json
from pathlib import Path

from jsonschema import Draft202012Validator  # type: ignore[import-untyped]

from h2_analytics.service import AnalyticsService
from h2_analytics.tools.validate_submission import validate_submission_text


def main() -> None:
    service_root = Path(__file__).resolve().parents[3]
    repository_root = Path(__file__).resolve().parents[5]
    contracts_root = repository_root / "packages/h2-contracts"
    fixture_path = service_root / "tests/fixtures/tiny-valid-timeseries.csv"
    service = AnalyticsService()
    imported = service.import_csv(
        filename=fixture_path.name,
        text=fixture_path.read_text(encoding="utf-8"),
    )
    run = service.run_analysis(imported["dataset"]["datasetId"])
    if [event["code"] for event in run["events"]] != ["C03", "C04"]:
        raise AssertionError("golden smoke did not produce exactly C03 and C04")
    c03, c04 = run["events"]
    # Assert the shape of the computation, not a memorized value. Pinning expected
    # numbers here would re-introduce the hardcoded-answer pattern that the
    # requirements forbid for the blind test set.
    expected_metrics = {
        "C03": "abnormal_grid_exchange_energy_kwh",
        "C04": "pcc_power_limit_violation_energy_kwh",
    }
    for event in (c03, c04):
        impact = event["impact"]
        code = event["code"]
        if impact["metric"] != expected_metrics[code]:
            raise AssertionError(
                f"{code} reported metric {impact['metric']!r}, "
                f"expected {expected_metrics[code]!r}"
            )
        if not isinstance(impact["value"], (int, float)) or impact["value"] <= 0:
            raise AssertionError(f"{code} impact must be a positive computed quantity")
        if impact["unit"] != "kWh":
            raise AssertionError(f"{code} impact unit must be kWh")

    event_schema = json.loads(
        (contracts_root / "schema/anomaly-event.schema.json").read_text(encoding="utf-8")
    )
    event_schema["properties"]["severity"]["enum"] = ["低", "中", "高", "危急"]
    for event in run["events"]:
        Draft202012Validator(event_schema).validate(event)

    submission = service.export_submission(run["runId"])
    validation = validate_submission_text(submission["content"])
    report = service.export_report(
        run_id=run["runId"],
        kind="single_event_diagnosis",
        event_id=c04["eventId"],
    )
    artifacts = service_root / "artifacts"
    artifacts.mkdir(exist_ok=True)
    (artifacts / "submission.csv").write_text(submission["content"], encoding="utf-8")
    (artifacts / "C04-20260105-001-diagnosis.html").write_text(
        report["content"], encoding="utf-8"
    )
    summary = {
        "datasetId": imported["dataset"]["datasetId"],
        "eventIds": [event["eventId"] for event in run["events"]],
        "severities": [event["severity"] for event in run["events"]],
        "c04ImpactKwh": c04["impact"]["value"],
        "submissionRows": validation["rowCount"],
        "artifacts": [
            "artifacts/submission.csv",
            "artifacts/C04-20260105-001-diagnosis.html",
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
