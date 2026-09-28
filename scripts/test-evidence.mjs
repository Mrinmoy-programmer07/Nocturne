import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--reporter=verbose'], {
  encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
});
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
mkdirSync('docs/evidence', { recursive: true });
mkdirSync('tmp', { recursive: true });
writeFileSync('docs/evidence/tests.txt', output);
const escaped = output.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
writeFileSync('tmp/test-output.html', `<!doctype html><html lang="en"><meta charset="utf-8"><title>Nocturne test evidence</title><style>body{background:#202620;color:#e4e9dd;margin:0;padding:40px;font:14px/1.7 monospace}h1{font:600 24px sans-serif;margin:0 0 12px}p{color:#acb49f;margin:0 0 26px}pre{white-space:pre-wrap;border-top:1px solid #485242;padding-top:20px}</style><h1>Nocturne: local test run</h1><p>Actual captured output: node node_modules/vitest/vitest.mjs run --reporter=verbose<br>Exit code: ${result.status} | ${new Date().toISOString()}<br>Generated contract execution tests. No network settlement is implied.</p><pre>${escaped}</pre></html>`);
process.stdout.write(output);
process.exit(result.status ?? 1);
