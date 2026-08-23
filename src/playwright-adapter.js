#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const failures = new Set(['failed', 'timedOut', 'interrupted']);

function collect(suite, tests = []) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const result = test.results.at(-1);
      let status;
      if (failures.has(result?.status)) status = 'failed';
      else if (result?.status === 'skipped') status = 'skipped';
      else if (result?.status === 'passed') status = 'passed';
      else throw new Error(`unknown Playwright status: ${result?.status}`);
      tests.push({ id: `${spec.file} › ${spec.title}`, status });
    }
  }
  for (const child of suite.suites || []) collect(child, tests);
  return tests;
}

function adapt(report, runId) {
  const tests = [];
  for (const suite of report.suites || []) collect(suite, tests);
  return { run_id: runId, tests };
}

if (require.main === module) {
  const [input, output, runId] = process.argv.slice(2);
  const report = JSON.parse(fs.readFileSync(input, 'utf8'));
  fs.writeFileSync(output, `${JSON.stringify(adapt(report, Number(runId)), null, 2)}\n`);
}

module.exports = { adapt };
