'use strict';

function evaluateRuns(runs, threshold) {
  const outcomes = new Map();

  for (const run of runs) {
    for (const test of run.tests) {
      if (!outcomes.has(test.id)) outcomes.set(test.id, []);
      outcomes.get(test.id).push(test.status);
    }
  }

  const unstable = [];
  const broken = [];

  for (const [id, statuses] of outcomes) {
    const passed = statuses.includes('passed');
    const failed = statuses.includes('failed');
    if (passed && failed) unstable.push(id);
    if (statuses.length === runs.length && statuses.every((status) => status === 'failed')) {
      broken.push(id);
    }
  }

  const totalTests = outcomes.size;
  const flakeRate = totalTests === 0 ? 0 : unstable.length / totalTests;

  return {
    blocked: broken.length > 0 || flakeRate > threshold,
    broken,
    unstable,
    totalTests,
    flakeRate,
    threshold,
    runCount: runs.length
  };
}

module.exports = { evaluateRuns };
