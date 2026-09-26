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
    expect(url.searchParams.get('code')).toBe('const a = 1;');
    expect(url.searchParams.get('dependencies')).toBe('expo-camera@~15.0.0,expo-image@*');
    expect(url.searchParams.get('preview')).toBe('true');
    expect(url.searchParams.get('theme')).toBe('light');
  });

  it('omits the dependencies param when none are given', () => {
    const url = new URL(buildSnackUrl({ code: 'x', platform: 'ios' }));
    expect(url.searchParams.has('dependencies')).toBe(false);
  });

  it('round-trips code containing special characters exactly', () => {
    const code = 'const a = "x&y=z#w";\nconsole.log(a);';
    const url = new URL(buildSnackUrl({ code, platform: 'web' }));
    expect(url.searchParams.get('code')).toBe(code);
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

  it('sandboxes the iframe without top-navigation privileges', () => {
    render(<Snack code="export default function App() { return null }" />);
    const frame = screen.getByTitle('Expo Snack');
    expect(frame.getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals',
    );
  });
});
