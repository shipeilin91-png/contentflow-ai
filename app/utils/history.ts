// ── localStorage History Helpers ───────────────────────────────────
// All functions are client-side only. Call only from 'use client' components.
// Max 30 items to keep localStorage lean.

import { type EvaluationHistoryItem } from '@/app/types/history';

const STORAGE_KEY = 'contentflow-evaluation-history';
const MAX_ITEMS = 30;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getHistoryItems(): EvaluationHistoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as EvaluationHistoryItem[];
  } catch {
    return [];
  }
}

export function addHistoryItem(item: EvaluationHistoryItem): void {
  if (!isBrowser()) return;
  try {
    const items = getHistoryItems();
    items.unshift(item);
    // Keep only the most recent MAX_ITEMS
    const trimmed = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — silently ignore
    console.warn('[ContentFlow AI] Failed to save history item to localStorage');
  }
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
