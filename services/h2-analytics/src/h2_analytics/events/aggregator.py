from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta

from h2_analytics.detection import DetectionCandidate
from h2_analytics.models import DataRow


@dataclass(frozen=True, slots=True)
class AggregationPolicy:
    minimum_rows: int
    confirmation_row: int
    maximum_gap_intervals: int = 1
    daily: bool = False


@dataclass(frozen=True, slots=True)
class EventWindow:
    event_id: str
    code: str
    subtype: str
    rows: tuple[DataRow, ...]
    start_time: datetime
    end_time: datetime
    first_detection_time: datetime
    confidence: float
    detector_version: str


POLICIES = {
    # Official detection_expectation (05_validation_event_labels.csv): the
    # "detect within 10 minutes of event start" codes confirm on the row inside
    # the 10-minute window; C05/C07 require EARLY warning and confirm on the
    # first candidate row of the segment.
    # C01: setpoint oscillation recurs every ~12 min, so segments merge across
    # a 12-interval gap and confirm after 5 rows (5 min <= 10 min).
    "C01": AggregationPolicy(
        minimum_rows=5, confirmation_row=5, maximum_gap_intervals=12
    ),
    # C02: capacity mismatch is sustained; 5 rows confirm within 10 minutes.
    "C02": AggregationPolicy(minimum_rows=5, confirmation_row=5),
    # C03: direction reversal is sustained; 5 rows confirm within 10 minutes.
    "C03": AggregationPolicy(minimum_rows=5, confirmation_row=5),
    # C04: boundary violation rows are dense during the event; 5 rows form the
    # event and 3 rows (3 min) confirm detection within 10 minutes.
    "C04": AggregationPolicy(minimum_rows=5, confirmation_row=3),
    # C05: early-warning code -- the daily quota plan failure must be flagged
    # as soon as the anomalous quota appears, so confirmation is the first row.
    # Events are daily (quota resets at midnight) and split at day boundaries.
    "C05": AggregationPolicy(minimum_rows=3, confirmation_row=1, daily=True),
    # C06: load-allocation anomalies are sustained (1.5-3 h events); 30 rows
    # suppress the short ramp bursts, confirmation at row 10 (10 min).
    "C06": AggregationPolicy(minimum_rows=30, confirmation_row=10),
    # C07: early-warning code -- the reserve shortfall is flagged on the first
    # row where SOC deviates with an elevated reserve target.
    "C07": AggregationPolicy(minimum_rows=5, confirmation_row=1),
}
DEFAULT_POLICY = AggregationPolicy(minimum_rows=3, confirmation_row=3)


class EventAggregator:
    def aggregate(
        self,
        *,
        rows: tuple[DataRow, ...],
        candidates: tuple[DetectionCandidate, ...],
        sampling_interval_minutes: float,
    ) -> tuple[EventWindow, ...]:
        rows_by_index = {row.index: row for row in rows}
        grouped: dict[tuple[str, str], list[DetectionCandidate]] = defaultdict(list)
        for candidate in candidates:
            grouped[(candidate.code, candidate.subtype)].append(candidate)

        draft_windows: list[
            tuple[str, str, tuple[DetectionCandidate, ...], tuple[DataRow, ...]]
        ] = []
        for (code, subtype), values in sorted(grouped.items()):
            policy = POLICIES.get(code, DEFAULT_POLICY)
            ordered = sorted(values, key=lambda item: (item.timestamp, item.row_index))
            for segment in _segments(
                ordered,
                maximum_gap=timedelta(
                    minutes=sampling_interval_minutes * policy.maximum_gap_intervals
                ),
                daily=policy.daily,
            ):
                if len(segment) < policy.minimum_rows:
                    continue
                segment_rows = tuple(rows_by_index[item.row_index] for item in segment)
                draft_windows.append((code, subtype, segment, segment_rows))

        ordinals: dict[str, int] = defaultdict(int)
        output: list[EventWindow] = []
        for code, subtype, segment, segment_rows in sorted(
            draft_windows,
            key=lambda item: (item[2][0].timestamp, item[0], item[1]),
        ):
            policy = POLICIES.get(code, DEFAULT_POLICY)
            ordinals[code] += 1
            ordinal = ordinals[code]
            start = segment[0].timestamp
            end = segment[-1].timestamp
            confirmation_index = min(policy.confirmation_row - 1, len(segment) - 1)
            confidence = sum(item.confidence for item in segment) / len(segment)
            event_id = f"{code}-{start:%Y%m%d}-{ordinal:03d}"
            output.append(
                EventWindow(
                    event_id=event_id,
                    code=code,
                    subtype=subtype,
                    rows=segment_rows,
                    start_time=start,
                    end_time=end,
                    first_detection_time=segment[confirmation_index].timestamp,
                    confidence=confidence,
                    detector_version=segment[0].detector_version,
                )
            )
        return tuple(output)


def _segments(
    candidates: list[DetectionCandidate],
    *,
    maximum_gap: timedelta,
    daily: bool = False,
) -> tuple[tuple[DetectionCandidate, ...], ...]:
    if not candidates:
        return ()
    segments: list[list[DetectionCandidate]] = [[candidates[0]]]
    for candidate in candidates[1:]:
        previous = segments[-1][-1]
        crosses_day = daily and candidate.timestamp.date() != previous.timestamp.date()
        if not crosses_day and candidate.timestamp - previous.timestamp <= maximum_gap:
            segments[-1].append(candidate)
        else:
            segments.append([candidate])
    return tuple(tuple(segment) for segment in segments)
