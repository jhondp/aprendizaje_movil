import styles from './Snack.module.css';

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
}: {
  code: string;
  dependencies?: Record<string, string>;
  platform: SnackPlatform;
}): string {
  const params = new URLSearchParams({ platform, preview: 'true', theme: 'light', code });
  if (dependencies && Object.keys(dependencies).length > 0) {
    params.set('dependencies', serializeDependencies(dependencies));
  }
  return `https://snack.expo.dev/embedded?${params.toString()}`;
}

export function Snack({
  code,
  dependencies,
  platform = 'ios',
}: {
  code: string;
  dependencies?: Record<string, string>;
  platform?: SnackPlatform;
}) {
  return (
    <div className={styles.root}>
      <iframe
        title="Expo Snack"
        className={styles.frame}
        src={buildSnackUrl({ code, dependencies, platform })}
        loading="lazy"
        allow="geolocation; camera; microphone"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
      />
      <p className={styles.note}>
        Este ejemplo se ejecuta en Expo Snack y necesita conexión a internet. Puedes abrirlo en tu
        teléfono con Expo Go escaneando el código QR desde la pestaña &quot;My Device&quot;.
      </p>
    </div>
  );
}
