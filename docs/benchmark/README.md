# ContentFlow Benchmark System

ContentFlow Benchmark 是一个本地自动化测试体系，用于验证 ContentFlow 在典型小红书 / 抖音内容场景下，对 AIGC 内容评测、A/B Prompt 对比、PGC/AIGC 差距分析、Badcase 归因、风险识别和 Prompt 优化效果的稳定性。

## 1. Benchmark 目的

- 批量测试 `/api/evaluate` 的 TriFlow 评分、Badcase、风险与 Prompt v2 输出。
- 用 `/api/evaluate` 双跑模拟 A/B 测试，观察 Prompt B 是否比 Prompt A 更贴合平台机制。
- 调用 `/api/compare` 分析合成 PGC 标杆与 AIGC 内容之间的结构差距。
- 自动生成 JSON / CSV / Markdown 报告，沉淀可用于产品复盘和作品集讲解的结构化指标。

## 2. 为什么使用合成平台场景样例

当前 benchmark 不复制真实小红书或抖音原文，而是使用“真实平台场景 + 合成测试内容”。

这样做有三个原因：

1. 避免搬运真实博主内容或平台原文，降低版权和隐私风险。
2. 可以人为设计高低质量差异，稳定测试评分区间、Badcase taxonomy 和风险识别能力。
3. 方便后续扩展人工标注集，把同一类平台问题持续沉淀为可复用测试样例。

## 3. 当前样例规模

当前版本共 90 条 benchmark case：

- evaluate：30 条
- ab-test：30 条
- compare：30 条

平台覆盖：

- 小红书：约 45 条
- 抖音：约 45 条

样例覆盖泛泛种草、夸大功效、输入信息不足、真实体验缺失、短视频 Hook 弱、完播动机不足、伪装真实体验等场景。

## 4. 如何运行

先启动本地服务：

```bash
npm run dev
```

另开一个终端运行 benchmark：

```bash
BENCHMARK_BASE_URL=http://localhost:3001 npm run benchmark
```

注意：端口需要替换为 `npm run dev` 实际显示的 Local 地址。如果未设置 `BENCHMARK_BASE_URL`，脚本默认请求 `http://localhost:3000`。

## 5. 结果文件说明

脚本会生成到 `benchmark-results/`：

- `latest-summary.md`：基础运行摘要，包含成功数、失败数、每条 case 的核心结果。
- `latest-cases.md`：全部 90 条 case 的逐条详情报告，包含原始输入、ContentFlow 输出、评分、Badcase、风险、Prompt v2、A/B 对比和 PGC 对比结果。
- `latest-analysis.md`：面向产品经理和作品集展示的数据分析报告。
- `benchmark-analysis-data.json`：结构化统计指标，方便后续写 README、简历或仪表盘。
- `latest.csv`：表格分析用数据。
- `latest.json`：完整输入与输出记录。

`benchmark-results/` 已被 `.gitignore` 排除，默认不会提交到 GitHub，也不会自动出现在 Vercel。若需要公开展示某次分析，请手动整理为 `docs/benchmark/` 下的文档或同步到项目 README。

## 6. 如何把结果用于作品集

可以谨慎引用这些来自合成 benchmark 的指标：

- Prompt B 胜出比例：用于说明 Prompt Optimizer 是否能提升平台适配分。
- averageImprovementDelta：用于说明 Prompt v2 相比 Prompt v1 的平均提升幅度。
- Top Badcase：用于说明内容质量治理中最常见的问题类型，以及如何反哺 SOP Builder。
- 风险识别数量：用于说明 Risk Assessment 可以辅助人工复核优先级排序。
- 成功率：用于说明自动化 benchmark runner 能稳定调用本地 API 并生成报告。

推荐表述：

> 基于 90 条合成 benchmark case，ContentFlow 自动完成内容评测、A/B Prompt 对比和 PGC/AIGC 差距分析，并生成结构化分析报告。指标来自合成测试集，不代表真实用户线上数据。

## 7. 边界声明

- 当前 benchmark 使用合成测试样例，不代表真实用户数据。
- 当前 benchmark 不直接复制真实小红书 / 抖音原文。
- 测试结果不代表真实平台推荐效果或真实转化预测。
- 结果用于产品验证、PromptOps 迭代和作品集展示。
- 后续可以接入真实用户授权样本和人工标注数据，进一步校准 LLM-as-a-Judge。
