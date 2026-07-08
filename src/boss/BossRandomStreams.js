import { deriveSeed, SeededRandom } from '../utils/SeededRandom.js';
const NAMES = Object.freeze(['attackSelection','attackVariation','fanPattern','linePattern','summonSelection','hostileEchoSelection','hostileEchoOffset','sectorSelection','panelSelection','longFightVariation','cosmeticVariation','destructionCosmetics']);
export class BossRandomStreams {
  constructor(seed, difficultyId = 'standard', generationVersion = 1) {
    this.baseSeed = deriveSeed(Number(seed) >>> 0, `boss:${difficultyId}:${generationVersion}`);
    for (const name of NAMES) this[name] = new SeededRandom(deriveSeed(this.baseSeed, name));
  }
  snapshot() { return Object.freeze(Object.fromEntries(NAMES.map((name) => [name, this[name].snapshot()]))); }
  reset() { for (const name of NAMES) this[name].reset(); }
}
