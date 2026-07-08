import { SeededRandom, deriveSeed } from '../utils/SeededRandom.js';

export const ENCOUNTER_RANDOM_STREAM_NAMES = Object.freeze({
  composition: 'encounter-composition',
  spawnSelection: 'spawn-selection',
  spawnOrder: 'spawn-order',
  recoveryVariation: 'recovery-variation',
  cosmetic: 'cosmetic-randomness',
});

export function createEncounterRandomStreams({ seed, chamberIndex, sequenceIndex, phase, attempt = 0 } = {}) {
  const rootSeed = deriveSeed(Number(seed) >>> 0, `encounter:${chamberIndex}:${sequenceIndex}:${phase}`);
  const makeSeed = (name, includeAttempt = true) => deriveSeed(rootSeed, `${name}${includeAttempt ? `:${attempt}` : ''}`);
  const seeds = Object.freeze({
    composition: makeSeed(ENCOUNTER_RANDOM_STREAM_NAMES.composition),
    spawnSelection: makeSeed(ENCOUNTER_RANDOM_STREAM_NAMES.spawnSelection),
    spawnOrder: makeSeed(ENCOUNTER_RANDOM_STREAM_NAMES.spawnOrder),
    recoveryVariation: makeSeed(ENCOUNTER_RANDOM_STREAM_NAMES.recoveryVariation, false),
    cosmetic: makeSeed(ENCOUNTER_RANDOM_STREAM_NAMES.cosmetic, false),
  });
  return {
    seeds,
    composition: new SeededRandom(seeds.composition),
    spawnSelection: new SeededRandom(seeds.spawnSelection),
    spawnOrder: new SeededRandom(seeds.spawnOrder),
    recoveryVariation: new SeededRandom(seeds.recoveryVariation),
    cosmetic: new SeededRandom(seeds.cosmetic),
  };
}
