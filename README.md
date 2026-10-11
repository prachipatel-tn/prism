# Prism

Prism is a browser-based data investigation app built for Week 1, Path C. It reveals when a rising overall conversion rate hides declining performance within customer groups. It uses transparent arithmetic and rules, not a runtime AI model. No paid service, account, API key, or database is required.

## Start locally

Install Node.js 22.13 or newer and pnpm 11.25.0, then run:

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173. Keep the terminal running during your demonstration.

```sh
pnpm test
pnpm typecheck
pnpm build
```

The source uses React, TypeScript, Vinext and Vite. The starter includes an optional Cloudflare/Sites build integration. Prism runs locally; no hosted service or account is required.

## Demo in four steps

1. Open Investigation with The hidden reversal. Overall conversion rises from 20% to 45.6%, but every segment declines.
2. Investigate Every segment improved (Contradicted), then Overall conversion increased (Supported), then the causal claim (Needs review).
3. Open Sandbox. Change counts or select Growth that holds up. Charts and verdict inputs recalculate. Reset returns to the original example.
4. Open Evaluation lab and Run local benchmark. The headline-only baseline matches 5 of 12 labels, while the claim-aware checks match 12 of 12.

The local benchmark is a set of authored demonstration cases developed alongside the rules, not an independent estimate of accuracy or an AI model evaluation.

## CSV contract

UTF-8 CSV, up to 500 KB and 5,000 summary rows, with exactly these headers in any order:

```csv
period,segment,visitors,conversions
before,New customers,800,80
before,Returning customers,200,120
after,New customers,200,16
after,Returning customers,800,440
```

Use one row per period and segment, up to 20 segments. Period is `before` or `after`. Counts must be nonnegative whole numbers; conversions cannot exceed visitors. Duplicate rows, empty numeric cells, malformed quotes and invalid counts are rejected. Missing segment-periods and zero denominators trigger review.

The included datasets are synthetic, with no real customer records. Imported data, sandbox edits, claim checks and evaluations stay in browser memory. Refreshing the page clears edits; download your CSV or report first.

## Calculations and limits

- Segment conversion = conversions / visitors.
- Overall conversion = total conversions / total visitors. Do not average group percentages.
- Same-mix after rate = sum of each after segment rate multiplied by its before-period visitor share.
- `pp` means percentage points, not relative percent change.
- The reversal example yields a same-mix after rate of 17.4%, down 2.6 percentage points from 20%.
- Any segment-period below 30 visitors triggers a conservative review policy. This is not a statistical significance test.
- Missing groups and zero denominators trigger review. The causal claim always requires review because no causal study design is supplied.
- Period comparability, non-overlapping groups, unique visitor counts and consistent definitions remain data-owner assumptions.

The app supports three explicit claims rather than arbitrary natural-language analysis. It provides no confidence intervals, automatic causal attribution or automated business decisions.

## Architecture

CSV or sample data -> validation -> weighted calculations -> charts and claim checks -> downloadable report.

Sandbox edits feed the same calculations. The local benchmark reuses the same functions against fixed reference labels. AI was used to write and refine the application during development, not to generate its runtime answers.

## Source map

- `app/page.tsx`: interface, sandbox and report export.
- `app/globals.css`: responsive visual design.
- `lib/analysis.ts`: schemas, scenarios, arithmetic, rules and CSV parser.
- `tests/analysis.test.mjs`: numerical and data-validation checks.
- `public/prism-example.csv`: importable sample file.

## Presentation and demo assets

- [Prism use case](docs/Prism-Use-Case.docx).

- [Three introductory slides](docs/Prism-Introduction.pptx).
- [Importable campaign dataset](data/campaign-test.csv).

## Development

Built with Codex assistance. The application uses local calculations and explicit rules, with no runtime AI model. Run the tests and type checks before committing changes. Generated files, dependencies, environment files and local tool state are excluded from Git.
