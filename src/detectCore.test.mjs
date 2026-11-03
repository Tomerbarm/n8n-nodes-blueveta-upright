import assert from 'node:assert/strict'
import { test } from 'node:test'
import { detectRotation } from './detectCore.js'

function fakeFetch(responses) {
  let i = 0
  return async (url, opts) => {
    const resp = responses[i]
    i += 1
    return resp(url, opts)
  }
}

test('missing API key returns 401 without calling fetch', async () => {
  let called = false
  const result = await detectRotation(
    { imageBase64: 'AA==', imageMimeType: 'image/jpeg' },
    { fetchImpl: async () => { called = true }, apiKey: '' }
  )
  assert.equal(result.status, 401)
  assert.equal(result.body.error, 'missing_api_key')
  assert.equal(called, false)
})

test('no image input returns 400', async () => {
  const result = await detectRotation({}, { fetchImpl: async () => {}, apiKey: 'bvu_live_x' })
  assert.equal(result.status, 400)
  assert.equal(result.body.error, 'missing_image_input')
})

test('imageBase64 without mime type returns 400', async () => {
  const result = await detectRotation(
    { imageBase64: 'AA==' },
    { fetchImpl: async () => {}, apiKey: 'bvu_live_x' }
  )
  assert.equal(result.status, 400)
  assert.equal(result.body.error, 'missing_image_mime_type')
})

test('imageBase64 input posts to detectUrl with Bearer auth and correct content-type', async () => {
  let capturedUrl, capturedOpts
  const fetchImpl = async (url, opts) => {
    capturedUrl = url
    capturedOpts = opts
    return { ok: true, status: 200, json: async () => ({ wasAlreadyUpright: true }) }
  }
  const result = await detectRotation(
    { imageBase64: 'AA==', imageMimeType: 'image/png' },
    { fetchImpl, apiKey: 'bvu_live_x', detectUrl: 'https://example.test/detect' }
  )
  assert.equal(result.status, 200)
  assert.deepEqual(result.body, { wasAlreadyUpright: true })
  assert.equal(String(capturedUrl), 'https://example.test/detect')
  assert.equal(capturedOpts.headers['content-type'], 'image/png')
  assert.equal(capturedOpts.headers.authorization, 'Bearer bvu_live_x')
})

test('returnImage=true appends the query param', async () => {
  let capturedUrl
  const fetchImpl = async (url) => {
    capturedUrl = url
    return { ok: true, status: 200, json: async () => ({}) }
  }
  await detectRotation(
    { imageBase64: 'AA==', imageMimeType: 'image/jpeg', returnImage: true },
    { fetchImpl, apiKey: 'bvu_live_x', detectUrl: 'https://example.test/detect' }
  )
  assert.equal(new URL(String(capturedUrl)).searchParams.get('returnImage'), 'true')
})

test('imageUrl input fetches the source first, then posts its bytes', async () => {
  const calls = []
  const fetchImpl = fakeFetch([
    async () => {
      calls.push('source')
      return {
        ok: true,
        headers: { get: () => 'image/webp' },
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      }
    },
    async (url, opts) => {
      calls.push('upstream')
      return { ok: true, status: 200, json: async () => ({ ok: true, _opts: opts }) }
    },
  ])
  const result = await detectRotation(
    { imageUrl: 'https://photos.test/a.webp' },
    { fetchImpl, apiKey: 'bvu_live_x', detectUrl: 'https://example.test/detect' }
  )
  assert.deepEqual(calls, ['source', 'upstream'])
  assert.equal(result.status, 200)
  assert.equal(result.body._opts.headers['content-type'], 'image/webp')
})

test('a failed source-image fetch returns 400 without calling the upstream API', async () => {
  let upstreamCalled = false
  const fetchImpl = fakeFetch([
    async () => ({ ok: false, status: 404 }),
    async () => { upstreamCalled = true },
  ])
  const result = await detectRotation(
    { imageUrl: 'https://photos.test/missing.jpg' },
    { fetchImpl, apiKey: 'bvu_live_x' }
  )
  assert.equal(result.status, 400)
  assert.equal(result.body.error, 'could_not_fetch_image_url')
  assert.equal(upstreamCalled, false)
})

test('a network-level failure calling the upstream API returns 502', async () => {
  const fetchImpl = async () => { throw new Error('ECONNRESET') }
  const result = await detectRotation(
    { imageBase64: 'AA==', imageMimeType: 'image/jpeg' },
    { fetchImpl, apiKey: 'bvu_live_x' }
  )
  assert.equal(result.status, 502)
  assert.equal(result.body.error, 'upstream_failed')
})
