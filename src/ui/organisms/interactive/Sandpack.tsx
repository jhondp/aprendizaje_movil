import { Sandpack as SandpackEditor } from '@codesandbox/sandpack-react';

export function Sandpack({
  files,
  height = 380,
}: {
  files: Record<string, string>;
  height?: number;
}) {
  return (
    <div style={{ margin: '24px 0' }}>
      <SandpackEditor
        template="react-ts"
        files={files}
        theme="light"
        options={{ editorHeight: height, showTabs: true, showLineNumbers: true }}
      />
      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-55)' }}>
        Este editor necesita conexión a internet para compilar.
      </p>
    </div>
  );
}
