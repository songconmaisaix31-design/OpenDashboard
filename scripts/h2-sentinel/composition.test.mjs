import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const mainSourceUrl = new URL('../../apps/web/src/main.tsx', import.meta.url)
const liveDataSourceUrl = new URL(
  '../../plugins/h2-ems/src/live-data-source.ts',
  import.meta.url,
)
const vercelConfigUrl = new URL('../../vercel.json', import.meta.url)

const readVercelConfig = async () =>
  JSON.parse(await readFile(vercelConfigUrl, 'utf8'))

test('keeps the exact temporary root redirect and H2 SPA rewrites', async () => {
  const config = await readVercelConfig()

  assert.deepEqual(config.redirects, [
    {
      source: '/',
      destination: '/h2-sentinel/?mode=fixture',
      permanent: false,
    },
  ])
  assert.deepEqual(config.rewrites, [
    { source: '/h2-sentinel', destination: '/index.html' },
    { source: '/h2-sentinel/', destination: '/index.html' },
  ])
})

test('does not publish an H2 API, function, remote origin, or catch-all', async () => {
  const config = await readVercelConfig()
  const rules = [...config.redirects, ...config.rewrites]

  assert.equal(Object.hasOwn(config, 'functions'), false)
  assert.equal(Object.hasOwn(config, 'routes'), false)
  assert.doesNotMatch(JSON.stringify(config), /\/api\/v1\/h2-sentinel/)
  assert.equal(rules.some(({ source }) => /[()*:]/.test(source)), false)
  assert.equal(
    rules.some(({ destination }) => !/^\/(?!\/)/.test(destination)),
    false,
  )
})

test('keeps H2 entry parsing inside the rejected bootstrap promise', async () => {
  const source = await readFile(mainSourceUrl, 'utf8')
  assert.match(source, /const bootstrap = async \(\): Promise<void> =>/)
  assert.match(source, /const entry = readApplicationEntry\(window\.location\)/)
  assert.match(source, /void bootstrap\(\)\.catch\(\(\) =>/)
})

test('keeps the explicit path and mode vocabulary closed', async () => {
  const source = await readFile(mainSourceUrl, 'utf8')
  assert.match(
    source,
    /new Set\(\['\/h2-sentinel', '\/h2-sentinel\/'\]\)/,
  )
  assert.match(source, /mode !== 'fixture' && mode !== 'local'/)
  assert.match(source, /key !== 'mode'/)
})

test('keeps Fixture selection and gives the local H2 adapter a bounded timeout', async () => {
  const source = await readFile(mainSourceUrl, 'utf8')
  assert.match(
    source,
    /mode\s*===\s*'fixture'\s*\?\s*h2EmsPlugin\s*:\s*createH2EmsPlugin\(\s*\{\s*enabled\s*:\s*true\s*,\s*baseUrl\s*:\s*window\.location\.origin\s*,\s*timeoutMs\s*:\s*30_000\s*,?\s*\}\s*\)/s,
  )
})

test('keeps the Local adapter behind the literal-loopback guard', async () => {
  const source = await readFile(liveDataSourceUrl, 'utf8')
  assert.match(
    source,
    /const baseUrl = validateLoopbackUrl\(options\.baseUrl\)/,
  )
  assert.match(
    source,
    /host !== '127\.0\.0\.1' && host !== '\[::1\]' && host !== '::1'/,
  )
})
