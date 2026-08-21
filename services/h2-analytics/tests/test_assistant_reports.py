from __future__ import annotations

import hashlib
import json

import pytest

from h2_analytics import vocabulary
from h2_analytics.contracts import ASSISTANT_QUESTION_IDS, SUBMISSION_COLUMNS
from h2_analytics.service import AnalyticsService


def _analyzed(valid_csv: str) -> tuple[AnalyticsService, str]:
    service = AnalyticsService()
    dataset_id = service.import_csv(
        filename="tiny-valid-timeseries.csv", text=valid_csv
    )["dataset"]["datasetId"]
    return service, service.run_analysis(dataset_id)["runId"]


def test_all_ten_answers_are_deterministic_without_llm(valid_csv: str) -> None:
    service, run_id = _analyzed(valid_csv)

    answers = [
        service.ask(
            run_id=run_id,
            question_id=question_id,
            event_id=None,
            allow_llm_rendering=True,
        )
        for question_id in ASSISTANT_QUESTION_IDS
    ]

    assert [answer["questionId"] for answer in answers] == list(
        ASSISTANT_QUESTION_IDS
    )
    assert all(answer["mode"] == "DETERMINISTIC_TEMPLATE" for answer in answers)
    assert all(answer["refusedControlClaim"] for answer in answers)
    assert answers == [
        service.ask(
            run_id=run_id,
            question_id=question_id,
            event_id=None,
            allow_llm_rendering=False,
        )
        for question_id in ASSISTANT_QUESTION_IDS
    ]


def test_answers_carry_official_chinese_questions_and_no_invented_measurement_points(
    valid_csv: str,
) -> None:
    """Task B4: answers use the official Q01-Q10 Chinese from the vocabulary.

    Each answer echoes its official question verbatim, classifies itself as
    fact / calculation / recommendation, and only cites official field names
    when it references a measurement point.
    """
    service, run_id = _analyzed(valid_csv)
    official = {
        entry["questionId"]: entry["question"]
        for entry in vocabulary.assistant_questions()
    }
    assert set(official) == set(ASSISTANT_QUESTION_IDS)
    official_fields = set(vocabulary.official_field_names())

    for question_id in ASSISTANT_QUESTION_IDS:
        answer = service.ask(
            run_id=run_id,
            question_id=question_id,
            event_id=None,
            allow_llm_rendering=False,
        )
        sections = {section["sectionId"]: section for section in answer["sections"]}
        assert sections["question"]["text"] == official[question_id], question_id
        assert sections["answer"]["claimKind"] in {
            "fact",
            "calculation",
            "recommendation",
        }, question_id
        citation = answer["citations"][0]
        if citation["sourceType"] == "variable":
            assert citation["sourceId"] in official_fields, question_id


@pytest.mark.parametrize(
    ("kind", "event_id", "expected_format", "expected_media_type"),
    [
        ("single_event_diagnosis", "C04-20260105-001", "html", "text/html"),
        ("period_summary", None, "html", "text/html"),
        ("analysis_result_json", None, "json", "application/json"),
        ("submission_csv", None, "csv", "text/csv"),
        ("validation_metrics", None, "json", "application/json"),
        ("quality_report", None, "html", "text/html"),
    ],
)
def test_report_kind_format_parity_and_content_addressing(
    valid_csv: str,
    kind: str,
    event_id: str | None,
    expected_format: str,
    expected_media_type: str,
) -> None:
    service, run_id = _analyzed(valid_csv)
    artifact = service.export_report(
        run_id=run_id,
        kind=kind,
        event_id=event_id,
    )

    expected_hash = hashlib.sha256(artifact["content"].encode("utf-8")).hexdigest()
    assert artifact["descriptor"]["contentHash"] == f"sha256:{expected_hash}"
    assert artifact["descriptor"]["format"] == expected_format
    assert artifact["mediaType"] == expected_media_type
    assert artifact["descriptor"]["filename"].endswith(f".{expected_format}")
    assert "C:\\" not in artifact["content"]

    if expected_format == "html":
        assert "<!doctype html>" in artifact["content"]
        assert "require human confirmation" in artifact["content"]
        assert "Dataset fingerprint:" in artifact["content"]
        if kind == "single_event_diagnosis":
            assert "120.0" in artifact["content"]
        if kind == "quality_report":
            assert "Rows" in artifact["content"]
            assert "Time range" in artifact["content"]
            assert "Provenance source" in artifact["content"]
            assert "sanitized-golden-fixture" in artifact["content"]
    elif expected_format == "json":
        payload = json.loads(artifact["content"])
        assert payload["runId"] == run_id
    else:
        assert artifact["content"].splitlines()[0] == ",".join(SUBMISSION_COLUMNS)
        assert artifact["content"].splitlines()[1].endswith(",true")


def test_validation_metrics_contains_quality_and_provenance(valid_csv: str) -> None:
    service, run_id = _analyzed(valid_csv)
    artifact = service.export_report(run_id=run_id, kind="validation_metrics")

    payload = json.loads(artifact["content"])
    assert payload["reportKind"] == "validation_metrics"
    assert payload["quality"]["status"] in {"passed", "warning"}
    assert payload["provenance"]["mode"] == "FIXTURE"


@pytest.mark.parametrize(
    ("kind", "needs_event"),
    [
        ("single_event_diagnosis", True),
        ("period_summary", False),
        ("quality_report", False),
    ],
)
def test_html_reports_escape_imported_filename(
    valid_csv: str, kind: str, needs_event: bool
) -> None:
    service = AnalyticsService()
    live_csv = valid_csv + "\n"
    dataset_id = service.import_csv(filename="<script>.csv", text=live_csv)[
        "dataset"
    ]["datasetId"]
    run = service.run_analysis(dataset_id)
    artifact = service.export_report(
        run_id=run["runId"],
        kind=kind,
        event_id=run["events"][0]["eventId"] if needs_event else None,
    )

    assert "&lt;script&gt;.csv" in artifact["content"]
    assert "<script>.csv" not in artifact["content"]


def test_period_summary_contains_all_six_required_items(valid_csv: str) -> None:
    """Task B5: the PCC compliance daily report carries six items:

    power boundary interval, violation duration & energy, symbol convention,
    dataset fingerprint, constraints, and unresolved events.
    """
    service, run_id = _analyzed(valid_csv)
    artifact = service.export_report(run_id=run_id, kind="period_summary")
    content = artifact["content"]

    assert artifact["descriptor"]["format"] == "html"
    for marker in (
        "数据集指纹",
        "符号约定",
        "功率边界区间",
        "越限时长",
        "生效约束",
        "未决事件",
    ):
        assert marker in content, marker
    assert "正值上网、负值下网" in content or "pcc_sign_convention" in content
