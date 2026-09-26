export interface PlaygroundMessage {
  type: 'saber-playground';
  id: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'done';
  args: string[];
}

export function buildSrcdoc(code: string, instanceId: string): string {
  const safeCode = code.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><html><body><script>
(function () {
  var id = ${JSON.stringify(instanceId)};
  function fmt(a) {
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }
  function send(level, args) {
    parent.postMessage({ type: 'saber-playground', id: id, level: level, args: Array.prototype.map.call(args, fmt) }, '*');
  }
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    console[level] = function () { send(level, arguments); };
  });
  window.onerror = function (message) { send('error', [String(message)]); };
  (async function () {
    try {
      ${safeCode}
    } catch (e) {
      send('error', [String(e)]);
    }
    send('done', []);
  })();
})();
</script></body></html>`;
}
