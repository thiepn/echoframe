import { PALETTE } from '../data/constants.js';
import { CORE_ENEMY_DEFINITIONS } from '../data/coreEnemyDefinitions.js';
import { ELITE_MODIFIER_DEFINITIONS } from '../data/eliteModifierDefinitions.js';
import { ARENA_TEMPLATE_DEFINITIONS } from '../data/arenaTemplateDefinitions.js';
import { ENEMY_BASE_SCORES, ELITE_SCORE_SCALARS } from '../data/scoreDefinitions.js';
import { PALETTE_DEFINITIONS, TRAIL_DEFINITIONS } from '../data/cosmeticDefinitions.js';
import { LORE_DEFINITIONS, UNLOCK_DEFINITIONS } from '../data/progressionDefinitions.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import { UPGRADE_DEFINITIONS } from '../upgrades/UpgradeCatalog.js';
import { MenuSceneBase } from './MenuSceneBase.js';

const CATEGORIES = Object.freeze(['Enemies', 'Elite Modifiers', 'Arenas', 'Upgrades', 'Null Architect', 'Echo Systems', 'Lore', 'Cosmetics']);
const clean = (value) => String(value ?? '').replaceAll('-', ' ');
const levelText = (upgrade) => upgrade.levels.map((entry, index) => `L${index + 1}: ${entry.description}`).join('\n');

function entriesFor(category, save) {
  if (category === 'Enemies') return Object.values(CORE_ENEMY_DEFINITIONS).map((e) => ({ id: `enemy:${e.id}`, title: e.displayName, subtitle: `${clean(e.role)} · Threat ${e.threatCost} · Score ${ENEMY_BASE_SCORES[e.id]}`, body: `Health ${e.health} · Speed ${e.moveSpeed}\nDamage: ${Object.entries(e.damageValues).map(([k,v]) => `${clean(k)} ${v}`).join(', ')}\nCounterplay: read the ${clean(e.visualProfile.telegraph)} telegraph and preserve movement routes.` }));
  if (category === 'Elite Modifiers') return Object.values(ELITE_MODIFIER_DEFINITIONS).map((e) => ({ id: `elite:${e.id}`, title: e.displayName, subtitle: `Threat +${e.threatSurcharge} · Score ×${ELITE_SCORE_SCALARS[e.id]}`, body: `Health ×${e.healthScalar} · Movement ×${e.movementScalar}\n${e.tags.map(clean).join(' · ')}\nReplicating copies score separately and never count as elite parents.` }));
  if (category === 'Arenas') return ARENA_TEMPLATE_DEFINITIONS.map((a) => ({ id: `arena:${a.id}`, title: a.label, subtitle: `${a.identity} · ${a.enemySockets.length} spawn sockets`, body: `Stage tags: ${a.tags.join(', ')}\nHazards: ${a.hazardConfigurationIds.join(', ')}\nTransforms: ${a.validTransformIds.join(', ')}` }));
  if (category === 'Upgrades') return UPGRADE_DEFINITIONS.map((u) => { const unlocked = save.progression.unlockedUpgradeIds.includes(u.id); const unlock = UNLOCK_DEFINITIONS.find((d) => d.rewardIds.includes(u.id)); return { id: `upgrade:${u.id}`, title: `${u.name}${unlocked ? '' : ' · LOCKED'}`, subtitle: `${u.category} · ${u.maxLevel} level${u.maxLevel === 1 ? '' : 's'}`, body: unlocked ? levelText(u) : `${unlock?.requirementText ?? 'Locked breadth upgrade.'}\n\nThe upgrade is implemented but excluded from offers until unlocked.` }; });
  if (category === 'Null Architect') return [
    { id: 'boss:null-architect', title: 'Null Architect', subtitle: '3600 health · Boss victory score 5000', body: 'Observe teaches rotating fans, line volleys, summons, and vulnerability.\nImitate creates separate hostile Echo replays.\nDelete removes temporary sectors and exposes rear panels for crossfire.' },
    { id: 'boss:observe', title: 'Observe', subtitle: '3600–2520 health', body: 'Guaranteed projectile gaps, locked line telegraphs, bounded Drifter summons, and early vulnerability windows.' },
    { id: 'boss:imitate', title: 'Imitate', subtitle: '2520–1260 health', body: 'Hostile Echoes replay curated movement and fire events without inheriting player upgrades.' },
    { id: 'boss:delete', title: 'Delete', subtitle: '1260–0 health', body: 'At least 45% connected safe arena space remains. Rear panels reward friendly-Echo positioning.' },
  ];
  if (category === 'Echo Systems') return [
    { id: 'echo:friendly', title: 'Friendly Echo', subtitle: 'Recorded player action replay', body: 'Uses a frozen loadout snapshot. Friendly Echoes can score crossfire when player and Echo accepted damage hit the same target in time.' },
    { id: 'echo:hostile', title: 'Hostile Echo', subtitle: 'Boss-owned red-black replay', body: 'Separate entity, manager, faction, projectiles, rendering, telemetry, and cleanup. Never inherits player upgrades or cosmetics.' },
    { id: 'echo:crossfire', title: 'Crossfire', subtitle: '40 × stage scalar · +0.5 combo', body: 'Qualified by the authoritative CrossfireTracker. Per-target cooldown prevents farming. Closed boss hits do not qualify.' },
  ];
  if (category === 'Lore') return LORE_DEFINITIONS.map((l) => ({ id: l.id, title: l.title, subtitle: save.progression.loreIds.includes(l.id) ? 'DISCOVERED' : 'LOCKED', body: save.progression.loreIds.includes(l.id) ? `${l.title} is recorded in the local station archive.` : l.requirementText }));
  if (category === 'Cosmetics') return [
    ...PALETTE_DEFINITIONS.map((c) => ({ id: `palette:${c.id}`, type: 'palette', cosmeticId: c.id, title: c.displayName, subtitle: `${save.progression.unlockedPaletteIds.includes(c.id) ? 'UNLOCKED' : 'LOCKED'} PALETTE${save.progression.selectedPaletteId === c.id ? ' · SELECTED' : ''}`, body: c.requirementText })),
    ...TRAIL_DEFINITIONS.map((c) => ({ id: `trail:${c.id}`, type: 'trail', cosmeticId: c.id, title: c.displayName, subtitle: `${save.progression.unlockedTrailIds.includes(c.id) ? 'UNLOCKED' : 'LOCKED'} TRAIL${save.progression.selectedTrailId === c.id ? ' · SELECTED' : ''}`, body: c.requirementText })),
  ];
  return [];
}

export class ArchiveScene extends MenuSceneBase {
  constructor(services) { super(SCENE_KEYS.archive, services); this.categoryIndex = 0; this.page = 0; this.selectedIndex = 0; this.viewObjects = []; }
  create() {
    this.returnTo = this.sceneData.returnTo ?? SCENE_KEYS.mainMenu;
    this.returnPayload = this.sceneData.resultData ?? {};
    this.setupMenu({ title: 'Archive & Cosmetics', subtitle: 'Canonical combat reference, discoveries, unlock requirements, and non-power loadout.', onCancel: () => this.#back() });
    this.#render();
  }
  #clearView() { this.clearButtons(); for (const object of this.viewObjects) object.destroy(); this.viewObjects = []; }
  #add(object) { this.viewObjects.push(object); return object; }
  #render() {
    this.#clearView();
    const save = this.services.saveManager.getSnapshot();
    const category = CATEGORIES[this.categoryIndex];
    const entries = entriesFor(category, save);
    const pageSize = 7; const pageCount = Math.max(1, Math.ceil(entries.length / pageSize)); this.page = Math.min(this.page, pageCount - 1);
    const visible = entries.slice(this.page * pageSize, this.page * pageSize + pageSize); this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, visible.length - 1));
    CATEGORIES.forEach((label, index) => this.addButton(label, () => { this.categoryIndex = index; this.page = 0; this.selectedIndex = 0; this.#render(); }, { x: 135 + index * 190, y: 150, width: 176, height: 38, fontSize: 14 }));
    this.#add(this.add.rectangle(400, 490, 650, 570, PALETTE.surface, 0.92).setStrokeStyle(2, PALETTE.surfaceHighlight, 0.8));
    this.#add(this.add.rectangle(1160, 490, 800, 570, PALETTE.surface, 0.92).setStrokeStyle(2, PALETTE.echoViolet, 0.7));
    visible.forEach((entry, index) => this.addButton(entry.title, () => { this.selectedIndex = index; this.#render(); }, { x: 400, y: 240 + index * 61, width: 570, height: 46, fontSize: 16 }));
    const selected = visible[this.selectedIndex] ?? entries[0];
    if (selected) {
      this.#add(this.add.text(800, 235, selected.title, { fontFamily: 'monospace', fontSize: '25px', color: PALETTE.primaryText }).setOrigin(0, 0));
      this.#add(this.add.text(800, 280, selected.subtitle, { fontFamily: 'monospace', fontSize: '15px', color: '#ffd166', wordWrap: { width: 700 } }).setOrigin(0, 0));
      this.#add(this.add.text(800, 335, selected.body, { fontFamily: 'Arial, sans-serif', fontSize: '19px', color: PALETTE.mutedText, lineSpacing: 10, wordWrap: { width: 700 } }).setOrigin(0, 0));
      if (selected.type) {
        const unlocked = selected.type === 'palette' ? save.progression.unlockedPaletteIds.includes(selected.cosmeticId) : save.progression.unlockedTrailIds.includes(selected.cosmeticId);
        this.addButton(unlocked ? `Select ${selected.title}` : 'Locked', () => this.#selectCosmetic(selected), { x: 1160, y: 670, width: 420, enabled: unlocked, fontSize: 17 });
      }
    }
    if (pageCount > 1) {
      this.addButton('◀ Page', () => { this.page = (this.page + pageCount - 1) % pageCount; this.selectedIndex = 0; this.#render(); }, { x: 270, y: 740, width: 200, height: 42, fontSize: 15 });
      this.addButton(`Page ${this.page + 1}/${pageCount}`, () => {}, { x: 520, y: 740, width: 230, height: 42, fontSize: 15, enabled: false });
      this.addButton('Page ▶', () => { this.page = (this.page + 1) % pageCount; this.selectedIndex = 0; this.#render(); }, { x: 650, y: 740, width: 200, height: 42, fontSize: 15 });
    }
    this.addButton(save.meta.tutorialCompleted ? 'Replay Tutorial' : 'Tutorial locked until first completion', () => this.#replayTutorial(), { x: 560, y: 830, width: 480, height: 46, fontSize: 17, enabled: save.meta.tutorialCompleted });
    this.addButton('Back', () => this.#back(), { x: 1080, y: 830, width: 300, height: 46, fontSize: 18 });
  }
  #selectCosmetic(entry) {
    let result = Object.freeze({ accepted: false, reason: 'not-evaluated' });
    this.services.saveManager.update((save) => { result = this.services.progressionManager.selectCosmetic(save, entry.type, entry.cosmeticId); }, { immediate: true });
    if (result.accepted) this.services.eventBus.emit('cosmetic:selected', { type: entry.type, id: entry.cosmeticId });
    else this.services.eventBus.emit('cosmetic:selection:rejected', result);
    this.#render();
  }
  #replayTutorial() { this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.archive], targetKey: SCENE_KEYS.tutorial, payload: { mode: 'replay', returnTo: SCENE_KEYS.archive }, token: `archive-tutorial-${performance.now()}` }); }
  #back() { this.services.sceneFlow.replace({ sourceKeys: [SCENE_KEYS.archive], targetKey: this.returnTo, payload: this.returnPayload, token: `archive-back-${performance.now()}` }); }
}
