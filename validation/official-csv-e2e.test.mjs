import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  inspectCsvIdentity,
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

function depsFor({ rawText = 'timestamp,power_kw\n2026-01-01T00:00:00Z,1\n', events, check = { valid: true } } = {}) {
  const calls = []
  const source = {
    async importCsv(input) {
      calls.push(['import', input.filename])
      if (events?.import) throw new Error('import body must not be recorded')
      return { dataset: { datasetId: 'dataset-1' } }
    },
    async runAnalysis(datasetId) {
      calls.push(['analysis', datasetId])
      if (events?.analysis) throw new Error('analysis body must not be recorded')
      return { runId: 'run-1' }
    },
    async exportSubmission(runId) {
      calls.push(['export', runId])
      if (events?.export) throw new Error('export body must not be recorded')
      return { content: 'header\n', mediaType: 'text/csv' }
    },
  }
  const normalizedText = rawText
  let stopped = 0
  let nextPort = 4100
  return {
    calls,
    stopped: () => stopped,
    rawText,
    normalizedText,
    expected: { raw: identity(rawText), normalized: identity(normalizedText) },
    deps: {
      getHead: async () => EXPECTED_COMMIT,
      readFile: async () => rawText,
      inspectRaw: async () => identity(rawText),
      normalize: () => normalizedText,
      inspectNormalized: async () => identity(normalizedText),
      officialFields: FIELDS,
      totalMemoryBytes: () => 8 * 1024 ** 3,
      freeLoopbackPort: async () => nextPort++,
      startLauncher: async (options) => {
        calls.push(['start', options])
        if (events?.start) throw new Error('launcher output must not be recorded')
        return {
          ready: { webUrl: 'http://127.0.0.1:4100/' },
          stop: async () => {
            stopped += 1
            if (events?.cleanup) throw new Error('cleanup output must not be recorded')
          },
        }
      },
      createLiveDataSource: (options) => {
        calls.push(['source', options])
        if (events?.source) throw new Error('source output must not be recorded')
        return source
      },
      checkSubmission: () => check,
      getResources: () => ({ rssBytes: 123, resourceUsage: { maxRSS: 456 } }),
    },
  }
}

async function runFixture(directory, fixture, overrides = {}) {
  return runOfficialCsvE2e({
    rawPath: join(directory, 'not-reported.csv'),
    expectedCommit: EXPECTED_COMMIT,
    runId: 'synthetic-run',
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
      runId: 'synthetic-run',
      outputRoot: join(directory, 'reports'),
      expected: fixture.expected,
      dependencies: fixture.deps,
    })
    assert.equal(result.status, 'failed')
    assert.equal(result.errorCode, 'E_COMMIT_MISMATCH')
    assert.deepEqual(fixture.calls, [])
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
      'start', 'source', 'import', 'analysis', 'export',
    ])
    assert.deepEqual(fixture.calls[0][1], { mode: 'local', webPort: 4100, analyticsPort: 4101 })
    assert.deepEqual(fixture.calls[1][1], {
      enabled: true,
      baseUrl: 'http://127.0.0.1:4100/',
      timeoutMs: 30_000,
    })
    assert.equal(fixture.stopped(), 1)
  })
})

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
