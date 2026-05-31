# Next.js AI API — Engineering Guidelines

Read before modifying API routes, DeepSeek calls, or structured outputs.

## Project Structure

- **Framework**: Next.js 16 App Router (Turbopack)
- **API routes location**: `app/api/*/route.ts` (current project convention)
- **Types**: Shared in `app/data/mockResults.ts` — reuse, don't duplicate
- **Client pages**: `app/evaluate/page.tsx`, `app/ab-test/page.tsx`, `app/sop/page.tsx`

## Environment Variables

### Hard Rules
1. **NEVER** read, print, log, or commit `.env` or `.env.local` files
2. **NEVER** write real API keys into any file (code, README, mock data, comments, logs)
3. When environment variables are needed, create or update **only** `.env.example` with placeholder values
4. The `.gitignore` already ignores `.env*` with an exception for `.env.example` — do not change this

### Current Environment Variables
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

DeepSeek API Key must ONLY be accessed via `process.env.DEEPSEEK_API_KEY`. No other method is acceptable.

## Calling DeepSeek API

### Use fetch, Not SDKs

```typescript
// CORRECT — native fetch, no dependency
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [...],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  }),
});
```

Do NOT install `openai`, `@anthropic-ai/sdk`, or any other LLM SDK. Use `fetch`.

### Mandatory Error Handling

Every LLM API call MUST be wrapped in try/catch. Fallback conditions:

| Condition | Action |
|---|---|
| `DEEPSEEK_API_KEY` undefined or placeholder | Throw → fallback to mock |
| API response not `ok` (status ≠ 2xx) | Throw with status + error text → fallback to mock |
| Response body missing `choices[0].message.content` | Throw → fallback to mock |
| `JSON.parse()` fails on response content | Strip markdown fences, retry parse; if still fails, throw → fallback to mock |
| Parsed JSON fails `isValidEvaluationResult()` | Throw → fallback to mock |

### Fallback Chain
```
API Key present? → Call API → Parse JSON → Validate fields → Return result
     ↓ no              ↓ fail      ↓ fail      ↓ fail
     └──────────────→ Return mockResult from app/data/mockResults.ts
```

The API route returns `{ ...result, _fallback: true }` on fallback so the frontend can show a subtle indicator.

### Response Format
- All API responses must return JSON compatible with `EvaluationResult` type
- The frontend destructures `_fallback` and uses the rest as the result
- Never let the frontend parse markdown — the API must return clean JSON

## route.ts Conventions

```typescript
// POST handler signature
export async function POST(request: Request) {
  // 1. Parse body
  // 2. Validate required fields
  // 3. Try DeepSeek call
  // 4. On failure, fallback to getMockResult()
  // 5. Return Response.json(...)
}
```

- Use `Response.json()` for all responses (Next.js 16 convention)
- Validate platform field against `['xiaohongshu', 'douyin']`
- Log errors server-side with `console.error` — do NOT expose error details to client

## Type Compatibility

The frontend `EvaluationResult` type in `app/data/mockResults.ts` is the source of truth. API responses must match this structure:

```typescript
interface EvaluationResult {
  audiencePersona: AudiencePersona;
  triFlowScores: TriFlowScores;
  badcases: BadcaseItem[];
  promptV2: PromptV2;
}
```

Do NOT create parallel type definitions. Import from `@/app/data/mockResults` in route.ts.

## Build Check

After ANY API route modification, run:
```bash
npm run build
```

If it fails, fix TypeScript/lint errors before considering the change complete.
