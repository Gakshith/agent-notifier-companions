# Companion pack format

A companion pack is images and metadata. It never contains executable code.

```text
PulseOrb.agentpack/
  manifest.json
  checksums.json
  frames/
    frame_001.png
    frame_002.png
```

Distributed as a ZIP holding exactly one `.agentpack` directory.

## manifest.json

```json
{
  "version": 2,
  "id": "community.pulse-orb",
  "displayName": "Pulse Orb",
  "author": "Your Name",
  "summary": "One sentence describing the companion",
  "symbolName": "circle.fill",
  "movementStyle": "airborne",
  "renderer": "sprite",
  "animation": {
    "fps": 12,
    "frameCount": 24,
    "width": 256,
    "height": 256,
    "loop": "forward"
  }
}
```

- `id` must be `community.<slug>`; the slug is 1–40 characters of lowercase letters,
  digits, and hyphens, and cannot start or end with a hyphen.
- `movementStyle` is `airborne`, `grounded`, or `hovering`.
- `renderer` must be exactly `"sprite"`.
- `loop` is `forward` or `pingPong`.
- `displayName`, `author`, `summary`, and `symbolName` must all be non-empty after
  trimming whitespace.
- `symbolName` may contain only letters, digits, and dots (`[A-Za-z0-9.]`).

## Limits

| Limit | Value |
|-------|-------|
| Frames | 1–96 |
| Frame size | 16–512 px per side |
| Frame rate | 1–24 fps |
| Compressed pack | 50 MB |
| `displayName` length | at most 40 characters |
| `author` length | at most 60 characters |
| `summary` length | at most 160 characters |
| `symbolName` length | at most 60 characters |

## checksums.json

Maps each frame path to its SHA-256, which detects corrupted downloads. It is not
an identity or trust signal.

```json
{ "frames/frame_001.png": "9f86d081…" }
```

## Frames

Exactly `frameCount` PNG files named `frame_NNN.png`, numbered from 001 with no
gaps, each matching the declared width and height. Transparency is preserved.
