"""The single place that decides which detector the service runs by default.

`AnalyticsService` is shared by every track, so it must not name a concrete
detector. It calls `default_row_detector()` instead, and this module is owned by
the detection track. Swapping the default -- for example to a hybrid detector
that scores ML candidates and keeps the rule layer for the evidence chain -- is
therefore a one-file change here, with no edit to the shared service.

Callers that need a specific detector still pass one explicitly to
`AnalyticsService(detector=...)`; this factory only supplies the default.
"""

from __future__ import annotations

from .base import RowDetector
from .rules import RuleRowDetector


def default_row_detector() -> RowDetector:
    """Return the detector used when no detector is injected.

    The deterministic rule detector is the default because it needs no model
    artifact and no optional dependency, so a clean checkout analyzes a dataset
    without any extra setup.
    """
    return RuleRowDetector()
