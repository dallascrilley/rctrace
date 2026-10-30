import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, supportedOptions } from '../public/src/standout.js';

test('keeps rc file provenance per occurrence and labels action configuration separately', () => {
  const result = analyze([
    "INFO: Reading 'build' options from /repo/.bazelrc: --remote_cache=grpcs://cache.example.net --compilation_mode=opt",
    "INFO: Reading 'test' options from /repo/ci.rc: --remote_cache=grpcs://ci-cache --action_env=CI=true",
  ].join('\n'));
  assert.deepEqual(result.announcements.map(({ name, source, command, group }) => ({ name, source, command, group })), [
    { name: 'remote_cache', source: '/repo/.bazelrc', command: 'build', group: 'Action cache' },
    { name: 'compilation_mode', source: '/repo/.bazelrc', command: 'build', group: 'Action configuration' },
    { name: 'remote_cache', source: '/repo/ci.rc', command: 'test', group: 'Action cache' },
    { name: 'action_env', source: '/repo/ci.rc', command: 'test', group: 'Action configuration' },
  ]);
  assert.equal(result.announcements[0].value, 'grpcs://cache.example.net');
  assert.equal(result.announcements[0].explanation.includes('final effective value'), false);
});

test('parses captured Bazel 9.3.1 announce_rc output', () => {
  const output = readFileSync(new URL('../public/sample.txt', import.meta.url), 'utf8');
  const { announcements } = analyze(output);
  assert.deepEqual(announcements.map(({ name, source, command }) => [name, source, command]), [
    ['remote_cache', '/private/tmp/rctrace-bazel-fixture/.bazelrc', 'build'],
    ['compilation_mode', '/private/tmp/rctrace-bazel-fixture/.bazelrc', 'build'],
    ['repository_cache', '/private/tmp/rctrace-bazel-fixture/.bazelrc', 'build'],
    ['action_env', '/private/tmp/rctrace-bazel-fixture/.bazelrc', 'build'],
    ['remote_upload_local_results', '/private/tmp/rctrace-bazel-fixture/.bazelrc', 'build'],
  ]);
  assert.equal(analyze(output).announcements.length, 5);
  assert.equal(analyze(output).totalLines, 6);
});

test('does not promote unknown options, console noise, or unrecognized line shapes', () => {
  const result = analyze([
    "INFO: Reading 'build' options from /repo/.bazelrc: --future_cache_magic=true --remote_cache=grpc://cache",
    'INFO: Build completed successfully',
    "INFO: Reading 'build' options from /repo/.bazelrc --remote_cache=grpc://cache",
  ].join('\n'));
  assert.deepEqual(result.announcements.map((item) => item.name), ['remote_cache']);
});

test('recognizes documented negated boolean form without inventing its final state', () => {
  const { announcements } = analyze("INFO: Reading 'build' options from /repo/.bazelrc: --noremote_accept_cached");
  assert.equal(announcements.length, 1);
  assert.equal(announcements[0].name, 'remote_accept_cached');
  assert.equal(announcements[0].negated, true);
  assert.equal(announcements[0].value, null);
});

test('keeps repository download cache distinct from action cache options', () => {
  const { announcements } = analyze("INFO: Reading 'common' options from /repo/.bazelrc: --repository_cache=/tmp/repository --disk_cache=/tmp/actions");
  assert.deepEqual(announcements.map((item) => [item.name, item.group]), [
    ['repository_cache', 'Repository downloads'],
    ['disk_cache', 'Action cache'],
  ]);
  assert.match(announcements[0].explanation, /separate from the action result cache/);
});

test('rejects non-text input and reports an empty result for unsupported text', () => {
  assert.throws(() => analyze(null), /Input must be text/);
  assert.deepEqual(analyze('no Bazel announcement here').announcements, []);
});

test('keeps the supported set explicit and bounded', () => {
  assert.ok(supportedOptions.includes('remote_cache'));
  assert.ok(supportedOptions.includes('repository_cache'));
  assert.ok(supportedOptions.includes('compilation_mode'));
  assert.ok(supportedOptions.length < 30);
});
