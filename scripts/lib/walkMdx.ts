import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/** Recursively collects every `.mdx` file under `dir`, returned as full paths sorted
 *  lexicographically, so callers get a deterministic order regardless of directory-listing order. */
export function walkMdx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkMdx(full));
    else if (entry.endsWith('.mdx')) out.push(full);
  }
  return out.sort();
}
