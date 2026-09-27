import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { walkMdx } from './walkMdx';

const tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'saber-walkmdx-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true });
  tmpDirs.length = 0;
});

describe('walkMdx', () => {
  it('collects .mdx files recursively, sorted, and ignores other extensions', () => {
    const root = makeTmpDir();
    mkdirSync(path.join(root, 'b-stage'), { recursive: true });
    mkdirSync(path.join(root, 'a-stage', 'nested'), { recursive: true });
    writeFileSync(path.join(root, 'b-stage', '01-lesson.mdx'), '');
    writeFileSync(path.join(root, 'a-stage', '00-lesson.mdx'), '');
    writeFileSync(path.join(root, 'a-stage', 'nested', '02-lesson.mdx'), '');
    writeFileSync(path.join(root, 'a-stage', 'notes.txt'), '');
    writeFileSync(path.join(root, 'stages.json'), '[]');

    expect(walkMdx(root)).toEqual(
      [
        path.join(root, 'a-stage', '00-lesson.mdx'),
        path.join(root, 'a-stage', 'nested', '02-lesson.mdx'),
        path.join(root, 'b-stage', '01-lesson.mdx'),
      ].sort(),
    );
  });

  it('returns an empty array for a directory with no mdx files', () => {
    const root = makeTmpDir();
    writeFileSync(path.join(root, 'readme.md'), '');
    expect(walkMdx(root)).toEqual([]);
  });
});
