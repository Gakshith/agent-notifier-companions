import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_DIR = join(process.cwd(), 'content', 'packs');
const PUBLIC_PACKS_DIR = join(process.cwd(), 'public', 'packs');
const PREVIEW_ASSET = 'preview.webp';
const ARCHIVE_ASSET = 'pack.zip';

async function describeAsset(path) {
  try {
    const info = await stat(path);
    return info.size > 0 ? null : `${path} is empty`;
  } catch {
    return `${path} is missing`;
  }
}

// Built-in packs ship inside the app and have no downloadable archive, so a
// pack.zip next to one would imply a download the site does not offer.
async function describeForbiddenAsset(path) {
  try {
    await stat(path);
    return `${path} must not exist for a built-in pack`;
  } catch {
    return null;
  }
}

export async function checkPackAssets(contentDir = CONTENT_DIR, publicPacksDir = PUBLIC_PACKS_DIR) {
  const problems = [];
  const entries = (await readdir(contentDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name);

  for (const fileName of entries) {
    let id;
    try {
      id = JSON.parse(await readFile(join(contentDir, fileName), 'utf8')).id;
    } catch (error) {
      problems.push(`${fileName} is not valid JSON: ${error.message}`);
      continue;
    }

    if (`${id}.json` !== fileName) {
      problems.push(`${fileName} declares id "${id}", so its filename must be ${id}.json`);
      continue;
    }

    const previewProblem = await describeAsset(join(publicPacksDir, id, PREVIEW_ASSET));
    if (previewProblem) problems.push(previewProblem);

    const archivePath = join(publicPacksDir, id, ARCHIVE_ASSET);
    const archiveProblem = id.startsWith('builtin.')
      ? await describeForbiddenAsset(archivePath)
      : await describeAsset(archivePath);
    if (archiveProblem) problems.push(archiveProblem);
  }

  return problems;
}

// Only act as a build gate when run directly, so tests can import the function.
// fileURLToPath handles paths containing spaces, which a naive file:// concatenation does not.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const problems = await checkPackAssets();
  if (problems.length > 0) {
    console.error('Pack asset check failed:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log('Pack asset check passed');
}
