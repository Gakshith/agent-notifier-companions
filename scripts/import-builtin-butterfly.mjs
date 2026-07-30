/**
 * Import the app's real Blender-rendered butterfly as a built-in companion.
 *
 * The butterfly ships inside the macOS app, so it is showcased here rather than
 * distributed: this writes a manifest and an animated preview, and deliberately
 * produces no pack.zip. The frames are the app's own artwork, read from the
 * sibling repository rather than re-rendered, so the gallery shows exactly what
 * the app shows.
 */
import { execFileSync } from 'node:child_process';
import { access, mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const APP_REPO =
  process.env.AGENT_NOTIFIER_REPO ??
  resolve(process.cwd(), '../../../agent_notifier/Git/agent_notifier');

const FRAMES_DIR = join(
  APP_REPO,
  'Sources/ButterflyRenderer/Resources/Companions/butterfly/frames',
);

const ID = 'builtin.butterfly';
const SIZE = 384;
// The app declares frameCount = 48 but no playback rate, so the wing cycle is
// timed here: 48 frames at 24 fps is a two-second loop, which reads as a
// natural flap rather than a strobe.
const FPS = 24;

const MANIFEST = {
  version: 2,
  id: ID,
  displayName: 'Butterfly',
  author: 'Agent Notifier',
  summary: 'Painterly Blender wings with iridescent shimmer and organic flight',
  symbolName: 'camera.macro',
  movementStyle: 'airborne',
  renderer: 'sprite',
  animation: { fps: FPS, frameCount: 48, width: SIZE, height: SIZE, loop: 'forward' },
};

async function main() {
  try {
    await access(FRAMES_DIR);
  } catch {
    console.error(`Butterfly frames not found at:\n  ${FRAMES_DIR}`);
    console.error('Set AGENT_NOTIFIER_REPO to the agent_notifier repository root.');
    process.exit(2);
  }

  const frames = (await readdir(FRAMES_DIR))
    .filter((name) => name.endsWith('.png'))
    .sort();

  if (frames.length !== MANIFEST.animation.frameCount) {
    console.error(
      `Expected ${MANIFEST.animation.frameCount} frames, found ${frames.length}. ` +
        'Refusing to publish a manifest that disagrees with the artwork.',
    );
    process.exit(1);
  }

  const publicDir = join(process.cwd(), 'public', 'packs', ID);
  await mkdir(publicDir, { recursive: true });

  // The Blender frames are detailed, and img2webp defaults to lossless, which
  // produced a 3 MB preview — far too heavy for a gallery grid. Lossy WebP still
  // carries the alpha channel these transparent frames need.
  execFileSync('img2webp', [
    '-loop', '0',
    '-d', String(Math.round(1000 / FPS)),
    '-lossy', '-q', '72',
    ...frames.map((name) => join(FRAMES_DIR, name)),
    '-o', join(publicDir, 'preview.webp'),
  ]);

  await writeFile(
    join(process.cwd(), 'content', 'packs', `${ID}.json`),
    `${JSON.stringify(MANIFEST, null, 2)}\n`,
  );

  console.log(`imported ${ID} from ${frames.length} frames at ${FPS} fps`);
}

await main();
