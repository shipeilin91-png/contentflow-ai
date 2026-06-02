# ContentFlow Benchmark

本目录说明本地 benchmark 体系的使用方式。测试样例均为“真实平台场景 + 合成测试内容”，不复制真实小红书或抖音原文。

## 运行方式

1. 启动本地服务：

```bash
npm run dev
```

2. 在另一个终端运行 benchmark：

```bash
BENCHMARK_BASE_URL=http://localhost:3001 npm run benchmark
```

如果未设置 `BENCHMARK_BASE_URL`，脚本默认请求 `http://localhost:3000`。

## 输出文件

脚本会生成到 `benchmark-results/`：

- `latest.json`：完整输入与输出
- `latest.csv`：表格分析用数据
- `latest-summary.md`：基础运行摘要
- `latest-analysis.md`：面向作品集的数据分析报告
- `benchmark-analysis-data.json`：关键结构化指标

`benchmark-results/` 默认不提交到 Git，仅保留 `.gitkeep`。如需沉淀某次结果，可手动复制到 docs 目录后再提交。

## 当前覆盖

- 内容评测 evaluate：10 条
- A/B 测试 ab-test：10 条，通过 `/api/evaluate` 双跑计算 winner
- PGC/AIGC 对比 compare：10 条，通过 `/api/compare` 调用

结果仅用于产品验证和作品集展示，不代表真实平台推荐效果或转化预测。
