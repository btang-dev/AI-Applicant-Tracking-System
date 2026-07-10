const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const asText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const normalizeScore = (value: unknown): number => {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
};

const normalizeTips = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((rawTip) => {
    const item = asRecord(rawTip);
    const tip = asText(item.tip) || asText(item.title);
    const explanation = asText(item.explanation) || asText(item.details);

    if (!tip && !explanation) return [];

    return [{
      type: item.type === 'good' ? 'good' as const : 'improve' as const,
      tip: tip || 'Additional feedback',
      explanation,
    }];
  });
};

const normalizeCategory = (value: unknown) => {
  const category = asRecord(value);
  return {
    score: normalizeScore(category.score),
    tips: normalizeTips(category.tips),
  };
};

export const normalizeFeedback = (value: unknown): Feedback => {
  const feedback = asRecord(value);
  const toneAndStyle = feedback.toneAndStyle
    ?? feedback.tone_and_style
    ?? feedback.ToneAndStyle;

  return {
    overallScore: normalizeScore(feedback.overallScore ?? feedback.overall_score),
    ATS: normalizeCategory(feedback.ATS ?? feedback.ats),
    toneAndStyle: normalizeCategory(toneAndStyle),
    content: normalizeCategory(feedback.content),
    structure: normalizeCategory(feedback.structure),
    skills: normalizeCategory(feedback.skills),
  };
};

export const parseFeedbackText = (text: string): Feedback => {
  const withoutFence = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace < firstBrace) {
    throw new Error('The AI feedback was not a JSON object.');
  }

  return normalizeFeedback(JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1)));
};
