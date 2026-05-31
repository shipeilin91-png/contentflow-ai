// ── localStorage Eval Dataset Helpers ──────────────────────────────
// All functions are client-side only. Call only from 'use client' components.
// Max 100 items to keep localStorage lean.

import type { EvalDatasetItem } from '@/app/types/evalDataset';

const STORAGE_KEY = 'contentflow_eval_dataset';
const MAX_ITEMS = 100;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getEvalDatasetItems(): EvalDatasetItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as EvalDatasetItem[];
  } catch {
    return [];
  }
}

export function saveEvalDatasetItem(item: EvalDatasetItem): void {
  if (!isBrowser()) return;
  try {
    const items = getEvalDatasetItems();
    items.unshift(item);
    const trimmed = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn(
      '[ContentFlow AI] Failed to save eval dataset item to localStorage'
    );
  }
}

export function updateEvalDatasetItem(
  id: string,
  patch: Partial<EvalDatasetItem>
): void {
  if (!isBrowser()) return;
  try {
    const items = getEvalDatasetItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    items[idx] = { ...items[idx], ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function deleteEvalDatasetItem(id: string): void {
  if (!isBrowser()) return;
  try {
    const items = getEvalDatasetItems();
    const filtered = items.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function clearEvalDataset(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generateDatasetId(): string {
  return `ds-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
