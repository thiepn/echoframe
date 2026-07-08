import { HOSTILE_ECHO_DEFINITION } from '../data/hostileEchoDefinitions.js';
function inside(point, rect, padding = 0) { return point.x >= rect.left + padding && point.x <= rect.right - padding && point.y >= rect.top + padding && point.y <= rect.bottom - padding; }
function overlapsRect(point, rect, radius = 28) { return point.x + radius > rect.x - rect.width/2 && point.x - radius < rect.x + rect.width/2 && point.y + radius > rect.y - rect.height/2 && point.y - radius < rect.y + rect.height/2; }
export class HostileEchoSpawnValidator {
  constructor({ minimumPlayerDistance = HOSTILE_ECHO_DEFINITION.minimumSpawnDistance, maximumAttempts = 12 } = {}) { this.minimumPlayerDistance = minimumPlayerDistance; this.maximumAttempts = maximumAttempts; }
  validate(point, context = {}) {
    const reasons = [];
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) reasons.push('non-finite');
    if (context.bounds && !inside(point, context.bounds, 30)) reasons.push('outside-bounds');
    if (context.player && Math.hypot(point.x-context.player.x, point.y-context.player.y) < this.minimumPlayerDistance) reasons.push('player-distance');
    if (context.boss && Math.hypot(point.x-context.boss.x, point.y-context.boss.y) < (context.boss.radius ?? 165) + 40) reasons.push('boss-shell');
    if ((context.solids ?? []).some((solid) => overlapsRect(point, solid))) reasons.push('arena-solid');
    if ((context.hostileEchoes ?? []).some((echo) => Math.hypot(point.x-echo.x, point.y-echo.y) < 90)) reasons.push('hostile-echo');
    if (context.disabledCellPredicate?.(point)) reasons.push('disabled-sector');
    return Object.freeze({ valid: reasons.length === 0, reasons: Object.freeze(reasons) });
  }
  choose({ rng, origin, context = {}, fallbackSockets = [] } = {}) {
    const rejections = {};
    for (let attempt = 0; attempt < this.maximumAttempts; attempt += 1) {
      const distance = rng.integer(HOSTILE_ECHO_DEFINITION.offsetRange[0], HOSTILE_ECHO_DEFINITION.offsetRange[1]);
      const angle = rng.next() * Math.PI * 2;
      const point = { x: origin.x + Math.cos(angle)*distance, y: origin.y + Math.sin(angle)*distance };
      const check = this.validate(point, context);
      if (check.valid) return Object.freeze({ accepted: true, point: Object.freeze(point), attempt: attempt + 1, rejections: Object.freeze(rejections) });
      for (const reason of check.reasons) rejections[reason] = (rejections[reason] ?? 0) + 1;
    }
    for (const socket of fallbackSockets) {
      const check = this.validate(socket, context);
      if (check.valid) return Object.freeze({ accepted: true, point: Object.freeze({ x: socket.x, y: socket.y }), attempt: this.maximumAttempts + 1, fallback: true, rejections: Object.freeze(rejections) });
    }
    return Object.freeze({ accepted: false, point: null, attempt: this.maximumAttempts, rejections: Object.freeze(rejections) });
  }
}
