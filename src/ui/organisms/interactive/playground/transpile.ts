import { transform } from 'sucrase';

export type PlaygroundLang = 'js' | 'ts';

export function transpile(
  code: string,
  lang: PlaygroundLang,
): { code: string } | { error: string } {
  if (lang === 'js') return { code };
  try {
    return { code: transform(code, { transforms: ['typescript'] }).code };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
