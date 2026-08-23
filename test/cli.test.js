'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('CLI rejects an unknown status with exit 2', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-gate-'));
  try {
    fs.writeFileSync(path.join(directory, 'run-1.json'), JSON.stringify({
      run_id: 1,
      tests: [{ id: 'checkout', status: 'timedOut' }]
    }));
    const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'src', 'cli.js'), directory], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /invalid test status "timedOut"/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
