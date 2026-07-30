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
- `loop` is `forward` or `pingPong`.

## Limits

| Limit | Value |
|-------|-------|
| Frames | 1–96 |
| Frame size | 16–512 px per side |
| Frame rate | 1–24 fps |
| Compressed pack | 50 MB |

## checksums.json

Maps each frame path to its SHA-256, which detects corrupted downloads. It is not
an identity or trust signal.

```json
{ "frames/frame_001.png": "9f86d081…" }
```

## Frames

Exactly `frameCount` PNG files named `frame_NNN.png`, numbered from 001 with no
gaps, each matching the declared width and height. Transparency is preserved.
