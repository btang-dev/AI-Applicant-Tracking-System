import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFeedback, normalizeScore, parseFeedbackText} from '../app/lib/feedback.ts';

test('clamps invalid and out-of-range scores', () => {
  assert.equal(normalizeScore(-20), 0);
  assert.equal(normalizeScore(145), 100);
  assert.equal(normalizeScore('72.6'), 73);
  assert.equal(normalizeScore('not-a-score'), 0);
});

test('fills missing categories with safe empty values', () => {
  const feedback = normalizeFeedback({overallScore: 81});
  assert.equal(feedback.overallScore, 81);
  assert.deepEqual(feedback.ATS, {score: 0, tips: []});
  assert.deepEqual(feedback.skills, {score: 0, tips: []});
});

test('preserves tips and long explanations while dropping empty tips', () => {
  const explanation = 'Use quantified results. '.repeat(50);
  const feedback = normalizeFeedback({
    content: {
      score: 64,
      tips: [
        {type: 'good', tip: 'Clear summary', explanation},
        {type: 'unexpected', title: 'Add metrics', details: 'Include percentages.'},
        null,
      ],
    },
  });

  assert.equal(feedback.content.tips.length, 2);
  assert.equal(feedback.content.tips[0].explanation, explanation.trim());
  assert.deepEqual(feedback.content.tips[1], {
    type: 'improve',
    tip: 'Add metrics',
    explanation: 'Include percentages.',
  });
});

test('parses fenced JSON, preamble text, aliases, and numeric strings', () => {
  const feedback = parseFeedbackText(`Here is the result:\n\`\`\`json
    {"overall_score":"92","ats":{"score":"88","tips":[]},"tone_and_style":{"score":70,"tips":[]}}
  \`\`\``);

  assert.equal(feedback.overallScore, 92);
  assert.equal(feedback.ATS.score, 88);
  assert.equal(feedback.toneAndStyle.score, 70);
});

test('rejects responses without a JSON object', () => {
  assert.throws(() => parseFeedbackText('No structured feedback available'), /not a JSON object/);
});
