import styles from './Snack.module.css';
import { buildSnackUrl, type SnackPlatform } from './snackUrl';

export function Snack({
  code,
  dependencies,
  platform = 'ios',
  sdkVersion,
}: {
  code: string;
  dependencies?: Record<string, string>;
  platform?: SnackPlatform;
  /** Expo SDK version, e.g. "55.0.0"; Snack picks its default when omitted. */
  sdkVersion?: string;
}) {
  return (
    <div className={styles.root}>
      <iframe
        title="Expo Snack"
        className={styles.frame}
        src={buildSnackUrl({ code, dependencies, platform, sdkVersion })}
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
      />
      <p className={styles.note}>
        Este ejemplo se ejecuta en Expo Snack y necesita conexión a internet. Puedes abrirlo en tu
        teléfono con Expo Go escaneando el código QR desde la pestaña &quot;My Device&quot;.
      </p>
    </div>
  );
}
