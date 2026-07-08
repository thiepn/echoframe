import { DESIGN_HEIGHT, DESIGN_WIDTH, PALETTE } from '../data/constants.js';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../data/difficulty.js';
import { SCENE_KEYS } from '../data/sceneKeys.js';
import {
  ACTION_LABELS,
  GAMEPLAY_ACTIONS,
  bindingLabel,
  clearSecondaryBinding,
  defaultBindingsSnapshot,
  replaceBinding,
} from '../input/BindingCatalog.js';
import { ConfirmationModal } from '../ui/ConfirmationModal.js';
import { MenuSceneBase } from './MenuSceneBase.js';

function percent(value) { return `${Math.round(value * 100)}%`; }
function nextStep(value, step = 0.1, minimum = 0, maximum = 1) {
  const next = Number((value + step).toFixed(2));
  return next > maximum ? minimum : next;
}

export class SettingsScene extends MenuSceneBase {
  constructor(services) {
    super(SCENE_KEYS.settings, services);
    this.section = 'root';
    this.returnTo = SCENE_KEYS.mainMenu;
    this.returnPayload = {};
    this.viewObjects = [];
    this.statusText = null;
    this.captureCleanup = null;
  }

  create() {
    this.returnTo = this.sceneData.returnTo ?? SCENE_KEYS.mainMenu;
    this.returnPayload = this.sceneData.returnPayload ?? {};
    this.setupMenu({
      title: 'Settings',
      subtitle: 'Changes persist locally and apply immediately.',
      onCancel: () => this.#cancel(),
    });
    this.statusText = this.add.text(DESIGN_WIDTH / 2, 855, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: '#72f1b8', align: 'center', wordWrap: { width: 1100 },
    }).setOrigin(0.5).setDepth(200);
    this.#renderRoot();
    this.cleanup.add(() => this.#closeCapture('scene-shutdown'));
  }

  #cancel() {
    if (this.captureCleanup) { this.#closeCapture('cancelled'); return; }
    if (this.section !== 'root') { this.#renderRoot(); return; }
    this.#return();
  }

  #renderRoot() {
    this.#prepareView('root');
    let y = 215;
    for (const [label, render] of [
      ['Audio', () => this.#renderAudio()],
      ['Visual', () => this.#renderVisual()],
      ['Accessibility', () => this.#renderAccessibility()],
      ['Controls', () => this.#renderControls()],
      ['Gameplay', () => this.#renderGameplay()],
      ['Data', () => this.#renderData()],
    ]) {
      this.addButton(label, render, { y, height: 50 });
      y += 61;
    }
    this.addButton('Back', () => this.#return(), { y: 760, width: 320 });
  }

  #renderAudio() {
    this.#prepareView('audio');
    const settings = this.services.settingsManager;
    let y = 220;
    const addVolume = (label, path) => {
      const button = this.addButton(`${label}: ${percent(settings.get(path))}`, () => {
        const value = nextStep(settings.get(path)); settings.set(path, value); button.setLabel(`${label}: ${percent(value)}`);
      }, { y });
      y += 66;
    };
    addVolume('Master volume', 'audio.masterVolume');
    addVolume('Music volume', 'audio.musicVolume');
    addVolume('Effects volume', 'audio.effectsVolume');
    const muteButton = this.addButton(`Mute: ${settings.get('audio.muted') ? 'On' : 'Off'}`, () => {
      const value = !settings.get('audio.muted'); settings.set('audio.muted', value); muteButton.setLabel(`Mute: ${value ? 'On' : 'Off'}`);
    }, { y });
    this.addButton('Back to Settings', () => this.#renderRoot(), { y: 660, width: 340 });
  }

  #renderVisual() {
    this.#prepareView('visual');
    const settings = this.services.settingsManager;
    let y = 190;
    const addToggle = (label, path) => {
      const button = this.addButton(`${label}: ${settings.get(path) ? 'On' : 'Off'}`, () => {
        const value = !settings.get(path); settings.set(path, value); button.setLabel(`${label}: ${value ? 'On' : 'Off'}`);
      }, { y, height: 46, fontSize: 18 });
      y += 56;
    };
    const shakeButton = this.addButton(`Screen shake: ${percent(settings.get('visual.screenShake'))}`, () => {
      const value = nextStep(settings.get('visual.screenShake')); settings.set('visual.screenShake', value); shakeButton.setLabel(`Screen shake: ${percent(value)}`);
    }, { y, height: 46, fontSize: 18 }); y += 56;
    addToggle('Reduced flashes', 'visual.reducedFlashes');
    addToggle('Reduced particles', 'visual.reducedParticles');
    addToggle('Damage numbers', 'visual.damageNumbers');
    addToggle('Aim line', 'visual.aimLine');
    const hudButton = this.addButton(`HUD opacity: ${percent(settings.get('visual.hudOpacity'))}`, () => {
      const value = nextStep(settings.get('visual.hudOpacity'), 0.1, 0.5, 1); settings.set('visual.hudOpacity', value); hudButton.setLabel(`HUD opacity: ${percent(value)}`);
    }, { y, height: 46, fontSize: 18 });
    this.addButton('Back to Settings', () => this.#renderRoot(), { y: 670, width: 340, height: 46, fontSize: 18 });
  }

  #renderAccessibility() {
    this.#prepareView('accessibility');
    const settings = this.services.settingsManager;
    let y = 220;
    const addToggle = (label, path) => {
      const button = this.addButton(`${label}: ${settings.get(path) ? 'On' : 'Off'}`, () => {
        const value = !settings.get(path); settings.set(path, value); button.setLabel(`${label}: ${value ? 'On' : 'Off'}`);
      }, { y, height: 50, fontSize: 18 });
      y += 66;
    };
    addToggle('High contrast', 'visual.highContrast');
    addToggle('Pause on focus loss', 'accessibility.pauseOnFocusLoss');
    addToggle('Persistent player locator', 'accessibility.persistentPlayerLocator');
    addToggle('Larger telegraph outlines', 'accessibility.largerTelegraphOutlines');
    this.#add(this.add.text(DESIGN_WIDTH / 2, 535, 'Danger, focus, lock, vulnerability, and tutorial states use shape, text, outline, or motion in addition to color.', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: PALETTE.mutedText, align: 'center', wordWrap: { width: 900 },
    }).setOrigin(0.5));
    this.addButton('Back to Settings', () => this.#renderRoot(), { y: 650, width: 340 });
  }

  #renderControls() {
    this.#prepareView('controls');
    const bindings = this.services.settingsManager.get('controls.bindings', {});
    this.#add(this.add.text(DESIGN_WIDTH / 2, 150, 'Gameplay bindings are remappable. Menu navigation remains fixed: Arrow keys, Enter, Escape, and mouse.', {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: PALETTE.mutedText, align: 'center', wordWrap: { width: 1100 },
    }).setOrigin(0.5));
    GAMEPLAY_ACTIONS.forEach((action, index) => {
      const y = 205 + index * 59;
      this.#add(this.add.text(245, y, ACTION_LABELS[action], { fontFamily: 'monospace', fontSize: '18px', color: PALETTE.primaryText }).setOrigin(0, 0.5));
      const primary = bindings[action]?.[0];
      const secondary = bindings[action]?.[1];
      this.addButton(`Primary: ${bindingLabel(primary)}`, () => this.#openCapture(action, 0), { x: 790, y, width: 390, height: 43, fontSize: 16 });
      this.addButton(`Secondary: ${secondary ? bindingLabel(secondary) : 'None'}`, () => this.#openCapture(action, 1), { x: 1220, y, width: 390, height: 43, fontSize: 16 });
    });
    this.#add(this.add.text(DESIGN_WIDTH / 2, 695, 'During capture: press a key or mouse button. Escape cancels. Backspace clears an optional secondary binding.', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffd166', align: 'center',
    }).setOrigin(0.5));
    this.addButton('Restore Defaults', () => this.#restoreDefaults(), { x: 580, y: 770, width: 350, height: 46, fontSize: 18 });
    this.addButton('Back to Settings', () => this.#renderRoot(), { x: 1020, y: 770, width: 350, height: 46, fontSize: 18 });
  }

  #renderGameplay() {
    this.#prepareView('gameplay');
    const settings = this.services.settingsManager;
    const save = this.services.saveManager.getSnapshot();
    const button = this.addButton(`Default difficulty: ${DIFFICULTIES[settings.get('gameplay.lastDifficulty', 'standard')]?.label ?? 'Standard'}`, () => {
      const current = settings.get('gameplay.lastDifficulty', 'standard');
      const start = DIFFICULTY_ORDER.indexOf(current);
      for (let offset = 1; offset <= DIFFICULTY_ORDER.length; offset += 1) {
        const candidate = DIFFICULTY_ORDER[(start + offset) % DIFFICULTY_ORDER.length];
        if (save.progression.unlockedDifficultyIds.includes(candidate)) { settings.set('gameplay.lastDifficulty', candidate); break; }
      }
      const next = settings.get('gameplay.lastDifficulty', 'standard');
      button.setLabel(`Default difficulty: ${DIFFICULTIES[next]?.label ?? 'Standard'}`);
    }, { y: 250 });
    this.#add(this.add.text(DESIGN_WIDTH / 2, 390, [
      'Difficulty affects new runs only.',
      'Relaxed and Standard are available from a fresh save.',
      'Overclocked unlocks through breadth progression.',
      'Menu navigation is fixed for reliable recovery and accessibility.',
    ], { fontFamily: 'Arial, sans-serif', fontSize: '21px', color: PALETTE.mutedText, align: 'center', lineSpacing: 12 }).setOrigin(0.5));
    this.addButton('Back to Settings', () => this.#renderRoot(), { y: 620, width: 340 });
  }

  #renderData() {
    this.#prepareView('data');
    let y = 245;
    this.addButton('Export Save JSON', () => this.#exportSave(), { y }); y += 72;
    this.addButton('Import Save JSON', () => this.#importSave(), { y }); y += 72;
    this.addButton('Clear Local Save', () => this.#confirmClear(), { y });
    this.#add(this.add.text(DESIGN_WIDTH / 2, 535, 'Save data remains local. Imports are validated before the current save is replaced.', {
      fontFamily: 'Arial, sans-serif', fontSize: '19px', color: PALETTE.mutedText,
    }).setOrigin(0.5));
    this.addButton('Back to Settings', () => this.#renderRoot(), { y: 650, width: 340 });
  }

  #openCapture(action, slot) {
    if (this.captureCleanup) return;
    this.services.inputManager.beginCapture();
    const objects = [];
    const overlay = this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x000000, 0.72).setDepth(300).setInteractive();
    const panel = this.add.rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, 760, 300, PALETTE.surface, 1).setStrokeStyle(4, PALETTE.playerCyan, 0.95).setDepth(301);
    const title = this.add.text(DESIGN_WIDTH / 2, 380, `Rebind ${ACTION_LABELS[action]} · ${slot === 0 ? 'Primary' : 'Secondary'}`, { fontFamily: 'monospace', fontSize: '24px', color: PALETTE.primaryText, fontStyle: 'bold' }).setOrigin(0.5).setDepth(302);
    const instruction = this.add.text(DESIGN_WIDTH / 2, 455, 'Press a key or mouse button\nEscape cancels · Backspace clears optional secondary', { fontFamily: 'Arial, sans-serif', fontSize: '22px', color: PALETTE.mutedText, align: 'center', lineSpacing: 10 }).setOrigin(0.5).setDepth(302);
    const cancel = this.add.text(DESIGN_WIDTH / 2, 555, 'CANCEL', { fontFamily: 'monospace', fontSize: '19px', color: '#ffd166', backgroundColor: '#080b14', padding: { x: 24, y: 12 } }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });
    objects.push(overlay, panel, title, instruction, cancel);

    let active = true;
    let keyHandler = null;
    let pointerHandler = null;
    const close = (reason, message = '') => {
      if (!active) return;
      active = false;
      if (keyHandler) globalThis.removeEventListener('keydown', keyHandler, true);
      if (pointerHandler) globalThis.removeEventListener('pointerdown', pointerHandler, true);
      cancel.off('pointerdown');
      for (const object of objects) object.destroy();
      this.services.inputManager.endCapture();
      this.captureCleanup = null;
      if (message) this.#setStatus(message, reason === 'accepted' || reason === 'cleared');
      if (!['view-change', 'return', 'scene-shutdown'].includes(reason)) this.#renderControls();
    };
    this.captureCleanup = close;
    cancel.on('pointerdown', (pointer) => { pointer.event?.stopPropagation?.(); close('cancelled', 'Binding capture cancelled.'); });

    const commit = (descriptor) => {
      const current = this.services.settingsManager.get('controls.bindings', {});
      const result = replaceBinding(current, action, slot, descriptor);
      if (!result.ok) {
        const conflict = result.conflictAction ? ` with ${ACTION_LABELS[result.conflictAction]}` : '';
        close('rejected', `Binding rejected: ${result.reason.replaceAll('-', ' ')}${conflict}. Existing binding kept.`);
        return;
      }
      this.services.settingsManager.set('controls.bindings', structuredClone(result.bindings), { immediate: true });
      this.services.eventBus.emit('binding:accepted', { action, slot, descriptor: result.descriptor });
      close('accepted', `${ACTION_LABELS[action]} ${slot === 0 ? 'primary' : 'secondary'} set to ${bindingLabel(result.descriptor)}.`);
    };

    const timer = this.time.delayedCall(140, () => {
      keyHandler = (event) => {
        if (event.repeat) return;
        event.preventDefault(); event.stopPropagation();
        if (event.code === 'Escape') { close('cancelled', 'Binding capture cancelled.'); return; }
        if (event.code === 'Backspace' && slot === 1) {
          const result = clearSecondaryBinding(this.services.settingsManager.get('controls.bindings', {}), action);
          this.services.settingsManager.set('controls.bindings', structuredClone(result.bindings), { immediate: true });
          close('cleared', `${ACTION_LABELS[action]} secondary binding cleared.`); return;
        }
        commit({ device: 'keyboard', code: event.code });
      };
      pointerHandler = (event) => {
        if (!active) return;
        event.preventDefault(); event.stopPropagation();
        commit({ device: 'pointer', button: event.button });
      };
      globalThis.addEventListener('keydown', keyHandler, true);
      globalThis.addEventListener('pointerdown', pointerHandler, true);
    });
    this.cleanup.trackTimer(timer);
  }

  #closeCapture(reason) { this.captureCleanup?.(reason); }

  #restoreDefaults() {
    this.services.settingsManager.set('controls.bindings', defaultBindingsSnapshot(), { immediate: true });
    this.services.eventBus.emit('binding:defaults-restored', {});
    this.#setStatus('Canonical gameplay bindings restored.', true);
    this.#renderControls();
  }

  #prepareView(section) {
    this.#closeCapture('view-change');
    this.section = section;
    this.clearButtons();
    for (const object of this.viewObjects) object.destroy();
    this.viewObjects = [];
    this.statusText?.setText('');
  }
  #add(object) { this.viewObjects.push(object); return object; }
  #setStatus(message, success) { this.statusText.setColor(success ? '#72f1b8' : '#ff9d45').setText(message); }

  #exportSave() {
    const blob = new Blob([this.services.saveManager.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'echoframe-save-v2.json'; document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    this.#setStatus('Save exported.', true);
  }

  #importSave() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json'; input.hidden = true; document.body.append(input);
    let removed = false;
    const cleanupInput = () => { if (!removed) { removed = true; input.remove(); } };
    this.cleanup.add(cleanupInput);
    input.addEventListener('change', async () => {
      try {
        const file = input.files?.[0]; if (!file) return;
        const result = this.services.saveManager.importJson(await file.text());
        if (!result.ok) { this.#setStatus('Import rejected. The current save was preserved.', false); return; }
        this.services.settingsManager.reloadFromSave();
        this.services.inputManager.refreshContexts('save-import');
        this.#setStatus(result.migrated ? 'Older save imported and upgraded safely.' : 'Save imported.', true);
      } finally { cleanupInput(); }
    }, { once: true });
    input.click();
  }

  #confirmClear() {
    new ConfirmationModal(this, this.focusManager, {
      title: 'Clear local save?',
      message: 'This resets tutorial completion, controls, settings, statistics, progression, and run history. This action cannot be undone.',
      confirmLabel: 'Clear Save',
      onConfirm: () => {
        this.services.saveManager.clear(); this.services.settingsManager.reloadFromSave(); this.services.inputManager.refreshContexts('save-clear');
        this.#setStatus('Local save reset. Tutorial and controls returned to defaults.', true);
      },
    });
  }

  #return() {
    this.#closeCapture('return');
    this.services.sceneFlow.replace({
      sourceKeys: [SCENE_KEYS.settings],
      targetKey: this.returnTo,
      payload: this.returnPayload,
      token: `settings-back-${performance.now()}`,
    });
  }
}
