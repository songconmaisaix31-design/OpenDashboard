from __future__ import annotations

import copy
import csv
import io
import json
from collections import Counter
from typing import Any

import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator

from h2_analytics import vocabulary
from h2_analytics.api import create_app
from h2_analytics.contracts import SUBMISSION_COLUMNS
from h2_analytics.reports import submission_rows
from h2_analytics.service import AnalyticsService
from h2_analytics.settings import API_NAMESPACE
from h2_analytics.tools.validate_submission import validate_submission_text

_CANONICAL_SEVERITIES = ("low", "medium", "high", "critical")
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


def test_all_severity_mappings_are_closed_and_explicit() -> None:
    for code, canonical in _CANONICAL_SEVERITY_BY_CODE.items():
        assert vocabulary.canonical_severity_for_code(code) == canonical
        assert (
            vocabulary.official_severity_for_event(code, canonical)
            == _OFFICIAL_SEVERITY_BY_CODE[code]
        )


def test_unknown_code_and_taxonomy_severity_fail_closed(monkeypatch) -> None:
    with pytest.raises(vocabulary.VocabularyError):
        vocabulary.canonical_severity_for_code("C99")
    with pytest.raises(vocabulary.VocabularyError):
        vocabulary.official_severity_for_event("C99", "high")

    malformed_taxonomy = tuple(
        {**entry, "severity": "unexpected"} if entry["code"] == "C01" else entry
        for entry in vocabulary.load_taxonomy()
    )
    monkeypatch.setattr(vocabulary, "load_taxonomy", lambda: malformed_taxonomy)
    with pytest.raises(vocabulary.VocabularyError):
        vocabulary.canonical_severity_for_code("C01")


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
    event_counts = Counter(event["severity"] for event in run["events"])
    expected_counts = {
        severity: event_counts[severity] for severity in _CANONICAL_SEVERITIES
    }
    assert run["eventCountsBySeverity"] == expected_counts
    assert sum(run["eventCountsBySeverity"].values()) == len(run["events"])
    event_schema = _schema(repository_root, "anomaly-event.schema.json")
    for event in run["events"]:
        Draft202012Validator(event_schema).validate(event)
        assert event["severity"] == _CANONICAL_SEVERITY_BY_CODE[event["code"]]
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
    submission = service.export_submission(run["runId"])
    validation = validate_submission_text(submission["content"])
    assert tuple(validation["columns"]) == SUBMISSION_COLUMNS
    rows = list(csv.DictReader(io.StringIO(submission["content"])))
    for row in rows:
        assert row["severity"] == _OFFICIAL_SEVERITY_BY_CODE[row["anomaly_code"]]
        assert "," in row["affected_equipment"]
        assert ":" not in row["affected_equipment"]
        assert " " not in row["affected_equipment"]
        assert row["primary_control_object"]


def test_submission_rejects_tampered_internal_severity(valid_csv: str) -> None:
    service = AnalyticsService()
    dataset_id = service.import_csv(
        filename="tiny-valid-timeseries.csv", text=valid_csv
    )["dataset"]["datasetId"]
    event = service.run_analysis(dataset_id)["events"][0]

    for severity in ("高", "medium"):
        tampered = copy.deepcopy(event)
        tampered["severity"] = severity
        with pytest.raises(vocabulary.VocabularyError):
            submission_rows([tampered])

    unknown_code = copy.deepcopy(event)
    unknown_code["code"] = "C99"
    with pytest.raises(vocabulary.VocabularyError):
        submission_rows([unknown_code])


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
