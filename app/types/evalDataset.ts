// ── Eval Dataset Types ──────────────────────────────────────────────
// Client-side localStorage only — no backend database.

export type EvalDatasetSource =
  | 'evaluate'
  | 'ab-test'
  | 'compare'
  | 'batch'
  | 'manual';

export interface AiScores {
  platformFit: number;
  audienceFit: number;
  creatorGoalFit: number;
  overallEffectiveness: number;
}

export interface HumanLabel {
  usability: 'usable' | 'needs_revision' | 'unusable';
  humanScore?: number;
  expectedBadcaseLabels?: string[];
  note?: string;
}

export interface EvalDatasetItem {
  id: string;
  createdAt: string; // ISO 8601
  source: EvalDatasetSource;
  platform: 'xiaohongshu' | 'douyin';
  contentGoal: string;
  productTopic?: string;
  targetAudience?: string;
  content: string;
  prompt?: string;
  aiScores?: AiScores;
  aiBadcaseLabels?: string[];
  confidenceLevel?: 'high' | 'medium' | 'low';
  confidenceScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  reviewRequired?: boolean;
  riskTypes?: string[];
  humanLabel?: HumanLabel;
}

export const USABILITY_LABEL_MAP: Record<
  NonNullable<HumanLabel['usability']>,
  string
> = {
  usable: '可用',
  needs_revision: '需要修改',
  unusable: '不可用',
};

export const SOURCE_LABEL_MAP: Record<EvalDatasetSource, string> = {
  evaluate: '内容评测',
  'ab-test': 'A/B 测试',
  compare: 'PGC 对比',
  batch: '批量评测',
  manual: '手动添加',
};

/** Compute simple AI-vs-human agreement rate */
export function computeAgreementRate(
  items: EvalDatasetItem[]
): { rate: number; total: number } {
  let matched = 0;
  let total = 0;
  for (const item of items) {
    if (
      item.humanLabel?.humanScore !== undefined &&
      item.aiScores?.overallEffectiveness !== undefined
    ) {
      total++;
      const aiGood = item.aiScores.overallEffectiveness >= 75;
      const humanGood = item.humanLabel.humanScore >= 75;
      if (aiGood === humanGood) matched++;
    }
  }
  return {
    rate: total > 0 ? Math.round((matched / total) * 100) : 0,
    total,
  };
}
