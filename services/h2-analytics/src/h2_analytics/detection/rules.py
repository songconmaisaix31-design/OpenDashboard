from __future__ import annotations

from h2_analytics.models import DataRow
from h2_analytics.settings import (
    DEFAULT_CONSTRAINTS,
    FALLBACK_DETECTOR_VERSION,
    H2Constraints,
)

from .base import DetectionCandidate

_ELZ_IDS = ("1", "2", "3")
_ELZ_POWER_CMD = tuple(f"elz{index}_power_cmd_kw" for index in _ELZ_IDS)
_ELZ_POWER_ACTUAL = tuple(f"elz{index}_power_actual_kw" for index in _ELZ_IDS)
_ELZ_REPORTED = tuple(
    f"elz{index}_reported_available_capacity_kw" for index in _ELZ_IDS
)
_ELZ_ACTUAL_CAPACITY = tuple(
    f"elz{index}_actual_available_capacity_kw" for index in _ELZ_IDS
)
_ELZ_SPECIFIC = tuple(f"elz{index}_specific_energy_kwh_per_kg" for index in _ELZ_IDS)
_ELZ_RUN_STATE = tuple(f"elz{index}_run_state" for index in _ELZ_IDS)
_ELZ_AVAILABLE_FLAG = tuple(f"elz{index}_available_flag" for index in _ELZ_IDS)

_OSCILLATION_WINDOW = 15
_OSCILLATION_AMPLITUDE_KW = 80.0
_OSCILLATION_TURNS = 2
_OSCILLATION_TURN_KW = 10.0
_STABILITY_SPAN_KW = 300.0

_RATED_CAPACITY_KW = 1_000.0
_CAPACITY_SKEW_KW = 200.0
_COMMAND_EXECUTION_GAP_KW = 50.0
_BESS_REVERSAL_POWER_KW = 100.0
_BESS_REVERSAL_SOC_DELTA_PCT = 0.25
_SOC_TARGET_DEVIATION_PCT = 10.0


class RuleRowDetector:
    """Deterministic rules covering the official C01-C07 field mappings."""

    def __init__(self, constraints: H2Constraints = DEFAULT_CONSTRAINTS) -> None:
        self._constraints = constraints

    @property
    def version(self) -> str:
        return FALLBACK_DETECTOR_VERSION

    def detect(self, rows: tuple[DataRow, ...]) -> tuple[DetectionCandidate, ...]:
        candidates: list[DetectionCandidate] = []
        for index, row in enumerate(rows):
            if row.timestamp is None:
                continue
            previous = rows[index - 1] if index > 0 else None
            candidates.extend(self._detect_c01(rows, index))
            candidates.extend(self._detect_c02(row))
            candidates.extend(self._detect_c03(row, previous))
            candidates.extend(self._detect_c04(row))
            candidates.extend(self._detect_c05(row))
            candidates.extend(self._detect_c06(row, previous))
            candidates.extend(self._detect_c07(row))
        return tuple(
            sorted(
                candidates,
                key=lambda item: (item.timestamp, item.code, item.subtype, item.row_index),
            )
        )

    def _candidate(
        self,
        row: DataRow,
        code: str,
        subtype: str,
        confidence: float,
    ) -> DetectionCandidate:
        assert row.timestamp is not None
        return DetectionCandidate(
            row_index=row.index,
            timestamp=row.timestamp,
            code=code,
            subtype=subtype,
            confidence=confidence,
            detector_version=self.version,
        )

    def _detect_c01(self, rows: tuple[DataRow, ...], index: int) -> tuple[DetectionCandidate, ...]:
        window = rows[max(0, index - (_OSCILLATION_WINDOW - 1)) : index + 1]
        if len(window) < _OSCILLATION_WINDOW:
            return ()
        if any(row.timestamp is None for row in window):
            return ()
        oscillating = False
        for field in _ELZ_POWER_CMD:
            values = [row.value(field) for row in window]
            if any(value is None for value in values):
                continue
            numeric = [value for value in values if value is not None]
            if max(numeric) - min(numeric) < _OSCILLATION_AMPLITUDE_KW:
                continue
            diffs = [
                second - first
                for first, second in zip(numeric, numeric[1:], strict=False)
            ]
            significant = [
                diff for diff in diffs if abs(diff) >= _OSCILLATION_TURN_KW
            ]
            turns = sum(
                1
                for first, second in zip(significant, significant[1:], strict=False)
                if first * second < 0
            )
            if turns >= _OSCILLATION_TURNS:
                oscillating = True
                break
        if not oscillating:
            return ()
        pv = [row.value("pv_actual_kw") for row in window]
        pcc = [row.value("pcc_power_actual_kw") for row in window]
        if any(value is None for value in pv) or any(value is None for value in pcc):
            return ()
        if max(pv) - min(pv) > _STABILITY_SPAN_KW:
            return ()
        if max(pcc) - min(pcc) > _STABILITY_SPAN_KW:
            return ()
        return (self._candidate(rows[index], "C01", "SETPOINT_OSCILLATION", 0.80),)

    def _detect_c02(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        for reported_field, actual_field, cmd_field, actual_field_power in zip(
            _ELZ_REPORTED,
            _ELZ_ACTUAL_CAPACITY,
            _ELZ_POWER_CMD,
            _ELZ_POWER_ACTUAL,
            strict=True,
        ):
            reported = row.value(reported_field)
            actual = row.value(actual_field)
            command = row.value(cmd_field)
            actual_power = row.value(actual_field_power)
            if None in (reported, actual, command, actual_power):
                continue
            assert reported is not None
            assert actual is not None
            assert command is not None
            assert actual_power is not None
            if reported < 0.9 * _RATED_CAPACITY_KW:
                continue
            if reported - actual < _CAPACITY_SKEW_KW:
                continue
            if command - actual_power < _COMMAND_EXECUTION_GAP_KW:
                continue
            return (
                self._candidate(
                    row, "C02", "CAPACITY_NOT_SYNCHRONIZED", 0.88
                ),
            )
        return ()

    def _detect_c03(
        self,
        row: DataRow,
        previous: DataRow | None,
    ) -> tuple[DetectionCandidate, ...]:
        command = row.value("bess_power_cmd_kw")
        actual = row.value("bess_power_actual_kw")
        if (
            command is not None
            and actual is not None
            and abs(command) >= 1.0
            and abs(actual) >= 1.0
            and command * actual < 0
        ):
            return (self._candidate(row, "C03", "BESS_DIRECTION_REVERSED", 0.94),)
        if previous is None:
            return ()
        soc = row.value("bess_soc_pct")
        previous_soc = previous.value("bess_soc_pct")
        power = actual if actual is not None else command
        if power is None or soc is None or previous_soc is None:
            return ()
        if abs(power) < _BESS_REVERSAL_POWER_KW:
            return ()
        delta_soc = soc - previous_soc
        if abs(delta_soc) < _BESS_REVERSAL_SOC_DELTA_PCT:
            return ()
        if power * delta_soc > 0:
            return (self._candidate(row, "C03", "BESS_DIRECTION_REVERSED", 0.94),)
        return ()

    def _detect_c04(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        export_violation = row.value("pcc_export_power_violation_kw")
        import_violation = row.value("pcc_import_power_violation_kw")
        if export_violation is not None and import_violation is not None:
            if export_violation > 0:
                return (
                    self._candidate(
                        row, "C04", "EXPORT_POWER_LIMIT_NOT_TRACKED", 0.91
                    ),
                )
            if import_violation > 0:
                return (
                    self._candidate(
                        row, "C04", "IMPORT_POWER_LIMIT_NOT_TRACKED", 0.91
                    ),
                )
            return ()
        pcc = row.value("pcc_power_actual_kw")
        export_limit = row.value("grid_export_power_limit_kw")
        import_limit = row.value("grid_import_power_limit_kw")
        if pcc is None:
            return ()
        margin = self._constraints.pcc_boundary_detection_margin_kw
        if export_limit is not None and pcc > export_limit + margin:
            return (
                self._candidate(
                    row, "C04", "EXPORT_POWER_LIMIT_NOT_TRACKED", 0.91
                ),
            )
        if import_limit is not None and pcc < -(import_limit + margin):
            return (
                self._candidate(
                    row, "C04", "IMPORT_POWER_LIMIT_NOT_TRACKED", 0.91
                ),
            )
        return ()

    def _detect_c05(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        export_excess = row.value("grid_export_energy_quota_excess_kwh")
        import_excess = row.value("grid_import_energy_quota_excess_kwh")
        if export_excess is not None and export_excess > 0:
            return (self._candidate(row, "C05", "EXPORT_ENERGY_QUOTA_RISK", 0.85),)
        if import_excess is not None and import_excess > 0:
            return (self._candidate(row, "C05", "IMPORT_ENERGY_QUOTA_RISK", 0.85),)
        export_remaining = row.value("grid_export_energy_remaining_kwh")
        import_remaining = row.value("grid_import_energy_remaining_kwh")
        export_power = row.value("grid_export_power_kw")
        import_power = row.value("grid_import_power_kw")
        if export_remaining is not None and export_remaining <= 0 and (export_power or 0) > 0:
            return (self._candidate(row, "C05", "EXPORT_ENERGY_QUOTA_RISK", 0.85),)
        if import_remaining is not None and import_remaining <= 0 and (import_power or 0) > 0:
            return (self._candidate(row, "C05", "IMPORT_ENERGY_QUOTA_RISK", 0.85),)
        return ()

    def _detect_c06(
        self,
        row: DataRow,
        previous: DataRow | None,
    ) -> tuple[DetectionCandidate, ...]:
        inefficient = self._detect_c06_inefficient(row)
        if inefficient:
            return inefficient
        return self._detect_c06_start_stop(row, previous)

    def _detect_c06_inefficient(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        for index, specific_field in enumerate(_ELZ_SPECIFIC):
            power = row.value(_ELZ_POWER_ACTUAL[index])
            specific = row.value(specific_field)
            if power is None or specific is None:
                continue
            assert power is not None
            for other_index, other_specific_field in enumerate(_ELZ_SPECIFIC):
                if other_index == index:
                    continue
                other_power = row.value(_ELZ_POWER_ACTUAL[other_index])
                other_specific = row.value(other_specific_field)
                other_available = row.value(_ELZ_AVAILABLE_FLAG[other_index])
                other_capacity = row.value(_ELZ_ACTUAL_CAPACITY[other_index])
                if other_power is None or other_specific is None:
                    continue
                if other_available is None or other_capacity is None:
                    continue
                if power <= other_power + 50.0:
                    continue
                if specific <= other_specific + 0.5:
                    continue
                if other_available != 1:
                    continue
                if other_capacity - other_power < 50.0:
                    continue
                return (
                    self._candidate(
                        row, "C06", "INEFFICIENT_POWER_ALLOCATION", 0.82
                    ),
                )
        return ()

    def _detect_c06_start_stop(
        self,
        row: DataRow,
        previous: DataRow | None,
    ) -> tuple[DetectionCandidate, ...]:
        if previous is None:
            return ()
        for index, state_field in enumerate(_ELZ_RUN_STATE):
            current_state = row.value(state_field)
            previous_state = previous.value(state_field)
            if current_state is None or previous_state is None:
                continue
            if previous_state >= 2 or current_state < 2:
                continue
            other_has_headroom = False
            for other_index, capacity_field in enumerate(_ELZ_ACTUAL_CAPACITY):
                if other_index == index:
                    continue
                other_power = row.value(_ELZ_POWER_ACTUAL[other_index])
                other_capacity = row.value(capacity_field)
                other_available = row.value(_ELZ_AVAILABLE_FLAG[other_index])
                if other_power is None or other_capacity is None:
                    continue
                if other_available is None or other_available != 1:
                    continue
                if other_capacity - other_power >= 50.0:
                    other_has_headroom = True
                    break
            if other_has_headroom:
                return (
                    self._candidate(row, "C06", "AVOIDABLE_START_STOP", 0.82),
                )
        return ()

    def _detect_c07(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        soc = row.value("bess_soc_pct")
        target = row.value("soc_target_pct")
        if soc is None or target is None:
            return ()
        deviation = soc - target
        if abs(deviation) < _SOC_TARGET_DEVIATION_PCT:
            return ()
        subtype = (
            "CHARGE_HEADROOM_SHORTFALL"
            if deviation < 0
            else "DISCHARGE_RESERVE_SHORTFALL"
        )
        return (self._candidate(row, "C07", subtype, 0.86),)
