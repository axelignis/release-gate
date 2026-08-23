#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { adapt } = require('./playwright-adapter');

const root = path.join(__dirname, '..');
const rawDirectory = path.join(root, '.playwright-results');
const resultsDirectory = path.join(root, 'results');

function prepare(directory) {
  fs.mkdirSync(directory, { recursive: true });
  for (const file of fs.readdirSync(directory)) {
    if (file.endsWith('.json')) fs.unlinkSync(path.join(directory, file));
  }
}

function waitForServer(attempts = 100) {
  return new Promise((resolve, reject) => {
    const probe = (remaining) => {
      const request = http.get('http://127.0.0.1:4173/login', (response) => {
        response.resume();
        resolve();
      });
      request.on('error', () => {
        if (remaining === 0) return reject(new Error('app server did not start'));
        setTimeout(() => probe(remaining - 1), 50);
      });
    };
    probe(attempts);
  });
}

async function main() {
  prepare(rawDirectory);
  prepare(resultsDirectory);
  const server = spawn(process.execPath, [path.join(root, 'app', 'server.js')], { stdio: 'ignore' });

  try {
    await waitForServer();
    const playwrightCli = path.join(path.dirname(require.resolve('@playwright/test/package.json')), 'cli.js');
    for (let runId = 1; runId <= 5; runId += 1) {
      const run = spawnSync(process.execPath, [playwrightCli, 'test', '--reporter=json'], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
      if (![0, 1].includes(run.status) || !run.stdout) {
        throw new Error(`Playwright run ${runId} could not complete: ${run.stderr.trim()}`);
      }
      const rawFile = path.join(rawDirectory, `run-${runId}.json`);
      fs.writeFileSync(rawFile, run.stdout);
      const report = JSON.parse(run.stdout);
      const result = adapt(report, runId);
      fs.writeFileSync(path.join(resultsDirectory, `run-${runId}.json`), `${JSON.stringify(result, null, 2)}\n`);
      console.log(`Run ${runId}/5: ${run.status === 0 ? 'passed' : 'failed'}`);
    }

    const gate = spawnSync(process.execPath, [path.join(root, 'src', 'cli.js'), resultsDirectory], {
      cwd: root,
      stdio: 'inherit'
    });
    process.exitCode = gate.status;
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 2;
});
