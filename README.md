# Agent Notifier Companions

The public gallery of animated companions for the
[Agent Notifier](https://github.com/Gakshith/agent-notifier) macOS app. Browse a
companion, press install, and it appears over your work the next time your coding
agent finishes, needs you, or fails.

Companions are **images and metadata only** — never executable code.

## Development

```bash
npm install
npm run dev
```

- `npm test` — unit tests
- `npm run build` — verifies every pack has its assets, then exports the static site
- `NEXT_PUBLIC_SITE_ORIGIN=https://your-domain npm run build` — production build; one-click
  install requires this to be set to an `https` origin, and omitting it produces
  `localhost` install links
- `node scripts/make-seed-pack.mjs <orb|ring|comet>` — regenerates a seed pack

Requires the `zip` and `img2webp` binaries for pack generation only; the site itself
builds without them.

## Layout

| Path | Contents |
|------|----------|
| `content/packs/<id>.json` | Pack metadata, identical to the pack's `manifest.json` |
| `public/packs/<id>/` | `preview.webp` and `pack.zip` |
| `src/lib/packs.ts` | The only module that reads pack data |
| `docs/pack-format.md` | The pack format |

## Status

Phase 1: browse and install. Creator uploads are not open yet — see `/submit`.
One-click install requires Agent Notifier 0.2 or newer, which is in development.
