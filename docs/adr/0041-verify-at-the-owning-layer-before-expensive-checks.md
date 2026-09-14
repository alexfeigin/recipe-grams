---
status: accepted
---

# Verify at the owning layer before expensive checks

Tests that require a build or browser for pure rules delay feedback, while
duplicated assertions can drift apart. Check source rules with independent
fixtures before building, publication contracts against the build, and reader
interactions in the browser, with one owner for each assertion. Use a preview
owned and identified by the verification run so another server cannot yield a
false pass.

## Consequences

Link existence differs from expected navigation; search artifacts differ from
search content and interactions. Keep these assertions with their respective
owners instead of repeating them across suites.

[Development](../development.md) owns the commands, execution order, preview
lifecycle, and artifact locations. The runner's preview identity and cleanup are
part of verification correctness, not just test setup.

Consolidates historical ADRs 0031, 0033; see the
[original records](../history/decisions.md#topic-index).
