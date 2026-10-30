# Understand and modify RcTrace

## Explain the useful result

Run `npm run dev`, click **Load sample**, and point out a flag with its command and source path. The deterministic parser in `public/src/standout.js` reads Bazel's announced rc-file options. `public/app.js` renders known options by role.

The sample came from a real Bazel 9.3.1 invocation against a temporary minimal workspace. Bazel said an `--action_env` change discarded its analysis cache. The target had no actions to build. That proves the parser handles Bazel's current announced format. It does not prove a remote-cache miss or hit.

## Investigate a failure

Try text that has no announcement lines. RcTrace should show an empty result. Then add a made-up `--future_cache_option` to a correctly shaped line. The parser should ignore that flag instead of guessing what it means.

The current format uses a `Reading rc options` line followed by an indented command-options line. The parser also supports the older single-line form. The test suite checks both.

## Predict and make a change

Add a `--disk_cache=/tmp/actions` line to the sample. Before reloading, predict that it will appear under **Action cache** and retain the path Bazel announced. Add a parser test, implement the classification in `OPTION_GUIDE`, and verify both the result and its source path.

## Explain the boundary

`--announce_rc` tells you which options Bazel read from rc files. It does not show the final value after all command-line inputs and config expansion. For a cache diagnosis, inspect Bazel's canonical expanded command line and action-level evidence too. RcTrace intentionally does not compute precedence or explain a cache miss.

## Evidence levels

- Verified locally: current-format Bazel capture, parser tests, Chrome sample/paste/empty flows, responsive layout, and static Worker asset dry-run.
- Not established: a remote cache hit or miss, use by an independent Bazel team, production adoption, or a measured time saving.
