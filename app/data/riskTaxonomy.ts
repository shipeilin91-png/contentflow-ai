// ── Risk Taxonomy ──────────────────────────────────────────────────
// Standardized risk types for AI content evaluation.
// These flag content that may contain unsupported claims, platform evasion,
// or other risks that warrant human review.

export interface RiskType {
  tag: string;
  label: string;
  description: string;
}

export const RISK_TYPES: RiskType[] = [
  {
    tag: 'unsupported_claim',
    label: '未支撑功效/效果声明',
    description:
      '内容出现用户未提供的数据、功效、销量、排名、专家背书或效果承诺。',
  },
  {
    tag: 'exaggerated_promotion',
    label: '夸大宣传',
    description:
      '使用绝对化、过度承诺或明显夸大的营销表达。',
  },
  {
    tag: 'fake_experience',
    label: '伪装真实体验',
    description:
      '内容像在冒充真实用户亲测、买家评价或素人种草，但缺少真实素材依据。',
  },
  {
    tag: 'platform_evasion',
    label: '平台规避倾向',
    description:
      '内容暗示绕过平台审核、规避敏感词或隐性营销识别。',
  },
  {
    tag: 'medical_financial_legal_risk',
    label: '医疗/金融/法律高风险',
    description:
      '内容涉及医疗、金融、法律等高风险领域的确定性建议或效果承诺。',
  },
  {
    tag: 'low_context_confidence',
    label: '输入信息不足',
    description:
      '用户提供的信息不足，导致 AI 判断置信度较低，需要人工复核。',
  },
  {
    tag: 'plagiarism_imitation_risk',
    label: '模仿/搬运风险',
    description:
      'PGC 对比或改写中可能过度贴近标杆内容，存在仿写、洗稿或搬运风险。',
  },
];

export const RISK_LABEL_MAP: Record<string, string> = {};
for (const rt of RISK_TYPES) {
  RISK_LABEL_MAP[rt.tag] = rt.label;
}
