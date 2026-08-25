# Release Gate

```sh
npm ci && npx playwright install chromium && npm run gate
```

Requires Node.js 20 or newer.

The Agent Shop fixture in `app/` was written by an agent. It is a dependency-free, in-memory Node HTTP app with only login and cart flows; its cart client contains a real stale-response race during concurrent additions.

Blocked PR: [agent-cart-race → main](https://github.com/axelignis/release-gate2/pull/1)

Rule: a test that both passes and fails across five runs is unstable; the gate blocks when unstable tests / total tests exceeds `0.0200`, while a test that fails all five runs is broken and blocks directly.

## Actual blocked run

```text
> release-gate@1.0.0 gate
> node src/run-gate.js

Run 1/5: failed
Run 2/5: passed
Run 3/5: failed
Run 4/5: passed
Run 5/5: failed
BLOCKED
Reason: flake rate 0.2500 (1 unstable / 4 total) exceeds threshold 0.0200
Runs: 5
Unstable tests: flows.spec.js › cart keeps the latest badge after concurrent additions
Broken tests: none
```

## Measured calibration

The recorded five-run sample measured a `0.2500` flake rate: 1 unstable test among 4 total tests. The threshold is `0.0200`; it keeps the accepted rate below the first observable non-zero rate in this four-test suite, so the measured race at 12.5 times the threshold is blocked.
