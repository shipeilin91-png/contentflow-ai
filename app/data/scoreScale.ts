// ── Unified Score Scale ────────────────────────────────────────────
// 0-100 scoring bands with labels, colors, and descriptions.
// Used across all evaluation pages for consistent score interpretation.

export interface ScoreBand {
  min: number;
  max: number;
  label: string;
  color: string; // Tailwind text color
  bg: string; // Tailwind bg + border
  description: string;
}

export const SCORE_BANDS: ScoreBand[] = [
  {
    min: 0,
    max: 39,
    label: '明显不合格',
    color: 'text-red-500',
    bg: 'bg-red-50 border-red-200',
    description:
      '内容与平台、受众或目标明显不匹配，需要重写或重构内容策略。',
  },
  {
    min: 40,
    max: 59,
    label: '较弱',
    color: 'text-orange-500',
    bg: 'bg-orange-50 border-orange-200',
    description:
      '有基础信息，但缺少关键平台信号或用户信任支撑，需要大幅修改。',
  },
  {
    min: 60,
    max: 74,
    label: '基本可用',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    description:
      '方向基本正确，但仍存在明显 badcase，建议优化后再使用。',
  },
  {
    min: 75,
    max: 89,
    label: '表现良好',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    description:
      '大部分指标匹配，可进入发布前人工复核阶段。',
  },
  {
    min: 90,
    max: 100,
    label: '高度适配',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-300',
    description:
      '平台、受众和目标高度一致，但仍建议根据实际素材复核。',
  },
];

export function getScoreBand(score: number): ScoreBand {
  for (const band of SCORE_BANDS) {
    if (score >= band.min && score <= band.max) return band;
  }
  return SCORE_BANDS[0]; // fallback
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function scoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  if (score >= 40) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}
