# Agent Notifier Companions — Thin End-to-End Slice Design

## Goal

Let someone discover an animated companion on a public website and install it into
the Agent Notifier macOS app in one click, without writing code.

This is phase 1 of a three-phase product. It deliberately builds one narrow path
all the way through rather than a broad surface that does not connect. Phase 2
adds creator accounts and uploads; phase 3 adds the community surface (likes,
collections, search).

## Why this phase exists

The app cannot currently render anything a creator could make. Both shipped
companions (`butterfly`, `firecracker`) are compiled-in Swift renderers, and a v1
manifest only *selects* already-compiled code. A gallery built before the app can
load packs would distribute files that nothing can install. So the slice covers
both sides: the app learns to render a declarative sprite pack, and the website
learns to serve one.

## Scope

In scope:

- Manifest v2 and pack validation.
- One generic sprite-sequence renderer that plays any valid pack.
- Catalog discovery of installed community packs.
- `agent-notifier://install?url=…` — download, validate, preview, confirm, install.
- A public website: gallery, pack detail pages, install action, seeded packs.

Out of scope for this phase:

- Accounts, uploads, moderation, creator profiles.
- Server-side media conversion. Turning a video or GIF into frames stays a local
  concern; this phase does not build that pipeline either, so seeded packs are
  produced by hand.
- Likes, bookmarks, collections, search, categories, install counts.
- Payments. Signed or cryptographically attributed packs.

## Architecture

Two repositories, one shared contract.

| Repository | Responsibility |
|------------|----------------|
| `agent_notifier` (Swift) | Parse and validate packs, render them, handle the install deep link |
| `agent_notifier_companions` (Next.js) | Host pack files and metadata, present them, trigger installs |

The contract between them is exactly two things: the **pack format** and the
**install URL**. Both are specified below and must change in lockstep.

## Pack format

A pack is a directory whose name ends in `.agentpack`:

```text
Fox.agentpack/
  manifest.json
  checksums.json
  frames/
    frame_001.png
    frame_002.png
    …
```

Distributed as a ZIP containing exactly one such top-level directory. The
directory's name is cosmetic: the installed location is derived from the manifest
`id`, never from the archive, so two packs cannot collide by naming their folders
alike.

### manifest.json (version 2)

```json
{
  "version": 2,
  "id": "community.fox",
  "displayName": "Fox",
  "author": "Jane Doe",
  "summary": "A sleepy fox that pads across the bottom of your screen",
  "symbolName": "pawprint",
  "movementStyle": "grounded",
  "renderer": "sprite",
  "animation": {
    "fps": 18,
    "frameCount": 36,
    "width": 384,
    "height": 384,
    "loop": "forward"
  }
}
```

`version` is the discriminator and reuses the field v1 already has, so no aliasing
is needed. v1 manifests remain valid and continue to describe the two built-ins;
they are not migrated.

Field rules:

- `id` must match `community.<slug>` where slug is 1–40 characters of
  `[a-z0-9-]`, not starting or ending with `-`. Total length ≤ 60. The built-in
  ids `butterfly` and `firecracker` are reserved and rejected.
- `renderer` must be exactly `"sprite"`. A community pack can therefore never
  select compiled built-in code or name a renderer that does not exist.
- `movementStyle` must be `airborne`, `grounded`, or `hovering`. `burst` is
  rejected: it is bound to the compiled firework renderer and is not expressible
  as frames.
- `displayName` ≤ 40 characters, `author` ≤ 60, `summary` ≤ 160. All must be
  non-empty after trimming whitespace, and control characters are stripped.
- `symbolName` is 1–60 characters of `[A-Za-z0-9.]`. It is a display hint only;
  if the system has no such symbol the renderer substitutes a default rather than
  failing the pack.
- `animation.loop` is `forward` or `pingPong`.

### checksums.json

Maps each frame path to its lowercase hex SHA-256:

```json
{ "frames/frame_001.png": "9f86d081…", "frames/frame_002.png": "b1946ac9…" }
```

It covers frames only — a manifest cannot checksum itself. Checksums detect
accidental corruption. They are **not** author identity and are never presented as
a trust signal.

### Frame files

Exactly `frameCount` files, named `frame_NNN.png`, zero-padded to three digits,
numbered from 001 with no gaps. Each must decode as a PNG whose pixel dimensions
equal the declared `width` and `height`.

### Hard limits

| Limit | Value |
|-------|-------|
| Frames | 1–96 |
| Frame dimensions | 16–512 px per side |
| FPS | 1–24 |
| Compressed pack | 50 MB |
| Expanded payload | 120 MB |

These match the limits already specified in the app's earlier companion-pack
design, so the two documents do not disagree.

## App-side changes

### `ButterflyCore` — pure, testable

Add `SpriteSequencePack`: decoding and validation of manifest v2, id rules, bounds
checks, frame-name sequencing, and checksum comparison. No AppKit, no filesystem
assumptions beyond a supplied directory listing, so every rule above is unit
testable without fixtures on disk.

Add `PackInstallLocation` for resolving and validating destination paths.

### `ButterflyRenderer`

Generalize the butterfly's frame loader into one `SpriteSequenceArtwork` driven by
manifest metadata (frame count, fps, dimensions, loop). The butterfly keeps its
existing dedicated path so a regression in generic loading cannot break the
built-in; the firework is untouched.

Community packs inherit existing behavior rather than redefining it: motion
presets reuse the current flight and grounded paths, `hovering` is a bounded local
drift around a safe screen point, and every pack gets multi-display routing,
hover-pause, scroll replanning, Reduce Motion, and accessibility labels for free.
A pack cannot override agent-state semantics — it supplies pixels, not behavior.

### Catalog and application layer

The catalog merges app-bundled manifests with validated packs discovered in:

```text
~/Library/Application Support/Agent Notifier/Companions/<id>/
```

Built-ins sort first, community packs follow by display name. An invalid pack is
omitted and logged, never fatal. A stored selection that no longer resolves falls
back to `butterfly` **without erasing the preference**, so reinstalling the pack
restores the choice.

`Info.plist` gains `agent-notifier` as a second URL scheme. The existing
`butterfly-agent-notifier` scheme stays registered so the installed CLI and any
configured agent hooks keep working.

## Install flow

`agent-notifier://install?url=<percent-encoded https URL>`

1. Reject anything but a single `url` parameter carrying an `https` URL.
2. Download to a freshly created unique temporary directory, aborting past the
   50 MB compressed cap.
3. Expand, enforcing the expanded cap and rejecting absolute paths, parent
   traversal, symlinks and hard links, non-regular files, executable permission
   bits, and any top-level entry other than one `.agentpack` directory.
4. Validate the manifest and checksums, then verify decoded frame dimensions.
5. Present a **live preview** in a confirmation dialog that names the pack, its
   author, and — prominently — the **host the pack came from**.
6. On confirmation, install by atomic same-volume replacement, retaining one
   rollback backup when replacing an existing id.

Nothing is installed without an explicit confirmation. Only PNG and JSON are ever
read; no archive entry is ever executed. While one install is awaiting
confirmation, further install requests are ignored, so a page cannot spam dialogs.

The residual risk is understood and accepted: a hostile page can put an install
prompt on screen. Because validation admits only bounded images and declarative
metadata, the worst outcome of a mistaken confirmation is an unwanted animation
the user can remove — not code execution.

## Website

Next.js (App Router) with TypeScript and Tailwind, statically generated, no
database and no authentication in this phase.

### Content and data

Each pack contributes one metadata file in `content/packs/<id>.json` plus two
assets in `public/packs/<id>/`:

- `preview.webp` — an animated loop used for both the grid and the detail page.
  One asset, no client-side frame cycling to build.
- `pack.zip` — the installable pack.

All reads go through a single `lib/packs.ts` module. That module is the only thing
phase 2 has to replace when the index moves to Supabase; pages stay untouched.

A build-time check fails the build if any pack's metadata, `preview.webp`, or
`pack.zip` is missing, or if the declared id does not match its filename. Broken
packs cannot reach production.

### Pages

- `/` — hero and the pack grid.
- `/c/<id>` — large preview, author, motion and fps metadata, **Install** button
  (the deep link), a copyable CLI command as fallback, and a "don't have the app
  yet?" link to the app's releases.
- `/submit` — an honest "creator uploads are coming" page that documents the pack
  format and links to the app repository. Not a dead form.

### Visual direction

A near-black neutral base with a warm amber primary and a teal secondary accent.
Two reasons: transparent sprite animations read best against a dark canvas, and
warm-on-black is clearly distinct from the blue-on-navy of the site that inspired
this. Deliberately not the default purple/navy.

## Error handling

- Every failure names the stage that failed and what the user can do about it.
- A malformed or oversized download leaves no trace: the temporary directory is
  removed on success, cancellation, and failure alike.
- Validation runs before image decoding wherever metadata allows, then again on
  decoded dimensions.
- An install that fails partway restores the retained backup.
- A pack that becomes invalid after installation disappears from the catalog and
  is reported, rather than crashing the app or blanking the menu.

## Testing

Swift, using Swift Testing:

- Pure unit tests for every manifest rule: version discrimination, id grammar,
  reserved ids, rejected renderer and movement values, field bounds, control-
  character stripping, frame sequencing, loop modes, and checksum comparison.
- Adversarial archive tests: path traversal, absolute paths, symlinks and hard
  links, executable bits, extra top-level entries, oversized declared and actual
  dimensions, frame-count mismatch, corrupt PNG, checksum mismatch.
- Catalog tests: built-in ordering, discovery, invalid-pack omission,
  unresolved-selection fallback that preserves the preference.
- Renderer tests: playback at several fps values, both loop modes, each motion
  preset, Reduce Motion.
- Install tests: cancellation leaves installed packs unchanged, replacement keeps
  a rollback backup, concurrent requests are ignored.

Web, using Vitest:

- `lib/packs.ts` parsing and validation, including rejection of malformed content
  files.
- The asset-completeness build check, proven by a fixture that is missing an
  asset.

Verification before any completion claim: `swift build -c release`, the Swift test
suite, the web build and test run, and one real end-to-end pass — click Install on
a locally served site and confirm the pack previews, installs, appears in the menu,
and animates.

## Delivery order

1. Manifest v2 and pack validation in `ButterflyCore` (pure, TDD).
2. `SpriteSequenceArtwork` and catalog discovery of installed packs.
3. Install pipeline and the `agent-notifier://install` deep link.
4. Website data layer, pages, and visual design.
5. Seed packs, then end-to-end verification.

Steps 1–3 are Swift and land in `agent_notifier`. Step 4 is the new repository.
Step 5 spans both and is the acceptance gate for the phase.

Because the two halves live in different repositories and share only the contract
above, this spec produces **two implementation plans** — one for the app-side pack
support, one for the website — executed in that order. Step 5 belongs to whichever
plan finishes second.
