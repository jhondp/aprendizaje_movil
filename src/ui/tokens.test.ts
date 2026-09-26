import { readFileSync } from 'node:fs';
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
  ])('defines %s as %s', (name, value) => {
    expect(css).toContain(`${name}: ${value}`);
  });
});
