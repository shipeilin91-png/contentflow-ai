// ── Evaluation History Types ───────────────────────────────────────
// Client-side localStorage only — no backend database.

export interface EvaluationHistoryItem {
  id: string;
  createdAt: string; // ISO 8601
  source: 'evaluate' | 'ab-test' | 'compare' | 'batch';
  platform: 'xiaohongshu' | 'douyin';
  contentGoal: string;
  productTopic: string;
  targetAudience: string;
  overallEffectiveness: number;
  platformFit: number;
  audienceFit: number;
  creatorGoalFit: number;
  badcaseCount: number;
  badcaseTypes: string[];
  recommendedVersion?: 'Prompt v1' | 'Prompt v2';
  improvementDelta?: number;
  confidenceLevel?: 'high' | 'medium' | 'low';
  riskLevel?: 'low' | 'medium' | 'high';
  reviewRequired?: boolean;
}
