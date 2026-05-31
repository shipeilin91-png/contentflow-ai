// ── localStorage User SOP Template Helpers ──────────────────────────
// All functions are client-side only. Call only from 'use client' components.
// Max 50 items to keep localStorage lean.

import type { UserSopTemplate } from '@/app/types/sop';

const STORAGE_KEY = 'contentflow_user_sop_templates';
const MAX_ITEMS = 50;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getUserSopTemplates(): UserSopTemplate[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as UserSopTemplate[];
  } catch {
    return [];
  }
}

export function saveUserSopTemplate(
  template: UserSopTemplate
): void {
  if (!isBrowser()) return;
  try {
    const items = getUserSopTemplates();
    items.unshift(template);
    const trimmed = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn(
      '[ContentFlow AI] Failed to save user SOP template to localStorage'
    );
  }
}

export function deleteUserSopTemplate(id: string): void {
  if (!isBrowser()) return;
  try {
    const items = getUserSopTemplates();
    const filtered = items.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function clearUserSopTemplates(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generateSopId(): string {
  return `sop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
