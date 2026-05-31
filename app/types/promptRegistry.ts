// ── Prompt Version Registry Types ──────────────────────────────────
// Client-side localStorage only — no backend database.

export type PromptVersionSource =
  | 'evaluate'
  | 'ab-test'
  | 'compare'
  | 'manual';

export interface ScoreSnapshot {
  platformFit?: number;
  audienceFit?: number;
  creatorGoalFit?: number;
  overallEffectiveness?: number;
}

export interface AbTestSnapshot {
  comparedWith?: string;
  winner?: boolean;
  improvementDelta?: number;
}

export interface PromptVersionItem {
  id: string;
  createdAt: string; // ISO 8601
  source: PromptVersionSource;
  name: string;
  platform: 'xiaohongshu' | 'douyin';
  contentGoal: string;
  productTopic?: string;
  targetAudience?: string;
  versionLabel: string; // e.g. v1, v2, winner, strategy
  promptText: string;
  parentPromptText?: string;
  changeReasons?: string[];
  linkedBadcases?: string[];
  expectedImprovements?: string[];
  scoreSnapshot?: ScoreSnapshot;
  abTestResult?: AbTestSnapshot;
  savedAsSop?: boolean;
  notes?: string;
}

export const PROMPT_SOURCE_LABEL_MAP: Record<PromptVersionSource, string> = {
  evaluate: '内容评测',
  'ab-test': 'A/B 测试',
  compare: 'PGC 对比',
  manual: '手动创建',
};
