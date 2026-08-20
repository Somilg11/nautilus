# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through
[GitHub Security Advisories](https://github.com/Somilg11/nautilus/security/advisories/new),
or email the maintainer listed on the GitHub profile. Include reproduction steps
and, where relevant, the diagram JSON or share link that triggers the issue.

Expect an acknowledgement within a few days. Fixes for confirmed issues are
released as soon as practical, and we're happy to credit you in the release
notes.

## Supported versions

Only `main` is supported. Please upgrade before reporting.

## Threat model

Nautilus is a client-only application. There is no backend, no database and no
account system — every diagram and every API key stays in the visitor's browser.
The consequences:

| Asset | Where it lives | Protected by |
| --- | --- | --- |
| Diagrams | `localStorage` + exported JSON | Same-origin policy |
| AI provider API keys | `localStorage` | Same-origin policy + a strict CSP |
| Share links | The URL itself | Nothing — treat as unlisted, not private |

Because API keys sit in `localStorage`, **any script execution on the app's
origin is a key-disclosure bug.** We take XSS, CSP weakening and untrusted-input
handling seriously in this project even though there is no server to attack.

In scope:

- Any path to executing script on the origin (XSS via imported JSON, share
  links, AI output, node labels, filenames…).
- Weaknesses in the Content-Security-Policy or other response headers set in
  `next.config.ts`.
- Bypasses of the diagram validation in `src/lib/diagram-io.ts`.
- Dependency vulnerabilities that are reachable from the app.

Out of scope:

- Reading your own `localStorage` from your own devtools.
- Share links being readable by whoever holds the link — that is the documented
  design.
- Social-engineering a user into pasting an API key into a fork you control.
- Provider-side issues (OpenAI, Google, Anthropic, Groq).

## Hardening already in place

- Strict `Content-Security-Policy`: scripts from `'self'` only, and
  `connect-src` limited to the four AI provider hosts.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
  `Strict-Transport-Security`.
- All externally-sourced diagrams (import, share link, `localStorage`, AI
  output) are validated and stripped to known fields before rendering.
- API keys are sent only to the provider the user selected, over HTTPS, and are
  never logged or transmitted anywhere else.
- `npm audit` is enforced in CI.
