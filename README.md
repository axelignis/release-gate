# Release Gate

```sh
npm ci && npx playwright install chromium && npm run gate
```

Requires Node.js 20 or newer.

`npm run gate` starts the Agent Shop app on `127.0.0.1:4173`, runs the Playwright
suite in `e2e/` five times with the JSON reporter, normalizes each report through
`src/playwright-adapter.js`, and scores the five runs together.

Rule: a test that both passes and fails across five runs is unstable; the gate blocks when unstable tests / total tests exceeds `0.0200`, while a test that fails all five runs is broken and blocks directly.

## What is in the repository

| Path | Contents |
| --- | --- |
| `app/server.js` | The Agent Shop fixture, written by an agent: a dependency-free, in-memory Node HTTP app with only login and cart flows. |
| `e2e/flows.spec.js` | The four Playwright specs the gate runs — two login, two cart. |
| `playwright.config.js` | One chromium project, `workers: 1`, `retries: 0`, so a repeated run measures the app and not the runner. |
| `src/run-gate.js` | The five-run driver: boots the app, runs Playwright, writes `.playwright-results/` and `results/`, then calls the scorer. |
| `src/playwright-adapter.js` | Maps a Playwright JSON report onto the gate contract. |
| `src/gate.js`, `src/report.js` | The unstable/broken rule and its printed report. |
| `src/cli.js` | Scores a directory of already-normalized runs: `npm run gate:fixtures fixtures/flaky`. |
| `fixtures/clean`, `fixtures/flaky` | Two recorded five-run samples, used by the tests and by `gate:fixtures`. |
| `test/` | `npm test` — unit tests for the rule, the adapter, and the CLI. |
| `.github/workflows/release-gate.yml` | Installs chromium, then runs `npm test` and `npm run gate` on every pull request. |

## On `main` the gate passes

The stale cart response race was fixed on `main` in c0cacde: the cart client tags
each add and paints the badge only when the response is newer than the one already
painted. Five runs, all green:

```text
> release-gate@1.0.0 gate
> node src/run-gate.js

Run 1/5: passed
Run 2/5: passed
Run 3/5: passed
Run 4/5: passed
Run 5/5: passed
PASSED
Flake rate: 0.0000 (0 unstable / 4 total), threshold 0.0200
Runs: 5
Unstable tests: none
Broken tests: none
```

## The blocked run

The race still lives on branch `agent-cart-race`, which removes that guard and is
open as [agent-cart-race → main](https://github.com/axelignis/release-gate/pull/1).
That branch is where the blocking sample comes from:

```text
> release-gate@1.0.0 gate
> node src/run-gate.js

Run 1/5: passed
Run 2/5: failed
Run 3/5: passed
Run 4/5: failed
Run 5/5: failed
BLOCKED
Reason: flake rate 0.2500 (1 unstable / 4 total) exceeds threshold 0.0200
Runs: 5
Unstable tests: flows.spec.js › cart keeps the latest badge after concurrent additions
Broken tests: none
```

## Measured calibration

The recorded five-run sample measured a `0.2500` flake rate: 1 unstable test among 4 total tests. The threshold is `0.0200`; it keeps the accepted rate below the first observable non-zero rate in this four-test suite, so the measured race at 12.5 times the threshold is blocked.
