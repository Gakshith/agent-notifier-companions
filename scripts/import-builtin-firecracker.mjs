/**
 * Package the procedural firecracker as a built-in companion.
 *
 * Unlike the butterfly, the firecracker has no artwork on disk anywhere: the app
 * draws it with SpriteKit at runtime. `scripts/lib/firecracker.mjs` reproduces
 * that animation deterministically so the gallery can show it. Like every
 * built-in it ships inside the app, so this writes a manifest and a preview and
 * deliberately produces no pack.zip.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FPS, FRAME_COUNT, HEIGHT, WIDTH, renderFrame } from './lib/firecracker.mjs';
import { encodePng } from './lib/png.mjs';

const ID = 'builtin.firecracker';

const MANIFEST = {
  version: 2,
  id: ID,
  displayName: 'Firecracker',
  author: 'Agent Notifier',
  summary: 'A procedural fireworks burst that celebrates finished work',
  symbolName: 'sparkles',
  // The app really does use "burst" for this companion: it is bound to the
  // compiled firework renderer, not a declarative sprite sequence. That value
  // is permitted here because this manifest's id is a builtin.* id — the
  // schema rejects "burst" for community packs, which can't express it.
  movementStyle: 'burst',
  renderer: 'sprite',
  animation: {
    fps: FPS,
    frameCount: FRAME_COUNT,
    width: WIDTH,
    height: HEIGHT,
    loop: 'forward',
  },
};

async function main() {
  const staging = await mkdtemp(join(tmpdir(), 'firecracker-import-'));
  try {
    const framePaths = [];
    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const name = `frame_${String(index + 1).padStart(3, '0')}.png`;
      const target = join(staging, name);
      await writeFile(target, encodePng(WIDTH, HEIGHT, renderFrame(index)));
      framePaths.push(target);
    }

    const publicDir = join(process.cwd(), 'public', 'packs', ID);
    await mkdir(publicDir, { recursive: true });

    execFileSync('img2webp', [
      '-loop', '0',
      '-d', String(Math.round(1000 / FPS)),
      '-lossy', '-q', '72',
      ...framePaths,
      '-o', join(publicDir, 'preview.webp'),
    ]);

    await writeFile(
      join(process.cwd(), 'content', 'packs', `${ID}.json`),
      `${JSON.stringify(MANIFEST, null, 2)}\n`,
    );

    console.log(`imported ${ID} from ${FRAME_COUNT} rendered frames at ${FPS} fps`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

await main();
