/* ── Recommendation Engine ─────────────────────────────────────────────
   Returns an array of skill result objects, up to (selectedCategories × 3).

   Skill eligibility uses progressive fallback — filters relaxed in order:
     0. All filters: category + budget + structure + level
     1. Drop level/commitment
     2. Drop structure
     3. Drop budget  (category match always required)

   Resource selection uses its own progressive fallback per skill:
     0. All filters: budget + structure + commitment
     1. Drop commitment
     2. Drop structure
     3. Drop budget (paidFallback = true if user wanted free)

   Ranking within the eligible skill pool:
     +3 per matching selected category (multi-category skills rise first)
     +1 for structure match
     +0.5–1 for level/commitment match
     +0–0.5 random nudge for variety
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

// ── Resource selection with progressive fallback ──────────────────────
function _selectResources (allResources, profile) {
  const passes = (r, rfb) => {
    // Level/commitment (relax at rfb >= 1)
    if (rfb < 1 && profile.level) {
      if (profile.level === 'beginner'    && r.commitment === 'intensive') return false;
      if (profile.level === 'experienced' && r.commitment === 'light')     return false;
    }
    // Structure (relax at rfb >= 2)
    if (rfb < 2 && profile.structure) {
      if (r.structure !== profile.structure) return false;
    }
    // Budget (relax at rfb >= 3)
    if (rfb < 3 && profile.budget === 'free') {
      if (r.costValue > 0) return false;
    }
    return true;
  };

  for (let rfb = 0; rfb <= 3; rfb++) {
    const pool = allResources.filter(r => passes(r, rfb));
    if (pool.length > 0) {
      const paidFallback = profile.budget === 'free' && pool.some(r => r.costValue > 0);
      return { resources: pool.slice(0, 3), paidFallback };
    }
  }

  // Shouldn't reach here, but safety net
  const paidFallback = profile.budget === 'free' && allResources.some(r => r.costValue > 0);
  return { resources: allResources.slice(0, 3), paidFallback };
}

GQ.recommend = function (profile) {
  const interests    = profile.interests || {};
  const selectedCats = Object.keys(interests).filter(k => interests[k] === true);

  if (selectedCats.length === 0) return [];

  const targetCount = selectedCats.length * 3;

  // ── Skill eligibility check ──────────────────────────────────────────
  const isEligible = (skill, fallback) => {
    // Always required: at least one selected category
    if (!skill.categories.some(c => selectedCats.includes(c))) return false;

    // Budget (relaxed at fallback >= 3)
    if (fallback < 3 && profile.budget === 'free') {
      if (!skill.resources.some(r => r.costValue === 0)) return false;
    }

    // Structure (relaxed at fallback >= 2)
    if (fallback < 2 && profile.structure) {
      if (skill.structure !== profile.structure) return false;
    }

    // Level / commitment (relaxed at fallback >= 1)
    if (fallback < 1 && profile.level) {
      if (profile.level === 'beginner'    && skill.commitment === 'intensive') return false;
      if (profile.level === 'experienced' && skill.commitment === 'light')     return false;
    }

    return true;
  };

  // ── Find minimum fallback level with enough skills ───────────────────
  let eligibleSkills = [];
  for (let fb = 0; fb <= 3; fb++) {
    const eligible = GQ.SKILLS.filter(s => isEligible(s, fb));
    if (eligible.length >= targetCount || fb === 3) {
      eligibleSkills = eligible;
      break;
    }
  }

  // ── Score and sort ───────────────────────────────────────────────────
  const scored = eligibleSkills.map(skill => {
    const catMatches     = skill.categories.filter(c => selectedCats.includes(c)).length;
    const structureBonus = skill.structure === profile.structure ? 1 : 0;
    let levelBonus = 0;
    if (profile.level === 'beginner') {
      if (skill.commitment === 'light')        levelBonus = 1;
      else if (skill.commitment === 'moderate') levelBonus = 0.5;
    } else if (profile.level === 'experienced') {
      if (skill.commitment === 'intensive')    levelBonus = 1;
      else if (skill.commitment === 'moderate') levelBonus = 0.75;
    }
    return {
      skill,
      score: catMatches * 3 + structureBonus + levelBonus + Math.random() * 0.5,
    };
  }).sort((a, b) => b.score - a.score);

  // ── Labels for filter hint ───────────────────────────────────────────
  const LEVEL_LABELS     = { beginner: 'Beginner', experienced: 'Intermediate' };
  const STRUCTURE_LABELS = { 'self-paced': 'Self-paced', cohort: 'Cohort', '1-on-1': '1-on-1' };
  const BUDGET_LABELS    = { free: 'Free', any: null };

  const filters = [
    BUDGET_LABELS[profile.budget],
    STRUCTURE_LABELS[profile.structure],
    LEVEL_LABELS[profile.level],
  ].filter(Boolean);

  // ── Build result objects from top N ─────────────────────────────────
  return scored.slice(0, targetCount).map(({ skill }) => {
    const { resources, paidFallback } = _selectResources(skill.resources, profile);

    return {
      skill,
      resources,
      matchedCats:  skill.categories.filter(c => selectedCats.includes(c)),
      paidFallback,
      filters,
      skillUrl:     `https://www.skillguild.co/skills/${skill.slug}`,
    };
  });
};
