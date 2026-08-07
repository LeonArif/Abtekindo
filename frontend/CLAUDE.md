@AGENTS.md

## Workflow rule

- Once the agent finishes a requested fix or change, stop there. Do not spend
  further turns opening a browser tab, taking screenshots, or otherwise
  self-verifying that it works. The user tests changes themselves and will
  report back if something is wrong.
- This does not relax `tsc`/`eslint` checks or other automated
  build/type/lint verification — keep running those. It only means: skip the
  manual "let me open the browser and look" pass after a fix is applied.
