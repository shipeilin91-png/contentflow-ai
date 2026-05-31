// ── User SOP Template Types ─────────────────────────────────────────
// Client-side localStorage only — no backend database.

export type SopSource = 'evaluate' | 'ab-test' | 'compare' | 'manual';

export interface UserSopTemplate {
  id: string;
  createdAt: string; // ISO 8601
  source: SopSource;
  name: string;
  platform: 'xiaohongshu' | 'douyin';
  contentGoal: string;
  targetAudience: string;
  productTopic?: string;
  structure: string[];
  promptTemplate: string;
  commonBadcases: string[];
  rubricFocus: string[];
  notes?: string;
}

export const SOP_SOURCE_LABEL_MAP: Record<SopSource, string> = {
  evaluate: '内容评测',
  'ab-test': 'A/B 测试',
  compare: 'PGC 对比',
  manual: '手动创建',
};

// ── Platform-specific defaults ──────────────────────────────────────

export const XHS_DEFAULT_STRUCTURE = [
  '搜索意图标题',
  '具体生活场景',
  '用户痛点/购买顾虑',
  '卖点转译为真实体验',
  '适合/不适合人群',
  '轻收藏/轻转化引导',
];

export const DY_DEFAULT_STRUCTURE = [
  '前三秒冲突 Hook',
  '痛点/反差放大',
  '卖点口语化转译',
  '镜头/口播节奏分段',
  '互动问题',
  '关注/转化承接',
];

export const XHS_DEFAULT_RUBRIC = [
  '搜索意图',
  '真实体验',
  '收藏价值',
  '信任信号',
  '软种草',
];

export const DY_DEFAULT_RUBRIC = [
  '前三秒 Hook',
  '完播动机',
  '冲突反差',
  '镜头感',
  '互动触发',
];
