'use client';

import { useState } from 'react';
import type { EvalDatasetSource, AiScores } from '@/app/types/evalDataset';
import { saveEvalDatasetItem, generateDatasetId } from '@/app/utils/evalDatasetStorage';

interface Props {
  source: EvalDatasetSource;
  platform: 'xiaohongshu' | 'douyin';
  contentGoal: string;
  productTopic?: string;
  targetAudience?: string;
  content: string;
  prompt?: string;
  aiScores?: AiScores;
  aiBadcaseLabels?: string[];
  confidenceLevel?: 'high' | 'medium' | 'low';
  confidenceScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  reviewRequired?: boolean;
  riskTypes?: string[];
  label?: string;
}

export default function AddToDatasetButton({
  source,
  platform,
  contentGoal,
  productTopic,
  targetAudience,
  content,
  prompt,
  aiScores,
  aiBadcaseLabels,
  confidenceLevel,
  confidenceScore,
  riskLevel,
  reviewRequired,
  riskTypes,
  label,
}: Props) {
  const [saved, setSaved] = useState(false);

  const handleAdd = () => {
    if (!content.trim()) return;
    saveEvalDatasetItem({
      id: generateDatasetId(),
      createdAt: new Date().toISOString(),
      source,
      platform,
      contentGoal,
      productTopic,
      targetAudience,
      content: content.trim(),
      prompt: prompt || undefined,
      aiScores,
      aiBadcaseLabels,
      confidenceLevel,
      confidenceScore,
      riskLevel,
      reviewRequired,
      riskTypes,
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        已加入评测集
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100 hover:border-teal-300"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label || '加入评测集'}
    </button>
  );
}
