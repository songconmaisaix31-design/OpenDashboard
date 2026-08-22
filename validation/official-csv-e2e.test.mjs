import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { H2EmsAdapterError } from '../plugins/h2-ems/src/index.ts'
import {
  inspectCsvIdentity,
  parseOfficialCsvE2eArgs,
  runOfficialCsvE2e,
  sanitizeErrorCode,
} from './official-csv-e2e.mjs'

const EXPECTED_COMMIT = 'a'.repeat(40)
const FIELDS = ['timestamp', 'power_kw']

function identity(text, rows = 1, fields = FIELDS.length) {
  const bytes = Buffer.byteLength(text)
  return {
    bytes,
    sha256: createHash('sha256').update(text).digest('hex'),
    rows,
    fields,
  }
}

async function withTempDir(run) {
  const directory = await mkdtemp(join(tmpdir(), 'official-csv-e2e-'))
  try {
    await run(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

function depsFor({ rawText = 'timestamp,power_kw\n2026-01-01T00:00:00Z,1\n', events, errors = {}, check, mutate = {}, readyWebUrl = 'http://127.0.0.1:4100/h2-sentinel/?mode=local', stopResult = { code: 0, signal: null, timedOut: false } } = {}) {
  const calls = []
  const hydrationInputs = []
  let metadataCalls = 0
  let inspectCalls = 0
  let readCalls = 0
  const normalizedText = rawText
  const expected = { raw: identity(rawText), normalized: identity(normalizedText) }
  const normalizedFingerprint = `sha256:${expected.normalized.sha256}`
  const imported = {
    dataset: {
      datasetId: 'dataset-1',
      mode: 'LIVE_ANALYSIS',
      rowCount: expected.normalized.rows,
      fields: Array.from({ length: expected.normalized.fields }, () => ({})),
      fingerprint: normalizedFingerprint,
    },
    quality: { status: 'passed' },
  }
  const analysis = {
    runId: 'run-1',
    status: 'completed',
    dataset: {
      datasetId: imported.dataset.datasetId,
      fingerprint: imported.dataset.fingerprint,
    },
    quality: { status: 'passed' },
    events: [{}, {}],
  }
  const submissionContent = 'header\nrow\nrow\n'
  const submission = {
    content: submissionContent,
    mediaType: 'text/csv',
    descriptor: {
      status: 'ready',
      kind: 'submission_csv',
      format: 'csv',
      runId: analysis.runId,
      contentHash: `sha256:${createHash('sha256').update(submissionContent).digest('hex')}`,
    },
  }
  mutate.import?.(imported)
  mutate.analysis?.(analysis)
  mutate.export?.(submission)
  const hydrationWorkspace = {
    run: {
      ...analysis,
      dataset: { ...analysis.dataset },
      quality: { ...analysis.quality },
      events: [...analysis.events],
    },
    series: {
      runId: analysis.runId,
      variables: ['power_kw'],
      points: Array.from({ length: expected.normalized.rows }, () => ({})),
    },
    seriesError: null,
  }
  mutate.hydration?.(hydrationWorkspace)
  const checkerResult = check ?? {
    valid: true,
    columns: Array.from({ length: 16 }, () => 'column'),
    rowCount: analysis.events.length,
  }
  const source = {
    async importCsv(input) {
      calls.push(['import', input.filename])
      if (events?.import) throw new Error('import body must not be recorded')
      return imported
    },
    async runAnalysis(datasetId) {
      calls.push(['analysis', datasetId])
      if (errors.analysis) throw errors.analysis
      if (events?.analysis) throw new Error('analysis body must not be recorded')
      return analysis
    },
    async exportSubmission(runId) {
      calls.push(['export', runId])
      if (events?.export) throw new Error('export body must not be recorded')
      return submission
    },
  }
  let stopped = 0
  let nextPort = 4100
  return {
    calls,
    hydrationInputs: () => hydrationInputs,
    metadataCalls: () => metadataCalls,
    inspectCalls: () => inspectCalls,
    readCalls: () => readCalls,
    stopped: () => stopped,
    rawText,
    normalizedText,
    expected,
    deps: {
      getHead: async () => EXPECTED_COMMIT,
      statRaw: async () => {
        metadataCalls += 1
        return { isFile: () => true, size: Buffer.byteLength(rawText) }
      },
      readFile: async () => {
        readCalls += 1
        return rawText
      },
      inspectRaw: async () => {
        inspectCalls += 1
        return identity(rawText)
      },
      normalize: () => normalizedText,
      inspectNormalized: async () => identity(normalizedText),
      officialFields: FIELDS,
      totalMemoryBytes: () => 8 * 1024 ** 3,
      heapLimitBytes: () => 4 * 1024 ** 3,
      freeLoopbackPort: async () => nextPort++,
      startLauncher: async (options) => {
        calls.push(['start', options])
        if (events?.start) throw new Error('launcher output must not be recorded')
        return {
          ready: { webUrl: readyWebUrl },
          stop: async () => {
            stopped += 1
            if (events?.cleanup) throw new Error('cleanup output must not be recorded')
            return stopResult
          },
        }
      },
      createLiveDataSource: (options) => {
        calls.push(['source', options])
        if (events?.source) throw new Error('source output must not be recorded')
        return source
      },
      checkSubmission: () => {
        calls.push(['checker'])
        return checkerResult
      },
      hydrateWorkspace: async (...argumentsList) => {
        calls.push(['hydrate'])
        hydrationInputs.push(argumentsList)
        if (events?.hydrate) throw new Error('series failure must not be recorded')
        return hydrationWorkspace
      },
      getResources: () => ({ rssBytes: 123, resourceUsage: { maxRSS: 456 } }),
    },
  }
}

async function runFixture(directory, fixture, overrides = {}) {
  return runOfficialCsvE2e({
    rawPath: join(directory, 'not-reported.csv'),
    expectedCommit: EXPECTED_COMMIT,
    runId: 'run_f2bc8c0433f8',
    taskId: 'task_x',
    dispatchId: 'ctx_x',
    outputRoot: join(directory, 'reports'),
    expected: fixture.expected,
    dependencies: { ...fixture.deps, ...overrides },
  })
}

test('rejects a literal expected commit mismatch before identity, reads, or launcher startup', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor()
    const result = await runOfficialCsvE2e({
      rawPath: join(directory, 'not-reported.csv'),
      expectedCommit: 'b'.repeat(40),
      runId: 'run_f2bc8c0433f8',
      taskId: 'task_x',
      dispatchId: 'ctx_x',
      outputRoot: join(directory, 'reports'),
      expected: fixture.expected,
      dependencies: fixture.deps,
    })
    assert.equal(result.status, 'failed')
    assert.equal(result.errorCode, 'E_COMMIT_MISMATCH')
    assert.deepEqual(fixture.calls, [])
  })
})

test('parses required public identifiers, preserves underscores, and rejects traversal', () => {
  assert.deepEqual(
    parseOfficialCsvE2eArgs([
      '--official-csv', 'operator-input.csv',
      '--expected-commit', EXPECTED_COMMIT,
      '--run-id', 'run_f2bc8c0433f8',
      '--task-id', 'task_x',
      '--dispatch-id', 'ctx_x',
    ]),
    {
      rawPath: 'operator-input.csv',
      expectedCommit: EXPECTED_COMMIT,
      runId: 'run_f2bc8c0433f8',
      taskId: 'task_x',
      dispatchId: 'ctx_x',
    },
  )
  assert.throws(
    () => parseOfficialCsvE2eArgs([
      '--official-csv', 'operator-input.csv',
      '--expected-commit', EXPECTED_COMMIT,
      '--run-id', '../escape',
      '--task-id', 'task_x',
    ]),
    (error) => sanitizeErrorCode(error) === 'E_RUN_ID_INVALID',
  )
  assert.throws(
    () => parseOfficialCsvE2eArgs([
      '--official-csv', 'operator-input.csv',
      '--expected-commit', EXPECTED_COMMIT,
      '--run-id', 'run_f2bc8c0433f8',
    ]),
    (error) => sanitizeErrorCode(error) === 'E_ARGUMENTS_INVALID',
  )
  assert.throws(
    () => parseOfficialCsvE2eArgs([
      '--official-csv', 'operator-input.csv',
      '--expected-commit', EXPECTED_COMMIT,
      '--run-id', 'run_f2bc8c0433f8',
      '--task-id', '../escape',
    ]),
    (error) => sanitizeErrorCode(error) === 'E_TASK_ID_INVALID',
  )
})

test('records run, task, dispatch, and tested code identity in a successful sanitized report', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor()
    const result = await runFixture(directory, fixture)
    const report = JSON.parse(await readFile(result.reportPath, 'utf8'))
    assert.equal(result.status, 'passed')
    assert.equal(report.runId, 'run_f2bc8c0433f8')
    assert.equal(report.taskId, 'task_x')
    assert.equal(report.dispatchId, 'ctx_x')
    assert.equal(report.testedCodeSha, EXPECTED_COMMIT)
  })
})

test('omits rather than fabricates an optional dispatch identity', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor()
    const result = await runOfficialCsvE2e({
      rawPath: join(directory, 'not-reported.csv'),
      expectedCommit: EXPECTED_COMMIT,
      runId: 'run_f2bc8c0433f8',
      taskId: 'task_x',
      outputRoot: join(directory, 'reports'),
      expected: fixture.expected,
      dependencies: fixture.deps,
    })
    const report = JSON.parse(await readFile(result.reportPath, 'utf8'))
    assert.equal(result.status, 'passed')
    assert.equal(Object.hasOwn(report, 'dispatchId'), false)
  })
})

test('rejects a non-file or size-mismatched raw metadata result before opening a stream or reading text', async () => {
  await withTempDir(async (directory) => {
    for (const [metadata, expectedCode] of [
      [{ isFile: () => false, size: 0 }, 'E_RAW_NOT_FILE'],
      [{ isFile: () => true, size: 0 }, 'E_RAW_BYTES_MISMATCH'],
    ]) {
      const fixture = depsFor()
      let statCalls = 0
      const result = await runFixture(directory, fixture, {
        statRaw: async () => {
          statCalls += 1
          return metadata
        },
      })
      assert.equal(result.status, 'failed')
      assert.equal(result.errorCode, expectedCode)
      assert.equal(statCalls, 1)
      assert.equal(fixture.inspectCalls(), 0)
      assert.equal(fixture.readCalls(), 0)
      assert.deepEqual(fixture.calls, [])
    }
  })
})

for (const [name, mutate, expectedCode] of [
  ['size', (value) => ({ ...value, bytes: value.bytes + 1 }), 'E_RAW_BYTES_MISMATCH'],
  ['hash', (value) => ({ ...value, sha256: '0'.repeat(64) }), 'E_RAW_SHA256_MISMATCH'],
  ['field count', (value) => ({ ...value, fields: value.fields + 1 }), 'E_RAW_FIELDS_MISMATCH'],
  ['header identity', (value) => ({ ...value, headerMatches: false }), 'E_RAW_HEADER_MISMATCH'],
]) {
  test(`rejects raw ${name} before launcher startup`, async () => {
    await withTempDir(async (directory) => {
      const fixture = depsFor()
      const result = await runFixture(directory, fixture, {
        inspectRaw: async () => mutate(identity(fixture.rawText)),
      })
      assert.equal(result.status, 'failed')
      assert.equal(result.errorCode, expectedCode)
      assert.deepEqual(fixture.calls, [])
    })
  })
}

test('rejects a normalized hash mismatch before launcher startup', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor()
    const result = await runFixture(directory, fixture, {
      inspectNormalized: async () => ({ ...fixture.expected.normalized, sha256: '0'.repeat(64) }),
    })
    assert.equal(result.status, 'failed')
    assert.equal(result.errorCode, 'E_NORMALIZED_SHA256_MISMATCH')
    assert.deepEqual(fixture.calls, [])
  })
})

test('uses only the launcher web origin with the mandated 30 second adapter timeout and stage order', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor()
    const result = await runFixture(directory, fixture)
    assert.equal(result.status, 'passed')
    assert.deepEqual(fixture.calls.map(([name]) => name), [
      'start', 'source', 'import', 'analysis', 'export', 'checker', 'hydrate',
    ])
    assert.deepEqual(fixture.calls[0][1], { mode: 'local', webPort: 4100, analyticsPort: 4101 })
    assert.deepEqual(fixture.calls[1][1], {
      enabled: true,
      baseUrl: 'http://127.0.0.1:4100',
      timeoutMs: 30_000,
    })
    assert.equal(fixture.stopped(), 1)
  })
})

test('fails closed on an invalid launcher ready URL without exposing it or creating a source', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor({ readyWebUrl: 'not a URL / secret' })
    const result = await runFixture(directory, fixture)
    const report = await readFile(result.reportPath, 'utf8')
    assert.equal(result.status, 'failed')
    assert.equal(result.errorCode, 'E_LAUNCHER_READY_INVALID')
    assert.deepEqual(fixture.calls.map(([name]) => name), ['start'])
    assert.equal(fixture.stopped(), 1)
    assert.doesNotMatch(report, /not a URL|secret/i)
  })
})

test('measures series hydration only after checker and records compact verified summaries', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor()
    const result = await runFixture(directory, fixture)
    const report = JSON.parse(await readFile(result.reportPath, 'utf8'))
    const hydrationInput = fixture.hydrationInputs()[0]
    assert.equal(result.status, 'passed')
    assert.deepEqual(fixture.calls.map(([name]) => name), [
      'start', 'source', 'import', 'analysis', 'export', 'checker', 'hydrate',
    ])
    assert.equal(hydrationInput[1].length, 1)
    assert.strictEqual(hydrationInput[1][0], hydrationInput[2])
    assert.deepEqual(report.seriesHydration, {
      status: 'passed',
      durationMs: report.seriesHydration.durationMs,
      runId: 'run-1',
      variableCount: 1,
      pointCount: fixture.expected.normalized.rows,
    })
    assert.doesNotMatch(JSON.stringify(report), /power_kw|series failure|not persisted/i)
    assert.deepEqual(report.stages.find(({ stage }) => stage === 'import'), {
      stage: 'import',
      status: 'passed',
      durationMs: report.stages.find(({ stage }) => stage === 'import').durationMs,
      rowCount: fixture.expected.normalized.rows,
      fieldCount: fixture.expected.normalized.fields,
      fingerprint: `sha256:${fixture.expected.normalized.sha256}`,
      qualityStatus: 'passed',
    })
    assert.deepEqual(report.stages.find(({ stage }) => stage === 'analysis'), {
      stage: 'analysis',
      status: 'passed',
      durationMs: report.stages.find(({ stage }) => stage === 'analysis').durationMs,
      runId: 'run-1',
      eventCount: 2,
      analysisStatus: 'completed',
    })
    assert.equal(report.stages.find(({ stage }) => stage === 'export').contentHash,
      `sha256:${createHash('sha256').update('header\nrow\nrow\n').digest('hex')}`)
    assert.deepEqual(
      {
        rowCount: report.stages.find(({ stage }) => stage === 'checker').rowCount,
        columnCount: report.stages.find(({ stage }) => stage === 'checker').columnCount,
      },
      { rowCount: 2, columnCount: 16 },
    )
  })
})

for (const [name, options, expectedCode] of [
  ['a thrown hydration', { events: { hydrate: true } }, 'E_SERIES_HYDRATION_FAILED'],
  ['a missing series', { mutate: { hydration: (value) => { value.series = null } } }, 'E_SERIES_HYDRATION_FAILED'],
  ['a series error', { mutate: { hydration: (value) => { value.seriesError = 'not persisted' } } }, 'E_SERIES_HYDRATION_FAILED'],
  ['a mismatched dataset id', { mutate: { hydration: (value) => { value.run.dataset.datasetId = 'other-dataset' } } }, 'E_SERIES_IDENTITY_MISMATCH'],
  ['a mismatched fingerprint', { mutate: { hydration: (value) => { value.run.dataset.fingerprint = 'sha256:bad' } } }, 'E_SERIES_IDENTITY_MISMATCH'],
  ['a mismatched series run id', { mutate: { hydration: (value) => { value.series.runId = 'other-run' } } }, 'E_SERIES_RUN_ID_MISMATCH'],
  ['an empty variable selection', { mutate: { hydration: (value) => { value.series.variables = [] } } }, 'E_SERIES_VARIABLES_INVALID'],
  ['an over-limit variable selection', { mutate: { hydration: (value) => { value.series.variables = Array.from({ length: 33 }, (_, index) => `v${index}`) } } }, 'E_SERIES_VARIABLES_INVALID'],
  ['a duplicate variable selection', { mutate: { hydration: (value) => { value.series.variables = ['power_kw', 'power_kw'] } } }, 'E_SERIES_VARIABLES_INVALID'],
  ['a mismatched point count', { mutate: { hydration: (value) => { value.series.points = [] } } }, 'E_SERIES_POINT_COUNT_MISMATCH'],
]) {
  test(`records independent hydration failure for ${name}`, async () => {
    await withTempDir(async (directory) => {
      const fixture = depsFor(options)
      const result = await runFixture(directory, fixture)
      const report = JSON.parse(await readFile(result.reportPath, 'utf8'))
      assert.equal(result.status, 'passed')
      assert.equal(result.errorCode, null)
      assert.deepEqual(report.seriesHydration, { status: 'failed', errorCode: expectedCode })
      assert.doesNotMatch(JSON.stringify(report.seriesHydration), /not persisted|series failure/i)
      assert.equal(fixture.stopped(), 1)
      assert.equal(fixture.calls.at(-1)[0], 'hydrate')
    })
  })
}

test('does not attempt hydration when the main checker chain has not passed', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor({ events: { import: true } })
    const result = await runFixture(directory, fixture)
    const report = JSON.parse(await readFile(result.reportPath, 'utf8'))
    assert.equal(result.status, 'failed')
    assert.deepEqual(report.seriesHydration, {
      status: 'not_attempted',
      errorCode: 'E_SERIES_HYDRATION_NOT_ATTEMPTED',
    })
    assert.equal(fixture.calls.some(([name]) => name === 'hydrate'), false)
    assert.equal(fixture.stopped(), 1)
  })
})

for (const [name, options, expectedCode] of [
  ['import dataset mode', { mutate: { import: (value) => { value.dataset.mode = 'FIXTURE' } } }, 'E_IMPORT_MODE_INVALID'],
  ['import row count', { mutate: { import: (value) => { value.dataset.rowCount = 0 } } }, 'E_IMPORT_ROW_COUNT_MISMATCH'],
  ['import field count', { mutate: { import: (value) => { value.dataset.fields = [] } } }, 'E_IMPORT_FIELD_COUNT_MISMATCH'],
  ['import fingerprint', { mutate: { import: (value) => { value.dataset.fingerprint = 'sha256:bad' } } }, 'E_IMPORT_FINGERPRINT_MISMATCH'],
  ['import blocked quality', { mutate: { import: (value) => { value.quality.status = 'blocked' } } }, 'E_IMPORT_QUALITY_BLOCKED'],
  ['import invalid quality', { mutate: { import: (value) => { value.quality.status = 'unknown' } } }, 'E_IMPORT_QUALITY_INVALID'],
  ['analysis completion status', { mutate: { analysis: (value) => { value.status = 'failed' } } }, 'E_ANALYSIS_STATUS_INVALID'],
  ['analysis dataset identity', { mutate: { analysis: (value) => { value.dataset.datasetId = 'other-dataset' } } }, 'E_ANALYSIS_DATASET_ID_MISMATCH'],
  ['analysis fingerprint identity', { mutate: { analysis: (value) => { value.dataset.fingerprint = 'sha256:bad' } } }, 'E_ANALYSIS_FINGERPRINT_MISMATCH'],
  ['analysis blocked quality', { mutate: { analysis: (value) => { value.quality.status = 'blocked' } } }, 'E_ANALYSIS_QUALITY_BLOCKED'],
  ['analysis invalid quality', { mutate: { analysis: (value) => { value.quality.status = 'unknown' } } }, 'E_ANALYSIS_QUALITY_INVALID'],
  ['export descriptor status', { mutate: { export: (value) => { value.descriptor.status = 'failed' } } }, 'E_EXPORT_STATUS_INVALID'],
  ['export descriptor kind', { mutate: { export: (value) => { value.descriptor.kind = 'period_summary' } } }, 'E_EXPORT_KIND_INVALID'],
  ['export descriptor format', { mutate: { export: (value) => { value.descriptor.format = 'json' } } }, 'E_EXPORT_FORMAT_INVALID'],
  ['export run identity', { mutate: { export: (value) => { value.descriptor.runId = 'other-run' } } }, 'E_EXPORT_RUN_ID_MISMATCH'],
  ['export media type', { mutate: { export: (value) => { value.mediaType = 'application/json' } } }, 'E_EXPORT_MEDIA_TYPE_INVALID'],
  ['export content hash', { mutate: { export: (value) => { value.descriptor.contentHash = 'sha256:bad' } } }, 'E_EXPORT_CONTENT_HASH_MISMATCH'],
  ['checker column count', { check: { valid: true, columns: [], rowCount: 2 } }, 'E_CHECKER_COLUMNS_INVALID'],
  ['checker row count', { check: { valid: true, columns: Array.from({ length: 16 }, () => 'column'), rowCount: 0 } }, 'E_CHECKER_ROW_COUNT_MISMATCH'],
]) {
  test(`rejects unbound ${name}`, async () => {
    await withTempDir(async (directory) => {
      const fixture = depsFor(options)
      const result = await runFixture(directory, fixture)
      assert.equal(result.status, 'failed')
      assert.equal(result.errorCode, expectedCode)
      assert.equal(fixture.stopped(), 1)
    })
  })
}

for (const stage of ['import', 'analysis', 'export', 'source']) {
  test(`stops the launcher exactly once when ${stage} fails`, async () => {
    await withTempDir(async (directory) => {
      const fixture = depsFor({ events: { [stage]: true } })
      const result = await runFixture(directory, fixture)
      assert.equal(result.status, 'failed')
      assert.equal(result.errorCode, `E_${stage.toUpperCase()}_FAILED`)
      assert.equal(fixture.stopped(), 1)
    })
  })
}

for (const [adapterCode, expectedCode] of [
  ['remote_request_failed', 'E_ANALYSIS_REMOTE_REQUEST_FAILED'],
  ['remote_response_invalid', 'E_ANALYSIS_REMOTE_RESPONSE_INVALID'],
  ['request_timeout', 'E_ANALYSIS_REQUEST_TIMEOUT'],
]) {
  test(`retains the stable analysis adapter code for ${adapterCode}`, async () => {
    await withTempDir(async (directory) => {
      const adapterError = new H2EmsAdapterError(adapterCode, false)
      adapterError.message = 'http://127.0.0.1:4100/hidden?body=adapter-secret'
      adapterError.stack = 'adapter-stack-must-not-be-reported'
      const fixture = depsFor({ errors: { analysis: adapterError } })
      const result = await runFixture(directory, fixture)
      const report = await readFile(result.reportPath, 'utf8')
      assert.equal(result.status, 'failed')
      assert.equal(result.errorCode, expectedCode)
      assert.match(report, new RegExp(expectedCode))
      assert.doesNotMatch(report, /127\.0\.0\.1|adapter-secret|adapter-stack-must-not-be-reported/i)
      assert.equal(fixture.stopped(), 1)
    })
  })
}

test('keeps arbitrary analysis errors at the existing generic code and redacts their details', async () => {
  await withTempDir(async (directory) => {
    const arbitraryError = new Error('http://127.0.0.1:4100/hidden?body=arbitrary-secret')
    arbitraryError.stack = 'arbitrary-stack-must-not-be-reported'
    const fixture = depsFor({ errors: { analysis: arbitraryError } })
    const result = await runFixture(directory, fixture)
    const report = await readFile(result.reportPath, 'utf8')
    assert.equal(result.status, 'failed')
    assert.equal(result.errorCode, 'E_ANALYSIS_FAILED')
    assert.match(report, /E_ANALYSIS_FAILED/)
    assert.doesNotMatch(report, /127\.0\.0\.1|arbitrary-secret|arbitrary-stack-must-not-be-reported/i)
    assert.equal(fixture.stopped(), 1)
  })
})

test('treats an invalid checker result as a nonzero runner failure', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor({ check: { valid: false } })
    const result = await runFixture(directory, fixture)
    assert.equal(result.status, 'failed')
    assert.equal(result.errorCode, 'E_CHECKER_INVALID')
    assert.equal(result.exitCode, 1)
    assert.equal(fixture.stopped(), 1)
  })
})

for (const [name, stopResult] of [
  ['a timed out stop', { code: null, signal: null, timedOut: true }],
  ['a nonzero stop code', { code: 1, signal: null, timedOut: false }],
  ['an unexpected stop signal', { code: 0, signal: 'SIGTERM', timedOut: false }],
]) {
  test(`marks cleanup failed after ${name}`, async () => {
    await withTempDir(async (directory) => {
      const fixture = depsFor({ stopResult })
      const result = await runFixture(directory, fixture)
      const report = JSON.parse(await readFile(result.reportPath, 'utf8'))
      assert.equal(result.status, 'failed')
      assert.equal(result.errorCode, 'E_CLEANUP_FAILED')
      assert.deepEqual(report.stages.at(-1), {
        stage: 'cleanup',
        status: 'failed',
        durationMs: report.stages.at(-1).durationMs,
        errorCode: 'E_CLEANUP_FAILED',
      })
      assert.equal(fixture.stopped(), 1)
    })
  })
}

test('sanitizes errors and reports without paths, URLs, argv, ports, raw CSV, or stack traces', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor({ events: { import: true } })
    const result = await runFixture(directory, fixture)
    const report = await readFile(result.reportPath, 'utf8')
    assert.equal(sanitizeErrorCode(new Error('http://127.0.0.1:4100 secret')), 'E_STAGE_FAILED')
    assert.match(report, /E_IMPORT_FAILED/)
    assert.doesNotMatch(report, /not-reported|127\.0\.0\.1|secret|stack|argv|cwd|pid/i)
  })
})

test('preserves attempts and refuses to overwrite an existing report', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor()
    const first = await runFixture(directory, fixture)
    const second = await runFixture(directory, fixture)
    assert.notEqual(first.reportPath, second.reportPath)
    await assert.rejects(
      () => writeFile(first.reportPath, '{}', { flag: 'wx' }),
      { code: 'EEXIST' },
    )
  })
})

test('uses official-csv-e2e.json as the only report artifact name', async () => {
  await withTempDir(async (directory) => {
    const fixture = depsFor()
    const result = await runFixture(directory, fixture)
    assert.match(result.reportPath, /official-csv-e2e\.json$/)
    assert.match(result.reportRef, /official-csv-e2e\.json$/)
  })
})

test('inspects a synthetic CSV stream without reading it as a full text buffer', async () => {
  await withTempDir(async (directory) => {
    const source = join(directory, 'synthetic.csv')
    const text = 'timestamp,power_kw\n2026-01-01T00:00:00Z,1\n'
    await writeFile(source, text)
    assert.deepEqual(
      await inspectCsvIdentity(source, FIELDS),
      { ...identity(text), headerMatches: true },
    )
  })
})
