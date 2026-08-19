import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createLiveH2EmsDataSource, H2EmsAdapterError } from '../src/index.ts'

describe('H2 EMS remote response validation', () => {
  it('rejects malformed data and never exposes raw response text', async () => {
    const source = createLiveH2EmsDataSource({
      enabled: true,
      baseUrl: 'http://127.0.0.1:8123/',
      fetchFn: async () => Response.json({ invalid: 'password=not-for-ui' }),
    })
    await assert.rejects(
      () => source.getMode(),
      (error: unknown) =>
        error instanceof H2EmsAdapterError &&
        error.code === 'remote_response_invalid' &&
        !error.message.includes('password'),
    )
  })
})
