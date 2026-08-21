"""Fit the row-level candidate scorer from the official training pack.

Reproducible entry point:

    H2_OFFICIAL_DATA_DIR="<pack>/数据与材料" python -m h2_analytics.training.fit

Writes `models/row-scorer.txt` (LightGBM booster) and
`models/row-scorer-meta.json` (features, class map, version, class counts).
Both paths are git-ignored; only this script is committed.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

_ELZ_IDS = ("1", "2", "3")
_ELZ_POWER_ACTUAL = tuple(f"elz{i}_power_actual_kw" for i in _ELZ_IDS)
_ELZ_POWER_CMD = tuple(f"elz{i}_power_cmd_kw" for i in _ELZ_IDS)
_ELZ_SPECIFIC = tuple(f"elz{i}_specific_energy_kwh_per_kg" for i in _ELZ_IDS)
_ELZ_STATE = tuple(f"elz{i}_run_state" for i in _ELZ_IDS)
_ELZ_CAP = tuple(f"elz{i}_actual_available_capacity_kw" for i in _ELZ_IDS)
_ELZ_FLAG = tuple(f"elz{i}_available_flag" for i in _ELZ_IDS)
_ELZ_EQUIPMENT = ("ELZ01", "ELZ02", "ELZ03")

# Row-level fields included directly in the feature vector.
_LEVEL_FIELDS = (
    "pv_forecast_kw", "pv_available_kw", "pv_actual_kw", "pv_curtailment_kw",
    "aux_load_kw", "soc_target_pct", "bess_soc_pct",
    "bess_charge_power_limit_kw", "bess_discharge_power_limit_kw",
    "bess_power_cmd_kw", "bess_power_actual_kw",
    "bess_available_charge_energy_kwh", "bess_available_discharge_energy_kwh",
    "bess_regulation_reserve_target_kwh",
    "pcc_power_cmd_kw", "pcc_power_actual_kw",
    "grid_export_power_kw", "grid_import_power_kw",
    "grid_export_power_limit_kw", "grid_import_power_limit_kw",
    "grid_export_energy_quota_kwh_day", "grid_import_energy_quota_kwh_day",
    "grid_export_energy_used_kwh_day", "grid_import_energy_used_kwh_day",
    "grid_export_energy_remaining_kwh", "grid_import_energy_remaining_kwh",
    "pcc_export_power_violation_kw", "pcc_import_power_violation_kw",
    "grid_export_energy_quota_excess_kwh", "grid_import_energy_quota_excess_kwh",
    "ems_total_elz_target_kw", "ems_power_balance_error_kw", "bus_frequency_hz",
    "total_h2_production_kgph", "system_alarm_count",
) + tuple(
    field
    for unit in _ELZ_IDS
    for field in (
        f"elz{unit}_available_flag", f"elz{unit}_run_state",
        f"elz{unit}_reported_available_capacity_kw",
        f"elz{unit}_actual_available_capacity_kw",
        f"elz{unit}_power_cmd_kw", f"elz{unit}_power_actual_kw",
        f"elz{unit}_specific_energy_kwh_per_kg",
        f"elz{unit}_start_stop_count", f"elz{unit}_plc_heartbeat",
        f"elz{unit}_current_run_duration_min",
        f"elz{unit}_current_stop_duration_min",
    )
)

# Fields that get rolling window statistics (mean / std / min / max) in
# addition to their level value.
_WINDOW_FIELDS = (
    "pv_actual_kw", "bess_power_actual_kw", "bess_power_cmd_kw",
    "bess_soc_pct", "pcc_power_actual_kw", "pcc_power_cmd_kw",
    "pcc_export_power_violation_kw", "pcc_import_power_violation_kw",
    "grid_export_energy_quota_excess_kwh", "grid_import_energy_quota_excess_kwh",
    "ems_total_elz_target_kw", "bus_frequency_hz",
) + tuple(
    field for unit in _ELZ_IDS for field in (f"elz{unit}_power_actual_kw",)
)

_WINDOW_MINUTES = (10, 30)
_LABEL_FILE = "06_train_row_labels.csv"
_SERIES_FILE = "01_train_timeseries.csv"
_NORMAL_CONTEXT_FILE = "13_train_validation_normal_context.csv"
_CLASS_ORDER = (
    "NORMAL", "C01", "C02", "C03", "C04", "C05", "C06", "C07",
)
_SUBTYPE_BY_CLASS = {
    "NORMAL": "NORMAL",
    "C01": "SETPOINT_OSCILLATION",
    "C02": "CAPACITY_NOT_SYNCHRONIZED",
    "C03": "BESS_DIRECTION_REVERSED",
    "C04": "EXPORT_POWER_LIMIT_NOT_TRACKED",
    "C05": "EXPORT_ENERGY_QUOTA_RISK",
    "C06": "INEFFICIENT_POWER_ALLOCATION",
    "C07": "DISCHARGE_RESERVE_SHORTFALL",
}


def _to_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _resolve_data_dir(arguments: argparse.Namespace) -> Path:
    override = (arguments.data_dir or os.environ.get("H2_OFFICIAL_DATA_DIR", "")).strip()
    if not override:
        raise SystemExit(
            "Set H2_OFFICIAL_DATA_DIR or pass --data-dir to the official pack's "
            "数据与材料 directory."
        )
    path = Path(override).resolve()
    if not path.is_dir():
        raise SystemExit(f"Data directory does not exist: {path}")
    return path


def _load_labels(data_dir: Path) -> dict[str, str]:
    labels: dict[str, str] = {}
    with open(data_dir / _LABEL_FILE, newline="", encoding="utf-8-sig") as fh:
        import csv

        for row in csv.DictReader(fh):
            labels[row["timestamp"]] = (
                row["anomaly_code"] if row["is_anomaly"] == "1" else "NORMAL"
            )
    return labels


def _load_normal_context_timestamps(data_dir: Path) -> set[str]:
    import csv

    windows: list[tuple[datetime, datetime]] = []
    with open(data_dir / _NORMAL_CONTEXT_FILE, newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            start = datetime.fromisoformat(row["start_time"].replace(" ", "T")).replace(
                tzinfo=UTC
            )
            end = datetime.fromisoformat(row["end_time"].replace(" ", "T")).replace(
                tzinfo=UTC
            )
            windows.append((start, end))
    timestamps: set[str] = set()
    with open(data_dir / _SERIES_FILE, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            ts = datetime.fromisoformat(row["timestamp"].replace(" ", "T")).replace(
                tzinfo=UTC
            )
            if any(start <= ts <= end for start, end in windows):
                timestamps.add(row["timestamp"])
    return timestamps


def _build_features() -> list[str]:
    features: list[str] = []
    for field in _LEVEL_FIELDS:
        features.append(f"{field}:level")
    for field in _WINDOW_FIELDS:
        for minutes in _WINDOW_MINUTES:
            for stat in ("mean", "std", "min", "max"):
                features.append(f"{field}:{minutes}m:{stat}")
    return features


def _stream_dataset(data_dir: Path, features: list[str]):
    """Yield (feature_row, label) tuples streaming over the training series."""
    import csv

    labels = _load_labels(data_dir)
    normal_context = _load_normal_context_timestamps(data_dir)
    buffers: dict[str, list[float | None]] = {field: [] for field in _WINDOW_FIELDS}
    best_specific = _best_specific_by_unit()
    with open(data_dir / _SERIES_FILE, newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            values = {field: _to_float(row.get(field)) for field in _LEVEL_FIELDS}
            for field in _WINDOW_FIELDS:
                buffers[field].append(values[field])
                if len(buffers[field]) > max(_WINDOW_MINUTES):
                    buffers[field].pop(0)
            label = labels.get(row["timestamp"], "NORMAL")
            if row["timestamp"] in normal_context and label == "NORMAL":
                label = "NORMAL_CONTEXT"
            feature_row: list[float] = []
            for field in _LEVEL_FIELDS:
                value = values[field]
                feature_row.append(0.0 if value is None else value)
            for field in _WINDOW_FIELDS:
                window = buffers[field]
                for minutes in _WINDOW_MINUTES:
                    if len(window) < minutes:
                        for _ in range(4):
                            feature_row.append(0.0)
                        continue
                    segment = [v for v in window[-minutes:] if v is not None]
                    if not segment:
                        for _ in range(4):
                            feature_row.append(0.0)
                        continue
                    mean = sum(segment) / len(segment)
                    variance = sum((v - mean) ** 2 for v in segment) / len(segment)
                    feature_row.extend(
                        [
                            mean,
                            variance ** 0.5,
                            min(segment),
                            max(segment),
                        ]
                    )
            # Engineered signals used by the rule layer.
            feature_row.extend(
                [
                    _bess_cmd_level(values),
                    _pcc_same_sign(values),
                    _specific_excess(values, best_specific),
                    _elz_total(values),
                ]
            )
            yield feature_row, label


def _best_specific_by_unit() -> dict[str, float]:
    from h2_analytics.vocabulary import efficiency_curve_by_equipment

    curves = efficiency_curve_by_equipment()
    return {
        equipment: min(point["specific_energy_kwh_per_kg"] for point in points)
        for equipment, points in curves.items()
    }


def _bess_cmd_level(values: dict[str, float | None]) -> float:
    command = values.get("bess_power_cmd_kw")
    return abs(command) if command is not None else 0.0


def _pcc_same_sign(values: dict[str, float | None]) -> float:
    command = values.get("bess_power_cmd_kw")
    pcc = values.get("pcc_power_actual_kw")
    if command is None or pcc is None:
        return 0.0
    return 1.0 if (command > 0) == (pcc > 0) else 0.0


def _specific_excess(
    values: dict[str, float | None], best_specific: dict[str, float]
) -> float:
    excess = 0.0
    for index, unit in enumerate(_ELZ_IDS):
        specific = values.get(f"elz{unit}_specific_energy_kwh_per_kg")
        if specific is None or specific <= 0:
            continue
        excess = max(excess, specific - best_specific[_ELZ_EQUIPMENT[index]])
    return excess


def _elz_total(values: dict[str, float | None]) -> float:
    total = 0.0
    for unit in _ELZ_IDS:
        power = values.get(f"elz{unit}_power_actual_kw")
        if power is not None:
            total += power
    return total


def _fit_and_save(data_dir: Path, model_dir: Path) -> None:
    import lightgbm as lgb
    import numpy as np

    features = _build_features()
    class_weights: dict[str, int] = {}
    rows: list[np.ndarray] = []
    targets: list[str] = []
    started = time.monotonic()
    for feature_row, label in _stream_dataset(data_dir, features):
        rows.append(np.asarray(feature_row, dtype=np.float32))
        targets.append(label)
        class_weights[label] = class_weights.get(label, 0) + 1
        if len(rows) % 50_000 == 0:
            print(
                f"  streamed {len(rows)} rows "
                f"({time.monotonic() - started:.0f}s), "
                f"classes={dict(sorted(class_weights.items()))}"
            )
    print(f"streamed {len(rows)} rows total")
    counts = Counter(targets)
    print("label counts:")
    for label in sorted(counts):
        print(f"  {label}: {counts[label]}")
    matrix = np.vstack(rows).astype(np.float32)
    del rows
    print(f"feature matrix shape: {matrix.shape}")
    target_index = {label: index for index, label in enumerate(_CLASS_ORDER)}
    context_count = counts.get("NORMAL_CONTEXT", 0)
    mapped = [
        ("NORMAL" if label == "NORMAL_CONTEXT" else label) for label in targets
    ]
    y = np.asarray([target_index[label] for label in mapped], dtype=np.int32)
    sample_weight = np.asarray(
        [
            1.0 if label != "NORMAL" else 0.25
            for label in mapped
        ],
        dtype=np.float32,
    )
    classifier = lgb.train(
        {
            "objective": "multiclass",
            "num_class": len(_CLASS_ORDER),
            "num_leaves": 63,
            "learning_rate": 0.05,
            "min_child_samples": 50,
            "subsample": 0.8,
            "subsample_freq": 1,
            "colsample_bytree": 0.8,
            "verbose": -1,
            "seed": 7,
        },
        lgb.Dataset(matrix, label=y, weight=sample_weight),
        num_boost_round=400,
    )
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "row-scorer.txt"
    classifier.save_model(str(model_path))
    generated_at = datetime.now(UTC).isoformat(timespec="seconds")
    metadata = {
        "contract": "h2-sentinel-row-scorer-v1",
        "version": "row-scorer-v1",
        "generatedAt": generated_at,
        "source": {
            "series": _SERIES_FILE,
            "labels": _LABEL_FILE,
            "normalContext": _NORMAL_CONTEXT_FILE,
        },
        "features": features,
        "classes": {
            str(index): {"code": code, "subtype": _SUBTYPE_BY_CLASS[code]}
            for index, code in enumerate(_CLASS_ORDER)
        },
        "classCounts": dict(counts),
        "normalContextRows": context_count,
        "parameters": {
            "nEstimators": 400,
            "numLeaves": 63,
            "learningRate": 0.05,
            "minChildSamples": 50,
            "subsample": 0.8,
            "colsampleBytree": 0.8,
        },
    }
    metadata_path = model_dir / "row-scorer-meta.json"
    metadata_path.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {model_path}")
    print(f"wrote {metadata_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", default="", help="Official 数据与材料 directory")
    parser.add_argument(
        "--model-dir",
        default="",
        help="Output model directory (default: <service>/models)",
    )
    arguments = parser.parse_args()
    data_dir = _resolve_data_dir(arguments)
    model_dir = Path(arguments.model_dir).resolve() if arguments.model_dir else (
        Path(__file__).resolve().parents[3] / "models"
    )
    _fit_and_save(data_dir, model_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
