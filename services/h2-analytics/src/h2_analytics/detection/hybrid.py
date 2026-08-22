"""Hybrid detector: ML proposes row candidates, the rule layer confirms them.

The machine-learning scorer is optional: it is only used through the factory
when a reviewed model artifact is present in the model directory. Without the
artifact the pipeline falls back to pure rules (see `factory.py`). The rule
layer remains the evidence and confirmation authority, so the deterministic
detections are never weakened by the optional scorer.
"""

from __future__ import annotations

from datetime import timedelta

from h2_analytics.models import DataRow

from .base import DetectionCandidate, RowDetector
from .lightgbm_adapter import LightGbmRowDetector

_CONFIRMATION_WINDOW_MINUTES = 15


class HybridRowDetector:
    """ML-scored candidates confirmed by the deterministic rule layer."""

    def __init__(
        self,
        *,
        scorer: LightGbmRowDetector,
        rules: RowDetector,
        version: str,
    ) -> None:
        self._scorer = scorer
        self._rules = rules
        self._version = version

    @property
    def version(self) -> str:
        return self._version

    @property
    def scorer(self) -> LightGbmRowDetector:
        return self._scorer

    def detect(self, rows: tuple[DataRow, ...]) -> tuple[DetectionCandidate, ...]:
        rule_candidates = self._rules.detect(rows)
        ml_candidates = self._scorer.detect(rows)
        confirmed = self._confirm(ml_candidates, rule_candidates)
        by_identity = {(c.code, c.subtype, c.row_index): c for c in confirmed}
        for candidate in rule_candidates:
            by_identity.setdefault(
                (candidate.code, candidate.subtype, candidate.row_index), candidate
            )
        return tuple(
            sorted(
                by_identity.values(),
                key=lambda item: (item.timestamp, item.code, item.subtype, item.row_index),
            )
        )

    def _confirm(
        self,
        ml_candidates: tuple[DetectionCandidate, ...],
        rule_candidates: tuple[DetectionCandidate, ...],
    ) -> list[DetectionCandidate]:
        window = timedelta(minutes=_CONFIRMATION_WINDOW_MINUTES)
        rule_by_code: dict[str, list[DetectionCandidate]] = {}
        for candidate in rule_candidates:
            rule_by_code.setdefault(candidate.code, []).append(candidate)
        confirmed: list[DetectionCandidate] = []
        for candidate in ml_candidates:
            peers = rule_by_code.get(candidate.code, ())
            if any(
                abs(peer.timestamp - candidate.timestamp) <= window for peer in peers
            ):
                confirmed.append(candidate)
        return confirmed
