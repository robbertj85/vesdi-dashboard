import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

/** Directory with the demo dataset (gitignored; see scripts/prepare-demo-data.sh). */
export function demoDataDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.DEMO_DATA_DIR || path.join(process.cwd(), "demo-data", "utrecht"));
}

const ALLOWED_EXT = /\.(csv|xlsx|xls|png|jpe?g)$/i;

export interface DemoFileInfo {
  name: string;
  size: number;
}

/** List servable demo files. The returned names are the only names /api/demo/[file] will serve. */
export async function listDemoFiles(): Promise<DemoFileInfo[]> {
  const dir = demoDataDir();
  let names: string[];
  try {
    names = await readdir(/*turbopackIgnore: true*/ dir);
  } catch {
    return [];
  }
  const files: DemoFileInfo[] = [];
  for (const name of names.sort()) {
    // Skip hidden files (e.g. macOS "._name.csv" companions from a tar upload)
    if (name.startsWith('.') || !ALLOWED_EXT.test(name)) continue;
    const s = await stat(/*turbopackIgnore: true*/ path.join(dir, name));
    if (s.isFile()) files.push({ name, size: s.size });
  }
  return files;
}
