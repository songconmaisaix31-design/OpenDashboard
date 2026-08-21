from __future__ import annotations

from typing import Any

from h2_analytics import vocabulary
from h2_analytics.contracts import ASSISTANT_QUESTION_IDS, build_provenance
from h2_analytics.errors import AnalyticsError

# Official Q01-Q10 Chinese question texts, taken verbatim from the frozen
# `16_assistant_questions.csv` via the vocabulary package. The registry below
# is keyed by the same IDs the API accepts; answers never rewrite a question.
_QUESTIONS = {entry["questionId"]: entry["question"] for entry in vocabulary.assistant_questions()}

# Each answer is (claim_kind, text, citation_source_type, citation_source_id).
# claim_kind distinguishes FACT (直接事实), CALCULATION (计算结论) and ADVICE
# (建议类回答). Citation source ids reference only official vocabulary entries
# or official field names; no measurement point is ever invented.
_ANSWERS: dict[str, tuple[str, str, str, str]] = {
    "Q01": (
        "fact",
        (
            "PCC 功率为正值表示向电网上网，为负值表示从电网下网。"
            "这是系统统一符号约定，PCC 实际功率直接按该约定解读。"
        ),
        "variable",
        "pcc_power_actual_kw",
    ),
    "Q02": (
        "fact",
        (
            "动态上下网功率限值属于瞬时功率约束，按分钟判定是否越限，对应 C04 类异常；"
            "上下网日电量配额属于累计电量约束，按自然日累计核算，对应 C05 类异常。"
            "同一分钟既可能越限又可能触碰配额，需分别核对各自字段。"
        ),
        "knowledge_base",
        "h2-anomaly-taxonomy-v1",
    ),
    "Q03": (
        "calculation",
        (
            "储能方向异常会使储能实际充放电方向与 EMS 指令相反，"
            "导致并网点实际功率偏离目标，形成异常电网交换电量。"
        ),
        "event",
        "C03",
    ),
    "Q04": (
        "calculation",
        (
            "当可用充电能量或可用放电能量低于调节备用目标时，SOC 调节裕度不足，"
            "无法覆盖未来功率波动与 PCC 约束。"
        ),
        "knowledge_base",
        "c07-reserve-rule-v1",
    ),
    "Q05": (
        "recommendation",
        (
            "对比 EMS 报告可用容量与设备实际可用容量，核查 PLC 状态映射与刷新周期；"
            "若指令持续大于实际执行功率，需在人工确认后刷新容量。"
        ),
        "knowledge_base",
        "c02-capacity-check-v1",
    ),
    "Q06": (
        "recommendation",
        (
            "若电解槽功率指令在光伏与 PCC 实际功率相对稳定的时段高频振荡，则为控制指令振荡；"
            "若光伏与 PCC 同时大幅波动，则应首先考虑云团等外部扰动。"
        ),
        "constraint",
        "electrolyzer-ramp-limit-v1",
    ),
    "Q07": (
        "calculation",
        (
            "应综合设备可用性、实际效率曲线、最小稳定功率与运行状态评价负荷分配；"
            "高单位电耗设备承担过多负荷或发生可避免启停即为分配异常。"
        ),
        "knowledge_base",
        "c06-allocation-rule-v1",
    ),
    "Q08": (
        "fact",
        (
            "所有操作建议均需人工确认。本服务只执行监督、诊断、解释、量化和建议，"
            "不直接向真实设备闭环下发控制指令。"
        ),
        "constraint",
        "human-confirmation-v1",
    ),
    "Q09": (
        "recommendation",
        (
            "测试集异常诊断报告通过报告导出生成：对每个检测事件导出单事件诊断"
            "（含证据链、量化影响、推断原因、安全检查与建议），"
            "并可用 period_summary 汇总 PCC 合规日报；全部内容来自本地确定性分析。"
        ),
        "report",
        "single_event_diagnosis",
    ),
    "Q10": (
        "recommendation",
        (
            "PCC 合规日报应包含功率边界区间、越限时长与越限电量、符号约定、"
            "数据集指纹、生效约束与未决事件六项内容。"
        ),
        "report",
        "period_summary",
    ),
}

_EVENT_DEPENDENT = {"Q03"}


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
        question = _QUESTIONS[question_id]
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
                    "sectionId": "question",
                    "claimKind": "fact",
                    "text": question,
                    "citationIds": [citation_id],
                },
                {
                    "sectionId": "answer",
                    "claimKind": claim_kind,
                    "text": text,
                    "citationIds": [citation_id],
                },
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
