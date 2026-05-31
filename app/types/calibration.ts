// ── Human Calibration Types ─────────────────────────────────────────
// Client-side localStorage only — no backend database.

export type CalibrationFeedbackType =
  | 'accurate'
  | 'score_too_high'
  | 'score_too_low'
  | 'badcase_wrong'
  | 'prompt_useful'
  | 'prompt_not_useful';

export const CALIBRATION_LABEL_MAP: Record<CalibrationFeedbackType, string> = {
  accurate: '判断准确',
  score_too_high: '评分偏高',
  score_too_low: '评分偏低',
  badcase_wrong: '问题归因不准确',
  prompt_useful: 'Prompt 建议有用',
  prompt_not_useful: 'Prompt 建议无用',
};

export type CalibrationSource = 'evaluate' | 'ab-test' | 'compare';

export interface CalibrationFeedback {
  id: string;
  createdAt: string; // ISO 8601
  source: CalibrationSource;
  platform: 'xiaohongshu' | 'douyin';
  productTopic?: string;
  targetAudience?: string;
  feedbackType: CalibrationFeedbackType;
  note?: string;
  relatedBadcaseLabel?: string;
  relatedScoreType?:
    | 'platformFit'
    | 'audienceFit'
    | 'creatorGoalFit'
    | 'overallEffectiveness';
}
