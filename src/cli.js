#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { evaluateRuns } = require('./gate');
const { formatReport } = require('./report');

const VALID_STATUSES = new Set(['passed', 'failed', 'skipped']);

function loadRuns(directory) {
  const files = fs.readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) throw new Error(`no JSON runs found in ${directory}`);

  return files.map((file) => {
    const run = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
    if (!Number.isInteger(run.run_id) || !Array.isArray(run.tests)) {
      throw new Error(`${file}: expected { run_id: integer, tests: array }`);
    }
    for (const test of run.tests) {
      if (typeof test.id !== 'string' || !VALID_STATUSES.has(test.status)) {
        throw new Error(`${file}: invalid test status ${JSON.stringify(test.status)} for ${JSON.stringify(test.id)}`);
      }
    }
    return run;
  });
}

function main(argv = process.argv.slice(2)) {
  try {
    const directory = argv[0];
    if (!directory) throw new Error('usage: node src/cli.js <results-directory>');
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'gate.config.json'), 'utf8'));
    const result = evaluateRuns(loadRuns(directory), config.flake_rate_threshold);
    console.log(formatReport(result));
    return result.blocked ? 1 : 0;
  } catch (error) {
    console.error(`INPUT ERROR: ${error.message}`);
    return 2;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = { loadRuns, main };
