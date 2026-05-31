// ── Evaluation Drift Monitor ──────────────────────────────────────
// Computes drift signals from existing localStorage data.
// All computation is client-side only. Call only from 'use client' components.

import type { DriftSignal, DriftSignalItem } from '@/app/types/drift';
import { getHistoryItems } from '@/app/utils/history';
import { getCalibrationFeedbacks } from '@/app/utils/calibration';
import { getEvalDatasetItems } from '@/app/utils/evalDatasetStorage';
import { computeAgreementRate } from '@/app/types/evalDataset';

const RECENT_N = 20;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function computeDriftSignal(): DriftSignal | null {
  if (!isBrowser()) return null;

  const signals: DriftSignalItem[] = [];
  const allCalibrations = getCalibrationFeedbacks();
  const recentCal = allCalibrations.slice(0, RECENT_N);
  const allHistory = getHistoryItems();
  const recentHistory = allHistory.slice(0, RECENT_N);
  const datasetItems = getEvalDatasetItems();

  // ── 1. score_bias ──────────────────────────────────────────────
  if (recentCal.length >= 5) {
    const scoreTooHigh = recentCal.filter(
      (c) => c.feedbackType === 'score_too_high'
    ).length;
    const scoreTooLow = recentCal.filter(
      (c) => c.feedbackType === 'score_too_low'
    ).length;
    const biasRate = ((scoreTooHigh + scoreTooLow) / recentCal.length) * 100;
    if (biasRate > 30) {
      signals.push({
        type: 'score_bias',
        label: '评分偏差升高',
        severity: biasRate > 50 ? 'high' : 'medium',
        description: `近 ${recentCal.length} 条校准中，评分偏高/偏低占比 ${Math.round(biasRate)}%，超过 30% 阈值`,
        evidence: `评分偏高 ${scoreTooHigh} 次，评分偏低 ${scoreTooLow} 次`,
        recommendation: '检查评分锚点和 TriFlow 权重，必要时调整 Judge Prompt 或评分范围',
      });
    }
  }

  // ── 2. badcase_mismatch ────────────────────────────────────────
  if (recentCal.length >= 5) {
    const badcaseWrong = recentCal.filter(
      (c) => c.feedbackType === 'badcase_wrong'
    ).length;
    const mismatchRate = (badcaseWrong / recentCal.length) * 100;
    if (mismatchRate > 20) {
      signals.push({
        type: 'badcase_mismatch',
        label: '问题归因误差升高',
        severity: mismatchRate > 40 ? 'high' : 'medium',
        description: `近 ${recentCal.length} 条校准中，问题归因不准确占比 ${Math.round(mismatchRate)}%，超过 20% 阈值`,
        evidence: `badcase_wrong 反馈 ${badcaseWrong} 次`,
        recommendation: '检查 Badcase Taxonomy 映射和 evidence 引用要求，确保 AI 引用原文证据',
      });
    }
  }

  // ── 3. prompt_unhelpful ────────────────────────────────────────
  if (recentCal.length >= 5) {
    const promptUseful = recentCal.filter(
      (c) => c.feedbackType === 'prompt_useful'
    ).length;
    const promptNotUseful = recentCal.filter(
      (c) => c.feedbackType === 'prompt_not_useful'
    ).length;
    if (promptNotUseful > promptUseful && promptNotUseful > 0) {
      signals.push({
        type: 'prompt_unhelpful',
        label: 'Prompt 建议有效性下降',
        severity: promptNotUseful >= promptUseful * 2 ? 'high' : 'medium',
        description: `Prompt 建议无用 (${promptNotUseful}) 超过有用 (${promptUseful})，Prompt Optimizer 可能过于泛化`,
        evidence: `prompt_not_useful: ${promptNotUseful}, prompt_useful: ${promptUseful}`,
        recommendation: '检查 Prompt Optimizer 是否针对具体 badcase，避免泛泛而谈的优化建议',
      });
    }
  }

  // ── 4. low_judge_agreement ─────────────────────────────────────
  if (recentHistory.length >= 5) {
    const withJudgeData = recentHistory.filter(
      (h) => h.judgeAgreementLevel !== undefined
    );
    if (withJudgeData.length >= 3) {
      const lowAgreement = withJudgeData.filter(
        (h) => h.judgeAgreementLevel === 'low'
      ).length;
      const lowRate = (lowAgreement / withJudgeData.length) * 100;
      if (lowRate > 20) {
        signals.push({
          type: 'low_judge_agreement',
          label: '多评审一致性下降',
          severity: lowRate > 40 ? 'high' : 'medium',
          description: `近 ${withJudgeData.length} 条评测中，低一致占比 ${Math.round(lowRate)}%，超过 20% 阈值`,
          evidence: `低一致评测 ${lowAgreement} 条 / ${withJudgeData.length} 条`,
          recommendation: '将低一致样本加入 Eval Dataset，进行人工标注后更新 Judge Prompt',
        });
      }
    }
  }

  // ── 5. high_review_required ────────────────────────────────────
  if (recentHistory.length >= 5) {
    const withReview = recentHistory.filter(
      (h) => h.reviewRequired !== undefined
    );
    if (withReview.length >= 3) {
      const reviewNeeded = withReview.filter(
        (h) => h.reviewRequired === true
      ).length;
      const reviewRate = (reviewNeeded / withReview.length) * 100;
      if (reviewRate > 30) {
        signals.push({
          type: 'high_review_required',
          label: '人工复核需求升高',
          severity: reviewRate > 50 ? 'high' : 'medium',
          description: `近 ${withReview.length} 条评测中，需人工复核占比 ${Math.round(reviewRate)}%，超过 30% 阈值`,
          evidence: `需复核 ${reviewNeeded} 条 / ${withReview.length} 条`,
          recommendation: '检查风险规则、输入质量和平台 Rubric 是否过严或过松',
        });
      }
    }
  }

  // ── 6. human_ai_disagreement ───────────────────────────────────
  const annotated = datasetItems.filter(
    (d) => d.humanLabel?.humanScore !== undefined && d.aiScores?.overallEffectiveness !== undefined
  );
  if (annotated.length >= 3) {
    const agreement = computeAgreementRate(annotated);
    if (agreement.total >= 3 && agreement.rate < 70) {
      signals.push({
        type: 'human_ai_disagreement',
        label: 'AI 与人工标签一致率偏低',
        severity: agreement.rate < 50 ? 'high' : 'medium',
        description: `已标注样本中 AI/人工一致率仅 ${agreement.rate}%，低于 70% 阈值`,
        evidence: `一致率 ${agreement.rate}%（${annotated.length} 个标注样本）`,
        recommendation: '优先检查低一致样本，更新评测集和 Judge Prompt',
      });
    }
  }

  // ── Compute driftScore and overallStatus ───────────────────────
  if (signals.length === 0) {
    return {
      overallStatus: 'stable',
      driftScore: 0,
      signals: [],
      summary: '当前评测系统稳定，未检测到明显漂移信号。',
      recommendedActions: [
        '持续积累人工校准样本',
        '定期更新 Eval Dataset',
        '监控评分偏差和归因准确性变化趋势',
      ],
    };
  }

  let driftScore = 0;
  for (const s of signals) {
    if (s.severity === 'low') driftScore += 10;
    else if (s.severity === 'medium') driftScore += 20;
    else driftScore += 30;
  }
  driftScore = Math.min(driftScore, 100);

  const overallStatus =
    driftScore <= 29 ? 'stable' : driftScore <= 59 ? 'watch' : 'drift_risk';

  const highSignals = signals.filter((s) => s.severity === 'high');
  const mediumSignals = signals.filter((s) => s.severity === 'medium');

  let summary: string;
  if (overallStatus === 'stable') {
    summary = '检测到少量漂移信号，评测系统整体可用，建议持续关注。';
  } else if (overallStatus === 'watch') {
    summary = `检测到 ${signals.length} 个漂移信号（${highSignals.length} 高 / ${mediumSignals.length} 中），需要观察并逐步校准。`;
  } else {
    summary = `评测系统存在明显漂移风险，${signals.length} 个信号被触发（${highSignals.length} 高 / ${mediumSignals.length} 中），建议优先进行人工校准。`;
  }

  const recommendedActions = signals.map((s) => s.recommendation).filter(
    (v, i, a) => a.indexOf(v) === i
  );
  if (annotated.length < 5) {
    recommendedActions.push('增加 Eval Dataset 人工标注样本至 5 条以上，提高漂移检测准确性');
  }
  if (recentCal.length < 10) {
    recommendedActions.push('增加人工校准反馈样本量（当前不足 10 条），提高信号可靠性');
  }

  return {
    overallStatus,
    driftScore,
    signals,
    summary,
    recommendedActions,
  };
}

/** Quick check: whether we have enough data to compute meaningful signals */
export function hasEnoughDriftData(): boolean {
  if (!isBrowser()) return false;
  const cal = getCalibrationFeedbacks();
  const hist = getHistoryItems();
  const ds = getEvalDatasetItems();
  return cal.length >= 3 || hist.length >= 5 || ds.length >= 3;
}
