import type { H2AnomalyEvent, H2SubmissionRow } from '../src/index.ts'

type H2C03Event = Extract<H2AnomalyEvent, { readonly code: 'C03' }>
type H2C03SubmissionRow = Extract<
  H2SubmissionRow,
  { readonly anomaly_code: 'C03' }
>

// @ts-expect-error C03 only accepts BESS_DIRECTION_REVERSED.
const invalidEventSubtype: H2C03Event['subtype'] =
  'EXPORT_POWER_LIMIT_NOT_TRACKED'

// @ts-expect-error C03 only accepts abnormal_grid_exchange_energy_kwh.
const invalidImpactMetric: H2C03SubmissionRow['primary_impact_metric'] =
  'pcc_power_limit_violation_energy_kwh'

void invalidEventSubtype
void invalidImpactMetric
