export type SnackPlatform = 'ios' | 'android' | 'web';

export function serializeDependencies(dependencies: Record<string, string>): string {
  return Object.entries(dependencies)
    .map(([name, version]) => `${name}@${version}`)
    .join(',');
}

export function buildSnackUrl({
  code,
  dependencies,
  platform,
  sdkVersion,
}: {
  code: string;
  dependencies?: Record<string, string>;
  platform: SnackPlatform;
  sdkVersion?: string;
}): string {
  // The `code` param always creates App.js, so TypeScript syntax would fail to parse; the
  // `files` param (URL-encoded JSON) lets Snack treat the learner code as App.tsx.
  const files = { 'App.tsx': { type: 'CODE', contents: code } };
  const params = new URLSearchParams({
    platform,
    preview: 'true',
    theme: 'light',
    files: JSON.stringify(files),
  });
  if (dependencies && Object.keys(dependencies).length > 0) {
    params.set('dependencies', serializeDependencies(dependencies));
  }
  // Snack reads the query param case-sensitively as `sdkVersion`.
  if (sdkVersion) params.set('sdkVersion', sdkVersion);
  return `https://snack.expo.dev/embedded?${params.toString()}`;
}
