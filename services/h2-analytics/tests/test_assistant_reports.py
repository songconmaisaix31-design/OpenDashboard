from __future__ import annotations

import hashlib

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


def test_html_json_and_submission_exports_are_content_addressed(valid_csv: str) -> None:
    service, run_id = _analyzed(valid_csv)
    html = service.export_report(
        run_id=run_id,
        kind="single_event_diagnosis",
        event_id="C04-20260105-001",
    )
    analysis = service.export_report(run_id=run_id, kind="analysis_result_json")
    submission = service.export_submission(run_id)

    assert "29.333333333333332" in html["content"]
    assert "require human confirmation" in html["content"]
    for artifact in (html, analysis, submission):
        expected = hashlib.sha256(artifact["content"].encode("utf-8")).hexdigest()
        assert artifact["descriptor"]["contentHash"] == f"sha256:{expected}"
        assert "C:\\" not in artifact["content"]
    assert submission["content"].splitlines()[0] == ",".join(SUBMISSION_COLUMNS)
    assert submission["content"].splitlines()[1].endswith(",true")


def test_html_report_escapes_imported_filename(valid_csv: str) -> None:
    service = AnalyticsService()
    live_csv = valid_csv + "\n"
    dataset_id = service.import_csv(filename="<script>.csv", text=live_csv)[
        "dataset"
    ]["datasetId"]
    run = service.run_analysis(dataset_id)
    artifact = service.export_report(
        run_id=run["runId"],
        kind="single_event_diagnosis",
        event_id=run["events"][0]["eventId"],
    )

    assert "&lt;script&gt;.csv" in artifact["content"]
    assert "<script>.csv" not in artifact["content"]
