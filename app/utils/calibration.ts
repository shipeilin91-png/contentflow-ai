// ── localStorage Calibration Feedback Helpers ───────────────────────
// All functions are client-side only. Call only from 'use client' components.
// Max 100 items to keep localStorage lean.

import type {
  CalibrationFeedback,
  CalibrationSource,
  CalibrationFeedbackType,
} from '@/app/types/calibration';

const STORAGE_KEY = 'contentflow_calibration_feedbacks';
const MAX_ITEMS = 100;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getCalibrationFeedbacks(): CalibrationFeedback[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CalibrationFeedback[];
  } catch {
    return [];
  }
}

export function saveCalibrationFeedback(
  item: CalibrationFeedback
): void {
  if (!isBrowser()) return;
  try {
    const items = getCalibrationFeedbacks();
    items.unshift(item);
    const trimmed = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn(
      '[ContentFlow AI] Failed to save calibration feedback to localStorage'
    );
  }
}

export function clearCalibrationFeedbacks(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface CalibrationStats {
  total: number;
  accurateCount: number;
  scoreTooHigh: number;
  scoreTooLow: number;
  badcaseWrong: number;
  promptUseful: number;
  promptNotUseful: number;
  promptUsefulRate: number; // 0-100
}

export function getCalibrationStats(): CalibrationStats {
  const items = getCalibrationFeedbacks();
  const total = items.length;
  const counts: Record<CalibrationFeedbackType, number> = {
    accurate: 0,
    score_too_high: 0,
    score_too_low: 0,
    badcase_wrong: 0,
    prompt_useful: 0,
    prompt_not_useful: 0,
  };

  for (const item of items) {
    counts[item.feedbackType] = (counts[item.feedbackType] || 0) + 1;
  }

  const promptTotal = counts.prompt_useful + counts.prompt_not_useful;

  return {
    total,
    accurateCount: counts.accurate,
    scoreTooHigh: counts.score_too_high,
    scoreTooLow: counts.score_too_low,
    badcaseWrong: counts.badcase_wrong,
    promptUseful: counts.prompt_useful,
    promptNotUseful: counts.prompt_not_useful,
    promptUsefulRate:
      promptTotal > 0
        ? Math.round((counts.prompt_useful / promptTotal) * 100)
        : 0,
  };
}

export function generateCalibrationId(): string {
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
