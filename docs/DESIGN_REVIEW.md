# RcTrace interface and visual proof

## Design choices

The page is a small workbench. A two-column layout pairs the announcement editor with grouped results. On narrow screens it stacks the editor above the results. A short provenance note stays above the results because the main risk is reading a source path as proof of precedence.

The palette uses a cool paper background, white work areas, ink text, thin dividers, and one blue accent. System fonts keep the page quick to load. Monospace is reserved for Bazel options and source paths. Buttons, textarea, links, and the explanatory disclosure have visible keyboard focus. The layout uses no decorative imagery.

## Visual journey proof

- Reviewer: Codex using image-capable inspection of saved Chrome screenshots.
- Source: local RcTrace static files after `npm run verify`.
- Target: local Chrome served by `tools/static-server.mjs`.
- Desktop: 1280 px, empty and sample-loaded states. Inspected `empty-preview.png` and `demo-final.png`.
- Mobile: 390 px, sample-loaded state. Inspected `mobile-preview.png`; no horizontal overflow.
- Findings fixed: the sample textarea opened at its final line on mobile. The sample action now resets the scroll position and caret. The empty placeholder now describes the task instead of showing an obsolete one-line example.
- Other browser proof: sample, pasted current-format output, unknown-option filtering, clear state, and no external requests passed in Chrome.

The deployed page has not been inspected because Cloudflare OAuth approval is pending. Local screenshots and browser checks do not establish live deployment behavior.
