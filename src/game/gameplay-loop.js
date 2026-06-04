import { clamp, computeNextCoinDelay, computeNextObstacleDelay, shouldSpawnCoin } from "./logic.js";

const IMPACT_SLOWDOWN_DURATION = 1.5;
const IMPACT_MIN_TRAVEL_MULTIPLIER = 0.42;
const IMPACT_OBSTACLE_SPAWN_PAUSE_DURATION = 1.5;

// Pure frame-update helpers extracted from the engine.
// The engine orchestrates them, while tests can validate the math in isolation.
export function computeFrameDelta(timestamp, lastTime, maxDelta = 0.033) {
  if (!lastTime) {
    return {
      deltaTime: 0,
      lastTime: timestamp,
    };
  }

  return {
    deltaTime: Math.min((timestamp - lastTime) / 1000, maxDelta),
    lastTime: timestamp,
  };
}

export function createFrameAnimationUpdate(state, deltaTime) {
  return {
    headSwingTime: state.headSwingTime + deltaTime * 4.6,
    gameOverAnimationTime: state.gameOver
      ? state.gameOverAnimationTime + deltaTime
      : state.gameOverAnimationTime,
  };
}

export function createActiveGameUpdate(state, difficulty, worldWidth, deltaTime) {
  // Once the death fall starts we freeze score/speed progression,
  // but we keep animation timers advancing until the ending resolves.
  const isEndingAfterAnimation = state.pendingGameOver || state.pendingVictory;
  const runTime = isEndingAfterAnimation ? state.runTime : state.runTime + deltaTime;
  const score = isEndingAfterAnimation ? state.score : state.score + deltaTime * difficulty.scoreRate;
  const nextSpeed = isEndingAfterAnimation
    ? state.speed
    : state.speed + deltaTime * (difficulty.speedRamp + runTime * difficulty.speedRampGrowth);
  const speed = Number.isFinite(difficulty.maxSpeed)
    ? clamp(nextSpeed, 0, difficulty.maxSpeed)
    : nextSpeed;
  const hitCooldown = isEndingAfterAnimation
    ? state.hitCooldown
    : Math.max(0, state.hitCooldown - deltaTime);
  const travelSpeed = getEffectiveTravelSpeed({ speed, hitCooldown });

  return {
    runTime,
    score,
    speed,
    obstacleTimer: isEndingAfterAnimation ? state.obstacleTimer : state.obstacleTimer + deltaTime,
    coinTimer: isEndingAfterAnimation ? state.coinTimer : state.coinTimer + deltaTime,
    hitCooldown,
    groundOffset: (state.groundOffset + travelSpeed * deltaTime) % worldWidth,
    hillFarOffset: (state.hillFarOffset + travelSpeed * 0.11 * deltaTime) % worldWidth,
    hillNearOffset: (state.hillNearOffset + travelSpeed * 0.22 * deltaTime) % worldWidth,
    thirdgroundOffset: (state.thirdgroundOffset + travelSpeed * 0.165 * deltaTime) % worldWidth,
    cloudOffset: state.cloudOffset + travelSpeed * 0.14 * deltaTime,
    deathFallTime: state.pendingGameOver
      ? state.deathFallTime + deltaTime
      : state.deathFallTime,
  };
}

export function getImpactTravelMultiplier(hitCooldown, cooldownDuration = IMPACT_SLOWDOWN_DURATION) {
  if (hitCooldown <= 0 || cooldownDuration <= 0) {
    return 1;
  }

  const clampedRatio = Math.max(0, Math.min(1, hitCooldown / cooldownDuration));
  const recoveryProgress = 1 - clampedRatio;

  return IMPACT_MIN_TRAVEL_MULTIPLIER + (1 - IMPACT_MIN_TRAVEL_MULTIPLIER) * recoveryProgress;
}

export function getEffectiveTravelSpeed(state, cooldownDuration = IMPACT_SLOWDOWN_DURATION) {
  return state.speed * getImpactTravelMultiplier(state.hitCooldown, cooldownDuration);
}

export function isObstacleSpawnPausedAfterHit(
  hitCooldown,
  cooldownDuration = IMPACT_SLOWDOWN_DURATION,
  pauseDuration = IMPACT_OBSTACLE_SPAWN_PAUSE_DURATION
) {
  if (hitCooldown <= 0 || cooldownDuration <= 0 || pauseDuration <= 0) {
    return false;
  }

  return hitCooldown > Math.max(0, cooldownDuration - pauseDuration);
}

export function computeNextRunCycle(runCycle, speed, deltaTime) {
  return runCycle + deltaTime * Math.max(13.5, speed * 0.044);
}

export function shouldSpawnObstacleNow(state, runtime) {
  return (
    !state.pendingGameOver &&
    !state.pendingVictory &&
    !runtime.isPlayerHeadInImpactState &&
    !isObstacleSpawnPausedAfterHit(state.hitCooldown ?? 0) &&
    state.obstacleTimer >= state.nextObstacleIn
  );
}

export function createPostSpawnStateUpdate(state, difficulty) {
  return {
    obstacleTimer: 0,
    nextObstacleIn: computeNextObstacleDelay(state.speed, difficulty),
  };
}

export function shouldSpawnCoinNow(state) {
  return !state.pendingGameOver && !state.pendingVictory && shouldSpawnCoin(state.coinTimer, state.nextCoinIn);
}

export function createPostCoinSpawnStateUpdate(difficulty) {
  return {
    coinTimer: 0,
    nextCoinIn: computeNextCoinDelay(difficulty),
  };
}

export function shouldResolveGameplayCollisions(state) {
  return !state.pendingGameOver && !state.pendingVictory;
}

export function shouldEndPendingGameOver(state, runtime) {
  return state.pendingGameOver && state.deathFallTime >= runtime.deathFallDuration;
}

export function createEndGameSnapshot(score, bestScore, difficultyLabel) {
  const finalScore = Math.floor(score);
  const isNewRecord = finalScore > bestScore;
  const nextBestScore = Math.max(bestScore, finalScore);

  return {
    finalScore,
    isNewRecord,
    nextBestScore,
    title: isNewRecord ? "Super debugger !" : "Trop de bugs !",
    text: `Score final : ${finalScore}\nRecord : ${nextBestScore}\nMode : ${difficultyLabel}`,
  };
}
