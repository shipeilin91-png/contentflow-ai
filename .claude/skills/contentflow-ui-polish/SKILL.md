# ContentFlow UI Polish Skill

## Purpose

Use this skill when improving the frontend UI of ContentFlow AI.

ContentFlow AI is a platform-aware AIGC content strategy evaluation workspace. It should look like a credible AI product manager / content operations dashboard, not a generic AI writing toy, not a literary app, and not a flashy landing page.

The UI should communicate:
- Professional ToB-like AI workspace
- Structured evaluation workflow
- Platform intelligence (小红书 vs 抖音 differentiation)
- Audience intelligence (psychological needs, trust barriers)
- Content quality governance (scores, badcases, evidence, fixes)
- Clear data hierarchy (overview → detail → drill-down)
- Trustworthy AI evaluation results (scores are for reference, not guaranteed outcomes)

## Design Direction

Use a clean, modern dashboard style inspired by shadcn/ui dashboard patterns and professional AI workspaces.

### Preferred
- White / soft gray background (`#f8fafc` or `#f6f7f9`)
- Clean cards with subtle borders (`border-slate-200`)
- Light shadows only when useful (`shadow-sm` at most)
- Restrained accent colors — one primary, plus semantic colors for scores
- Clear typography hierarchy — heading → subheading → label → body → caption
- Plenty of whitespace — dense but readable information layout
- Slightly rounded corners (`rounded-xl` or `rounded-2xl`), not huge pill shapes
- Desktop-first layout, mobile-safe (no horizontal scroll, no white screen)

### Avoid
- Overly colorful gradients or rainbow dashboards
- Childish illustrations or decorative doodads
- Random emojis scattered through the UI
- Huge rounded blobs or bubble shapes
- Dark neon cyberpunk style
- FanForge / literary beige editorial style
- Generic blue SaaS template feeling
- Cluttered cards with too much text in one block
- Decorative elements that don't support the evaluation workflow
- Heavy box shadows or 3D effects

## Color and Visual System

### Base Palette
```
Page background:  #f8fafc (slate-50) or #f6f7f9
Card background:  #ffffff
Primary text:     #0f172a (slate-900)
Secondary text:   #64748b (slate-500)
Muted text:       #94a3b8 (slate-400)
Border:           #e2e8f0 (slate-200)
```

### Semantic Colors
```
Primary accent:  indigo-600 / indigo-700 (buttons, links, active states)
Positive:        emerald-600 / emerald-700 (high scores, improvements, "good")
Warning:         amber-600 / amber-700 (mid scores, fallback indicators)
Risk/Error:      red-500 / rose-600 (low scores, badcases, regressions)
Info:            blue-600 (audience insights, neutral data)
```

### Color Usage by Context
| Context | Color | Usage |
|---|---|---|
| Platform Fit score | emerald if ≥70, amber if ≥50, red if <50 | Score card background + number |
| Audience Fit score | emerald if ≥70, amber if ≥50, red if <50 | Score card background + number |
| Creator Goal Fit score | emerald if ≥70, amber if ≥50, red if <50 | Score card background + number |
| Overall score | emerald if ≥70, amber if ≥50, red if <50 | More prominent, often in indigo tint |
| Improvement delta (positive) | emerald-600 | +N label |
| Regression delta (negative) | red-500 | −N label |
| Platform badge (小红书) | indigo tint or rose tint | Small inline badge |
| Platform badge (抖音) | different from 小红书 | Small inline badge |
| Badcase layer: platform | emerald-100 bg, emerald-700 text | Layer badge |
| Badcase layer: audience | blue-100 bg, blue-700 text | Layer badge |
| Badcase layer: creator | purple-100 bg, purple-700 text | Layer badge |
| Fallback indicator | amber-50 bg, amber-700 text, amber-200 border | Subtle banner |
| Winner badge (Prompt v2) | emerald-100 bg, emerald-700 text | A/B Test results |
| Winner badge (Prompt v1) | zinc-100 bg, zinc-600 text | A/B Test results |

Use accent colors to **distinguish meaning**, not to decorate. Avoid turning the page into a rainbow dashboard.

## Layout Principles

### Page Container
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
```

### Workspace Split (evaluate, ab-test, compare)
```
Desktop: grid grid-cols-1 lg:grid-cols-2 gap-6
  Left:  input / configuration form
  Right: results / analysis output

Mobile: single column, input stacks above output
```

### Content Pages (sop, dashboard)
```
Full-width card grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
```

### Rules
- Use consistent max-width across all pages
- Never use fixed widths that break at 375px viewport
- Never use `min-w` values that cause horizontal scroll
- Never set `overflow-hidden` on body-level containers
- Every page must remain readable on mobile — even if desktop is the primary experience
- Keep sticky panels only if they don't break mobile scroll

## Component Rules

### Cards
```html
<!-- Standard result card -->
<section class="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
  <h3 class="flex items-center gap-2 text-sm font-semibold text-zinc-800">
    <!-- Icon badge + title -->
  </h3>
  <!-- content -->
</section>
```
- Use `rounded-xl` (12px) for section cards
- Use `border border-zinc-200` for consistent borders
- Use `bg-white` for all cards on gray background
- Use `shadow-sm` only when the card needs to lift from background
- Never use `shadow-md` or heavier — it looks like a marketing landing page

### Score Cards (inside TriFlow score grids)
```html
<div class="rounded-lg border p-3 bg-emerald-50 border-emerald-200">
  <span class="block text-xs font-medium text-zinc-500">Platform Fit</span>
  <span class="mt-1 block text-xl font-bold text-emerald-600">78</span>
</div>
```
- Grid of 2×2 or 4 columns
- Each card: label + large number + colored background by score tier
- Color the background lightly, color the number strongly

### Buttons

Primary:
```html
<button class="flex h-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
```

Secondary / ghost:
```html
<button class="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
```

Destructive (clear history, etc.):
```html
<button class="inline-flex h-8 items-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 hover:bg-red-50">
```

Button labels should be action-oriented: "Run Evaluation" / "Run A/B Evaluation" / "Run Contrast Analysis" / "Clear History". Never use vague labels like "Submit" or "Go".

### Badges
```html
<!-- Platform badge -->
<span class="inline-flex rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
  小红书
</span>

<!-- Layer badge (badcase) -->
<span class="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 border-emerald-200">
  platform
</span>

<!-- Source badge (dashboard) -->
<span class="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium border-indigo-200 bg-indigo-50 text-indigo-600">
  Evaluation
</span>
```
- Keep badges compact: `text-[10px]`, `px-1.5 py-0.5`
- Use borders to define badge shape at small sizes
- Never overuse badges — one or two per item is enough

### Forms

Input:
```html
<input class="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300">
```

Textarea:
```html
<textarea rows="4" class="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none">
```

Form rules:
- Every input/textarea must have a visible `<label>`
- Labels: `text-xs font-medium text-zinc-500 mb-1.5`
- Placeholder text should be helpful examples, not just field name repeated
- Textarea rows: 3-5 depending on expected content length
- Use `resize-none` on textareas to maintain layout
- Group related fields with clear dividers or spacing

### Score Display
- Use score cards with **label + score + context** (not just bare numbers)
- Display 0–100 integers prominently
- Show deltas with `+` / `−` prefix and color:
  ```html
  <span class="text-xs font-mono font-semibold text-emerald-600">+12</span>
  <span class="text-xs font-mono font-semibold text-red-500">−5</span>
  ```
- Include brief interpretation alongside scores when space permits

### Badcases
Each badcase card must show:
1. **Layer badge** (platform / audience / creator)
2. **Type** (specific issue name)
3. **Evidence** (原文引用, visually distinct from fix)
4. **Fix** (actionable, in positive/emerald color)

```html
<div class="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
  <div class="flex items-center gap-2 mb-1.5">
    <span class="layer-badge">platform</span>
    <span class="text-xs font-medium text-zinc-700">Issue Type</span>
  </div>
  <p class="text-xs text-zinc-500 mb-1">
    <span class="font-medium text-zinc-400">Evidence: </span>原文引用...
  </p>
  <p class="text-xs text-emerald-600">
    <span class="font-medium text-emerald-500">Fix: </span>改进方案...
  </p>
</div>
```
- Never merge evidence and fix into one paragraph
- Keep each badcase card compact — 4-6 lines max

## Page-Specific Guidance

### Home Page (`/`)
- Immediately explain what ContentFlow is (platform-aware AIGC evaluation, not a copywriter)
- Highlight the TriFlow framework visually: Platform Fit / Audience Fit / Creator Goal Fit
- Show the workflow: Audience Persona → Evaluation → Badcase Diagnosis → Prompt v2 → A/B Test → SOP Codification
- Each workflow step should link to its page
- Avoid long marketing paragraphs — this is a workspace, not a sales page

### Evaluate Page (`/evaluate`)
- Form must be easy to scan — platform toggle at top, goal selector below
- Platform selection should feel like a meaningful choice (小红书 vs 抖音 = different evaluation rubrics)
- Results should look like a **professional evaluation report**, not a chatbot response
- TriFlow scores must be visually prominent with color-coded backgrounds
- Prompt v2 should be displayed in a copyable `<pre>` block with monospace font
- Fallback indicator should be visible but not alarming (amber, not red)

### A/B Test Page (`/ab-test`)
- Clear visual separation between Prompt v1 (Side A, gray/neutral) and Prompt v2 (Side B, indigo/accent)
- Winner should be visually obvious — badge + color + score delta
- Score comparison table must align A/B/Δ columns precisely
- Deltas positive = emerald, negative = red, zero = gray
- Keep A/B input forms balanced — same height, same field count per side

### Compare Page (`/compare`)
- Emphasize PGC vs AIGC **gap analysis**, not "which is better"
- Use labels that reinforce ethical stance: "Transferable Rules" (not "Copy These"), "Structure Extraction" (not "Imitation")
- AIGC Weaknesses section uses red accent; PGC Strengths uses emerald
- Platform-specific Insights section should show the current platform name as a badge
- SOP Potential section should clearly indicate yes/no with color

### SOP Page (`/sop`)
- Templates should feel like **reusable operational assets**, not static documentation
- Each SOP card must show: platform, goal, audience, structure outline, prompt template, evaluation rubric
- Cards should be scannable in a grid — user should grasp the template in 5 seconds
- Include "Use This Template" or "Copy Prompt" affordance per card

### Dashboard Page (`/dashboard`)
- Top-level metrics in a 4-column overview row (desktop) / 2×2 grid (mobile)
- Use simple number cards — no chart libraries unless explicitly requested
- Platform distribution: simple bar chart with CSS widths (no library)
- Top Badcase Types: ranked list with frequency count
- Recent History: compact list items with source badge + platform badge + score + date
- Empty state must have clear CTAs to `/evaluate` and `/ab-test`

## Responsiveness

Mobile must not white-screen. Test at 375px width mentally.

### Tailwind Responsive Patterns
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
flex flex-col md:flex-row
text-2xl md:text-3xl
px-4 sm:px-6 lg:px-8
space-y-6 lg:space-y-0 lg:gap-6
```

### Mobile Rules
- Left/right split layouts stack vertically on mobile (input top, results bottom)
- Navigation should not overflow — if too many links, consider a mobile menu
- Cards should be full-width on mobile, not shrunken
- Score grids should go from 4-column to 2-column on mobile
- Text should never truncate critically on mobile — allow wrapping
- Buttons should be full-width or at least 44px tall for touch

Never rely on desktop-only layout assumptions.

## Accessibility and Usability

- Use semantic heading hierarchy (h1 → h2 → h3)
- Maintain WCAG AA contrast minimums for text (4.5:1 for normal text, 3:1 for large text)
- Buttons must be keyboard-focusable (always use `<button>`, not `<div onClick>`)
- Every input must have an associated `<label>`
- Important information must not be hidden behind hover-only interactions
- Color must not be the only differentiator — use labels alongside color
- Score numbers alone are not enough — include labels

## Content Tone Guidelines

Labels and microcopy should sound:
- Professional but not cold
- Precise but not academic
- Actionable but not pushy
- Chinese-first for all user-facing text (platform names, labels, insights)
- English acceptable for technical terms (TriFlow, Platform Fit, SOP)

Examples of good microcopy:
- "Run Evaluation" (not "Submit" or "Analyze")
- "Using fallback evaluation result" (not "Error: API failed")
- "Transferable Rules" (not "Copy These Patterns")
- "Recommended: Prompt v2" (not "Winner: B")

## Development Constraints

- **Do NOT add new dependencies** unless explicitly requested by the user
- **Do NOT install UI libraries** (no shadcn/ui CLI, no Radix, no Headless UI, no Framer Motion)
- **Do NOT rewrite entire pages** — prefer targeted UI refinements
- **Preserve existing routes, data logic, and API fallback chains**
- **Preserve DeepSeek API structure** — UI changes must not break API integration
- **Preserve localStorage dashboard history** — don't change the history shape
- **Preserve platform differentiation** — 小红书 and 抖音 must remain visually and logically distinct
- **Run `npm run build` after every UI change** — if it fails, fix before considering the change complete

## Review Checklist

After any UI change, verify:

### Overall Consistency
- [ ] All 6 pages (`/`, `/evaluate`, `/ab-test`, `/compare`, `/sop`, `/dashboard`) use consistent card styles, button styles, and spacing
- [ ] Navigation bar is consistent across all pages
- [ ] Color system is applied consistently (same score → same color everywhere)

### Platform Differentiation
- [ ] 小红书 and 抖音 have visually distinct platform indicators
- [ ] Platform-specific results show meaningfully different content

### Readability
- [ ] Score cards are easy to read at a glance
- [ ] Badcase cards clearly separate layer / type / evidence / fix
- [ ] Prompt v2 text is in a copyable monospace block
- [ ] Deltas and comparisons have clear +/- and color coding

### Mobile Safety
- [ ] No horizontal scroll at 375px width
- [ ] No white screen on any page at mobile sizes
- [ ] All form inputs are usable on mobile
- [ ] Navigation does not overflow

### Build
- [ ] `npm run build` passes with zero errors
- [ ] No unintended page or route changes
