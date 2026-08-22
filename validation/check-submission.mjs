import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { decodeUtf8Strict } from './lib/csv.mjs'
import {
  ANOMALY_CODES,
  PRIMARY_CONTROL_OBJECT_BY_CODE,
  PRIMARY_IMPACT_METRIC_BY_CODE,
  SUBTYPES_BY_CODE,
  validateEquipmentTokenSet,
} from './lib/fields.mjs'
import { toInstant } from './lib/metrics.mjs'
import {
  OFFICIAL_SEVERITIES,
  SUBMISSION_COLUMNS,
  parseSubmission,
} from './lib/submission.mjs'

const MAX_SUBMISSION_BYTES = 64 * 1024 * 1024
const MOJIBAKE_PATTERN = /[\uFFFD�]|锟斤拷|烫烫烫|屯屯屯|鈥/

/**
 * Validate the official `affected_equipment` format: comma-separated tokens
 * without spaces (`BESS,PCC`, `ELZ1,ELZ2,ELZ3`, ...). The official label files
 * use this exact shape and `equipment_master` ids (`BESS01:...`) never appear.
 */
function validateAffectedEquipment(code, field, issues, label) {
  if (/\s/.test(field)) {
    issues.push(`${label} affected_equipment "${field}" must not contain spaces`)
    return
  }
  const tokens = field.split(',')
  const problem = validateEquipmentTokenSet(code, tokens)
  if (problem !== null) {
    issues.push(`${label} affected_equipment "${field}" ${problem}`)
  }
}

export function validateSubmissionText(text, { strictHeader = true } = {}) {
  const issues = []
  const warnings = []
  if (text.includes('\x00')) {
    return { valid: false, issues: ['submission contains a NUL byte'], warnings, rowCount: 0 }
  }
  if (MOJIBAKE_PATTERN.test(text)) {
    return {
      valid: false,
      issues: ['submission contains replacement characters or mojibake sequences'],
      warnings,
      rowCount: 0,
    }
  }

  const { columns, rows } = parseSubmission(text)
  if (strictHeader) {
    if (columns.length !== SUBMISSION_COLUMNS.length) {
      issues.push(
        `header has ${columns.length} columns; expected ${SUBMISSION_COLUMNS.length}`,
      )
      return { valid: false, issues, warnings, rowCount: 0 }
    }
    for (let index = 0; index < SUBMISSION_COLUMNS.length; index += 1) {
      if (columns[index] !== SUBMISSION_COLUMNS[index]) {
        issues.push(
          `header column ${index + 1} is "${columns[index]}"; expected "${SUBMISSION_COLUMNS[index]}"`,
        )
      }
    }
  }

  const seenIds = new Set()
  const rowIssues = []
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    const label = `row ${rowIndex + 2}`
    const missing = SUBMISSION_COLUMNS.filter(
      (column) => !(column in row) || row[column].trim() === '',
    )
    if (missing.length > 0) {
      rowIssues.push(`${label} has empty values for: ${missing.join(', ')}`)
    }

    const predEventId = row.pred_event_id?.trim()
    if (predEventId !== undefined && predEventId !== '') {
      if (seenIds.has(predEventId)) {
        rowIssues.push(`${label} duplicates pred_event_id "${predEventId}"`)
      }
      seenIds.add(predEventId)
    }

    const code = row.anomaly_code?.trim()
    if (!ANOMALY_CODES.includes(code)) {
      rowIssues.push(`${label} has invalid anomaly_code "${code}"`)
    }

    const subtype = row.anomaly_subtype?.trim()
    if (code !== undefined && !SUBTYPES_BY_CODE.get(code)?.includes(subtype)) {
      rowIssues.push(`${label} has invalid anomaly_subtype "${subtype}" for ${code}`)
    }

    const severity = row.severity?.trim()
    if (!OFFICIAL_SEVERITIES.includes(severity)) {
      rowIssues.push(`${label} has invalid severity "${severity}"`)
    }

    const controlObject = row.primary_control_object?.trim()
    if (controlObject === '') {
      rowIssues.push(`${label} has an empty primary_control_object`)
    } else if (code !== undefined) {
      const expectedControl = PRIMARY_CONTROL_OBJECT_BY_CODE.get(code)
      if (controlObject !== expectedControl) {
        rowIssues.push(
          `${label} primary_control_object "${controlObject}" is not the official value "${expectedControl}" for ${code}`,
        )
      }
    }

    const affectedEquipment = row.affected_equipment?.trim()
    if (affectedEquipment === '') {
      rowIssues.push(`${label} has an empty affected_equipment`)
    } else if (code !== undefined && ANOMALY_CODES.includes(code)) {
      validateAffectedEquipment(code, affectedEquipment, rowIssues, label)
    }

    const confidence = Number(row.confidence)
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      rowIssues.push(`${label} has invalid confidence "${row.confidence}"`)
    }

    let evidence
    try {
      evidence = JSON.parse(row.evidence_json ?? '')
    } catch {
      rowIssues.push(`${label} evidence_json is not valid JSON`)
    }
    if (evidence !== undefined && (!Array.isArray(evidence) || evidence.length === 0)) {
      rowIssues.push(`${label} evidence_json must be a non-empty array`)
    }

    if ((row.root_cause ?? '').trim() === '') {
      rowIssues.push(`${label} has an empty root_cause`)
    }
    if ((row.recommended_action ?? '').trim() === '') {
      rowIssues.push(`${label} has an empty recommended_action`)
    }

    const impactMetric = row.primary_impact_metric?.trim()
    if (code !== undefined && impactMetric !== PRIMARY_IMPACT_METRIC_BY_CODE.get(code)) {
      rowIssues.push(
        `${label} primary_impact_metric "${impactMetric}" does not match ${code}`,
      )
    }

    const impactValue = Number(row.estimated_impact_value)
    if (!Number.isFinite(impactValue)) {
      rowIssues.push(`${label} has invalid estimated_impact_value "${row.estimated_impact_value}"`)
    }

    const start = toInstant(row.start_time ?? '')
    const end = toInstant(row.end_time ?? '')
    const firstDetection = toInstant(row.first_detection_time ?? '')
    if (!Number.isFinite(start)) {
      rowIssues.push(`${label} has an invalid start_time`)
    }
    if (!Number.isFinite(end)) {
      rowIssues.push(`${label} has an invalid end_time`)
    }
    if (!Number.isFinite(firstDetection)) {
      rowIssues.push(`${label} has an invalid first_detection_time`)
    }
    if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
      rowIssues.push(`${label} has an inverted interval`)
    }
    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      Number.isFinite(firstDetection) &&
      !(start <= firstDetection && firstDetection <= end)
    ) {
      rowIssues.push(`${label} first_detection_time is outside the event interval`)
    }

    const humanConfirmation = row.requires_human_confirmation?.trim()
    if (humanConfirmation !== 'true' && humanConfirmation !== 'false') {
      rowIssues.push(`${label} requires_human_confirmation must be true or false`)
    }
  }

  if (rowIssues.length > 0) {
    issues.push(...rowIssues)
  }
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    rowCount: rows.length,
    columns,
  }
}

export function validateSubmissionFile(candidatePath) {
  const resolved = resolve(candidatePath)
  const stat = statSync(resolved)
  if (!stat.isFile()) {
    return { valid: false, issues: [`${candidatePath} is not a file`], warnings: [], rowCount: 0 }
  }
  if (stat.size > MAX_SUBMISSION_BYTES) {
    return { valid: false, issues: [`${candidatePath} exceeds the ${MAX_SUBMISSION_BYTES}-byte limit`], warnings: [], rowCount: 0 }
  }
  let text
  try {
    text = decodeUtf8Strict(readFileSync(resolved))
  } catch {
    return { valid: false, issues: [`${candidatePath} is not valid UTF-8`], warnings: [], rowCount: 0 }
  }
  return validateSubmissionText(text)
}

const isDirectRun = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(new URL(import.meta.url))
if (isDirectRun) {
  const candidates = process.argv.slice(2)
  if (candidates.length === 0) {
    console.error('Usage: node validation/check-submission.mjs <path-to-submission.csv>')
    process.exitCode = 2
  } else {
    let anyInvalid = false
    for (const candidate of candidates) {
      const result = validateSubmissionFile(candidate)
      console.log(JSON.stringify(result, null, 2))
      if (!result.valid) anyInvalid = true
    }
    process.exitCode = anyInvalid ? 1 : 0
  }
}
