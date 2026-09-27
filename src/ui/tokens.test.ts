import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const css = readFileSync(path.resolve(__dirname, 'tokens.css'), 'utf8');

describe('design tokens', () => {
  it.each([
    ['--color-ink', '#022a2a'],
    ['--color-teal', '#10484a'],
    ['--color-accent', '#ff3d00'],
    ['--color-lime', '#9bc62b'],
    ['--color-sand', '#efe6da'],
    ['--color-paper', '#f6f1ea'],
    ['--color-canvas', '#e4ddd2'],
    ['--radius-s', '10px'],
    ['--radius-m', '14px'],
    ['--radius-l', '22px'],
    ['--radius-xl', '28px'],
    ['--ink-06', 'rgba(2, 42, 42, 0.06)'],
    ['--ink-08', 'rgba(2, 42, 42, 0.08)'],
    ['--ink-10', 'rgba(2, 42, 42, 0.1)'],
    ['--ink-25', 'rgba(2, 42, 42, 0.25)'],
    ['--ink-55', 'rgba(2, 42, 42, 0.55)'],
    ['--ink-65', 'rgba(2, 42, 42, 0.65)'],
    ['--ink-35', 'rgba(2, 42, 42, 0.35)'],
    ['--paper-80', 'rgba(246, 241, 234, 0.8)'],
    ['--color-error', '#9a2a00'],
    ['--color-error-bg', '#ffe8e0'],
    ['--color-warn', '#ffd166'],
    ['--color-warn-bg', '#fff4e5'],
    ['--color-console-warn', '#ff8a65'],
    ['--radius-xs', '6px'],
    ['--radius-pill', '999px'],
    ['--shadow-dialog', '0 30px 80px rgba(0, 0, 0, 0.3)'],
  ])('defines %s as %s', (name, value) => {
    expect(css).toContain(`${name}: ${value}`);
  });

  it('defines --font starting with Poppins', () => {
    const match = css.match(/--font:\s*([^;]+);/);
    expect(match?.[1]).toMatch(/^'Poppins'/);
  });
});

describe('CSS modules', () => {
  const files = readdirSync(__dirname, { recursive: true, encoding: 'utf8' }).filter((f) =>
    f.endsWith('.module.css'),
  );

  it.each(files)('%s uses tokens for colours and radii', (file) => {
    const source = readFileSync(path.resolve(__dirname, file), 'utf8');
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/rgba?\(/);
    expect(source).not.toMatch(/border-radius:\s*\d+px/);
  });
});
