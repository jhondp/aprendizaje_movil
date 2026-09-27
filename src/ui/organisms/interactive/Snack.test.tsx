import { render, screen } from '@testing-library/react';
import { buildSnackUrl, Snack } from './Snack';

describe('buildSnackUrl', () => {
  it('encodes code, dependencies and platform', () => {
    const url = new URL(
      buildSnackUrl({
        code: 'const a = 1;',
        dependencies: { 'expo-camera': '~15.0.0', 'expo-image': '*' },
        platform: 'android',
      }),
    );
    expect(url.origin + url.pathname).toBe('https://snack.expo.dev/embedded');
    expect(url.searchParams.get('platform')).toBe('android');
    expect(url.searchParams.has('code')).toBe(false);
    expect(JSON.parse(url.searchParams.get('files') ?? '')).toEqual({
      'App.tsx': { type: 'CODE', contents: 'const a = 1;' },
    });
    expect(url.searchParams.get('dependencies')).toBe('expo-camera@~15.0.0,expo-image@*');
    expect(url.searchParams.get('preview')).toBe('true');
    expect(url.searchParams.get('theme')).toBe('light');
  });

  it('passes the SDK version when given', () => {
    const url = new URL(buildSnackUrl({ code: 'x', platform: 'ios', sdkVersion: '52.0.0' }));
    expect(url.searchParams.get('sdkVersion')).toBe('52.0.0');
    expect(
      new URL(buildSnackUrl({ code: 'x', platform: 'ios' })).searchParams.has('sdkVersion'),
    ).toBe(false);
  });

  it('omits the dependencies param when none are given', () => {
    const url = new URL(buildSnackUrl({ code: 'x', platform: 'ios' }));
    expect(url.searchParams.has('dependencies')).toBe(false);
  });

  it('round-trips TypeScript code containing special characters exactly', () => {
    const code = 'const a = "x&y=z#w" as const;\nconst n: number = 1;\nconsole.log(`${a}`, n);';
    const url = new URL(buildSnackUrl({ code, platform: 'web' }));
    const files = JSON.parse(url.searchParams.get('files') ?? '') as Record<
      string,
      { contents: string }
    >;
    expect(files['App.tsx']?.contents).toBe(code);
  });
});

describe('Snack', () => {
  it('renders an iframe to Expo Snack defaulting to ios', () => {
    render(<Snack code="export default function App() { return null }" />);
    const frame = screen.getByTitle('Expo Snack');
    expect(frame.getAttribute('src')).toContain('https://snack.expo.dev/embedded?');
    expect(frame.getAttribute('src')).toContain('platform=ios');
    expect(screen.getByText(/necesita conexión/)).toBeInTheDocument();
  });

  it('forwards the SDK version to the embed URL', () => {
    render(<Snack code="x" sdkVersion="52.0.0" />);
    expect(screen.getByTitle('Expo Snack').getAttribute('src')).toContain('sdkVersion=52.0.0');
  });

  it('sandboxes the iframe without top-navigation privileges', () => {
    render(<Snack code="export default function App() { return null }" />);
    const frame = screen.getByTitle('Expo Snack');
    expect(frame).not.toHaveAttribute('allow');
    expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(frame.getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals',
    );
  });
});
