import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_DIR = join(process.cwd(), 'content', 'packs');
const PUBLIC_PACKS_DIR = join(process.cwd(), 'public', 'packs');
const REQUIRED_ASSETS = ['preview.webp', 'pack.zip'];

async function describeAsset(path) {
  try {
    const info = await stat(path);
    return info.size > 0 ? null : `${path} is empty`;
  } catch {
    return `${path} is missing`;
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

    for (const asset of REQUIRED_ASSETS) {
      const problem = await describeAsset(join(publicPacksDir, id, asset));
      if (problem) problems.push(problem);
    }
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
