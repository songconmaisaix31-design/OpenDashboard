import { parseCsvText, serializeCsv } from './csv.mjs'
import {
  CANONICAL_EQUIPMENT_TOKENS_BY_CODE,
  EQUIPMENT_NAME_BY_ID,
  OFFICIAL_EQUIPMENT_TOKENS,
  PRIMARY_CONTROL_OBJECT_BY_CODE,
  PRIMARY_IMPACT_METRIC_BY_CODE,
  SEVERITY_BY_CODE,
  SUBTYPES_BY_CODE,
  validateEquipmentTokenSet,
} from './fields.mjs'

export const SUBMISSION_COLUMNS = [
  'pred_event_id',
  'start_time',
  'end_time',
  'anomaly_code',
  'anomaly_subtype',
  'severity',
  'primary_control_object',
  'affected_equipment',
  'confidence',
  'evidence_json',
  'root_cause',
  'recommended_action',
  'primary_impact_metric',
  'estimated_impact_value',
  'first_detection_time',
  'requires_human_confirmation',
]

export const OFFICIAL_SEVERITIES = ['高', '中']

/**
 * Official comma-separated `affected_equipment` tokens for an event.
 *
 * Uses per-event equipment only when it forms a complete valid official token
 * set for the event code; otherwise falls back to the canonical per-code
 * pattern. C01/C02 equipment varies per event (oscillating/derated tanks), so
 * those rows are validated as token sets by the submission checker.
 */
export function affectedEquipmentTokens(event) {
  const code = event.code
  const canonical = CANONICAL_EQUIPMENT_TOKENS_BY_CODE.get(code) ?? []
  const eventTokens = (event.affectedEquipment ?? [])
    .map((entry) => {
      if (OFFICIAL_EQUIPMENT_TOKENS.has(entry.kind ?? '')) return entry.kind
      return /^ELZ0[1-3]$/.test(entry.id ?? '') ? `ELZ${entry.id.slice(-1)}` : null
    })
    .filter((token) => token !== null)
  const unique = [...new Set(eventTokens)]
  if (unique.length > 0 && validateEquipmentTokenSet(code, unique) === null) {
    return unique.join(',')
  }
  return canonical.join(',')
}

export function eventToSubmissionRow(event) {
  const code = event.code
  return {
    pred_event_id: event.eventId,
    start_time: event.startTime,
    end_time: event.endTime,
    anomaly_code: code,
    anomaly_subtype: event.subtype,
    severity: SEVERITY_BY_CODE.get(code),
    primary_control_object: PRIMARY_CONTROL_OBJECT_BY_CODE.get(code),
    affected_equipment: affectedEquipmentTokens(event),
    confidence: event.confidence,
    evidence_json: JSON.stringify(
      (event.evidence ?? []).map((item) => ({
        evidence_id: item.evidenceId,
        kind: item.kind,
        claim_kind: item.claimKind,
        timestamp: item.timestamp ?? item.interval?.startTime ?? '',
        variable: item.variable ?? '',
        actual_value: item.actualValue ?? '',
        reference_value: item.referenceValue ?? '',
        unit: item.unit ?? '',
        conclusion: item.conclusion,
      })),
    ),
    root_cause: event.rootCause ?? '',
    recommended_action: (event.recommendations ?? [])
      .map((item) => item.summary)
      .join(' '),
    primary_impact_metric: PRIMARY_IMPACT_METRIC_BY_CODE.get(code),
    estimated_impact_value: event.impact?.value ?? 0,
    first_detection_time: event.firstDetectionTime ?? event.startTime,
    requires_human_confirmation: event.requiresHumanConfirmation ?? true,
  }
}

export function serializeSubmission(rows) {
  return serializeCsv(
    SUBMISSION_COLUMNS,
    rows.map((row) => SUBMISSION_COLUMNS.map((column) => row[column])),
  )
}

export function parseSubmission(text) {
  const { columns, rows } = parseCsvText(text)
  return { columns, rows: rows.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index] ?? '']))) }
}

export { SUBTYPES_BY_CODE, EQUIPMENT_NAME_BY_ID, PRIMARY_CONTROL_OBJECT_BY_CODE }
