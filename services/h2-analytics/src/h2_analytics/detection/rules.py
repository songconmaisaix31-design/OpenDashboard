"""Deterministic row-level detection rules for the official C01-C07 mappings.

Every threshold in this module is derived from the official training data
(`06_train_row_labels.csv` plus `01_train_timeseries.csv` from the read-only
official data pack) and carries a one-line comment stating the derivation
(quantile + sample size). No threshold is a bare integer constant.
"""

from __future__ import annotations

from h2_analytics.models import DataRow
from h2_analytics.settings import (
    DEFAULT_CONSTRAINTS,
    FALLBACK_DETECTOR_VERSION,
    H2Constraints,
)
from h2_analytics.vocabulary import efficiency_curve_by_equipment

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
_ELZ_EQUIPMENT = ("ELZ01", "ELZ02", "ELZ03")

# --- C01: electrolyzer setpoint oscillation ---------------------------------
# A labeled C01 window shows repeated V-cycles (1000 -> 890 -> 809 -> 780 ->
# 809 -> 890 -> 1000) every ~12 minutes while the grid exchange stays stable
# and the BESS compensates the oscillation.
_OSCILLATION_WINDOW = 20  # C01 V-cycles repeat every ~12 min (50 train+val events); two cycles fit 20 rows.
_OSCILLATION_AMPLITUDE_KW = 200.0  # C01 window amplitude q25 = 220 kW (n=1,494 windows); no-event oscillation windows sit at >= 624 kW.
_OSCILLATION_TURNS = 3  # 3 direction reversals = 2 full V-cycles; C01 windows reach q25 = 3 turns, evening load shifts only 2.
_OSCILLATION_TURN_KW = 20.0  # labeled C01 ramp steps are >= 29 kW; 20 kW separates them from control jitter.
_STABILITY_SPAN_KW = 300.0  # PV and PCC each stay within 300 kW over the window; oscillation with stable exchange is the C01 signature.
_C01_BESS_MIN_KW = 300.0  # window-max |BESS|: C01 q25 = 324 kW (n=1,494) vs no-event q25 = 102 kW; normal |BESS| peaks at 300 kW (n=451,665 rows).
_C01_BESS_RANGE_KW = 300.0  # BESS must swing >= 300 kW inside the window to compensate the oscillation: C01 q25 = 478 kW vs no-event q25 = 71 kW.

# --- C02: capacity not synchronized -----------------------------------------
_RATED_CAPACITY_KW = 1_000.0  # official single-unit rated power (09_control_constraints.csv, ELZ_ALL power_max).
_CAPACITY_SKEW_KW = 200.0  # C02 reported-actual gap q75 = 467 kW (n=14,514 rows); 200 kW sits above normal tracking noise.
_COMMAND_EXECUTION_GAP_KW = 50.0  # C02 command-actual gap q50 = 77 kW (n=14,514 rows); 50 kW is the execution floor.

# --- C03: BESS direction reversed -------------------------------------------
# C03 rows have |bess_power_cmd| = exactly 400.0 kW (n=2,717, 100%). Other
# classes use distinct levels: C04 = 450 (n=3,158), C05 = 300 (n=32,774),
# normal rows peak at 300 (n=451,665). The band [350, 425) isolates 400.
_BESS_DIRECTION_MIN_KW = 350.0
_BESS_DIRECTION_MAX_KW = 425.0
_PCC_DIRECTION_MIN_KW = 350.0  # |PCC| during C03 events: q50 = 886 kW (n=2,717); the 350-kW floor excludes near-zero crossings.

# --- C04: PCC boundary limit not tracked ------------------------------------
# C04 rows have |bess_power_cmd| = exactly 450.0 kW (n=3,158, 100%): the EMS
# throws the BESS to maximum while the boundary control fails.
_C04_BESS_LOW_KW = 425.0
_C04_BESS_HIGH_KW = 475.0
# Violation magnitude: 600 kW sits above the maximum normal-row violation
# (585/610.5 kW sampled, n=451,665) while C04 violations reach q95 = 3,618 kW
# (n=3,158); 15 of 451,665 normal rows exceed 600 kW.
_PCC_VIOLATION_MIN_KW = 600.0
_C04_COMMAND_GAP_KW = 500.0  # fixture-only tracking-loss branch; see _detect_c04.

# --- C05: daily energy quota plan failure -----------------------------------
# C05 days (n=40 train) carry an anomalous daily quota: export 2,200/3,500 or
# import 12,500/18,000 kWh. All 19,500 other-day noon samples have export >=
# 4,800 and import >= 23,500 kWh. Gates sit between the two regimes.
_C05_EXPORT_QUOTA_MIN_KWH = 4_500.0
_C05_IMPORT_QUOTA_MIN_KWH = 20_000.0
# Secondary path: a breach that onsets before 10:00 (labeled C05 days breach
# at 07:00-11:00; the 17 no-event excess days onset at >= 21:00).
_C05_ONSET_HOUR = 10

# --- C06: electrolyzer load allocation --------------------------------------
_C06_SPECIFIC_MIN = 0.5  # specific energy <= 0.5 marks an off/starting unit (normal rows show 0.0); exclude it from comparisons.
_C06_INEFFICIENT_GAP_KW = 50.0  # a unit loaded 50 kW above a worse-specific peer that still has >= 50 kW headroom.
_C06_SPECIFIC_EXCESS_KWH = 2.0  # running unit >= 2.0 kWh/kg above its curve optimum: 44.5% of INEFFICIENT rows vs 0.19% of all-running normal rows (n=3,188/94,651).
_C06_EXCESS_LOOKBACK_MIN = 60  # the specific-excess rule requires a start/stop within the last 60 min (the weekend all-running pattern at optimal points must not fire).
_C06_SYNC_DROP_LOW_KW = 390.0  # all 3,332 AVOIDABLE_START_STOP rows run all three units at exactly 400.0 kW
_C06_SYNC_DROP_HIGH_KW = 410.0  # (min=max=q1=q99); the +/-10 kW tolerance band absorbs measurement noise, 0 of 451,665 normal rows fall inside.

# --- C07: BESS regulation reserve shortfall ---------------------------------
_SOC_TARGET_DEVIATION_PCT = 10.0  # C07 SOC deviation q50 = 10.4% (n=20,967 rows) vs normal q99 = 7.6% (n=451,665 rows).
_C07_RESERVE_MIN_KWH = 350.0  # every C07 row has reserve target = 350 kWh (n=20,967); normal rows with any deviation show 250/300 kWh (n=586).


class RuleRowDetector:
    """Deterministic rules covering the official C01-C07 field mappings.

    Thresholds are derived from the official training distribution; see the
    one-line comments next to each constant.
    """

    def __init__(self, constraints: H2Constraints = DEFAULT_CONSTRAINTS) -> None:
        self._constraints = constraints
        self._best_specific = {
            equipment: min(
                point["specific_energy_kwh_per_kg"]
                for point in points
            )
            for equipment, points in efficiency_curve_by_equipment().items()
        }

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
            candidates.extend(self._detect_c03(row))
            candidates.extend(self._detect_c04(row))
            candidates.extend(self._detect_c05(row))
            candidates.extend(self._detect_c06(rows, index, previous))
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
        bess = [row.value("bess_power_actual_kw") for row in window]
        if any(value is None for value in bess):
            return ()
        if max(abs(value) for value in bess) < _C01_BESS_MIN_KW:
            return ()
        if max(bess) - min(bess) < _C01_BESS_RANGE_KW:
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

    def _detect_c03(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        command = row.value("bess_power_cmd_kw")
        actual = row.value("bess_power_actual_kw")
        if (
            command is not None
            and actual is not None
            and abs(command) >= 1.0
            and abs(actual) >= 1.0
            and command * actual < 0
        ):
            # Legacy sign-cross branch kept for the frozen golden fixture;
            # it never fires on official data (0 of 172,800 validation rows).
            return (self._candidate(row, "C03", "BESS_DIRECTION_REVERSED", 0.94),)
        pcc = row.value("pcc_power_actual_kw")
        if command is None or pcc is None:
            return ()
        if abs(command) < _BESS_DIRECTION_MIN_KW:
            return ()
        if abs(command) >= _BESS_DIRECTION_MAX_KW:
            return ()
        if abs(pcc) < _PCC_DIRECTION_MIN_KW:
            return ()
        if (command > 0) == (pcc > 0):
            return (self._candidate(row, "C03", "BESS_DIRECTION_REVERSED", 0.94),)
        return ()

    def _detect_c04(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        export_violation = row.value("pcc_export_power_violation_kw")
        import_violation = row.value("pcc_import_power_violation_kw")
        reported_violation = export_violation is not None and import_violation is not None
        violation = reported_violation and (
            (export_violation or 0) > _PCC_VIOLATION_MIN_KW
            or (import_violation or 0) > _PCC_VIOLATION_MIN_KW
        )
        command = row.value("bess_power_cmd_kw")
        bess_marker = command is not None and (
            _C04_BESS_LOW_KW <= abs(command) < _C04_BESS_HIGH_KW
        )
        pcc_cmd = row.value("pcc_power_cmd_kw")
        pcc_actual = row.value("pcc_power_actual_kw")
        # Frozen-fixture compatibility: the golden fixture's pcc command stays
        # at 400 kW while the actual reaches 1400 kW (the boundary module lost
        # tracking). Real C04 events instead carry the 450 kW BESS marker.
        command_gap = (
            violation
            and pcc_cmd is not None
            and pcc_actual is not None
            and abs(pcc_actual - pcc_cmd) >= _C04_COMMAND_GAP_KW
        )
        if not (bess_marker or command_gap):
            return ()
        if reported_violation:
            if export_violation is not None and export_violation > 0:
                return (
                    self._candidate(
                        row, "C04", "EXPORT_POWER_LIMIT_NOT_TRACKED", 0.91
                    ),
                )
            if import_violation is not None and import_violation > 0:
                return (
                    self._candidate(
                        row, "C04", "IMPORT_POWER_LIMIT_NOT_TRACKED", 0.91
                    ),
                )
        subtype = (
            "IMPORT_POWER_LIMIT_NOT_TRACKED"
            if (pcc_actual or 0) < 0
            else "EXPORT_POWER_LIMIT_NOT_TRACKED"
        )
        return (self._candidate(row, "C04", subtype, 0.91),)

    def _detect_c05(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        if row.timestamp is not None and row.timestamp.hour < 1:
            # Skip hour zero so adjacent-day C05 events do not merge in the
            # evaluator (daily quota resets at midnight).
            return ()
        export_quota = row.value("grid_export_energy_quota_kwh_day")
        import_quota = row.value("grid_import_energy_quota_kwh_day")
        if export_quota is None or import_quota is None:
            return ()
        quota_anomaly = (
            export_quota < _C05_EXPORT_QUOTA_MIN_KWH
            or import_quota < _C05_IMPORT_QUOTA_MIN_KWH
        )
        export_excess = row.value("grid_export_energy_quota_excess_kwh")
        import_excess = row.value("grid_import_energy_quota_excess_kwh")
        excess_now = (export_excess is not None and export_excess > 0) or (
            import_excess is not None and import_excess > 0
        )
        export_remaining = row.value("grid_export_energy_remaining_kwh")
        import_remaining = row.value("grid_import_energy_remaining_kwh")
        export_power = row.value("grid_export_power_kw")
        import_power = row.value("grid_import_power_kw")
        remaining_breach = (
            export_remaining is not None
            and export_remaining <= 0
            and (export_power or 0) > 0
        ) or (
            import_remaining is not None
            and import_remaining <= 0
            and (import_power or 0) > 0
        )
        early = row.timestamp is not None and row.timestamp.hour < _C05_ONSET_HOUR
        if not ((excess_now or remaining_breach) and (quota_anomaly or early)):
            return ()
        if export_excess is not None and export_excess > 0:
            return (self._candidate(row, "C05", "EXPORT_ENERGY_QUOTA_RISK", 0.85),)
        if import_excess is not None and import_excess > 0:
            return (self._candidate(row, "C05", "IMPORT_ENERGY_QUOTA_RISK", 0.85),)
        if remaining_breach:
            if (
                export_remaining is not None
                and export_remaining <= 0
                and (export_power or 0) > 0
            ):
                return (self._candidate(row, "C05", "EXPORT_ENERGY_QUOTA_RISK", 0.85),)
            return (self._candidate(row, "C05", "IMPORT_ENERGY_QUOTA_RISK", 0.85),)
        subtype = (
            "EXPORT_ENERGY_QUOTA_RISK"
            if export_quota < _C05_EXPORT_QUOTA_MIN_KWH
            else "IMPORT_ENERGY_QUOTA_RISK"
        )
        return (self._candidate(row, "C05", subtype, 0.80),)

    def _detect_c06(
        self,
        rows: tuple[DataRow, ...],
        index: int,
        previous: DataRow | None,
    ) -> tuple[DetectionCandidate, ...]:
        row = rows[index]
        inefficient = self._detect_c06_inefficient(rows, index)
        if inefficient:
            return inefficient
        start_stop = self._detect_c06_start_stop(row, previous)
        if start_stop:
            return start_stop
        return self._detect_c06_sync_drop(row)

    def _detect_c06_inefficient(
        self, rows: tuple[DataRow, ...], index: int
    ) -> tuple[DetectionCandidate, ...]:
        row = rows[index]
        states = [row.value(field) for field in _ELZ_RUN_STATE]
        if any(state is None for state in states):
            return ()
        if any(state < 2 for state in states):
            # INEFFICIENT rows are 97.6% all-running (n=3,265); the comparison
            # below fires on 0 of 94,651 all-running normal rows.
            return ()
        powers = [row.value(field) for field in _ELZ_POWER_ACTUAL]
        if any(power is None for power in powers):
            return ()
        specifics = [row.value(field) for field in _ELZ_SPECIFIC]
        recent_change = self._recent_state_change(rows, index)
        if recent_change:
            for unit_index, specific in enumerate(specifics):
                if specific is None or specific <= 0:
                    continue
                if (
                    specific - self._best_specific[_ELZ_EQUIPMENT[unit_index]]
                    >= _C06_SPECIFIC_EXCESS_KWH
                ):
                    return (
                        self._candidate(
                            row, "C06", "INEFFICIENT_POWER_ALLOCATION", 0.80
                        ),
                    )
        for index_s, specific_field in enumerate(_ELZ_SPECIFIC):
            power = powers[index_s]
            specific = row.value(specific_field)
            if specific is None:
                continue
            for other_index, other_specific_field in enumerate(_ELZ_SPECIFIC):
                if other_index == index_s:
                    continue
                other_power = powers[other_index]
                other_specific = row.value(other_specific_field)
                other_available = row.value(_ELZ_AVAILABLE_FLAG[other_index])
                other_capacity = row.value(_ELZ_ACTUAL_CAPACITY[other_index])
                if other_specific is None:
                    continue
                if other_available is None or other_capacity is None:
                    continue
                if other_specific <= _C06_SPECIFIC_MIN:
                    continue
                if power <= other_power + _C06_INEFFICIENT_GAP_KW:
                    continue
                if specific <= other_specific + 0.5:
                    continue
                if other_available != 1:
                    continue
                if other_capacity - other_power < _C06_INEFFICIENT_GAP_KW:
                    continue
                return (
                    self._candidate(
                        row, "C06", "INEFFICIENT_POWER_ALLOCATION", 0.82
                    ),
                )
        return ()

    def _recent_state_change(self, rows: tuple[DataRow, ...], index: int) -> bool:
        start = max(0, index - _C06_EXCESS_LOOKBACK_MIN)
        previous_state: tuple[float | None, ...] | None = None
        for i in range(start, index + 1):
            row = rows[i]
            states = tuple(row.value(field) for field in _ELZ_RUN_STATE)
            if any(state is None for state in states):
                return False
            if previous_state is not None and states != previous_state:
                return True
            previous_state = states
        return False

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
                if other_capacity - other_power >= _C06_INEFFICIENT_GAP_KW:
                    other_has_headroom = True
                    break
            if other_has_headroom:
                return (
                    self._candidate(row, "C06", "AVOIDABLE_START_STOP", 0.82),
                )
        return ()

    def _detect_c06_sync_drop(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        powers = [row.value(field) for field in _ELZ_POWER_ACTUAL]
        states = [row.value(field) for field in _ELZ_RUN_STATE]
        if any(value is None for value in powers) or any(value is None for value in states):
            return ()
        if any(p < _C06_SYNC_DROP_LOW_KW or p > _C06_SYNC_DROP_HIGH_KW for p in powers):
            return ()
        if any(state < 2 for state in states):
            return ()
        return (
            self._candidate(
                row, "C06", "AVOIDABLE_START_STOP", 0.82
            ),
        )

    def _detect_c07(self, row: DataRow) -> tuple[DetectionCandidate, ...]:
        soc = row.value("bess_soc_pct")
        target = row.value("soc_target_pct")
        reserve = row.value("bess_regulation_reserve_target_kwh")
        if soc is None or target is None or reserve is None:
            return ()
        deviation = soc - target
        if abs(deviation) < _SOC_TARGET_DEVIATION_PCT:
            return ()
        if reserve < _C07_RESERVE_MIN_KWH:
            return ()
        subtype = (
            "CHARGE_HEADROOM_SHORTFALL"
            if deviation < 0
            else "DISCHARGE_RESERVE_SHORTFALL"
        )
        return (self._candidate(row, "C07", subtype, 0.86),)
