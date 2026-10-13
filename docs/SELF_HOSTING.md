# Self-Hosting Nautilus

Nautilus is a static-friendly Next.js app with **no database, no backend
services and no environment variables**. Everything — diagrams, undo history,
API keys — lives in the visitor's browser. That makes hosting it about as simple
as web apps get.

- [Requirements](#requirements)
- [Run it locally](#run-it-locally)
- [Deploy to Vercel](#deploy-to-vercel)
- [Deploy to any Node host](#deploy-to-any-node-host)
- [Docker](#docker)
- [Static export](#static-export)
- [Hosting behind a path or subdomain](#hosting-behind-a-path-or-subdomain)
- [Security notes for operators](#security-notes-for-operators)
- [Upgrading](#upgrading)
- [Troubleshooting](#troubleshooting)

---

## Requirements

- **Node.js 20 or newer** (Next.js 16 requires it)
- npm (or pnpm/yarn — lockfile is npm)
- ~400 MB disk for `node_modules`

No API keys are needed to run Nautilus. AI features are optional and use a key
each user pastes into the app at runtime.

## Run it locally

```bash
git clone https://github.com/Somilg11/nautilus.git
cd nautilus
npm install
npm run build
npm start           # http://localhost:3000
```

For development use `npm run dev` instead of `build` + `start`.

Always build with **`npm run build`**, not a bare `next build`. The script runs
one extra step afterwards that pins the Content-Security-Policy to the hashes of
the inline scripts the build produced; without it the app still works, but with
a looser policy that allows any inline script.

## Deploy to Vercel

The zero-config path:

1. Fork the repository.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Framework preset: **Next.js**. Build command `npm run build`, output
   `.next`. No environment variables.
4. Deploy.

Pushes to `main` redeploy automatically.

## Deploy to any Node host

Railway, Render, Fly.io, a VPS — anything that can run Node 20:

```bash
npm ci
npm run build
npm start -- --port 3000
```

Behind nginx/Caddy, proxy to that port and terminate TLS at the proxy. Nautilus
sends `Strict-Transport-Security`, so serve it over HTTPS.

Minimal nginx block:

```nginx
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

Do not strip the app's response headers — the Content-Security-Policy it sets is
what keeps a script injected into the page from reading visitors' API keys.

## Docker

There is no Dockerfile in the repo yet (a PR adding one is welcome). This one
works today:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t nautilus .
docker run -p 3000:3000 nautilus
```

## Static export

Every route is prerendered as static content and there are no server actions or
route handlers, so Nautilus can also be served as plain files:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // `headers()` does not apply to a static export — see the note below.
}
```

```bash
npm run build      # emits ./out
```

Then serve `out/` from S3 + CloudFront, GitHub Pages, Netlify, Cloudflare Pages,
or any static host.

> **Important:** a static export cannot send the security headers configured in
> `next.config.ts`. Re-create them at the CDN/host layer (CloudFront response
> headers policy, Netlify `_headers`, Cloudflare Transform Rules). Losing the
> CSP on a build where visitors store API keys is a real downgrade, not a
> cosmetic one. Copy the policy from a response of a normal build
> (`npm run build && npm start`, then `curl -sI localhost:3000 | grep -i
> content-security`), not from `next.config.ts` — the served one carries the
> script hashes, and they change with every build.

## Hosting behind a path or subdomain

To serve from `https://example.com/nautilus`:

```ts
const nextConfig: NextConfig = {
  basePath: "/nautilus",
  assetPrefix: "/nautilus",
}
```

Share links embed `window.location.origin` at generation time, so links created
before a domain change will point at the old host.

## Security notes for operators

Nautilus is a single-origin, client-only app. The security model follows from
that:

1. **API keys live in `localStorage` on your origin.** Any script that executes
   on your deployment can read them. This is why the app ships a
   Content-Security-Policy that allows no third-party script origins and
   network calls only to the four AI provider hosts. Don't loosen it to add analytics or
   an embed widget without understanding that trade-off; if you must, add the
   specific host rather than a wildcard.
2. **Serve over HTTPS.** `Strict-Transport-Security` is sent on every response.
3. **Share links carry the entire diagram in the URL.** They are unlisted, not
   private — anyone with the link (or your access logs, or a referrer header)
   has the diagram. Don't share internal architecture this way.
4. **Imported files and share links are untrusted input.** Nautilus validates
   both (`src/lib/diagram-io.ts`) and drops anything it doesn't recognise, so a
   hand-crafted payload cannot inject arbitrary props into the canvas.
5. **No telemetry.** Nautilus makes no network calls of its own; the only
   outbound requests are the AI calls a user explicitly triggers. Simulations
   run in a Web Worker in the visitor's browser and never reach your host — a
   thousand people running the load playground cost you nothing but the
   static files.
6. **Keep `worker-src 'self' blob:` if you rewrite the policy.** Without it the
   load playground falls back to running on the page's main thread; it still
   works, but large diagrams will stutter while it runs.
7. **Keep dependencies patched.** `npm audit --omit=dev` should report zero
   vulnerabilities; CI runs it on every push.

If you deploy Nautilus for a team, consider disabling the AI panel entirely
(remove the provider hosts from `connect-src` and hide the Settings tab) so keys
are never entered on a shared origin in the first place.

## Upgrading

```bash
git pull origin main
npm install
npm run build
```

Diagrams are stored in `localStorage` under `nautilus-canvas-v1` and are
forward-compatible: unknown fields are dropped on load rather than crashing the
canvas. Exported JSON from any version imports cleanly.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `npm install` fails on peer deps | You're on Node < 20, or an old lockfile. Delete `node_modules` and `package-lock.json`, then `npm install` on Node 20+. |
| Canvas renders but nodes are unstyled | `reactflow/dist/style.css` import missing from `src/components/canvas.tsx`. |
| AI request fails with a CORS error | The provider host isn't in `connect-src` in `next.config.ts`, or your CDN is stripping/overriding the CSP. |
| Claude requests fail from the browser | The request must send `anthropic-dangerous-direct-browser-access: true`; it is set in `src/lib/ai-client.ts`. |
| Blank page after deploy behind a path | `basePath`/`assetPrefix` not set — see above. |
| Load playground shows "In-page" instead of "Web Worker" | The worker script was blocked — usually a rewritten CSP missing `worker-src 'self' blob:`, or a CDN serving the worker chunk with the wrong MIME type. |
| Blank page, console says an inline script violates `script-src` | The HTML and the policy come from different builds — typically a CDN caching pages across a deploy, or a hand-copied policy with stale hashes. Purge the cache, or re-copy the policy from the new build. |
| Diagram vanished | `localStorage` was cleared (private window, browser cleanup, different origin). Autosave is not a backup; export JSON. |
