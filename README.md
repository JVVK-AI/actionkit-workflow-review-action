# ActionKit workflow review action

A tiny, dependency-free GitHub Action that reads one workflow YAML file and writes a Markdown review report.

```yaml
- uses: JVVK-AI/actionkit-workflow-review-action@v1.0.1
  with:
    workflow-path: .github/workflows/ci.yml
```

The report lists prompts for a human reviewer, including broad permissions, floating action references, `npm install`, missing job timeout limits, and missing concurrency. It does not modify, execute, upload, or prove the safety of a workflow.

For a browser review, use [ActionKit](https://actionkit-workflow-review.jvvkmusic.chatgpt.site). The optional **9 USDC** local kit adds repeatable batch reports, a decision guide, and handoff templates; it has no subscription and does not edit workflows automatically.

## Output

By default the report is written to `actionkit-workflow-review.md` and included in the GitHub Actions job summary. Set `report-path` to choose another location. The `finding-count` action output is the number of review prompts written to the report.

## Boundaries

This is a lightweight static text review, not a security audit, policy engine, or deployment approval.

## Verification

This repository includes a GitHub Actions workflow that runs the action against a deliberately flawed fixture and checks the generated report. The workflow is a product check; it does not review or approve any external workflow.
