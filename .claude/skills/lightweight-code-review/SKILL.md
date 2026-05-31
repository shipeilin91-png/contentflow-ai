# Lightweight Code Review — Checklist

Run this review after any significant change. Output must be short: categorize each finding as **Critical**, **Should Fix**, or **Nice to Have**.

## Pre-Flight

- [ ] `npm run build` passes with zero errors
- [ ] No uncommitted `.env` / `.env.local` files in `git status`
- [ ] `git status` shows no unintended file deletions

## Page Integrity

- [ ] `/` homepage still loads without errors
- [ ] `/evaluate` page functional — platform toggle, form inputs, Run Evaluation, results display all work
- [ ] `/ab-test` page functional — dual inputs, parallel evaluation, comparison cards, next-advice all work
- [ ] `/sop` page functional — templates display correctly
- [ ] No page crashes on mobile viewport (no horizontal scroll, no content cut off)

## API & Data Integrity

- [ ] `/api/evaluate` returns correct structure on success (all `EvaluationResult` fields present)
- [ ] `/api/evaluate` returns mock fallback when `DEEPSEEK_API_KEY` is absent
- [ ] Mock fallback does NOT error — `getMockResult()` returns valid data for both `'小红书'` and `'抖音'`
- [ ] Frontend `isFallback` state properly shows "Using fallback evaluation result" indicator
- [ ] Platform differentiation preserved — 小红书 and 抖音 get different mock results and different rubrics

## Dependencies & Security

- [ ] No new dependencies added to `package.json` unless absolutely necessary
- [ ] No API keys, tokens, or secrets hardcoded in any source file
- [ ] No `process.env` values logged to console or exposed in client responses
- [ ] API error messages returned to client are generic — internal details only logged server-side

## TypeScript & Code Quality

- [ ] No excessive `any` types — use proper interfaces from `app/data/mockResults.ts`
- [ ] Field names consistent across types, API, and frontend (`platformFit` not `platform_fit`, etc.)
- [ ] No unused imports or variables (build would catch this)
- [ ] No duplicate type definitions — reuse from `app/data/mockResults.ts`

## Product Alignment

- [ ] Feature serves the "Evaluate → Attribute → Optimize → A/B → SOP" loop
- [ ] Not drifting into generic AI copywriting / content generation
- [ ] Platform scope stays at 小红书 + 抖音 (no extra platforms added without user request)
- [ ] No login, database, or team features introduced without user request

## Dangerous Operations

- [ ] No `rm -rf` or destructive filesystem commands
- [ ] No automated `git commit` or `git push`
- [ ] No modification of `.gitignore` without explicit reason
- [ ] No reading of `.env.local` or `.env`

## Output Format

When reporting review results, use this structure:

```
## Code Review — [branch/feature name]

### Critical (must fix before merge)
- item 1
- item 2

### Should Fix (important, can follow-up)
- item 1

### Nice to Have (non-blocking)
- item 1
```

Keep it concise. Do NOT suggest full-repo refactors. Do NOT auto-apply fixes unless asked.
