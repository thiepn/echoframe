export class AudioManager {
  constructor({ eventBus }) {
    this.eventBus = eventBus;
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.ambientOscillator = null;
    this.buffers = new Map();
    this.settings = {
      masterVolume: 0.8,
      musicVolume: 0.6,
      effectsVolume: 0.8,
      muted: false,
    };
    this.activeVoices = 0;
    this.voiceCap = 14;
    this.initializationFailed = false;
    this.lastCrossfireVoiceTime = -Infinity;
  }

  async ensureStarted() {
    if (this.initializationFailed) {
      return false;
    }

    try {
      if (!this.context) {
        const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('Web Audio API is unavailable.');
        }

        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.musicGain = this.context.createGain();
        this.effectsGain = this.context.createGain();
        this.musicGain.connect(this.masterGain);
        this.effectsGain.connect(this.masterGain);
        this.masterGain.connect(this.context.destination);
        this.#buildBuffers();
        this.#createAmbientLayer();
        this.#applyGainValues();
      }

      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.eventBus.emit('audio:state:changed', {
        available: true,
        state: this.context.state,
      });
      return true;
    } catch (error) {
      this.initializationFailed = true;
      this.eventBus.emit('audio:state:changed', {
        available: false,
        state: 'failed',
        message: error.message,
      });
      return false;
    }
  }

  applySettings(settings) {
    this.settings = {
      masterVolume: settings.masterVolume,
      musicVolume: settings.musicVolume,
      effectsVolume: settings.effectsVolume,
      muted: settings.muted,
    };
    this.#applyGainValues();
  }

  playNavigation() {
    this.#playBuffer('navigation', { gain: 0.045 });
  }

  playConfirm() {
    this.#playBuffer('confirm', { gain: 0.06 });
  }

  playPlayerShot() {
    this.#playBuffer('player-shot', {
      gain: 0.055,
      detune: -35 + Math.random() * 70,
    });
  }

  playDash() {
    this.#playBuffer('dash', { gain: 0.085, detune: -20 + Math.random() * 40 });
  }

  playTargetHit() {
    this.#playBuffer('target-hit', {
      gain: 0.055,
      detune: -45 + Math.random() * 90,
    });
  }

  playObjectiveComplete() {
    this.#playBuffer('complete', { gain: 0.095 });
  }

  // Legacy internal alias retained for Phase 1–9 event compatibility.
  playPrototypeComplete() { this.playObjectiveComplete(); }

  playEchoDeploy() {
    this.#playBuffer('echo-deploy', { gain: 0.075, detune: -15 });
  }

  playEchoShot() {
    this.#playBuffer('echo-shot', {
      gain: 0.042,
      detune: -55 + Math.random() * 40,
    });
  }

  playEchoDash() {
    this.#playBuffer('echo-dash', { gain: 0.052, detune: -45 + Math.random() * 30 });
  }

  playEchoDissolve() {
    this.#playBuffer('echo-dissolve', { gain: 0.055 });
  }

  playCrossfire() {
    if (!this.context || this.context.currentTime - this.lastCrossfireVoiceTime < 0.18) {
      return;
    }
    this.lastCrossfireVoiceTime = this.context.currentTime;
    this.#playBuffer('crossfire', { gain: 0.07 });
  }

  playDrifterSpawn() { this.#playBuffer('drifter-spawn', { gain: 0.055 }); }

  playDrifterLunge() { this.#playBuffer('drifter-lunge', { gain: 0.065 }); }

  playDrifterDeath() { this.#playBuffer('drifter-death', { gain: 0.06 }); }

  playSentrySpawn() { this.#playBuffer('sentry-spawn', { gain: 0.055 }); }

  playSentryAnticipation() { this.#playBuffer('sentry-anticipation', { gain: 0.05 }); }

  playSentryShot() { this.#playBuffer('sentry-shot', { gain: 0.065 }); }

  playSentryDeath() { this.#playBuffer('sentry-death', { gain: 0.065 }); }

  playPlayerDamage() { this.#playBuffer('player-damage', { gain: 0.09 }); }

  playPlayerDeath() { this.#playBuffer('player-death', { gain: 0.11 }); }

  playChamberClear() { this.#playBuffer('chamber-clear', { gain: 0.095 }); }

  playUpgradeOffer() { this.#playBuffer('upgrade-offer', { gain: 0.065 }); }

  playUpgradeSelection() { this.#playBuffer('upgrade-selection', { gain: 0.085 }); }

  playCombatVictory() { this.#playBuffer('complete', { gain: 0.11 }); }

  playLancerSpawn() { this.#playBuffer('lancer-spawn', { gain: 0.06 }); }
  playLancerAnticipation() { this.#playBuffer('lancer-anticipation', { gain: 0.058 }); }
  playLancerAttack() { this.#playBuffer('lancer-attack', { gain: 0.075 }); }
  playLancerRecovery() { this.#playBuffer('lancer-recovery', { gain: 0.045 }); }
  playLancerDeath() { this.#playBuffer('lancer-death', { gain: 0.07 }); }
  playCarrierSpawn() { this.#playBuffer('carrier-spawn', { gain: 0.06 }); }
  playCarrierRelease() { this.#playBuffer('carrier-release', { gain: 0.075 }); }
  playCarrierImpact() { this.#playBuffer('carrier-impact', { gain: 0.06 }); }
  playCarrierDeath() { this.#playBuffer('carrier-death', { gain: 0.07 }); }
  playBulwarkSpawn() { this.#playBuffer('bulwark-spawn', { gain: 0.065 }); }
  playBulwarkGuard() { this.#playBuffer('bulwark-guard', { gain: 0.05 }); }
  playBulwarkProtectedHit() { this.#playBuffer('bulwark-protected', { gain: 0.045 }); }
  playBulwarkVulnerableHit() { this.#playBuffer('bulwark-vulnerable', { gain: 0.065 }); }
  playBulwarkDeath() { this.#playBuffer('bulwark-death', { gain: 0.075 }); }
  playSuppressorSpawn() { this.#playBuffer('suppressor-spawn', { gain: 0.06 }); }
  playSuppressorAnticipation() { this.#playBuffer('suppressor-anticipation', { gain: 0.055 }); }
  playSuppressorActive() { this.#playBuffer('suppressor-active', { gain: 0.065 }); }
  playSuppressorExpire() { this.#playBuffer('suppressor-expire', { gain: 0.05 }); }
  playSuppressorDeath() { this.#playBuffer('suppressor-death', { gain: 0.07 }); }
  playRecoveryStart() { this.#playBuffer('recovery-start', { gain: 0.06 }); }
  playClimaxStart() { this.#playBuffer('climax-start', { gain: 0.08 }); }
  playEliteSpawn() { this.#playBuffer('elite-spawn', { gain: 0.09 }); }
  playEliteOverclockedPulse() { this.#playBuffer('elite-overclocked-pulse', { gain: 0.052 }); }
  playEliteSplitWarning() { this.#playBuffer('elite-split-warning', { gain: 0.08 }); }
  playEliteCopyAssembly() { this.#playBuffer('elite-copy-assembly', { gain: 0.085 }); }
  playEliteShield() { this.#playBuffer('elite-shield', { gain: 0.08 }); }
  playEliteShieldBreak() { this.#playBuffer('elite-shield-break', { gain: 0.075 }); }
  playEliteDefeat() { this.#playBuffer('elite-defeat', { gain: 0.105 }); }
  playEliteChamberComplete() { this.#playBuffer('elite-chamber-complete', { gain: 0.105 }); }

  async handleVisibility(hidden) {
    if (!this.context) {
      return;
    }

    try {
      if (hidden && this.context.state === 'running') {
        await this.context.suspend();
      } else if (!hidden && this.context.state === 'suspended') {
        await this.context.resume();
      }
    } catch (error) {
      this.eventBus.emit('audio:state:changed', {
        available: true,
        state: this.context.state,
        message: error.message,
      });
    }
  }

  getDiagnostics() {
    return {
      contextCount: this.context ? 1 : 0,
      contextState: this.context?.state ?? 'uninitialized',
      activeVoices: this.activeVoices,
      initializationFailed: this.initializationFailed,
      bufferCount: this.buffers.size,
    };
  }

  async destroy() {
    try {
      this.ambientOscillator?.stop();
    } catch {
      // The oscillator may already have stopped during browser teardown.
    }
    this.ambientOscillator = null;
    this.buffers.clear();
    if (this.context && this.context.state !== 'closed') {
      await this.context.close();
    }
    this.context = null;
  }

  #applyGainValues() {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    const mutedScalar = this.settings.muted ? 0 : 1;
    this.masterGain.gain.setTargetAtTime(
      this.settings.masterVolume * mutedScalar,
      now,
      0.015,
    );
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, now, 0.015);
    this.effectsGain.gain.setTargetAtTime(this.settings.effectsVolume, now, 0.015);
  }

  #createAmbientLayer() {
    this.ambientOscillator = this.context.createOscillator();
    const ambientGain = this.context.createGain();
    this.ambientOscillator.type = 'sine';
    this.ambientOscillator.frequency.value = 55;
    ambientGain.gain.value = 0.012;
    this.ambientOscillator.connect(ambientGain);
    ambientGain.connect(this.musicGain);
    this.ambientOscillator.start();
  }

  #buildBuffers() {
    this.buffers.set('navigation', this.#makeToneBuffer({
      duration: 0.045,
      startFrequency: 340,
      endFrequency: 380,
    }));
    this.buffers.set('confirm', this.#makeToneBuffer({
      duration: 0.075,
      startFrequency: 480,
      endFrequency: 620,
    }));
    this.buffers.set('player-shot', this.#makeToneBuffer({
      duration: 0.07,
      startFrequency: 880,
      endFrequency: 420,
      noise: 0.08,
    }));
    this.buffers.set('dash', this.#makeToneBuffer({
      duration: 0.16,
      startFrequency: 190,
      endFrequency: 760,
      noise: 0.18,
    }));
    this.buffers.set('target-hit', this.#makeToneBuffer({
      duration: 0.085,
      startFrequency: 620,
      endFrequency: 260,
      noise: 0.25,
    }));
    this.buffers.set('complete', this.#makeChordBuffer({
      duration: 0.55,
      frequencies: [261.63, 392, 523.25],
    }));
    this.buffers.set('echo-deploy', this.#makeToneBuffer({
      duration: 0.2,
      startFrequency: 240,
      endFrequency: 720,
      noise: 0.08,
    }));
    this.buffers.set('echo-shot', this.#makeToneBuffer({
      duration: 0.075,
      startFrequency: 640,
      endFrequency: 300,
      noise: 0.05,
    }));
    this.buffers.set('echo-dash', this.#makeToneBuffer({
      duration: 0.14,
      startFrequency: 150,
      endFrequency: 560,
      noise: 0.12,
    }));
    this.buffers.set('echo-dissolve', this.#makeToneBuffer({
      duration: 0.22,
      startFrequency: 520,
      endFrequency: 140,
      noise: 0.06,
    }));
    this.buffers.set('drifter-spawn', this.#makeToneBuffer({ duration: 0.16, startFrequency: 160, endFrequency: 320, noise: 0.18 }));
    this.buffers.set('drifter-lunge', this.#makeToneBuffer({ duration: 0.13, startFrequency: 260, endFrequency: 720, noise: 0.14 }));
    this.buffers.set('drifter-death', this.#makeToneBuffer({ duration: 0.18, startFrequency: 340, endFrequency: 90, noise: 0.28 }));
    this.buffers.set('sentry-spawn', this.#makeToneBuffer({ duration: 0.18, startFrequency: 220, endFrequency: 440, noise: 0.08 }));
    this.buffers.set('sentry-anticipation', this.#makeToneBuffer({ duration: 0.24, startFrequency: 320, endFrequency: 760, noise: 0.02 }));
    this.buffers.set('sentry-shot', this.#makeToneBuffer({ duration: 0.09, startFrequency: 760, endFrequency: 180, noise: 0.22 }));
    this.buffers.set('sentry-death', this.#makeToneBuffer({ duration: 0.2, startFrequency: 520, endFrequency: 110, noise: 0.2 }));
    this.buffers.set('player-damage', this.#makeToneBuffer({ duration: 0.16, startFrequency: 170, endFrequency: 70, noise: 0.35 }));
    this.buffers.set('player-death', this.#makeChordBuffer({ duration: 0.55, frequencies: [110, 138.59, 164.81] }));
    this.buffers.set('chamber-clear', this.#makeChordBuffer({ duration: 0.45, frequencies: [261.63, 392, 587.33] }));
    this.buffers.set('upgrade-offer', this.#makeChordBuffer({ duration: 0.28, frequencies: [329.63, 493.88, 659.25] }));
    this.buffers.set('upgrade-selection', this.#makeChordBuffer({ duration: 0.34, frequencies: [392, 523.25, 783.99] }));
    this.buffers.set('crossfire', this.#makeChordBuffer({
      duration: 0.18,
      frequencies: [392, 493.88, 659.25],
    }));

    this.buffers.set('lancer-spawn', this.#makeToneBuffer({ duration: 0.18, startFrequency: 180, endFrequency: 500, noise: 0.12 }));
    this.buffers.set('lancer-anticipation', this.#makeToneBuffer({ duration: 0.34, startFrequency: 210, endFrequency: 860, noise: 0.04 }));
    this.buffers.set('lancer-attack', this.#makeToneBuffer({ duration: 0.14, startFrequency: 920, endFrequency: 190, noise: 0.2 }));
    this.buffers.set('lancer-recovery', this.#makeToneBuffer({ duration: 0.16, startFrequency: 240, endFrequency: 120, noise: 0.08 }));
    this.buffers.set('lancer-death', this.#makeToneBuffer({ duration: 0.23, startFrequency: 640, endFrequency: 80, noise: 0.24 }));
    this.buffers.set('carrier-spawn', this.#makeToneBuffer({ duration: 0.22, startFrequency: 130, endFrequency: 360, noise: 0.1 }));
    this.buffers.set('carrier-release', this.#makeChordBuffer({ duration: 0.24, frequencies: [220, 330, 440] }));
    this.buffers.set('carrier-impact', this.#makeToneBuffer({ duration: 0.13, startFrequency: 400, endFrequency: 90, noise: 0.28 }));
    this.buffers.set('carrier-death', this.#makeToneBuffer({ duration: 0.26, startFrequency: 520, endFrequency: 75, noise: 0.22 }));
    this.buffers.set('bulwark-spawn', this.#makeToneBuffer({ duration: 0.25, startFrequency: 90, endFrequency: 210, noise: 0.12 }));
    this.buffers.set('bulwark-guard', this.#makeToneBuffer({ duration: 0.12, startFrequency: 180, endFrequency: 260, noise: 0.04 }));
    this.buffers.set('bulwark-protected', this.#makeToneBuffer({ duration: 0.08, startFrequency: 260, endFrequency: 120, noise: 0.12 }));
    this.buffers.set('bulwark-vulnerable', this.#makeToneBuffer({ duration: 0.1, startFrequency: 540, endFrequency: 190, noise: 0.2 }));
    this.buffers.set('bulwark-death', this.#makeToneBuffer({ duration: 0.28, startFrequency: 320, endFrequency: 55, noise: 0.3 }));
    this.buffers.set('suppressor-spawn', this.#makeToneBuffer({ duration: 0.22, startFrequency: 300, endFrequency: 180, noise: 0.06 }));
    this.buffers.set('suppressor-anticipation', this.#makeToneBuffer({ duration: 0.32, startFrequency: 260, endFrequency: 680, noise: 0.03 }));
    this.buffers.set('suppressor-active', this.#makeChordBuffer({ duration: 0.28, frequencies: [146.83, 220, 293.66] }));
    this.buffers.set('suppressor-expire', this.#makeToneBuffer({ duration: 0.2, startFrequency: 420, endFrequency: 150, noise: 0.04 }));
    this.buffers.set('suppressor-death', this.#makeToneBuffer({ duration: 0.26, startFrequency: 460, endFrequency: 70, noise: 0.22 }));
    this.buffers.set('recovery-start', this.#makeChordBuffer({ duration: 0.3, frequencies: [261.63, 329.63, 392] }));
    this.buffers.set('climax-start', this.#makeChordBuffer({ duration: 0.38, frequencies: [110, 220, 440] }));
    this.buffers.set('elite-spawn', this.#makeChordBuffer({ duration: 0.42, frequencies: [146.83, 293.66, 440] }));
    this.buffers.set('elite-overclocked-pulse', this.#makeToneBuffer({ duration: 0.11, startFrequency: 330, endFrequency: 560, noise: 0.03 }));
    this.buffers.set('elite-split-warning', this.#makeToneBuffer({ duration: 0.36, startFrequency: 240, endFrequency: 820, noise: 0.06 }));
    this.buffers.set('elite-copy-assembly', this.#makeChordBuffer({ duration: 0.28, frequencies: [220, 440, 660] }));
    this.buffers.set('elite-shield', this.#makeChordBuffer({ duration: 0.3, frequencies: [196, 392, 587.33] }));
    this.buffers.set('elite-shield-break', this.#makeToneBuffer({ duration: 0.2, startFrequency: 760, endFrequency: 120, noise: 0.2 }));
    this.buffers.set('elite-defeat', this.#makeChordBuffer({ duration: 0.55, frequencies: [174.61, 349.23, 698.46] }));
    this.buffers.set('elite-chamber-complete', this.#makeChordBuffer({ duration: 0.62, frequencies: [220, 440, 659.25] }));
  }

  #makeToneBuffer({ duration, startFrequency, endFrequency, noise = 0 }) {
    const sampleRate = this.context.sampleRate;
    const length = Math.max(1, Math.floor(duration * sampleRate));
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const channel = buffer.getChannelData(0);
    let phase = 0;
    for (let index = 0; index < length; index += 1) {
      const progress = index / Math.max(1, length - 1);
      const frequency = startFrequency + (endFrequency - startFrequency) * progress;
      phase += (Math.PI * 2 * frequency) / sampleRate;
      const envelope = Math.sin(Math.PI * progress) * (1 - progress * 0.35);
      const noiseSample = (Math.random() * 2 - 1) * noise;
      channel[index] = (Math.sin(phase) * (1 - noise) + noiseSample) * envelope;
    }
    return buffer;
  }

  #makeChordBuffer({ duration, frequencies }) {
    const sampleRate = this.context.sampleRate;
    const length = Math.max(1, Math.floor(duration * sampleRate));
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      const time = index / sampleRate;
      const progress = index / Math.max(1, length - 1);
      const envelope = Math.sin(Math.PI * progress) * (1 - progress * 0.25);
      let sample = 0;
      for (const frequency of frequencies) {
        sample += Math.sin(Math.PI * 2 * frequency * time);
      }
      channel[index] = (sample / frequencies.length) * envelope;
    }
    return buffer;
  }

  #playBuffer(name, { gain, detune = 0 }) {
    if (!this.context || this.context.state !== 'running') {
      return;
    }
    if (this.activeVoices >= this.voiceCap) {
      return;
    }
    const buffer = this.buffers.get(name);
    if (!buffer) {
      return;
    }

    this.activeVoices += 1;
    const source = this.context.createBufferSource();
    const voiceGain = this.context.createGain();
    source.buffer = buffer;
    source.detune.value = detune;
    voiceGain.gain.value = gain;
    source.connect(voiceGain);
    voiceGain.connect(this.effectsGain);
    source.addEventListener('ended', () => {
      source.disconnect();
      voiceGain.disconnect();
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    });
    source.start();
  }
}
