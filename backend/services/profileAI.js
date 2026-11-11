
const TOPIC_RULES = [
  ['JavaScript', /\bjavascript\b|\bjs\b/i],
  ['React', /\breact\b|\bnext\.?js\b/i],
  ['Node.js', /\bnode\.?js\b|\bexpress\b/i],
  ['Java', /\bjava\b/i],
  ['C++', /(?:^|[^a-z0-9])c\+\+(?=$|[^a-z0-9])/i],
  ['Python', /\bpython\b/i],
  ['Data Structures & Algorithms', /\bdata structures?\b|\balgorithms?\b|\bdsa\b/i],
  ['Machine Learning', /\bmachine learning\b|\bml\b/i],
  ['Artificial Intelligence', /\bartificial intelligence\b|\bai\b/i],
  ['Web Development', /\bweb\b|\bfrontend\b|\bbackend\b|\bfull.?stack\b/i],
  ['Databases', /\bsql\b|\bmongodb\b|\bdatabase\b/i],
  ['Cloud & DevOps', /\bcloud\b|\bdevops\b|\bdocker\b|\bkubernetes\b/i],
  ['Cybersecurity', /\bcyber.?security\b|\bsecurity\b/i],
  ['UI/UX Design', /\bui\b|\bux\b|\bdesign\b/i]
];

// Remove duplicates and invalid values.
function uniqueStrings(values, limit = 12) {
  if (!Array.isArray(values)) return [];

  const seen = new Set();
  const result = [];

  for (const value of values) {
    if (typeof value !== 'string') continue;

    const cleaned = value.trim().slice(0, 40);

    if (!cleaned) continue;

    const key = cleaned.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(cleaned);

    if (result.length >= limit) break;
  }

  return result;
}

// Infer interests from program names and resource titles.
function inferInterests(programs, resources, savedInterests = []) {
  programs = Array.isArray(programs) ? programs : [];
  resources = Array.isArray(resources) ? resources : [];

  const sourceText = [
    ...programs.map(program => program?.name || ''),
    ...resources.map(resource =>
      `${resource?.title || ''} ${resource?.type || ''}`
    )
  ].join(' ');

  const inferred = TOPIC_RULES
    .filter(([, pattern]) => pattern.test(sourceText))
    .map(([label]) => label);

  const fallback = [
    ...programs.map(program => program?.name),
    ...resources.map(resource => resource?.type)
  ];

  return uniqueStrings([
    ...savedInterests,
    ...inferred,
    ...(inferred.length === 0 ? fallback : [])
  ]);
}

// Generate a consistent avatar URL.
function buildAvatarUrl(seed) {
  const safeSeed = encodeURIComponent(
    String(seed || 'techneeds-learner')
  );

  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${safeSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

// Generate achievement badges for a mentee.
function buildMenteeBadges({
  completed = 0,
  completedResources = [],
  streak = 0,
  rank = null,
  progress = 0,
  total = 0
}) {
  completedResources = Array.isArray(completedResources)
    ? completedResources
    : [];

  const badges = [];

  if (completed >= 1) {
    badges.push({
      icon: '🚀',
      title: 'First Steps',
      description: 'Completed your first learning resource'
    });
  }

  if (completedResources.some(resource => resource?.type === 'quiz')) {
    badges.push({
      icon: '🧠',
      title: 'Quiz Explorer',
      description: 'Completed at least one quiz'
    });
  }

  if (completedResources.some(resource => resource?.type === 'project')) {
    badges.push({
      icon: '🛠️',
      title: 'Project Builder',
      description: 'Submitted a hands-on project'
    });
  }

  if (streak >= 3) {
    badges.push({
      icon: '🔥',
      title: 'Consistency Streak',
      description: `Maintained a ${streak}-day learning streak`
    });
  }

  if (rank && rank <= 10) {
    badges.push({
      icon: '🏅',
      title: 'Top 10 Learner',
      description: `Currently ranked #${rank} on the leaderboard`
    });
  }

  if (total > 0 && progress === 100) {
    badges.push({
      icon: '🏆',
      title: 'Programme Finisher',
      description: 'Completed all currently assigned resources'
    });
  }

  return badges;
}

// Generate a deterministic performance summary and recommendations.
function buildMenteeFallback({
  name,
  completed = 0,
  total = 0,
  progress = 0,
  totalScore = 0,
  streak = 0,
  rank = null,
  pendingResources = [],
  interestTags = []
}) {
  pendingResources = Array.isArray(pendingResources)
    ? pendingResources
    : [];

  interestTags = Array.isArray(interestTags)
    ? interestTags
    : [];

  let performanceSummary;

  if (total === 0) {
    performanceSummary =
      'Your learning journey is ready to begin. Once your mentor assigns resources, your activity and achievements will appear here.';
  } else if (completed === 0) {
    performanceSummary =
      `You have ${total} assigned resources waiting. Start with one small task to build momentum.`;
  } else if (progress === 100) {
    performanceSummary =
      `Excellent work, ${name || 'learner'}! You have completed all ${total} assigned resources and earned ${totalScore} points. Ask your mentor for an advanced challenge.`;
  } else {
    performanceSummary =
      `You have completed ${completed} of ${total} resources (${progress}%) and earned ${totalScore} points. Your ${streak}-day streak is another sign of consistent effort.`;
  }

  const recommendations = [];

  if (pendingResources.some(resource => resource?.type === 'quiz')) {
    recommendations.push({
      icon: '🧩',
      title: 'Test your understanding',
      description:
        'Attempt an available quiz to identify topics that need more practice.'
    });
  }

  if (pendingResources.some(resource => resource?.type === 'project')) {
    recommendations.push({
      icon: '💻',
      title: 'Apply your knowledge',
      description:
        'Choose an assigned project and turn one of your learning concepts into a working deliverable.'
    });
  }

  if (pendingResources.some(resource => resource?.type === 'video')) {
    recommendations.push({
      icon: '🎬',
      title: 'Continue your learning path',
      description:
        'Watch an assigned video module and mark it complete when you finish.'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      icon: '🌟',
      title: 'Explore your next challenge',
      description: interestTags.length
        ? `Explore an advanced topic related to ${interestTags.slice(0, 2).join(' or ')}.`
        : 'Ask your mentor for an advanced resource that builds on your progress.'
    });
  }

  return {
    performanceSummary,
    recommendations: recommendations.slice(0, 3)
  };
}

// Extract JSON safely from an AI provider response.
function parseJsonContent(content) {
  if (typeof content !== 'string') return null;

  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace < 0 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(
        cleaned.slice(firstBrace, lastBrace + 1)
      );
    } catch {
      return null;
    }
  }
}

// Validate AI-generated recommendations.
function cleanRecommendations(recommendations, fallback) {
  if (!Array.isArray(recommendations)) {
    return fallback;
  }

  const cleaned = recommendations
    .filter(item =>
      item &&
      typeof item.title === 'string' &&
      typeof item.description === 'string' &&
      item.title.trim() &&
      item.description.trim()
    )
    .slice(0, 3)
    .map(item => ({
      icon:
        typeof item.icon === 'string' && item.icon.trim()
          ? item.icon.trim().slice(0, 8)
          : '✨',

      title: item.title.trim().slice(0, 80),

      description: item.description.trim().slice(0, 320)
    }));

  return cleaned.length > 0 ? cleaned : fallback;
}

/*
 * Optional OpenAI-compatible LLM integration.
 *
 * Required environment variables:
 * AI_API_URL
 * AI_API_KEY
 * AI_MODEL
 *
 * Without these variables, the profile uses
 * deterministic, activity-based recommendations.
 */
async function generateNarrative(facts, fallback) {
  const {
    AI_API_URL,
    AI_API_KEY,
    AI_MODEL
  } = process.env;

  // Use fallback if AI configuration is unavailable.
  if (!AI_API_URL || !AI_API_KEY || !AI_MODEL) {
    return {
      ...fallback,
      generationMode: 'rules'
    };
  }

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`
      },

      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.55,
        response_format: {
          type: 'json_object'
        },

        messages: [
          {
            role: 'system',

            content: [
              'You are the TechNeeds learning coach.',
              'Use only the supplied learning facts.',
              'Never invent scores, completed work, ranks, skills, or credentials.',
              'Return valid JSON with exactly these keys: performanceSummary (string), recommendations (array).',
              'Each recommendation must have icon (one emoji), title (short string), and description (one or two useful sentences).',
              'Return at most 3 recommendations.',
              'Keep the tone encouraging, specific, and practical.'
            ].join(' ')
          },

          {
            role: 'user',
            content: JSON.stringify(facts)
          }
        ]
      }),

      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      throw new Error(
        `AI provider returned HTTP ${response.status}`
      );
    }

    const payload = await response.json();

    const content =
      payload?.choices?.[0]?.message?.content;

    const parsed = parseJsonContent(content);

    if (
      !parsed ||
      typeof parsed.performanceSummary !== 'string' ||
      !parsed.performanceSummary.trim() ||
      !Array.isArray(parsed.recommendations)
    ) {
      throw new Error(
        'AI provider returned an unexpected response format'
      );
    }

    const recommendations = cleanRecommendations(
      parsed.recommendations,
      fallback.recommendations
    );

    return {
      performanceSummary: parsed.performanceSummary
        .trim()
        .slice(0, 1000),

      recommendations,

      generationMode: 'llm'
    };

  } catch (error) {
    console.warn(
      'AI profile generation fallback:',
      error.message
    );

    return {
      ...fallback,
      generationMode: 'rules'
    };
  }
}

module.exports = {
  uniqueStrings,
  inferInterests,
  buildAvatarUrl,
  buildMenteeBadges,
  buildMenteeFallback,
  generateNarrative
};