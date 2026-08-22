from __future__ import annotations

import copy
import json
from typing import Any

from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator

from h2_analytics.api import create_app
from h2_analytics import vocabulary
from h2_analytics.reports import submission_rows
from h2_analytics.service import AnalyticsService
from h2_analytics.settings import API_NAMESPACE

_CANONICAL_SEVERITIES = ["low", "medium", "high", "critical"]
_CANONICAL_SEVERITY_BY_CODE = {
    "C01": "medium",
    "C02": "high",
    "C03": "high",
    "C04": "high",
    "C05": "high",
    "C06": "medium",
    "C07": "high",
}
_OFFICIAL_SEVERITY_BY_CODE = {
    "C01": "中",
    "C02": "高",
    "C03": "高",
    "C04": "高",
    "C05": "高",
    "C06": "中",
    "C07": "高",
}


def _schema(repository_root, name: str) -> dict[str, Any]:
    return json.loads(
        (
            repository_root / f"packages/h2-contracts/schema/{name}"
        ).read_text(encoding="utf-8")
    )


def _official_submission_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Adapt only the external competition severity column to its taxonomy."""
    official = copy.deepcopy(schema)
    official["properties"]["severity"]["enum"] = sorted(
        set(_OFFICIAL_SEVERITY_BY_CODE.values())
    )
    return official


def test_severity_boundaries_cover_all_anomaly_codes() -> None:
    assert vocabulary.canonical_severity_by_code() == _CANONICAL_SEVERITY_BY_CODE
    assert vocabulary.official_severity_by_code() == _OFFICIAL_SEVERITY_BY_CODE


def test_pipeline_outputs_validate_against_frozen_contract_schemas(
    repository_root, valid_csv: str
) -> None:
    service = AnalyticsService()
    dataset_id = service.import_csv(
        filename="tiny-valid-timeseries.csv", text=valid_csv
    )["dataset"]["datasetId"]
    run = service.run_analysis(dataset_id)

    Draft202012Validator(_schema(repository_root, "dataset-manifest.schema.json")).validate(
        run["dataset"]
    )
    Draft202012Validator(
        _schema(repository_root, "data-quality-report.schema.json")
    ).validate(run["quality"])
    Draft202012Validator(_schema(repository_root, "analysis-run.schema.json")).validate(
        run
    )
    assert run["eventCountsBySeverity"] == {
        "low": 0,
        "medium": 0,
        "high": 2,
        "critical": 0,
    }
    event_schema = _schema(repository_root, "anomaly-event.schema.json")
    for event in run["events"]:
        Draft202012Validator(event_schema).validate(event)
        assert event["severity"] in _CANONICAL_SEVERITIES
        assert event["primaryControlObject"]["displayName"]
        assert all(":" in _eq(event) for event in event["affectedEquipment"])
    assert run["events"][1]["impact"]["value"] == 120.0

    answer = service.ask(
        run_id=run["runId"],
        question_id="Q03",
        event_id=run["events"][0]["eventId"],
        allow_llm_rendering=False,
    )
    Draft202012Validator(_schema(repository_root, "assistant-answer.schema.json")).validate(
        answer
    )
    artifact = service.export_report(
        run_id=run["runId"],
        kind="single_event_diagnosis",
        event_id=run["events"][0]["eventId"],
    )
    Draft202012Validator(_schema(repository_root, "report-descriptor.schema.json")).validate(
        artifact["descriptor"]
    )
    submission_schema = _official_submission_schema(
        _schema(repository_root, "submission-row.schema.json")
    )
    for row in submission_rows(run["events"]):
        Draft202012Validator(submission_schema).validate(row)
        assert row["severity"] == _OFFICIAL_SEVERITY_BY_CODE[row["anomaly_code"]]
        assert "," in row["affected_equipment"]
        assert ":" not in row["affected_equipment"]
        assert " " not in row["affected_equipment"]
        assert row["primary_control_object"]


def _eq(item: dict[str, str]) -> str:
    return f"{item['id']}:{item['displayName']}"


def test_success_warning_and_error_api_envelopes_validate(
    repository_root, valid_csv: str
) -> None:
    client = TestClient(create_app(), base_url="http://127.0.0.1")
    schema = _schema(repository_root, "api-envelope.schema.json")
    success = client.get("/health").json()
    warning = client.post(
        f"{API_NAMESPACE}/datasets:import",
        json={"filename": "tiny-valid-timeseries.csv", "text": valid_csv},
    ).json()
    error = client.post(
        f"{API_NAMESPACE}/datasets:import",
        json={"filename": "../blocked.csv", "text": valid_csv},
    ).json()

    for envelope in (success, warning, error):
        Draft202012Validator(schema).validate(envelope)
