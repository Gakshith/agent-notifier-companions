import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encodePng } from './lib/png.mjs';

const SIZE = 256;
const FRAME_COUNT = 24;
const FPS = 12;

const SHAPES = {
  orb: {
    id: 'community.pulse-orb',
    displayName: 'Pulse Orb',
    summary: 'A soft amber orb that breathes while it drifts across your screen',
    symbolName: 'circle.fill',
    movementStyle: 'airborne',
    colour: [245, 165, 36],
  },
  ring: {
    id: 'community.halo-ring',
    displayName: 'Halo Ring',
    summary: 'A slim teal ring that spins in place above your work',
    symbolName: 'circle.dashed',
    movementStyle: 'hovering',
    colour: [45, 212, 191],
  },
  comet: {
    id: 'community.dust-comet',
    displayName: 'Dust Comet',
    summary: 'A small comet that skims along the bottom of the display',
    symbolName: 'sparkle',
    movementStyle: 'grounded',
    colour: [232, 121, 249],
  },
};

// Each shape is drawn as a radial falloff so the frames have real soft alpha
// edges, which is what exercises transparent compositing in the app.
function drawFrame(shape, frameIndex) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4, 0);
  const phase = (frameIndex / FRAME_COUNT) * Math.PI * 2;
  const centre = SIZE / 2;
  const [r, g, b] = shape.colour;

  const baseRadius = SIZE * 0.3;
  const radius = shape.id === 'community.pulse-orb'
    ? baseRadius * (0.75 + 0.25 * Math.sin(phase))
    : baseRadius;

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const dx = x - centre;
      const dy = y - centre;
      const distance = Math.hypot(dx, dy);

      let alpha = 0;
      if (shape.id === 'community.halo-ring') {
        const band = Math.abs(distance - radius);
        const spin = 0.55 + 0.45 * Math.cos(Math.atan2(dy, dx) - phase);
        alpha = Math.max(0, 1 - band / (SIZE * 0.05)) * spin;
      } else if (shape.id === 'community.dust-comet') {
        const tail = Math.max(0, 1 - Math.abs(dy) / (SIZE * 0.06));
        const head = Math.max(0, 1 - distance / radius);
        const sweep = Math.max(0, 1 - Math.abs(dx - Math.sin(phase) * SIZE * 0.18) / (SIZE * 0.3));
        alpha = Math.max(head, tail * sweep * 0.7);
      } else {
        alpha = Math.max(0, 1 - distance / radius) ** 1.6;
      }

      if (alpha > 0) {
        const offset = (y * SIZE + x) * 4;
        rgba[offset] = r;
        rgba[offset + 1] = g;
        rgba[offset + 2] = b;
        rgba[offset + 3] = Math.round(Math.min(1, alpha) * 255);
      }
    }
  }
  return encodePng(SIZE, SIZE, rgba);
}

async function main() {
  const shapeName = process.argv[2];
  const shape = SHAPES[shapeName];
  if (!shape) {
    console.error(`Usage: node scripts/make-seed-pack.mjs <${Object.keys(SHAPES).join('|')}>`);
    process.exit(2);
  }

  const staging = await mkdtemp(join(tmpdir(), 'anc-seed-'));
  const packDir = join(staging, `${shape.displayName.replace(/\s+/g, '')}.agentpack`);
  const framesDir = join(packDir, 'frames');
  await mkdir(framesDir, { recursive: true });

  const checksums = {};
  const framePaths = [];
  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const name = `frame_${String(index + 1).padStart(3, '0')}.png`;
    const png = drawFrame(shape, index);
    const target = join(framesDir, name);
    await writeFile(target, png);
    checksums[`frames/${name}`] = createHash('sha256').update(png).digest('hex');
    framePaths.push(target);
  }

  const manifest = {
    version: 2,
    id: shape.id,
    displayName: shape.displayName,
    author: 'Agent Notifier',
    summary: shape.summary,
    symbolName: shape.symbolName,
    movementStyle: shape.movementStyle,
    renderer: 'sprite',
    animation: {
      fps: FPS,
      frameCount: FRAME_COUNT,
      width: SIZE,
      height: SIZE,
      loop: 'forward',
    },
  };

  await writeFile(join(packDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(packDir, 'checksums.json'), `${JSON.stringify(checksums, null, 2)}\n`);

  const publicDir = join(process.cwd(), 'public', 'packs', shape.id);
  await mkdir(publicDir, { recursive: true });

  // zip appends to an existing archive rather than replacing it, so stale frames
  // would survive a regeneration. Remove the target first to stay idempotent.
  const zipPath = join(publicDir, 'pack.zip');
  await rm(zipPath, { force: true });

  // -X omits extra file attributes so the archive is reproducible across machines.
  execFileSync('zip', ['-X', '-q', '-r', zipPath, '.'], { cwd: staging });

  execFileSync('img2webp', [
    '-loop', '0',
    '-d', String(Math.round(1000 / FPS)),
    ...framePaths,
    '-o', join(publicDir, 'preview.webp'),
  ]);

  await writeFile(
    join(process.cwd(), 'content', 'packs', `${shape.id}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  await rm(staging, { recursive: true, force: true });
  console.log(`seeded ${shape.id}`);
}

await main();
