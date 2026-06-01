'use client';

import { useState } from 'react';
import type {
  CalibrationFeedbackType,
  CalibrationSource,
} from '@/app/types/calibration';
import { CALIBRATION_LABEL_MAP } from '@/app/types/calibration';
import {
  saveCalibrationFeedback,
  generateCalibrationId,
} from '@/app/utils/calibration';
import { saveCalibrationToCloud } from '@/app/utils/cloudSync';

interface Props {
  source: CalibrationSource;
  platform: 'xiaohongshu' | 'douyin';
  productTopic?: string;
  targetAudience?: string;
  buttons: CalibrationFeedbackType[];
}

export default function CalibrationPanel({
  source,
  platform,
  productTopic,
  targetAudience,
  buttons,
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [note, setNote] = useState('');

  const handleFeedback = (feedbackType: CalibrationFeedbackType) => {
    const feedback = {
      id: generateCalibrationId(),
      createdAt: new Date().toISOString(),
      source,
      platform,
      productTopic,
      targetAudience,
      feedbackType,
      note: note.trim() || undefined,
    };
    saveCalibrationFeedback(feedback);
    void saveCalibrationToCloud(feedback);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3.5 text-center">
        <p className="text-xs font-medium text-emerald-700">
          ✓ 已记录本次校准反馈
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setNote('');
          }}
          className="mt-2 text-[10px] text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
        >
          添加更多反馈
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
          AI 评测结果仅供参考。标记本次评分、问题归因或 Prompt 建议是否准确，用于后续优化评测标准。
        </p>
      </div>

      {/* Button grid */}
      <div className="flex flex-wrap gap-1.5">
        {buttons.map((bt) => (
          <button
            key={bt}
            type="button"
            onClick={() => handleFeedback(bt)}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            {CALIBRATION_LABEL_MAP[bt]}
          </button>
        ))}
      </div>

      {/* Optional note */}
      <div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="补充说明（可选）"
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
      </div>
    </div>
  );
}
