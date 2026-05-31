# ContentFlow AI — Product Principles

Read before designing or implementing any product feature.

## What ContentFlow AI Is

ContentFlow AI is a **platform-aware AIGC content strategy evaluation and optimization platform**.
It is NOT a generic AI copywriter or content generator.

### Target Users
- Content operations teams
- AIGC product teams
- E-commerce / short-video operations

### MVP Platform Scope
Focus exclusively on these two platforms — do NOT add more unless the user explicitly requests it:

| Platform | Paradigm | Core Mechanics |
|---|---|---|
| **小红书 (XiaoHongShu)** | Search-driven 种草 / consumer decision platform | Search intent, save/collection value, authentic experience, trust signals, soft recommendation |
| **抖音 (Douyin)** | Feed-driven short video / attention competition platform | 3-second hook, completion motivation, emotional pacing, contrast/conflict, interaction triggers, IP memorability |

## Core Framework: TriFlow

All evaluation must operate across three dimensions:

1. **Platform Fit** — Does this content work within the target platform's ecosystem and user behavior?
2. **Audience Fit** — Does this content address the target audience's psychological needs and overcome trust barriers?
3. **Creator Goal Fit** — Does this content serve the creator/brand's objectives?

## Product Loop

All features must serve this closed loop:

```
Evaluate → Attribute (badcase diagnosis) → Optimize (Prompt v2) → A/B Validate → SOP Codify
```

- **/evaluate** — Single content evaluation (inputs → TriFlow scores + badcases + optimized prompt)
- **/ab-test** — Compare Prompt v1 vs v2 side-by-side
- **/sop** — Codify winning patterns into reusable templates

Any new feature must fit into this loop. Do NOT let the product drift into being a general-purpose content generator.

## Constraints (Do NOT violate unless user explicitly overrides)

### Scope
- No login, authentication, or user accounts
- No database (no Supabase, no PostgreSQL, no Redis)
- No team/permission systems
- No multi-platform expansion beyond 小红书/抖音 unless user asks

### Evaluation Outputs Must Be Explainable
Every evaluation result must include:
- **Numerical scores** (0–100) per TriFlow dimension
- **Evidence** — direct quotes from the submitted content supporting each low score
- **Badcases** — 3–5 specific issues with layer, type, evidence, and actionable fix
- **Prompt v2** — an optimized prompt that directly addresses every identified badcase

### Prompt Optimization Rules
- Changes must trace back to specific badcases — no generic "make it better" advice
- Change reasons must cite which badcase(s) each change addresses
- Expected improvements must be directional with rough magnitude (e.g., "收藏率预估从 2% 提升至 6–8%")

## What to Avoid
- Don't turn this into a general AI copywriting tool
- Don't add platforms without user request
- Don't add heavy infrastructure (auth, DB, teams) without user request
- Don't remove mock fallbacks — the app must work without API keys
- Don't remove platform differentiation — 小红书 and 抖音 logic must stay distinct
