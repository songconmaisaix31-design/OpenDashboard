from __future__ import annotations

from typing import Any

from h2_analytics import vocabulary
from h2_analytics.contracts import ASSISTANT_QUESTION_IDS, build_provenance
from h2_analytics.errors import AnalyticsError

_ANSWERS: dict[str, tuple[str, str, str, str]] = {
    "Q01": (
        "fact",
        "PCC功率正值表示向电网上网，负值表示从电网下网；储能功率正值表示放电，负值表示充电。",
        "variable",
        "pcc_power_actual_kw",
    ),
    "Q02": (
        "fact",
        "动态上下网功率限值属于瞬时功率约束，按分钟判定是否越限；上下网日电量配额属于累计电量约束，按自然日累计核算。二者分别对应C04与C05类异常。",
        "knowledge_base",
        "h2-anomaly-taxonomy-v1",
    ),
    "Q03": (
        "calculation",
        "储能方向异常会使储能实际充放电方向与EMS指令相反，导致并网点实际功率偏离目标，形成异常电网交换电量。",
        "event",
        "C03",
    ),
    "Q04": (
        "calculation",
        "当可用充电能量或可用放电能量低于调节备用目标时，SOC调节裕度不足，无法覆盖未来功率波动与PCC约束。",
        "knowledge_base",
        "c07-reserve-rule-v1",
    ),
    "Q05": (
        "recommendation",
        "对比EMS报告可用容量与设备实际可用容量，核查PLC状态映射与刷新周期；若指令持续大于实际执行功率，需在人工确认后刷新容量。",
        "knowledge_base",
        "c02-capacity-check-v1",
    ),
    "Q06": (
        "recommendation",
        "若电解槽功率指令在光伏与PCC实际功率相对稳定的时段高频振荡，则为控制指令振荡；若光伏与PCC同时大幅波动，则应首先考虑外部扰动。",
        "constraint",
        "electrolyzer-ramp-limit-v1",
    ),
    "Q07": (
        "calculation",
        "应综合设备可用性、实际效率曲线、最小稳定功率与运行状态评价负荷分配；高单位电耗设备承担过多负荷或发生可避免启停即为分配异常。",
        "knowledge_base",
        "c06-allocation-rule-v1",
    ),
    "Q08": (
        "fact",
        "所有操作建议均需人工确认。本服务只执行监督、诊断、解释、量化和建议，不直接向真实设备闭环下发控制指令。",
        "constraint",
        "human-confirmation-v1",
    ),
    "Q09": (
        "recommendation",
        "使用单事件诊断报告，其中包含证据链、计算影响、推断原因、安全检查与咨询建议。",
        "report",
        "single_event_diagnosis",
    ),
    "Q10": (
        "recommendation",
        "PCC合规日报应包含功率边界区间、越限时长与越限电量、符号约定、数据集指纹、生效约束与未决事件。",
        "report",
        "period_summary",
    ),
}

_EVENT_DEPENDENT = {"Q03", "Q09"}


class AssistantService:
    def answer(
        self,
        *,
        run: dict[str, Any],
        question_id: str,
        event_id: str | None,
        allow_llm_rendering: bool,
    ) -> dict[str, Any]:
        del allow_llm_rendering
        if question_id not in ASSISTANT_QUESTION_IDS:
            raise AnalyticsError("assistant.invalid_question", "Question ID is not supported.")
        event = _select_event(run, event_id, question_id)
        claim_kind, text, source_type, source_id = _ANSWERS[question_id]
        if event is not None and question_id in _EVENT_DEPENDENT:
            source_id = event["eventId"]
            text = (
                f"{text} 已选事件：{event['eventId']}（{event['startTime']} 至 {event['endTime']}）。"
            )
        elif event is None and question_id in _EVENT_DEPENDENT:
            text = (
                f"{text} 当前运行没有可确认的{question_id}事件，无法给出具体事件证据。"
            )
        citation_id = f"citation-{question_id}-{source_id}"
        generated_at = run.get("completedAt", run["startedAt"])
        mode = run["dataset"]["mode"]
        provenance = build_provenance(
            mode=mode,
            generated_at=generated_at,
            fingerprint=run["dataset"]["fingerprint"],
            renderer_version="deterministic-assistant-v1",
        )
        answer_id_suffix = event["eventId"] if event is not None else run["runId"]
        answer: dict[str, Any] = {
            "schemaVersion": 1,
            "answerId": f"answer-{question_id}-{answer_id_suffix}",
            "runId": run["runId"],
            "questionId": question_id,
            "mode": "DETERMINISTIC_TEMPLATE",
            "generatedAt": generated_at,
            "sections": [
                {
                    "sectionId": "answer",
                    "claimKind": claim_kind,
                    "text": text,
                    "citationIds": [citation_id],
                }
            ],
            "citations": [
                {
                    "citationId": citation_id,
                    "claimKind": claim_kind,
                    "sourceType": source_type,
                    "sourceId": source_id,
                    **({"eventId": event["eventId"]} if event is not None else {}),
                }
            ],
            "refusedControlClaim": True,
            "provenance": provenance,
        }
        if event is not None:
            answer["eventId"] = event["eventId"]
        return answer


def _select_event(
    run: dict[str, Any],
    event_id: str | None,
    question_id: str,
) -> dict[str, Any] | None:
    if event_id is not None:
        for event in run["events"]:
            if event["eventId"] == event_id:
                return event
        raise AnalyticsError("event.not_found", "Anomaly event was not found.")
    if question_id in _EVENT_DEPENDENT:
        preferred_code = "C03" if question_id == "Q03" else None
        return next(
            (
                event
                for event in run["events"]
                if preferred_code is None or event["code"] == preferred_code
            ),
            None,
        )
    return None
