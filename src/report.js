'use strict';

function decimal(value) {
  return value.toFixed(4);
}

function formatReport(result) {
  const lines = [];

  if (result.blocked) {
    lines.push('BLOCKED');
    if (result.broken.length > 0) {
      lines.push(`Reason: ${result.broken.length} broken test(s) failed all ${result.runCount} runs`);
    } else {
      lines.push(
        `Reason: flake rate ${decimal(result.flakeRate)} (${result.unstable.length} unstable / ${result.totalTests} total) exceeds threshold ${decimal(result.threshold)}`
      );
    }
  } else {
    lines.push('PASSED');
    lines.push(
      `Flake rate: ${decimal(result.flakeRate)} (${result.unstable.length} unstable / ${result.totalTests} total), threshold ${decimal(result.threshold)}`
    );
  }

  lines.push(`Runs: ${result.runCount}`);
  lines.push(`Unstable tests: ${result.unstable.length ? result.unstable.join(', ') : 'none'}`);
  lines.push(`Broken tests: ${result.broken.length ? result.broken.join(', ') : 'none'}`);
  return lines.join('\n');
}

module.exports = { formatReport };
