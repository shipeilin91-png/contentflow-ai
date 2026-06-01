'use client';

import { useState } from 'react';
import type { PromptVersionItem } from '@/app/types/promptRegistry';
import { savePromptVersion, generatePromptVersionId } from '@/app/utils/promptRegistryStorage';
import { savePromptVersionToCloud } from '@/app/utils/cloudSync';
import { trackUsageEvent } from '@/app/utils/usageTracking';

interface Props {
  item: Omit<PromptVersionItem, 'id' | 'createdAt'>;
  label?: string;
}

export default function SavePromptButton({ item, label }: Props) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const promptVersion = {
      ...item,
      id: generatePromptVersionId(),
      createdAt: new Date().toISOString(),
    };
    savePromptVersion(promptVersion);
    void savePromptVersionToCloud(promptVersion);
    void trackUsageEvent({
      eventName: 'save_prompt',
      pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      source: promptVersion.source,
      platform: promptVersion.platform,
      contentGoal: promptVersion.contentGoal,
      productTopic: promptVersion.productTopic,
      metadata: {
        versionLabel: promptVersion.versionLabel,
        savedAsSop: promptVersion.savedAsSop,
      },
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        已保存到 Prompt 版本库
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100 hover:border-sky-300"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label || '保存到 Prompt 版本库'}
    </button>
  );
}
