import type { H2AnomalyCode } from './anomaly.ts'
import type { H2AssistantQuestion, H2AssistantQuestionId } from './assistant.ts'
import { H2_ASSISTANT_QUESTIONS } from './assistant.ts'

import assistantQuestionsData from '../../h2-vocabulary/data/assistant-questions.json'
import anomalyTaxonomyData from '../../h2-vocabulary/data/anomaly-taxonomy.json'
import deprecatedFieldMapData from '../../h2-vocabulary/data/deprecated-field-map.json'
import equipmentData from '../../h2-vocabulary/data/equipment.json'
import fieldsData from '../../h2-vocabulary/data/fields.json'

export interface H2FieldDefinition {
  readonly name: string
  readonly chineseName: string
  readonly category: string
  readonly dataType: string
  readonly unit: string
  readonly sign: string
  readonly description: string
  readonly formula: string
  readonly isDerived: boolean
  readonly relatedAnomaly: readonly string[]
  readonly sourceFile: string
}

export interface H2AnomalyTaxonomyEntry {
  readonly code: H2AnomalyCode
  readonly nameZh: string
  readonly primaryControlObject: string
  readonly primaryImpactMetric: string
  readonly primaryImpactMetricZh: string
  readonly severity: string
  readonly subtypes: readonly {
    readonly code: string
    readonly nameZh: string
  }[]
  readonly affectedEquipment: readonly {
    readonly equipmentId: string
    readonly equipmentName: string
  }[]
}

export interface H2EquipmentEntry {
  readonly equipment_id: string
  readonly equipment_name: string
  readonly rated_capacity: string
  readonly control_relationship: string
  readonly related_tags: string
  readonly constraint_note: string
}

export interface H2AssistantQuestionZh extends H2AssistantQuestion {
  readonly question: string
}

export interface H2DeprecatedFieldMapping {
  readonly internal: string
  readonly official: string | null
  readonly derived?: string
  readonly note: string
}

const FIELD_BY_NAME = new Map<string, H2FieldDefinition>(
  (fieldsData as { readonly fields: readonly H2FieldDefinition[] }).fields.map(
    (field) => [field.name, field],
  ),
)

const TAXONOMY_BY_CODE = new Map<H2AnomalyCode, H2AnomalyTaxonomyEntry>(
  (anomalyTaxonomyData as readonly H2AnomalyTaxonomyEntry[]).map((entry) => [
    entry.code,
    entry,
  ]),
)

const EQUIPMENT_BY_KEY = new Map<string, H2EquipmentEntry>(
  (equipmentData as readonly H2EquipmentEntry[]).map((entry) => [
    normalizeEquipmentKey(entry.equipment_id),
    entry,
  ]),
)

/**
 * Returns the official 69-field definition for a variable name, or undefined
 * when the name is not part of the frozen vocabulary.
 */
export function fieldByName(name: string): H2FieldDefinition | undefined {
  return FIELD_BY_NAME.get(name)
}

/** Returns the official anomaly-taxonomy entry for a code, or undefined. */
export function anomalyTaxonomyByCode(
  code: H2AnomalyCode,
): H2AnomalyTaxonomyEntry | undefined {
  return TAXONOMY_BY_CODE.get(code)
}

function normalizeEquipmentKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLocaleLowerCase('en-US')
}

/**
 * Resolves an equipment reference to its official equipment name. Reference
 * identifiers are normalized (for example `bess-01` -> `BESS01`) before the
 * official equipment table is consulted; unknown references fall back to the
 * event-provided display name.
 */
export function equipmentNameForRef(ref: {
  readonly id: string
  readonly displayName: string
}): string {
  return EQUIPMENT_BY_KEY.get(normalizeEquipmentKey(ref.id))?.equipment_name ?? ref.displayName
}

/** Returns the official equipment entry for an id, or undefined. */
export function equipmentById(id: string): H2EquipmentEntry | undefined {
  return EQUIPMENT_BY_KEY.get(normalizeEquipmentKey(id))
}

function assistantQuestionZh(questionId: H2AssistantQuestionId): string | undefined {
  // Contract ids are the official ids, so no prefix translation is needed.
  return (assistantQuestionsData as readonly { readonly questionId: string; readonly question: string }[]).find(
    (item) => item.questionId === questionId,
  )?.question
}

/**
 * The ten official operations questions (Q01-Q10, Chinese) joined with the
 * contract question identifiers used by H2SentinelDataSource.
 */
export const H2_ASSISTANT_QUESTIONS_ZH: readonly H2AssistantQuestionZh[] =
  H2_ASSISTANT_QUESTIONS.map((question) => ({
    ...question,
    question: assistantQuestionZh(question.questionId) ?? question.prompt,
  }))

/** Maps a legacy internal field name to its official name, when it exists. */
export function deprecatedFieldName(internal: string): string | null {
  const mapping = (deprecatedFieldMapData as { readonly mappings: readonly H2DeprecatedFieldMapping[] }).mappings.find(
    (item) => item.internal === internal,
  )
  return mapping?.official ?? null
}
