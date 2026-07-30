import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { getPack, listPacks, partitionPacks } from './packs';

function meta(id: string, displayName: string) {
  return {
    version: 2,
    id,
    displayName,
    author: 'Seed Author',
    summary: 'A seeded companion used in tests',
    symbolName: 'sparkles',
    movementStyle: 'airborne',
    renderer: 'sprite',
    animation: { fps: 12, frameCount: 12, width: 256, height: 256, loop: 'forward' },
  };
}

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'anc-packs-'));
  await writeFile(join(dir, 'community.zebra.json'), JSON.stringify(meta('community.zebra', 'Zebra')));
  await writeFile(join(dir, 'community.apple.json'), JSON.stringify(meta('community.apple', 'apple')));
  await writeFile(join(dir, 'notes.txt'), 'ignored');
});

describe('listPacks', () => {
  it('returns every pack sorted by display name, case-insensitively', async () => {
    const packs = await listPacks(dir);
    expect(packs.map((pack) => pack.id)).toEqual(['community.apple', 'community.zebra']);
  });

  it('ignores files that are not JSON', async () => {
    const packs = await listPacks(dir);
    expect(packs).toHaveLength(2);
  });

  it('derives asset urls from the id', async () => {
    const [apple] = await listPacks(dir);
    expect(apple.previewUrl).toBe('/packs/community.apple/preview.webp');
    expect(apple.packUrl).toBe('/packs/community.apple/pack.zip');
  });

  it('returns an empty list for an empty directory', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'anc-empty-'));
    expect(await listPacks(empty)).toEqual([]);
  });

  it('fails loudly when the filename does not match the id', async () => {
    const bad = await mkdtemp(join(tmpdir(), 'anc-bad-'));
    await writeFile(join(bad, 'community.wrong.json'), JSON.stringify(meta('community.right', 'Right')));
    await expect(listPacks(bad)).rejects.toThrow(/filename/i);
  });

  it('fails loudly on invalid metadata', async () => {
    const bad = await mkdtemp(join(tmpdir(), 'anc-invalid-'));
    await writeFile(join(bad, 'community.bad.json'), JSON.stringify({ ...meta('community.bad', 'Bad'), renderer: 'butterfly' }));
    await expect(listPacks(bad)).rejects.toThrow(/renderer/i);
  });

  it('fails loudly on malformed JSON', async () => {
    const bad = await mkdtemp(join(tmpdir(), 'anc-json-'));
    await writeFile(join(bad, 'community.broken.json'), '{ not json');
    await expect(listPacks(bad)).rejects.toThrow(/community\.broken\.json/);
  });

  it('ignores a subdirectory whose name ends in .json', async () => {
    const dirWithStraySubdir = await mkdtemp(join(tmpdir(), 'anc-dirjson-'));
    await mkdir(join(dirWithStraySubdir, 'community.trap.json'));
    await writeFile(
      join(dirWithStraySubdir, 'community.apple.json'),
      JSON.stringify(meta('community.apple', 'apple')),
    );
    const packs = await listPacks(dirWithStraySubdir);
    expect(packs.map((pack) => pack.id)).toEqual(['community.apple']);
  });
});

describe('getPack', () => {
  it('returns the matching pack', async () => {
    const pack = await getPack('community.zebra', dir);
    expect(pack?.displayName).toBe('Zebra');
  });

  it('returns null for an unknown id', async () => {
    expect(await getPack('community.nope', dir)).toBeNull();
  });
});

describe('builtin packs', () => {
  it('has a null packUrl and a real previewUrl', async () => {
    const builtinDir = await mkdtemp(join(tmpdir(), 'anc-builtin-'));
    await writeFile(
      join(builtinDir, 'builtin.glow-wing.json'),
      JSON.stringify(meta('builtin.glow-wing', 'Glow Wing')),
    );
    const [pack] = await listPacks(builtinDir);
    expect(pack.packUrl).toBeNull();
    expect(pack.previewUrl).toBe('/packs/builtin.glow-wing/preview.webp');
    expect(pack.distribution).toBe('builtin');
  });

  it('leaves a community pack with a real packUrl', async () => {
    const [apple] = await listPacks(dir);
    expect(apple.packUrl).toBe('/packs/community.apple/pack.zip');
    expect(apple.distribution).toBe('community');
  });
});

describe('partitionPacks', () => {
  it('splits builtin and community packs, preserving sort order within each group', async () => {
    const mixedDir = await mkdtemp(join(tmpdir(), 'anc-partition-'));
    await writeFile(join(mixedDir, 'builtin.zeta.json'), JSON.stringify(meta('builtin.zeta', 'Zeta')));
    await writeFile(join(mixedDir, 'builtin.alpha.json'), JSON.stringify(meta('builtin.alpha', 'Alpha')));
    await writeFile(join(mixedDir, 'community.zebra.json'), JSON.stringify(meta('community.zebra', 'Zebra')));
    await writeFile(join(mixedDir, 'community.apple.json'), JSON.stringify(meta('community.apple', 'apple')));

    const packs = await listPacks(mixedDir);
    const { builtin, community } = partitionPacks(packs);

    expect(builtin.map((pack) => pack.id)).toEqual(['builtin.alpha', 'builtin.zeta']);
    expect(community.map((pack) => pack.id)).toEqual(['community.apple', 'community.zebra']);
  });

  it('returns empty arrays for an empty input', () => {
    expect(partitionPacks([])).toEqual({ builtin: [], community: [] });
  });
});
