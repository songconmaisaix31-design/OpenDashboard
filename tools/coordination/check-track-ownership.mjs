/**
 * Directory-ownership gate for the four parallel H2 Sentinel tracks.
 *
 * The execution plan splits work by directory ownership rather than by feature,
 * so that two tracks never edit the same file. That guarantee was documented in
 * prose only, which means a violation would surface at integration time -- the
 * most expensive moment to discover it. This script checks it mechanically, as
 * soon as a track commits.
 *
 * For each track branch it lists the files changed since the Wave 0 base and
 * asserts every one of them is owned by that track. It also refuses paths that
 * must never enter the repository at all: official competition data, trained
 * model artifacts, and credential files.
 *
 * Usage:
 *   node tools/coordination/check-track-ownership.mjs
 *   node tools/coordination/check-track-ownership.mjs --base <sha>
 *   node tools/coordination/check-track-ownership.mjs --branch h2/track-a-detect
 *
 * Exits non-zero when any track has written outside its own paths.
 */

import { execFileSync } from 'node:child_process'

/** Wave 0 tip. Every track branched from here, so this is the diff base. */
const DEFAULT_BASE = '09ed2a3'

/**
 * A pattern ending in `/**` matches that prefix; anything else is an exact
 * path. Kept deliberately simple -- the ownership table uses only these two
 * shapes, and a real glob engine would invite patterns nobody can audit.
 */
const OWNERSHIP = {
  'h2/track-a-detect': [
    'services/h2-analytics/src/h2_analytics/detection/**',
    'services/h2-analytics/src/h2_analytics/impact/**',
    'services/h2-analytics/src/h2_analytics/events/**',
    'services/h2-analytics/tests/test_detection_pipeline.py',
    'services/h2-analytics/tests/test_impact.py',
    'services/h2-analytics/training/**',
  ],
  'h2/track-b-evidence': [
    'services/h2-analytics/src/h2_analytics/diagnosis/**',
    'services/h2-analytics/src/h2_analytics/safety/**',
    'services/h2-analytics/src/h2_analytics/assistant/**',
    'services/h2-analytics/src/h2_analytics/reports/**',
    'services/h2-analytics/src/h2_analytics/evidence.py',
    'services/h2-analytics/tests/test_assistant_reports.py',
    'services/h2-analytics/tests/test_safety.py',
  ],
  'h2/track-c-web': [
    'apps/web/src/features/h2-sentinel/**',
    'packages/h2-contracts/src/**',
    'packages/h2-contracts/test/**',
    'plugins/h2-ems/**',
  ],
  'h2/track-d-qa': [
    'validation/**',
    'tests/h2-sentinel/**',
    'scripts/h2-sentinel/**',
    'submission/h2-sentinel/**',
    'docs/competition/**',
  ],
}

/**
 * Paths that must never be committed by anyone. Official pack data is read-only
 * and large; model artifacts are regenerable and would make the repository the
 * source of a trained answer, which the requirements forbid for the blind test
 * set.
 */
const NEVER_COMMIT = [
  /(^|\/)\.env($|\.)/,
  /(^|\/)models\//,
  /(^|\/)(credentials|secrets)\.(json|ya?ml|txt)$/i,
  // Official pack CSVs keep their numeric prefix wherever they are copied to,
  // so match on the basename rather than anchoring at the repository root: a
  // copy into a nested data/ directory is exactly the case worth catching.
  /(^|\/)(0[1-9]|1[0-9])_[^/]*\.csv$/,
  /数据与材料/,
]

function matches(path, pattern) {
  return pattern.endsWith('/**')
    ? path.startsWith(pattern.slice(0, -2))
    : path === pattern
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function branchExists(branch) {
  try {
    git(['rev-parse', '--verify', '--quiet', branch])
    return true
  } catch {
    return false
  }
}

function changedFiles(base, branch) {
  const out = git(['diff', '--name-only', `${base}...${branch}`])
  return out === '' ? [] : out.split('\n').filter(Boolean)
}

function main() {
  const argv = process.argv.slice(2)
  const readFlag = (name, fallback) => {
    const index = argv.indexOf(name)
    return index === -1 ? fallback : argv[index + 1]
  }
  const base = readFlag('--base', DEFAULT_BASE)
  const only = readFlag('--branch', undefined)

  const branches = only ? [only] : Object.keys(OWNERSHIP)
  let failures = 0

  for (const branch of branches) {
    const owned = OWNERSHIP[branch]
    if (!owned) {
      console.log(`FAIL ${branch} — not a known track branch`)
      failures += 1
      continue
    }
    if (!branchExists(branch)) {
      console.log(`SKIP ${branch} — branch does not exist yet`)
      continue
    }

    const files = changedFiles(base, branch)
    const trespass = files.filter((file) => !owned.some((p) => matches(file, p)))
    const forbidden = files.filter((file) =>
      NEVER_COMMIT.some((pattern) => pattern.test(file)),
    )

    if (trespass.length === 0 && forbidden.length === 0) {
      console.log(`PASS ${branch} — ${files.length} changed file(s), all owned`)
      continue
    }
    failures += 1
    console.log(`FAIL ${branch} — ${files.length} changed file(s)`)
    for (const file of trespass) {
      console.log(`  outside ownership: ${file}`)
    }
    for (const file of forbidden) {
      console.log(`  must never be committed: ${file}`)
    }
  }

  console.log(
    `SUMMARY base=${base} branches=${branches.length} violations=${failures}`,
  )
  process.exitCode = failures === 0 ? 0 : 1
}

main()
