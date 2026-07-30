// Thin CLI: simulate the firecracker companion and write it out as a PNG
// frame sequence. All the actual drawing logic lives in ./lib/firecracker.mjs
// so it can be unit tested directly; this file just wires it to the
// filesystem and the existing dependency-free PNG encoder.
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encodePng } from './lib/png.mjs';
import { renderFrame, WIDTH, HEIGHT, FRAME_COUNT } from './lib/firecracker.mjs';

const outDir = process.argv[2] ?? join(tmpdir(), 'firecracker-frames');

async function main() {
  await mkdir(outDir, { recursive: true });
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const png = encodePng(WIDTH, HEIGHT, renderFrame(i));
    const name = `frame_${String(i + 1).padStart(3, '0')}.png`;
    await writeFile(join(outDir, name), png);
  }
  console.log(`Wrote ${FRAME_COUNT} frames to ${outDir}`);
}

await main();
