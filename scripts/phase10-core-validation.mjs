import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, writeJson } from './phase10-browser-helpers.mjs';

const commands = [
  ['npm', ['run', 'lint']],
  ['npm', ['run', 'test']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'audit:score']],
  ['npm', ['run', 'audit:combo']],
  ['npm', ['run', 'audit:progression']],
  ['npm', ['run', 'audit:statistics']],
  ['npm', ['run', 'audit:tutorial']],
  ['npm', ['run', 'audit:bindings']],
  ['npm', ['run', 'audit:accessibility']],
  ['npm', ['run', 'audit:source']],
  ['npm', ['run', 'audit:security']],
  ['npm', ['audit', '--json']],
];
const results = [];
for (const [command, args] of commands) {
  const started = Date.now();
  const execution = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 });
  const combined = `${execution.stdout ?? ''}\n${execution.stderr ?? ''}`;
  const testMatch = combined.match(/# tests (\d+)/);
  const passMatch = combined.match(/# pass (\d+)/);
  const failMatch = combined.match(/# fail (\d+)/);
  const result = {
    command: [command, ...args].join(' '),
    exitCode: execution.status,
    signal: execution.signal,
    durationMs: Date.now() - started,
    passed: execution.status === 0,
    tests: testMatch ? Number(testMatch[1]) : null,
    pass: passMatch ? Number(passMatch[1]) : null,
    fail: failMatch ? Number(failMatch[1]) : null,
    outputTail: combined.trim().split('\n').slice(-30),
  };
  results.push(result);
  console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.command} (${result.durationMs} ms)`);
  if (!result.passed) break;
}
const test = results.find((item) => item.command === 'npm run test');
const report = {
  generatedAt: new Date().toISOString(),
  commands: results,
  exactTestTotal: test?.tests ?? null,
  exactPassTotal: test?.pass ?? null,
  exactFailTotal: test?.fail ?? null,
  retainedTestTotal: 923,
  addedTestTotal: test?.tests ? test.tests - 923 : null,
  passed: results.length === commands.length && results.every((item) => item.passed),
};
await writeJson('PHASE10_CORE_VALIDATION.json', report);
console.log(JSON.stringify({ passed: report.passed, exactTestTotal: report.exactTestTotal, exactPassTotal: report.exactPassTotal, exactFailTotal: report.exactFailTotal }, null, 2));
if (!report.passed) process.exitCode = 1;
