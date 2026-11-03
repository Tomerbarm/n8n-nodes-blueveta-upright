// Pure, SDK-free core of the n8n node's one real action -- separated from the
// n8n-specific node/credential wiring so the real HTTP logic is testable with
// plain node, same pattern as mcp-server/src/detectRotation.js and
// apify-actor/src/handleDetection.js.
//
// Unlike the Apify Actor (which BlueVeta's own backend absorbs the cost for and
// bills via Apify's marketplace), an n8n workflow runs under the END USER's own
// n8n instance -- there is no marketplace billing layer here. This node is BYOK:
// it calls BlueVetaUpright's real paid API using the user's OWN API key (set as
// an n8n credential), exactly the same BYOK pattern already used by the MCP
// server. n8n's own user base (workflow/automation builders) discovers and uses
// the tool for free from n8n's side; BlueVeta earns the same way it already
// does on the direct API -- the user's own existing pack/credit balance.

export const DETECT_URL = 'https://blueveta.com/api/upright/detect'

/**
 * @param {object} input
 * @param {string} [input.imageUrl] - mutually exclusive with imageBase64
 * @param {string} [input.imageBase64]
 * @param {string} [input.imageMimeType] - required with imageBase64
 * @param {boolean} [input.returnImage]
 * @param {object} deps
 * @param {typeof fetch} deps.fetchImpl
 * @param {string} deps.apiKey - the n8n user's OWN BlueVetaUpright API key (BYOK)
 * @param {string} [deps.detectUrl] - overrides DETECT_URL (tests only)
 * @returns {Promise<{status: number, body: object}>}
 */
export async function detectRotation(input, deps) {
  const { fetchImpl, apiKey } = deps
  const detectUrl = deps.detectUrl ?? DETECT_URL
  const returnImage = input?.returnImage === true

  if (!apiKey) {
    return { status: 401, body: { error: 'missing_api_key' } }
  }

  let bodyBytes
  let contentType
  if (input?.imageUrl) {
    const sourceResp = await fetchImpl(input.imageUrl)
    if (!sourceResp.ok) {
      return { status: 400, body: { error: 'could_not_fetch_image_url', status: sourceResp.status } }
    }
    contentType = sourceResp.headers.get('content-type') ?? 'image/jpeg'
    bodyBytes = Buffer.from(await sourceResp.arrayBuffer())
  } else if (input?.imageBase64) {
    if (!input.imageMimeType) {
      return { status: 400, body: { error: 'missing_image_mime_type' } }
    }
    contentType = input.imageMimeType
    bodyBytes = Buffer.from(input.imageBase64, 'base64')
  } else {
    return { status: 400, body: { error: 'missing_image_input' } }
  }

  const target = new URL(detectUrl)
  if (returnImage) target.searchParams.set('returnImage', 'true')

  let resp
  try {
    resp = await fetchImpl(target, {
      method: 'POST',
      headers: {
        'content-type': contentType,
        authorization: `Bearer ${apiKey}`,
      },
      body: bodyBytes,
    })
  } catch (err) {
    return { status: 502, body: { error: 'upstream_failed', detail: String(err?.message ?? err) } }
  }

  const data = await resp.json()
  return { status: resp.status, body: data }
}
