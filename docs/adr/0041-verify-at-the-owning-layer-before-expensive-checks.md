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

Use focused feedback during implementation and the final integration gate for
application logic, interaction, and recipe/site-source changes covered by it.
Documentation/report-only work needs source/diff review. A release always needs
verified current output. A passing final gate supplies the checking, build,
generated-output, and browser evidence; unchanged work does not require replaying
those stages. Failures or relevant changes invalidate affected evidence and must
be addressed before completion.

Manual publication runs its own single final gate under a checkout lock so the
helper owns the exact output it releases. Prior verification remains review
evidence, but does not substitute for this publication-owned gate; do not run a
separate gate immediately before invoking the helper.

[Development](../development.md#select-verification) owns check selection,
commands, execution order, preview lifecycle, and artifact locations.
The runner's preview identity and cleanup are
part of verification correctness, not just test setup. A command that runs a
selected browser suite owns its preview the same way, rather than trusting an
externally arranged server; the explicit-URL commands remain for deliberate
checks of another preview or the published site.

Consolidates historical ADRs 0031, 0033; see the
[original records](../history/decisions.md#topic-index).
