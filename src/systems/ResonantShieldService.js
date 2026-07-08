export class ResonantShieldService {
  absorb(controller, amount) {
    if (controller?.modifierId !== 'resonant') return Object.freeze({ absorbed: 0, remaining: Math.max(0, Number(amount) || 0) });
    return controller.modifier.absorb(amount);
  }
}
