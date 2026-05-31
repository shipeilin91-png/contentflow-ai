// ── localStorage Prompt Version Registry Helpers ───────────────────
// All functions are client-side only. Call only from 'use client' components.
// Max 100 items to keep localStorage lean.

import type { PromptVersionItem } from '@/app/types/promptRegistry';

const STORAGE_KEY = 'contentflow_prompt_versions';
const MAX_ITEMS = 100;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getPromptVersions(): PromptVersionItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PromptVersionItem[];
  } catch {
    return [];
  }
}

export function savePromptVersion(item: PromptVersionItem): void {
  if (!isBrowser()) return;
  try {
    const items = getPromptVersions();
    items.unshift(item);
    const trimmed = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn(
      '[ContentFlow AI] Failed to save prompt version to localStorage'
    );
  }
}

export function updatePromptVersion(
  id: string,
  patch: Partial<PromptVersionItem>
): void {
  if (!isBrowser()) return;
  try {
    const items = getPromptVersions();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    items[idx] = { ...items[idx], ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function deletePromptVersion(id: string): void {
  if (!isBrowser()) return;
  try {
    const items = getPromptVersions();
    const filtered = items.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function clearPromptVersions(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generatePromptVersionId(): string {
  return `pv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
