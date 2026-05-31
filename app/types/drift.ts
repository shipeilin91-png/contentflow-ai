// ── Evaluation Drift Monitor Types ─────────────────────────────────
// Detects LLM-as-a-Judge drift signals from existing localStorage data.
// Computed client-side — no backend required.

export interface DriftSignalItem {
  type:
    | 'score_bias'
    | 'badcase_mismatch'
    | 'prompt_unhelpful'
    | 'low_judge_agreement'
    | 'high_review_required'
    | 'human_ai_disagreement';
  label: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: string;
  recommendation: string;
}

export interface DriftSignal {
  overallStatus: 'stable' | 'watch' | 'drift_risk';
  driftScore: number; // 0-100
  signals: DriftSignalItem[];
  summary: string;
  recommendedActions: string[];
}

export const DRIFT_STATUS_LABEL: Record<DriftSignal['overallStatus'], string> = {
  stable: '评测稳定',
  watch: '需要观察',
  drift_risk: '存在漂移风险',
};
