import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { type PackMeta, validatePackMeta } from './pack';

export type Pack = PackMeta & {
  previewUrl: string;
  // Built-in packs ship with the app and have no downloadable archive.
  packUrl: string | null;
};

export const CONTENT_DIR = join(process.cwd(), 'content', 'packs');

function toPack(meta: PackMeta): Pack {
  return {
    ...meta,
    previewUrl: `/packs/${meta.id}/preview.webp`,
    packUrl: meta.distribution === 'builtin' ? null : `/packs/${meta.id}/pack.zip`,
  };
}

async function readPackFile(contentDir: string, fileName: string): Promise<Pack> {
  const raw = await readFile(join(contentDir, fileName), 'utf8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`${fileName} is not valid JSON`, { cause });
  }

  const meta = validatePackMeta(parsed);
  const expected = `${meta.id}.json`;
  if (fileName !== expected) {
    throw new Error(`${fileName} declares id "${meta.id}", so its filename must be ${expected}`);
  }
  return toPack(meta);
}

export async function listPacks(contentDir: string = CONTENT_DIR): Promise<Pack[]> {
  const entries = await readdir(contentDir, { withFileTypes: true });
  const packs = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => readPackFile(contentDir, entry.name)),
  );
  return packs.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'en', { sensitivity: 'base' }),
  );
}

export async function getPack(
  id: string,
  contentDir: string = CONTENT_DIR,
): Promise<Pack | null> {
  const packs = await listPacks(contentDir);
  return packs.find((pack) => pack.id === id) ?? null;
}

// Array.prototype.filter is stable, so each group keeps the sort order listPacks produced.
export function partitionPacks(packs: Pack[]): { builtin: Pack[]; community: Pack[] } {
  return {
    builtin: packs.filter((pack) => pack.distribution === 'builtin'),
    community: packs.filter((pack) => pack.distribution === 'community'),
  };
}
