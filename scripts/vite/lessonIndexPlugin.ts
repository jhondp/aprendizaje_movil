import { readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Plugin, ViteDevServer } from 'vite';
import { walkMdx } from '../lib/walkMdx';

const VIRTUAL_ID = 'virtual:lesson-index';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

function readFrontmatter(file: string): Record<string, unknown> {
  return matter(readFileSync(file, 'utf8')).data as Record<string, unknown>;
}

/**
 * Serves `virtual:lesson-index`: `{ '/content/<stage>/<lesson>.mdx': frontmatter }` for every MDX
 * lesson, read with gray-matter at build time. Keeping frontmatter out of the MDX modules lets
 * Vite split each lesson body into its own lazily loaded chunk.
 */
export function lessonIndexPlugin(contentDirName = 'content'): Plugin {
  let root = process.cwd();
  let isBuild = false;
  let contentDir = path.join(root, contentDirName);
  const frontmatterCache = new Map<string, string>();

  const isLesson = (file: string) =>
    file.startsWith(contentDir + path.sep) && file.endsWith('.mdx');

  const reload = (server: ViteDevServer) => {
    const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
    if (!mod) return;
    server.moduleGraph.invalidateModule(mod);
    server.ws.send({ type: 'full-reload' });
  };

  return {
    name: 'saber-lesson-index',
    configResolved(config) {
      root = config.root;
      isBuild = config.command === 'build';
      contentDir = path.join(root, contentDirName);
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      const index: Record<string, Record<string, unknown>> = {};
      // In dev the server already watches the project; configureServer and handleHotUpdate decide
      // when the index must be rebuilt. Only `vite build --watch` needs explicit watch files.
      for (const file of walkMdx(contentDir)) {
        if (isBuild) this.addWatchFile(file);
        const data = readFrontmatter(file);
        frontmatterCache.set(file, JSON.stringify(data));
        index[`/${path.relative(root, file).split(path.sep).join('/')}`] = data;
      }
      return `export default ${JSON.stringify(index)};`;
    },
    configureServer(server) {
      const onAddOrRemove = (file: string) => {
        if (isLesson(file)) reload(server);
      };
      server.watcher.on('add', onAddOrRemove);
      server.watcher.on('unlink', onAddOrRemove);
    },
    handleHotUpdate({ file, server }) {
      if (!isLesson(file)) return;
      // Only frontmatter edits change the index; body edits keep regular MDX hot updates.
      if (frontmatterCache.get(file) === JSON.stringify(readFrontmatter(file))) return;
      reload(server);
      return [];
    },
  };
}
