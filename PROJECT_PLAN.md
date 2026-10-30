# RcTrace project plan

RcTrace answers one question from Bazel diagnostics: which rc file did Bazel announce for a cache-related option?

## Scope

Input is pasted text from a Bazel invocation that used `--announce_rc`. The page identifies known options on announcement lines, retains the command scope and reported source path, and displays short explanations grounded in Bazel docs.

The project distinguishes action cache settings, action cache behavior, repository download cache, and action-configuration options. It does not determine effective precedence, prove an option affected a target, or diagnose an action cache miss.

## Prior art

Bazel documents `--announce_rc` as a way to announce rc-file options. Its [remote caching guide](https://bazel.build/remote/caching) explains remote and disk cache options. The older [remote caching debug guide](https://docs.bazel.build/versions/main/remote-execution-caching-debug.html) covers cache debugging more broadly. EngFlow's [Bazel Invocation Analyzer](https://docs.engflow.com/bia/how_to_use/github_repo.html) works from Bazel profiles to offer performance suggestions. RcTrace reads a different input for a narrower provenance question.

## Design decisions

- The deterministic parser lives in `public/src/standout.js` and runs without a server.
- The browser shows each recognized flag alongside the source and command Bazel reported.
- An explicit catalog prevents guesses for unfamiliar options.
- The sample is labeled illustrative. Acceptance tests exercise the announced-line format and failure cases.
- No accounts, AI, telemetry, or backend processing are needed.

## Proof

`public/sample.txt` is captured Bazel 9.3.1 `--announce_rc` output from a minimal `filegroup` build. It verifies Bazel's wrapped `Reading rc options` plus indented command-option format. Bazel reported an action-environment change and analysis-cache discard. The target had no actions to build and did not contact the example remote-cache endpoint. `npm test` checks that capture, source attribution, negated booleans, cache category boundaries, and malformed input. `npm run verify` also opens the static page in Chrome, exercises sample and paste flows, checks a narrow viewport, and requires the short GIF.
