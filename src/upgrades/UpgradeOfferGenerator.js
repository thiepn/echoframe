import { SeededRandom, deriveSeed } from '../utils/SeededRandom.js';
import { getUpgrade, INITIAL_UNLOCKED_UPGRADE_IDS } from './UpgradeCatalog.js';
import { eligibleUpgrades } from './UpgradeEligibility.js';

const BASE_WEIGHTS = Object.freeze({ Weapon: 1, Echo: 1, Mobility: 0.9, Defense: 0.85 });

function levelSignature(levels) {
  return [...levels.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, value]) => `${id}:${value}`).join('|');
}

function categoryCount(levels, category) {
  let count = 0;
  for (const [id, value] of levels) if (value > 0 && getUpgrade(id)?.category === category) count += 1;
  return count;
}

function effectiveWeight(definition, { levels, healthRatio, categoryCounts }) {
  const count = categoryCounts?.[definition.category] ?? categoryCount(levels, definition.category);
  let multiplier = count >= 2 ? 1.12 : 1;
  if (count >= 3) multiplier *= 1.05;
  if (definition.category === 'Defense' && healthRatio <= 0.35) multiplier *= 1.3;
  const base = BASE_WEIGHTS[definition.category] ?? 1;
  return Math.min(base * 1.6, base * multiplier);
}

export function generateUpgradeOffers({
  seed = 1,
  offerIndex = 0,
  levels = new Map(),
  count = 3,
  unlockedIds = INITIAL_UNLOCKED_UPGRADE_IDS,
  conflicts = [],
  healthRatio = 1,
  categoryCounts = null,
} = {}) {
  const valid = eligibleUpgrades({ levels, unlockedIds, conflicts });
  const stateKey = `${offerIndex}|${Math.round(healthRatio * 100)}|${levelSignature(levels)}|${[...unlockedIds].sort().join(',')}|${[...conflicts].sort().join(',')}`;
  const rng = new SeededRandom(deriveSeed(Number(seed) >>> 0, `upgrade-offer-${stateKey}`));
  const remaining = [...valid];
  const selected = [];
  while (selected.length < count && remaining.length) {
    const weights = remaining.map((definition) => effectiveWeight(definition, { levels, healthRatio, categoryCounts }));
    const total = weights.reduce((sum, value) => sum + value, 0);
    let roll = rng.next() * total;
    let index = 0;
    for (; index < weights.length - 1; index += 1) {
      roll -= weights[index];
      if (roll <= 0) break;
    }
    selected.push(remaining.splice(index, 1)[0]);
  }

  if (selected.length >= 2) {
    const dominant = selected[0].category;
    if (selected.every((definition) => definition.category === dominant)) {
      const outside = remaining.filter((definition) => definition.category !== dominant);
      if (outside.length) selected[selected.length - 1] = outside[Math.floor(rng.next() * outside.length)];
    }
  }

  return selected.map((definition) => {
    const currentLevel = levels.get(definition.id) ?? 0;
    return Object.freeze({
      ...definition,
      currentLevel,
      resultingLevel: currentLevel + 1,
      levelData: definition.levels[currentLevel],
    });
  });
}
