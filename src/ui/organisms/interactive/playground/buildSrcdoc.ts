export interface PlaygroundMessage {
  type: 'saber-playground';
  id: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'done';
  args: string[];
}

// Every "<" is escaped to its unicode form so the generated string literal can
// never contain a byte sequence the HTML parser reads as a tag (</script>,
// <!--<script> double-escape state, etc.), no matter what the learner writes.
function embed(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function buildSrcdoc(code: string, instanceId: string): string {
  const encodedCode = embed(code);
  const encodedId = embed(instanceId);
  return `<!doctype html><html><body><script>
(function () {
  var id = ${encodedId};
  function fmt(a) {
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }
  function __saberSend(level, args) {
    parent.postMessage(
      { type: 'saber-playground', id: id, level: level, args: Array.prototype.map.call(args, fmt) },
      '*',
    );
  }
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    console[level] = function () { __saberSend(level, arguments); };
  });
  window.onerror = function (message) {
    __saberSend('error', [String(message)]);
    return true;
  };
  (async function () {
    try {
      var __saberRun = new Function(
        '"use strict";return (async () => {\\n' + ${encodedCode} + '\\n})()',
      );
      await __saberRun();
    } catch (e) {
      __saberSend('error', [String(e)]);
    }
    __saberSend('done', []);
  })();
})();
</script></body></html>`;
}
