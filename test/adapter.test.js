'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { adapt } = require('../src/playwright-adapter');

test('adapter maps Playwright terminal failures into the gate contract', () => {
  const report = { suites: [{ specs: [
    { file: 'flow.spec.js', title: 'times out', tests: [{ results: [{ status: 'timedOut' }] }] },
    { file: 'flow.spec.js', title: 'is interrupted', tests: [{ results: [{ status: 'interrupted' }] }] },
    { file: 'flow.spec.js', title: 'works', tests: [{ results: [{ status: 'passed' }] }] }
  ] }] };
  assert.deepEqual(adapt(report, 3), {
    run_id: 3,
    tests: [
      { id: 'flow.spec.js › times out', status: 'failed' },
      { id: 'flow.spec.js › is interrupted', status: 'failed' },
      { id: 'flow.spec.js › works', status: 'passed' }
    ]
  });
});
