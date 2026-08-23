'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateRuns } = require('../src/gate');

test('marks pass/fail variation as unstable', () => {
  const runs = [
    { run_id: 1, tests: [{ id: 'race', status: 'passed' }, { id: 'steady', status: 'passed' }] },
    { run_id: 2, tests: [{ id: 'race', status: 'failed' }, { id: 'steady', status: 'passed' }] }
  ];
  const result = evaluateRuns(runs, 0.02);
  assert.deepEqual(result.unstable, ['race']);
  assert.equal(result.flakeRate, 0.5);
  assert.equal(result.blocked, true);
});

test('marks a test that fails every run as broken, not unstable', () => {
  const runs = [1, 2, 3].map((run_id) => ({ run_id, tests: [{ id: 'broken', status: 'failed' }] }));
  const result = evaluateRuns(runs, 1);
  assert.deepEqual(result.unstable, []);
  assert.deepEqual(result.broken, ['broken']);
  assert.equal(result.blocked, true);
});
