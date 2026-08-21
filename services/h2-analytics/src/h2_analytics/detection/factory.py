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

import json
from pathlib import Path

from .base import RowDetector
from .hybrid import HybridRowDetector
from .lightgbm_adapter import LightGbmRowDetector
from .rules import RuleRowDetector

_HYBRID_VERSION = "hybrid-lgbm-v1"

_MODEL_ENV = "H2_MODEL_DIR"
_DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[3] / "models"


def default_row_detector() -> RowDetector:
    """Return the detector used when no detector is injected.

    When a reviewed model artifact exists in the model directory, the default
    becomes the hybrid detector (ML candidates confirmed by the rule layer).
    Without the artifact the deterministic rule detector is used, so a clean
    checkout analyzes a dataset without any extra setup.
    """
    model = _load_approved_model()
    if model is None:
        return RuleRowDetector()
    booster, features, class_map, model_version = model
    scorer = LightGbmRowDetector(
        booster=booster,
        feature_names=features,
        class_map=class_map,
        version=model_version,
        minimum_confidence=0.5,
    )
    return HybridRowDetector(
        scorer=scorer,
        rules=RuleRowDetector(),
        version=_HYBRID_VERSION,
    )


def _load_approved_model() -> tuple[object, tuple[str, ...], dict[int, tuple[str, str]], str] | None:
    model_dir = _resolve_model_dir()
    if model_dir is None:
        return None
    metadata_path = model_dir / "row-scorer-meta.json"
    model_path = model_dir / "row-scorer.txt"
    if not metadata_path.is_file() or not model_path.is_file():
        return None
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        booster = _load_booster(model_path)
        features = tuple(metadata["features"])
        class_map = {
            int(index): (entry["code"], entry["subtype"])
            for index, entry in metadata["classes"].items()
        }
        version = metadata["version"]
    except (OSError, KeyError, ValueError):
        return None
    if booster is None or not features or not class_map or not version:
        return None
    return booster, features, class_map, version


def _resolve_model_dir() -> Path | None:
    override = _model_env_override()
    if override is not None:
        return override
    candidate = _DEFAULT_MODEL_DIR
    return candidate if candidate.is_dir() else None


def _model_env_override() -> Path | None:
    import os

    value = os.environ.get(_MODEL_ENV, "").strip()
    if not value:
        return None
    path = Path(value).resolve()
    return path if path.is_dir() else None


def _load_booster(model_path: Path) -> object | None:
    try:
        from lightgbm import Booster
    except ImportError:
        return None
    return Booster(model_file=str(model_path))
