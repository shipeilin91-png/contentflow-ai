# ContentFlow AI

平台感知型 AIGC 内容质量评测与 PromptOps 工作台。

## Live Demo

- Live Demo: https://contentflow-ai-rouge.vercel.app
- Portfolio: https://bcnjcsfiizh3.feishu.cn/wiki/MC4Bwt4lli6XnUkP18Nckjtonl5
- Note: Vercel may be unstable in mainland China; screenshots are available in the portfolio.

## Product Positioning

ContentFlow AI is not a generic AIGC content generator. It is a content quality evaluation and PromptOps workspace for creators and operators working with Xiaohongshu / Douyin-style content.

The product focuses on what happens after AI generates content:

- 判断 AI 内容是否适配平台机制、目标受众和内容目标。
- 输出 0-100 评分、风险等级、问题归因、置信度信号和 Prompt 优化建议。
- 将单次评测沉淀为 Prompt 版本、SOP 模板、评测样本和人工校准反馈。
- 用 synthetic benchmark 验证 Prompt 优化、A/B 测试、PGC 对比和风险识别效果。

## User Problems

- AI 内容生成很快，但运营人员很难判断它是否真的适合小红书 / 抖音。
- Prompt 优化依赖个人经验，缺少可复盘的评分、问题归因和版本记录。
- AIGC 与优质 PGC 的差距不清楚，难以提炼可迁移的内容策略。
- 风险内容不知道哪些需要人工优先复核，容易遗漏夸大宣传、未支撑功效或输入信息不足等问题。
- 优质内容结构和 Prompt 策略难以沉淀为可复用 SOP。

## Core Highlights

### Content Effectiveness Framework

将内容质量拆解为平台适配、受众适配和目标适配三类指标，输出 0-100 分评分、风险等级和人工复核建议，帮助运营人员快速判断内容是否值得继续优化或发布前复核。

### AI Evaluation + Human Calibration

设计多评审、置信度评分、风险识别和人工校准流程，让 LLM-as-a-Judge 的结果不只是“模型自评”，而是可以被人工反馈持续校准的评测链路。

### PromptOps Loop

将评测结果拆解为 badcase diagnosis、Prompt v2、A/B 验证、Prompt 版本库、SOP 模板和评测样本库，形成从内容问题发现到 Prompt / SOP 沉淀的闭环。

### Benchmark Validation

基于 60 条 synthetic benchmark cases 验证内容评测、A/B 测试、PGC 对比和风险识别链路，用结构化报告观察 Prompt 优化是否真正带来质量提升。

## Key Features

### Content Evaluation

对单条 AI 内容进行平台感知评测，输出 TriFlow 分数、风险等级、受众画像、badcase 归因和 Prompt v2 优化建议。适合运营人员快速判断内容是否需要重写、优化或人工复核。

### Batch Evaluation

批量评测多条内容，帮助用户在多个候选版本中快速筛选质量较高、风险较低的内容。它更适合内容生产链路中的初筛和复盘，而不是只看单条内容表现。

### A/B Testing

对比 Prompt A / Prompt B 生成结果，判断 Prompt 优化是否带来更高内容适配度。该模块帮助用户把“感觉更好”转化为可记录的分数差异、winner 判断和改进方向。

### PGC Comparison

将 AI 内容与合成 PGC 标杆内容进行对比，识别结构差距、信任信号差距和可迁移策略。它用于解释 AIGC 为什么“不像优质内容”，并为 SOP 沉淀提供依据。

### Prompt Versions

保存 Prompt v2、A/B winner 和策略说明，形成可复用的 Prompt 版本库。用户可以追踪 Prompt 改动原因、预期提升点和适用平台。

### Evaluation Dataset

将典型评测样本加入数据集，用于后续复盘、人工校准和 benchmark 扩展。它让单次评测不只是一次性结果，而是可以进入长期优化资产。

### SOP Templates

把有效 Prompt、内容结构和平台经验沉淀为 SOP 模板，支持内容团队复用经过验证的表达框架。适合将高频 badcase 和优秀策略转化为可执行流程。

### Quality Dashboard / Benchmark

Dashboard 用于查看个人质量沉淀与评测趋势；Benchmark case library 和 runner 用于本地自动测试内容评测、A/B 测试、PGC 对比和风险识别链路，并生成 JSON / CSV / Markdown 分析报告。

## Benchmark Results

The current benchmark uses synthetic platform scenarios rather than copied Xiaohongshu / Douyin posts.

- 60 synthetic benchmark cases
- Prompt B win rate: 100%
- Average score improvement: +32.7
- Medium/high-risk content identified: 30%
- High-risk content identified: 16.7%
- PGC comparison extracts AIGC weaknesses and transferable strategies

These results come from synthetic benchmark cases and do not represent real platform traffic, recommendation results, or conversion performance.

## Product Workflow

Input AI content / Prompt / PGC reference  
→ Evaluation by platform, audience, and goal fit  
→ Score, risk level, and badcase analysis  
→ Prompt v2 / A/B comparison / PGC gap analysis  
→ SOP and evaluation dataset  
→ Benchmark validation

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vercel
- API Routes
- Supabase Auth / Cloud Sync Foundation
- Prompt Engineering
- LLM-as-a-Judge
- Benchmark Runner

## Current Boundaries

- Current benchmark is synthetic, not real user data.
- LLM-as-a-Judge still requires human calibration.
- Vercel may be unstable in mainland China.
- Future work: real user samples, manual annotation, improved rubric, and dashboard analytics.

## My Role

As the project owner, I was responsible for product positioning, evaluation framework design, PromptOps workflow design, benchmark case design, frontend workflow, and portfolio packaging.
