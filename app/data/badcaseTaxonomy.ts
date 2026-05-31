// ── Platform-specific Badcase Taxonomy ──────────────────────────────
// Standardized issue labels for structured evaluation and dashboard aggregation.
// Each platform has its own set of tags — never mix across platforms.

export interface BadcaseTaxon {
  tag: string;
  label: string;
  description: string;
}

// ── XiaoHongShu (小红书) Taxonomy ───────────────────────────────────
export const XIAOHONGSHU_TAXONOMY: BadcaseTaxon[] = [
  {
    tag: 'search_intent_missing',
    label: '搜索意图缺失',
    description:
      '内容没有覆盖用户会主动搜索的问题、关键词或决策场景。',
  },
  {
    tag: 'trust_detail_weak',
    label: '真实体验不足',
    description:
      '缺少具体使用场景、限制条件、细节证据，导致内容不可信。',
  },
  {
    tag: 'save_worthiness_low',
    label: '收藏价值不足',
    description:
      '内容缺少清单、步骤、对比、避坑等值得收藏的信息结构。',
  },
  {
    tag: 'hard_sell_tone',
    label: '硬广感过强',
    description:
      '表达过度推销，缺少自然种草和用户视角。',
  },
  {
    tag: 'trust_barrier_unresolved',
    label: '购买顾虑未回应',
    description:
      '没有回应用户关于价格、效果、适配人群、风险或踩雷的顾虑。',
  },
  {
    tag: 'keyword_coverage_weak',
    label: '关键词覆盖弱',
    description:
      '标题或正文缺少平台搜索常用词和用户决策词。',
  },
  {
    tag: 'community_tone_mismatch',
    label: '社区语气不匹配',
    description:
      '语言不像真实经验分享，更像品牌说明书或广告稿。',
  },
];

// ── Douyin (抖音) Taxonomy ─────────────────────────────────────────
export const DOUYIN_TAXONOMY: BadcaseTaxon[] = [
  {
    tag: 'hook_weak',
    label: '前三秒 Hook 弱',
    description:
      '开头缺少冲突、反差、痛点或结果刺激，难以让用户停留。',
  },
  {
    tag: 'completion_drive_low',
    label: '完播动机不足',
    description:
      '内容缺少悬念、递进或节奏设计，用户没有看完理由。',
  },
  {
    tag: 'conflict_contrast_weak',
    label: '冲突/反差不足',
    description:
      '内容表达过于平铺直叙，缺少短视频推荐流需要的张力。',
  },
  {
    tag: 'visualizability_low',
    label: '镜头感不足',
    description:
      '缺少画面、动作、分镜或口播节奏，难以转化为视频。',
  },
  {
    tag: 'interaction_trigger_weak',
    label: '互动触发弱',
    description:
      '缺少评论、关注、讨论或二创触发点。',
  },
  {
    tag: 'ip_memory_weak',
    label: 'IP 记忆点不足',
    description:
      '口吻、人设、观点或表达方式不稳定，难以形成博主记忆。',
  },
  {
    tag: 'rhythm_dragging',
    label: '节奏拖沓',
    description:
      '信息铺陈过慢，重点不突出，不适合短视频节奏。',
  },
];

// ── Lookup helpers ──────────────────────────────────────────────────
export function getTaxonomyByPlatform(
  platform: string
): BadcaseTaxon[] {
  if (platform === 'douyin') return DOUYIN_TAXONOMY;
  return XIAOHONGSHU_TAXONOMY; // default to xiaohongshu
}

export function findTaxonByTag(
  platform: string,
  tag: string
): BadcaseTaxon | undefined {
  const taxonomy = getTaxonomyByPlatform(platform);
  return taxonomy.find((t) => t.tag === tag);
}

/**
 * Fallback: try to map a free-text badcase type to the closest taxonomy tag.
 * Uses simple keyword matching. If no match, returns undefined.
 */
export function mapTypeToTaxon(
  platform: string,
  type: string
): BadcaseTaxon | undefined {
  const taxonomy = getTaxonomyByPlatform(platform);
  const lower = type.toLowerCase();

  // Simple keyword-based fuzzy mapping
  const keywordMap: Record<string, string[]> = {
    search_intent_missing: ['搜索', '关键词', 'search', '曝光', '发现'],
    trust_detail_weak: ['真实', '体验', '细节', '场景', '使用', '证据', '信任信号'],
    save_worthiness_low: ['收藏', '清单', '步骤', '对比', '总结', '实用'],
    hard_sell_tone: ['硬广', '推销', '品牌方', '广告', '说明书', '卖点'],
    trust_barrier_unresolved: ['顾虑', '价格', '效果', '风险', '适不适合', '担心'],
    keyword_coverage_weak: ['覆盖', '标题', '搜索词', '关键词密度'],
    community_tone_mismatch: ['语气', '社区', '真实感', '分享', '朋友', '官方'],
    hook_weak: ['hook', '钩子', '开头', '前三秒', '停留', '吸引'],
    completion_drive_low: ['完播', '悬念', '节奏', '递进', '看完'],
    conflict_contrast_weak: ['冲突', '反差', '对比', '张力', '平铺'],
    visualizability_low: ['镜头', '画面', '分镜', '视频', '视觉'],
    interaction_trigger_weak: ['互动', '评论', '关注', '点赞', '参与'],
    ip_memory_weak: ['ip', '记忆', '辨识', '人设', '口吻', '风格'],
    rhythm_dragging: ['拖沓', '节奏慢', '铺垫', '重点不突出'],
  };

  for (const taxon of taxonomy) {
    const keywords = keywordMap[taxon.tag] || [];
    if (keywords.some((kw) => lower.includes(kw))) {
      return taxon;
    }
  }

  return undefined;
}
