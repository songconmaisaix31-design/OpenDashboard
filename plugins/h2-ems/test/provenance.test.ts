import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createFixtureH2EmsDataSource } from '../src/index.ts'

describe('H2 EMS provenance and reports', () => {
  it('keeps Fixture provenance and normalized report artifacts', async () => {
    const source = createFixtureH2EmsDataSource()
    const report = await source.exportReport({
      runId: 'run-fixture-h2-sentinel-golden',
      kind: 'single_event_diagnosis',
      eventId: 'C03-20260105-001',
    })
    const submission = await source.exportSubmission('run-fixture-h2-sentinel-golden')

    assert.equal(report.mediaType, 'application/json')
    assert.equal(report.descriptor.provenance.mode, 'FIXTURE')
    assert.match(report.descriptor.contentHash, /^sha256:[a-f0-9]{64}$/)
    assert.equal(submission.mediaType, 'text/csv')
    assert.match(submission.content, /^pred_event_id,/)
    assert(!/[A-Za-z]:\\|\\\\/.test(report.content))
  })
})
