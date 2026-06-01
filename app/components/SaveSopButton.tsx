'use client';

import { useState } from 'react';
import type { UserSopTemplate } from '@/app/types/sop';
import { saveUserSopTemplate, generateSopId } from '@/app/utils/sopStorage';
import { saveSopTemplateToCloud } from '@/app/utils/cloudSync';
import { trackUsageEvent } from '@/app/utils/usageTracking';

interface Props {
  template: Omit<UserSopTemplate, 'id' | 'createdAt'>;
  label?: string;
}

export function buildAndSaveSop(
  template: Omit<UserSopTemplate, 'id' | 'createdAt'>
): UserSopTemplate {
  const savedTemplate = {
    ...template,
    id: generateSopId(),
    createdAt: new Date().toISOString(),
  };
  saveUserSopTemplate(savedTemplate);
  return savedTemplate;
}

export default function SaveSopButton({ template, label }: Props) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const savedTemplate = buildAndSaveSop(template);
    void saveSopTemplateToCloud(savedTemplate);
    void trackUsageEvent({
      eventName: 'save_sop',
      pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      source: savedTemplate.source,
      platform: savedTemplate.platform,
      contentGoal: savedTemplate.contentGoal,
      productTopic: savedTemplate.productTopic,
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        已保存到 SOP 模板库
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 hover:border-indigo-300"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
      {label || '保存为 SOP'}
    </button>
  );
}
