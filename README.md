# n8n-nodes-blueveta-upright

An n8n community node for [BlueVetaUpright](https://blueveta.com/upright) — detects whether a
product photo is sideways or upside-down, and can hand back the photo already fixed.

BYOK (bring your own key): this node calls BlueVetaUpright's real, paid API using your OWN
API key, the same way the direct REST API and the official MCP server both work. Get a key at
[blueveta.com/upright](https://blueveta.com/upright) — pay-as-you-go, no subscription.

## Real status (2026-11-08)

**Published and live on npm — `n8n-nodes-blueveta-upright@0.1.0`.** Built and unit-tested
(`npm test`, `src/detectCore.test.mjs`, 8/8 passing). Lives in its own real public repo
(`github.com/Tomerbarm/n8n-nodes-blueveta-upright`, MIT-licensed, matches n8n's own verification
requirement that the main private `blueveta-app` repo couldn't satisfy).

Real next step, not yet done: running `npx @n8n/scan-community-package n8n-nodes-blueveta-upright`
and submitting for n8n's own verification review via their community forum/GitHub process, for
listing in n8n's official community-node directory.

## Install

```bash
npm install n8n-nodes-blueveta-upright
```

Then add it to n8n's `N8N_CUSTOM_EXTENSIONS` or install via the n8n UI's Community Nodes panel.

## Development

```bash
npm test     # runs the real, dependency-free core-logic tests (no n8n install needed)
npm run build  # compiles the TypeScript node/credential files (needs n8n-workflow as a peer dep)
```
