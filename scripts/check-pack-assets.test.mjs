import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkPackAssets } from './check-pack-assets.mjs';

async function fixture({ withPreview = true, withZip = true, id = 'community.fox' } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'anc-check-'));
  const contentDir = join(root, 'content');
  const publicPacksDir = join(root, 'packs');
  await mkdir(contentDir, { recursive: true });
  await mkdir(join(publicPacksDir, id), { recursive: true });
  await writeFile(join(contentDir, `${id}.json`), JSON.stringify({ id }));
  if (withPreview) await writeFile(join(publicPacksDir, id, 'preview.webp'), 'x');
  if (withZip) await writeFile(join(publicPacksDir, id, 'pack.zip'), 'x');
  return { contentDir, publicPacksDir };
}

describe('checkPackAssets', () => {
  it('reports no problems when both assets exist', async () => {
    const { contentDir, publicPacksDir } = await fixture();
    expect(await checkPackAssets(contentDir, publicPacksDir)).toEqual([]);
  });

  it('reports a missing preview', async () => {
    const { contentDir, publicPacksDir } = await fixture({ withPreview: false });
    const problems = await checkPackAssets(contentDir, publicPacksDir);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/preview\.webp/);
  });

  it('reports a missing archive', async () => {
    const { contentDir, publicPacksDir } = await fixture({ withZip: false });
    const problems = await checkPackAssets(contentDir, publicPacksDir);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/pack\.zip/);
  });

  it('reports an empty asset as missing', async () => {
    const { contentDir, publicPacksDir } = await fixture();
    await writeFile(join(publicPacksDir, 'community.fox', 'pack.zip'), '');
    const problems = await checkPackAssets(contentDir, publicPacksDir);
    expect(problems[0]).toMatch(/empty/i);
  });

  it('reports a filename that does not match the declared id', async () => {
    const root = await mkdtemp(join(tmpdir(), 'anc-check-id-'));
    const contentDir = join(root, 'content');
    const publicPacksDir = join(root, 'packs');
    await mkdir(contentDir, { recursive: true });
    await mkdir(publicPacksDir, { recursive: true });
    await writeFile(join(contentDir, 'community.wrong.json'), JSON.stringify({ id: 'community.right' }));
    const problems = await checkPackAssets(contentDir, publicPacksDir);
    expect(problems.join(' ')).toMatch(/filename/i);
  });

  it('ignores a directory whose name ends in .json', async () => {
    const { contentDir, publicPacksDir } = await fixture();
    await mkdir(join(contentDir, 'community.trap.json'), { recursive: true });
    const problems = await checkPackAssets(contentDir, publicPacksDir);
    expect(problems).toEqual([]);
  });

  it('does not require pack.zip for a builtin pack', async () => {
    const { contentDir, publicPacksDir } = await fixture({ id: 'builtin.glow-wing', withZip: false });
    expect(await checkPackAssets(contentDir, publicPacksDir)).toEqual([]);
  });

  it('reports a pack.zip present for a builtin pack as a problem', async () => {
    const { contentDir, publicPacksDir } = await fixture({ id: 'builtin.glow-wing', withZip: true });
    const problems = await checkPackAssets(contentDir, publicPacksDir);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/pack\.zip/);
  });

  it('still requires preview.webp for a builtin pack', async () => {
    const { contentDir, publicPacksDir } = await fixture({
      id: 'builtin.glow-wing',
      withPreview: false,
      withZip: false,
    });
    const problems = await checkPackAssets(contentDir, publicPacksDir);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/preview\.webp/);
  });
});
