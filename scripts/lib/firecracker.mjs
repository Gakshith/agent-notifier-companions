// Pure simulation of the macOS app's procedural firework companion. Mirrors
// `FireworkNode` in Sources/ButterflyRenderer/FireworkArtwork.swift (the
// agent_notifier repo) -- comet launch, soft halo flash, white core, radial
// sparks with gravity/fade, willow and sputter variants, grand finale -- but
// scaled to a 384x384 canvas and retimed into a clean 4s/48-frame loop.
//
// Deterministic: every random draw comes from a seeded PRNG (mulberry32), so
// re-rendering the same frame index always produces byte-identical output.

export const WIDTH = 384;
export const HEIGHT = 384;
export const FRAME_COUNT = 48;
export const FPS = 12;
export const DURATION = FRAME_COUNT / FPS; // 4s

// Real-renderer spark colours (sRGB 0-1, from FireworkNode.nsColor) -> 0-255.
const GOLD = [255, 209, 89];
const GREEN = [117, 250, 140];
const MAGENTA = [255, 92, 189];
const CYAN = [117, 217, 255];
const WHITE = [255, 255, 255];

// The real scene defaults to 900pt wide (FireworkNode.make's `area`
// parameter); scale every spatial constant lifted from the Swift source by
// this factor so our 384px canvas keeps the same proportions.
const SCALE = WIDTH / 900;

// ponytail: small inline seeded PRNG instead of a dependency -- mulberry32,
// the standard ~5-line generator for exactly this (deterministic, good
// enough distribution for particle scatter).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRAVEL_DURATION = 0.55; // comet flight time, matches the Swift `.move(duration: 0.55)`
const FADE_DEADLINE = 3.9; // every particle must fully fade by here so frame 48 -> frame 1 loops cleanly
const TRAIL_COUNT = 6;
const CANVAS_MARGIN = 6; // inset every splat from the edge so corner pixels are provably always alpha-0

// Shell plan: 8 launches, the last four overlapping closely as a "grand
// finale" -- same shape as FireworkNode.shellPlan(state: .completed) (paired
// delays, willow accents) but retimed to fit a 4s loop. One shell uses willow,
// one uses sputter, so both variants described in the Swift source are
// exercised.
const SHELL_DEFS = [
  { delay: 0.04, colors: [GOLD, CYAN], willow: true, sputter: false },
  { delay: 0.49, colors: [GREEN, MAGENTA], willow: false, sputter: false },
  { delay: 0.94, colors: [CYAN, GOLD], willow: false, sputter: false },
  { delay: 1.39, colors: [MAGENTA, GREEN], willow: true, sputter: false },
  // grand finale -- rapid overlapping bursts
  { delay: 1.89, colors: [GOLD, MAGENTA], willow: false, sputter: true },
  { delay: 2.09, colors: [CYAN, GREEN], willow: false, sputter: false },
  { delay: 2.24, colors: [MAGENTA, CYAN], willow: true, sputter: false },
  { delay: 2.24, colors: [GREEN, GOLD], willow: false, sputter: false },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Clamp an additive-accumulated channel value into a valid byte. Overlapping
 * bright sparks push these well past 255; a raw `Uint8Array` write wraps
 * (256 -> 0) instead of clamping, so every write goes through this first. */
export function clampByte(value) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

// Glitter's alpha flickers per FireworkNode's particleAlphaSequence keyframes.
function keyframeAlpha(normT) {
  const values = [1, 0.1, 1, 0];
  const times = [0, 0.35, 0.7, 1];
  for (let i = 0; i < times.length - 1; i += 1) {
    if (normT <= times[i + 1] || i === times.length - 2) {
      const span = times[i + 1] - times[i];
      const t = span > 0 ? (normT - times[i]) / span : 0;
      return lerp(values[i], values[i + 1], Math.min(1, Math.max(0, t)));
    }
  }
  return 0;
}

// Mirrors FireworkNode.burst()'s four `makeEmitter` calls. Speed/gravity are
// spatial (pt/s, pt/s^2) so they're scaled by SCALE; lifetime/alpha/count are
// time- or unit-based and are used as the Swift source wrote them.
function emitterParams(shell) {
  const { sputter } = shell;
  return {
    chrysanthemum: {
      count: sputter ? 49 : 80, // ~same 360:220 ratio as the source, reduced for a thumbnail-sized canvas
      speed: (sputter ? 780 : 720) * SCALE,
      speedRange: 320 * SCALE,
      gravity: 430 * SCALE,
      lifetime: sputter ? 1.2 : 1.9,
      scale: 0.52,
      color: shell.colors[0],
    },
    ring: {
      count: 60,
      speed: (sputter ? 560 : 520) * SCALE,
      speedRange: 260 * SCALE,
      gravity: 400 * SCALE,
      lifetime: 1.6,
      scale: 0.4,
      color: shell.colors[1] ?? shell.colors[0],
    },
    glitter: {
      count: sputter ? 63 : 45,
      speed: 160 * SCALE,
      speedRange: 80 * SCALE,
      gravity: 160 * SCALE,
      lifetime: 2.0,
      scale: 0.18,
      color: WHITE,
      flicker: true,
    },
    willow: shell.willow
      ? {
          count: 35,
          speed: 360 * SCALE,
          speedRange: 180 * SCALE,
          gravity: 300 * SCALE,
          lifetime: 2.8,
          scale: 0.44,
          color: shell.colors[0],
        }
      : null,
  };
}

// The Swift spark texture is a 24pt soft dot; `scale` is SKEmitterNode's
// particleScale multiplier.
function sparkRadius(scale) {
  return Math.max(1.1, ((24 * scale) / 2) * SCALE);
}

function buildShell(def, rng) {
  const startX = WIDTH / 2 + (rng() * 2 - 1) * WIDTH * 0.12;
  const startY = HEIGHT * 0.96;
  const burstX = WIDTH * (0.06 + rng() * 0.88);
  // Kept below 0.65H so the biggest halo (~107px radius at peak) can never
  // reach a canvas corner, however the random draw lands.
  const burstY = HEIGHT * (0.33 + rng() * 0.32);

  const emitters = emitterParams(def);
  const burstTime = def.delay + TRAVEL_DURATION;
  const longestBase = Math.max(
    emitters.chrysanthemum.lifetime,
    emitters.ring.lifetime,
    emitters.glitter.lifetime,
    emitters.willow?.lifetime ?? 0,
  );
  // Auto-derive how much to compress this shell's particle lifetimes so it
  // always finishes fading by FADE_DEADLINE, however late it launches --
  // this is what keeps the finale's late, overlapping bursts from spilling
  // past the loop point.
  const lifeScale = Math.max(0.3, Math.min(1, (FADE_DEADLINE - burstTime) / longestBase));

  const particleGroups = {};
  for (const [name, params] of Object.entries(emitters)) {
    if (!params) {
      particleGroups[name] = [];
      continue;
    }
    const list = [];
    for (let i = 0; i < params.count; i += 1) {
      list.push({
        angle: rng() * Math.PI * 2,
        speed: params.speed + (rng() * 2 - 1) * params.speedRange * 0.5,
        lifetime: params.lifetime * lifeScale * (1 + (rng() * 2 - 1) * 0.2),
        gravity: params.gravity,
        color: params.color,
        baseRadius: sparkRadius(params.scale),
        flicker: Boolean(params.flicker),
      });
    }
    particleGroups[name] = list;
  }

  const trailJitter = Array.from({ length: TRAIL_COUNT }, () => (rng() * 2 - 1) * 3);
  const trailRadius = sparkRadius(0.3);

  return {
    delay: def.delay,
    colors: def.colors,
    startX,
    startY,
    burstX,
    burstY,
    particleGroups,
    trailJitter,
    trailRadius,
  };
}

const SEED = 0xf19240a1;
const SHELLS = (() => {
  const rng = mulberry32(SEED);
  return SHELL_DEFS.map((def) => buildShell(def, rng));
})();

// Additive splat with a soft quadratic falloff, clipped to CANVAS_MARGIN so
// nothing ever reaches the literal edge pixels. Reused for the halo, the
// core, the comet head, its trail, and every spark -- it's the one drawing
// primitive the whole renderer needs.
function splat(canvas, cx, cy, radius, color, alpha) {
  if (alpha <= 0 || radius <= 0) return;
  const minX = Math.max(CANVAS_MARGIN, Math.floor(cx - radius));
  const maxX = Math.min(WIDTH - CANVAS_MARGIN - 1, Math.ceil(cx + radius));
  const minY = Math.max(CANVAS_MARGIN, Math.floor(cy - radius));
  const maxY = Math.min(HEIGHT - CANVAS_MARGIN - 1, Math.ceil(cy + radius));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      if (d >= radius) continue;
      const falloff = 1 - d / radius;
      const intensity = alpha * falloff * falloff;
      if (intensity <= 0) continue;
      const idx = (y * WIDTH + x) * 4;
      canvas[idx] += intensity * color[0];
      canvas[idx + 1] += intensity * color[1];
      canvas[idx + 2] += intensity * color[2];
      canvas[idx + 3] += intensity * 255;
    }
  }
}

function drawShell(canvas, shell, t) {
  const localT = t - shell.delay;
  if (localT < 0) return;

  if (localT < TRAVEL_DURATION) {
    // Comet phase: linear flight from launch to burst point (the Swift
    // `.move(to:duration:)` action has no timing mode set, so it's linear).
    const frac = localT / TRAVEL_DURATION;
    const cx = lerp(shell.startX, shell.burstX, frac);
    const cy = lerp(shell.startY, shell.burstY, frac);
    splat(canvas, cx, cy, (30 / 2) * SCALE, shell.colors[0], 1);

    // Trailing sparks: a handful of earlier points on the same path, fading
    // and shrinking with age -- cheap stand-in for the Swift trail emitter.
    for (let k = 0; k < TRAIL_COUNT; k += 1) {
      const sampleT = localT - k * 0.045;
      if (sampleT < 0) continue;
      const sampleFrac = Math.min(1, sampleT / TRAVEL_DURATION);
      const tx = lerp(shell.startX, shell.burstX, sampleFrac) + shell.trailJitter[k];
      const ty = lerp(shell.startY, shell.burstY, sampleFrac);
      const trailAlpha = (1 - k / TRAIL_COUNT) * 0.6;
      splat(canvas, tx, ty, shell.trailRadius * (1 - 0.08 * k), shell.colors[0], trailAlpha);
    }
    return;
  }

  const burstElapsed = localT - TRAVEL_DURATION;

  // Soft expanding halo flash: grows 0.3x -> 4.2x over 0.3s, fades over 0.42s.
  if (burstElapsed <= 0.42) {
    const growth = lerp(0.3, 4.2, Math.min(1, burstElapsed / 0.3));
    const haloRadius = 60 * SCALE * growth;
    const haloAlpha = 0.5 * Math.max(0, 1 - burstElapsed / 0.42);
    splat(canvas, shell.burstX, shell.burstY, haloRadius, shell.colors[0], haloAlpha);
  }

  // White core: grows 0.2x -> 6.0x over 0.24s, fades over 0.34s.
  if (burstElapsed <= 0.34) {
    const growth = lerp(0.2, 6.0, Math.min(1, burstElapsed / 0.24));
    const coreRadius = 30 * SCALE * growth;
    const coreAlpha = Math.max(0, 1 - burstElapsed / 0.34);
    splat(canvas, shell.burstX, shell.burstY, coreRadius, WHITE, coreAlpha);
  }

  for (const particles of Object.values(shell.particleGroups)) {
    for (const p of particles) {
      if (burstElapsed > p.lifetime) continue;
      const normT = burstElapsed / p.lifetime;
      const x = shell.burstX + Math.cos(p.angle) * p.speed * burstElapsed;
      const y =
        shell.burstY +
        Math.sin(p.angle) * p.speed * burstElapsed +
        0.5 * p.gravity * burstElapsed * burstElapsed;
      const alpha = p.flicker ? keyframeAlpha(normT) : Math.max(0, 1 - normT);
      const radius = p.baseRadius * (1 - 0.2 * normT);
      splat(canvas, x, y, radius, p.color, alpha);
    }
  }
}

/** Render one frame (0-indexed, wraps every FRAME_COUNT) as a
 * WIDTH * HEIGHT * 4 RGBA byte buffer. Pure and deterministic -- the same
 * index always produces the same bytes. */
export function renderFrame(frameIndex) {
  const t = ((frameIndex % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT / FPS;
  const canvas = new Float32Array(WIDTH * HEIGHT * 4);
  for (const shell of SHELLS) drawShell(canvas, shell, t);

  const out = Buffer.alloc(WIDTH * HEIGHT * 4);
  for (let i = 0; i < canvas.length; i += 1) {
    out[i] = clampByte(canvas[i]);
  }
  return out;
}
