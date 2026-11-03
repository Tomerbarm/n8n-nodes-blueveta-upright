# n8n-nodes-blueveta-upright

An n8n community node for [BlueVetaUpright](https://blueveta.com/upright) — detects whether a
product photo is sideways or upside-down, and can hand back the photo already fixed.

BYOK (bring your own key): this node calls BlueVetaUpright's real, paid API using your OWN
API key, the same way the direct REST API and the official MCP server both work. Get a key at
[blueveta.com/upright](https://blueveta.com/upright) — pay-as-you-go, no subscription.

## Real status (2026-11-03)

Built and unit-tested (`npm test`, `src/detectCore.test.mjs`, 8/8 passing). Now lives in its own
real public repo (`github.com/Tomerbarm/n8n-nodes-blueveta-upright`, MIT-licensed, matches n8n's
own verification requirement that the main private `blueveta-app` repo couldn't satisfy), with a
`.github/workflows/publish.yml` ready to publish with npm provenance on every GitHub Release.

**Still genuinely blocked on two things only Tomer can do:**

1. **npm's own 2FA at publish time** — `npm whoami` confirms the `blueveta-upright` account is
   logged in, but `npm publish` itself asks for a fresh one-time code from Tomer's own device,
   separate from the login OTP. A manual publish needs him there once.
2. **Linking npm's "Trusted Publisher" OIDC setting** (on npmjs.com, under this package's own
   settings) to this exact repo + the `publish.yml` workflow above — this is what lets the
   GitHub Action publish with provenance with NO stored npm token, which is what n8n's
   verification guidelines actually want. This is a one-time setup step inside the npm account
   itself, which needs Tomer logged in to do.

Once either path completes a first real publish, the remaining real step is running
`npx @n8n/scan-community-package n8n-nodes-blueveta-upright` and submitting for n8n's own
verification review via their community forum/GitHub process.

## Install (once published)

```bash
npm install n8n-nodes-blueveta-upright
```

Then add it to n8n's `N8N_CUSTOM_EXTENSIONS` or install via the n8n UI's Community Nodes panel.

## Development

```bash
npm test     # runs the real, dependency-free core-logic tests (no n8n install needed)
npm run build  # compiles the TypeScript node/credential files (needs n8n-workflow as a peer dep)
```
