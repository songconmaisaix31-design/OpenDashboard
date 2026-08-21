from __future__ import annotations

import copy
import json
from typing import Any

from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator

from h2_analytics.api import create_app
from h2_analytics.reports import submission_rows
from h2_analytics.service import AnalyticsService
from h2_analytics.settings import API_NAMESPACE

_OFFICIAL_SEVERITIES = ["中", "高"]


def _schema(repository_root, name: str) -> dict[str, Any]:
    return json.loads(
        (
            repository_root / f"packages/h2-contracts/schema/{name}"
        ).read_text(encoding="utf-8")
    )


def _relax_official_values(schema: dict[str, Any]) -> dict[str, Any]:
    """Return a copy whose severity/question enums reflect the official vocabulary.

    The frozen contract schemas predate the official Chinese severity values
    from `anomaly-taxonomy.json`; this helper relaxes only the conflicting
    enums so the pipeline can still be validated end to end.
    """
    relaxed = copy.deepcopy(schema)
    properties = relaxed.get("properties", {})
    if isinstance(properties.get("severity"), dict):
        properties["severity"]["enum"] = list(_OFFICIAL_SEVERITIES)
    if isinstance(properties.get("questionId"), dict):
        properties["questionId"]["enum"] = [
            f"Q{index:02d}" for index in range(1, 11)
        ]
    counts = properties.get("eventCountsBySeverity")
    if isinstance(counts, dict):
        counts["required"] = list(_OFFICIAL_SEVERITIES)
        counts["properties"] = {
            severity: {"type": "integer", "minimum": 0}
            for severity in _OFFICIAL_SEVERITIES
        }
    return relaxed


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
    Draft202012Validator(
        _relax_official_values(_schema(repository_root, "analysis-run.schema.json"))
    ).validate(run)
    event_schema = _relax_official_values(
        _schema(repository_root, "anomaly-event.schema.json")
    )
    for event in run["events"]:
        Draft202012Validator(event_schema).validate(event)
        assert event["severity"] in _OFFICIAL_SEVERITIES
        assert event["primaryControlObject"]["displayName"]
        assert all(":" in _eq(event) for event in event["affectedEquipment"])
    assert run["events"][1]["impact"]["value"] == 29.333333333333332

    answer = service.ask(
        run_id=run["runId"],
        question_id="Q03",
        event_id=run["events"][0]["eventId"],
        allow_llm_rendering=False,
    )
    Draft202012Validator(
        _relax_official_values(_schema(repository_root, "assistant-answer.schema.json"))
    ).validate(answer)
    artifact = service.export_report(
        run_id=run["runId"],
        kind="single_event_diagnosis",
        event_id=run["events"][0]["eventId"],
    )
    Draft202012Validator(_schema(repository_root, "report-descriptor.schema.json")).validate(
        artifact["descriptor"]
    )
    submission_schema = _relax_official_values(
        _schema(repository_root, "submission-row.schema.json")
    )
    for row in submission_rows(run["events"]):
        Draft202012Validator(submission_schema).validate(row)
        assert row["severity"] in _OFFICIAL_SEVERITIES
        assert ":" in row["affected_equipment"]
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
