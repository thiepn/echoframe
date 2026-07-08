import { PLAYER_BALANCE } from '../data/playerBalance.js';
import { PLAYER_STATES, PlayerState } from '../state/PlayerState.js';
import { DashModel } from './DashModel.js';
import {
  chooseDashDirection,
  clampDeltaSeconds,
  moveVelocityToward,
  normalizeInput,
} from '../utils/playerMath.js';

export class PlayerController {
  constructor({ player, inputContext, eventBus, statistics, dashDistanceResolver, movementSpeedProvider = () => 1, secondaryDashProvider = () => null }) {
    this.player = player;
    this.inputContext = inputContext;
    this.eventBus = eventBus;
    this.statistics = statistics;
    this.dashDistanceResolver = dashDistanceResolver;
    this.movementSpeedProvider = movementSpeedProvider;
    this.secondaryDashProvider = secondaryDashProvider;
    this.state = new PlayerState();
    this.dash = new DashModel(PLAYER_BALANCE.dash);
    this.aimDirection = { x: 1, y: 0 };
    this.movementInput = { x: 0, y: 0 };
    this.lastPosition = { x: player.x, y: player.y };
    this.lastMovementEvent = { x: 0, y: 0 };
    this.lastAimEvent = { x: 1, y: 0 };
    this.lastDashCooldownEvent = '';
    this.nextDashEventId = 1;
    this.hitInvulnerable = false;
    this.state.transition(PLAYER_STATES.active);
    this.eventBus.emit('player:spawned', { x: player.x, y: player.y });
    this.eventBus.emit('player:state:changed', { state: this.state.value });
  }

  update(deltaMs, camera, inputLocked = false) {
    this.#recordDistance();
    this.#updateAim(camera);
    const deltaSeconds = clampDeltaSeconds(
      deltaMs,
      PLAYER_BALANCE.movement.maximumDeltaMs,
    );
    const safeDeltaMs = deltaSeconds * 1000;
    const rawMovement = inputLocked
      ? { x: 0, y: 0 }
      : this.inputContext.getMovementVector();
    const normalized = normalizeInput(rawMovement.x, rawMovement.y);
    this.movementInput.x = normalized.x;
    this.movementInput.y = normalized.y;

    if (!inputLocked && this.inputContext.justPressed('dash')) {
      this.#requestDash();
    }

    const bufferedDirection = chooseDashDirection(
      this.movementInput,
      this.aimDirection,
    );
    const bufferedDistance = this.dashDistanceResolver(
      this.player.x,
      this.player.y,
      bufferedDirection,
      PLAYER_BALANCE.dash.distance,
      PLAYER_BALANCE.movement.collisionRadius,
    );
    const dashUpdate = this.dash.update(safeDeltaMs, {
      canStartBuffered: this.state.is(PLAYER_STATES.active) && !inputLocked,
      movement: this.movementInput,
      aim: this.aimDirection,
      bufferedDistance,
    });

    if (dashUpdate.startedBuffered) {
      this.#enterDashState();
    }
    if (dashUpdate.ended && this.state.is(PLAYER_STATES.dashing)) {
      this.#exitDashState();
    }

    if (this.state.is(PLAYER_STATES.dashing)) {
      const speed = this.dash.velocityScalar;
      this.player.setVelocity(
        this.dash.direction.x * speed,
        this.dash.direction.y * speed,
      );
    } else if (this.state.is(PLAYER_STATES.active) && !inputLocked) {
      this.#updateActiveMovement(deltaSeconds);
    } else {
      this.player.setVelocity(0, 0);
    }

    this.player.updateVisuals(safeDeltaMs, this.aimDirection, {
      dashing: this.state.is(PLAYER_STATES.dashing),
      invulnerable: this.dash.invulnerable || this.hitInvulnerable,
    });
    this.#emitMovementIfChanged();
    const cooldownBucket = Math.ceil(this.dash.cooldownRemainingMs / 50) * 50;
    const cooldownEventKey = `${cooldownBucket}:${this.dash.buffered}:${this.dash.active}`;
    if (cooldownEventKey !== this.lastDashCooldownEvent) {
      this.lastDashCooldownEvent = cooldownEventKey;
      this.eventBus.emit('player:dash:cooldown', {
        remainingMs: this.dash.cooldownRemainingMs,
        durationMs: PLAYER_BALANCE.dash.cooldownMs,
        buffered: this.dash.buffered,
        ready: !this.dash.active && this.dash.cooldownRemainingMs <= 0,
      });
    }
  }

  setHitInvulnerable(value) { this.hitInvulnerable = Boolean(value); }

  notifyWallCollision() {
    this.statistics.recordWallCollision();
    if (this.state.is(PLAYER_STATES.dashing) && this.dash.notifyWallStop()) {
      this.player.setVelocity(0, 0);
    }
  }

  lockForTransition() {
    if (
      this.state.is(PLAYER_STATES.active) ||
      this.state.is(PLAYER_STATES.dashing)
    ) {
      this.#setState(PLAYER_STATES.transitionLock);
    }
    this.player.setVelocity(0, 0);
  }

  disable() {
    if (!this.state.is(PLAYER_STATES.disabled)) {
      if (this.state.canTransition(PLAYER_STATES.disabled)) {
        this.#setState(PLAYER_STATES.disabled);
      }
    }
    this.player.setVelocity(0, 0);
  }

  reset(x, y) {
    this.state.reset();
    this.state.transition(PLAYER_STATES.active);
    this.dash.reset();
    this.aimDirection = { x: 1, y: 0 };
    this.movementInput = { x: 0, y: 0 };
    this.player.setPosition(x, y);
    this.player.setVelocity(0, 0);
    this.lastPosition = { x, y };
    this.lastAimEvent = { x: 1, y: 0 };
    this.lastDashCooldownEvent = '';
    this.nextDashEventId = 1;
    this.hitInvulnerable = false;
    this.eventBus.emit('player:state:changed', { state: this.state.value });
  }

  getSnapshot() {
    return {
      position: { x: this.player.x, y: this.player.y },
      velocity: { x: this.player.velocity.x, y: this.player.velocity.y },
      state: this.state.value,
      aim: { ...this.aimDirection },
      movement: { ...this.movementInput },
      dash: this.dash.snapshot(),
    };
  }

  #updateAim(camera) {
    const pointerWorld = this.inputContext.getPointerWorldPosition(camera);
    if (!pointerWorld) {
      return;
    }
    const deltaX = pointerWorld.x - this.player.x;
    const deltaY = pointerWorld.y - this.player.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < PLAYER_BALANCE.movement.aimDeadZoneRadius) {
      return;
    }
    this.aimDirection.x = deltaX / distance;
    this.aimDirection.y = deltaY / distance;
    const aimChanged =
      Math.abs(this.aimDirection.x - this.lastAimEvent.x) > 0.002 ||
      Math.abs(this.aimDirection.y - this.lastAimEvent.y) > 0.002;
    if (aimChanged) {
      this.lastAimEvent.x = this.aimDirection.x;
      this.lastAimEvent.y = this.aimDirection.y;
      this.eventBus.emit('player:aim:changed', {
        x: this.aimDirection.x,
        y: this.aimDirection.y,
      });
    }
  }

  #updateActiveMovement(deltaSeconds) {
    const speedScalar = Math.max(0.1, Number(this.movementSpeedProvider?.()) || 1);
    const maximumSpeed = Math.min(440, PLAYER_BALANCE.movement.maximumSpeed * speedScalar);
    const desiredX = this.movementInput.x * maximumSpeed;
    const desiredY = this.movementInput.y * maximumSpeed;
    const hasInput = Math.hypot(this.movementInput.x, this.movementInput.y) > 0;
    const rate = hasInput
      ? PLAYER_BALANCE.movement.acceleration
      : PLAYER_BALANCE.movement.deceleration;
    const next = moveVelocityToward(
      this.player.velocity.x,
      this.player.velocity.y,
      desiredX,
      desiredY,
      rate * deltaSeconds,
    );
    this.player.setVelocity(next.x, next.y);
  }

  #requestDash() {
    if (!this.state.is(PLAYER_STATES.active)) return;
    const direction = chooseDashDirection(this.movementInput, this.aimDirection);
    if (this.dash.cooldownRemainingMs > 0) {
      const secondaryScalar = this.secondaryDashProvider?.(direction);
      if (secondaryScalar) {
        const secondaryDistance = this.dashDistanceResolver(this.player.x, this.player.y, direction, PLAYER_BALANCE.dash.distance * secondaryScalar, PLAYER_BALANCE.movement.collisionRadius);
        this.dash.start({ movement: direction, aim: direction, distance: secondaryDistance });
        this.#enterDashState(true);
      }
      return;
    }
    const distance = this.dashDistanceResolver(this.player.x, this.player.y, direction, PLAYER_BALANCE.dash.distance, PLAYER_BALANCE.movement.collisionRadius);
    const result = this.dash.request({ movement: this.movementInput, aim: this.aimDirection, canStart: true, distance });
    if (result.started) this.#enterDashState(false);
  }

  #enterDashState(secondary = false) {
    if (!this.state.is(PLAYER_STATES.active)) {
      return;
    }
    this.#setState(PLAYER_STATES.dashing);
    this.statistics.recordDash();
    const dashEventId = this.nextDashEventId;
    this.nextDashEventId += 1;
    this.eventBus.emit('player:dash:started', {
      x: this.player.x,
      y: this.player.y,
      direction: { ...this.dash.direction },
      distance: this.dash.distance,
      durationMs: PLAYER_BALANCE.dash.durationMs,
      invulnerabilityMs: PLAYER_BALANCE.dash.invulnerabilityMs,
      dashEventId,
      secondary,
    });
  }

  #exitDashState() {
    this.player.setVelocity(0, 0);
    this.#setState(PLAYER_STATES.active);
    this.eventBus.emit('player:dash:ended', {
      x: this.player.x,
      y: this.player.y,
    });
  }

  #setState(next) {
    this.state.transition(next);
    this.eventBus.emit('player:state:changed', { state: this.state.value });
  }

  #recordDistance() {
    const distance = Math.hypot(
      this.player.x - this.lastPosition.x,
      this.player.y - this.lastPosition.y,
    );
    this.statistics.recordDistance(distance);
    this.lastPosition.x = this.player.x;
    this.lastPosition.y = this.player.y;
  }

  #emitMovementIfChanged() {
    const changed =
      Math.abs(this.player.velocity.x - this.lastMovementEvent.x) > 5 ||
      Math.abs(this.player.velocity.y - this.lastMovementEvent.y) > 5;
    if (!changed) {
      return;
    }
    this.lastMovementEvent.x = this.player.velocity.x;
    this.lastMovementEvent.y = this.player.velocity.y;
    this.eventBus.emit('player:movement:changed', {
      velocity: { ...this.lastMovementEvent },
    });
  }
}
