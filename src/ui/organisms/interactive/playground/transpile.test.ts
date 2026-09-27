import { transpile } from './transpile';

describe('transpile', () => {
  it('returns JS untouched', () => {
    expect(transpile('console.log(1)', 'js')).toEqual({ code: 'console.log(1)' });
  });
  it('strips TypeScript types', () => {
    const result = transpile('const n: number = 1; console.log(n)', 'ts');
    expect('code' in result && result.code).toContain('const n = 1');
  });
  it('reports syntax errors instead of throwing', () => {
    const result = transpile('const = ;', 'ts');
    expect('error' in result).toBe(true);
  });
});
