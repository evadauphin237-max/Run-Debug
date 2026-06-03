import { MAX_LIVES } from "./config.js";
import { computeNextCoinDelay, computeNextObstacleDelay } from "./logic.js";

// State is split in two layers:
// - game state: data that defines the current simulation
// - runtime state: temporary engine bookkeeping not directly tied to game rules
export function createGameState(difficulty, bestScore) {
  return {
    gameStarted: false,
    gameOver: false,
    pendingGameOver: false,
    pendingVictory: false,
    deathFallTime: 0,
    gameOverAnimationTime: 0,
    score: 0,
    coinsCollected: 0,
    bestScore,
    lives: MAX_LIVES,
    speed: difficulty.startSpeed,
    runTime: 0,
    obstacleTimer: 0,
    nextObstacleIn: computeNextObstacleDelay(difficulty.startSpeed, difficulty),
    coinTimer: 0,
    nextCoinIn: computeNextCoinDelay(difficulty),
    lastTime: 0,
    groundOffset: 0,
    hillFarOffset: 0,
    hillNearOffset: 0,
    thirdgroundOffset: 0,
    cloudOffset: 0,
    sparkleOffset: 0,
    hitCooldown: 0,
    headSwingTime: 0,
  };
}

export function createRuntimeState() {
  return {
    // Rotating queue avoids spawning the exact same obstacle pattern too often.
    obstacleTypeQueue: [],
    spawnedObstacleCount: 0,
    headImpactTimer: null,
    isPlayerHeadInImpactState: false,
    hitAnimationTime: null,
    didBeatRecordOnDeath: false,
    deathFallDuration: 0.96,
    inputMode: "keyboard",
    assetsReady: false,
    deferredAssetsWarmed: false,
    forestLoopCount: 0,
    isForestValleyTransitionPending: false,
    forestValleyTransitionLoopCount: 0,
    isForestValleyTransitionActive: false,
    forestValleyBridgeStartHillNearOffset: 0,
    valleyMidgroundSequenceIndex: 0,
  };
}

export function resetGameState(state, difficulty, bestScore) {
  Object.assign(state, createGameState(difficulty, bestScore));
  return state;
}

export function resetRuntimeState(runtime) {
  runtime.obstacleTypeQueue = [];
  runtime.spawnedObstacleCount = 0;
  runtime.headImpactTimer = null;
  runtime.isPlayerHeadInImpactState = false;
  runtime.hitAnimationTime = null;
  runtime.didBeatRecordOnDeath = false;
  runtime.forestLoopCount = 0;
  runtime.isForestValleyTransitionPending = false;
  runtime.forestValleyTransitionLoopCount = 0;
  runtime.isForestValleyTransitionActive = false;
  runtime.forestValleyBridgeStartHillNearOffset = 0;
  runtime.valleyMidgroundSequenceIndex = 0;
  return runtime;
}

export function markGameStarted(state) {
  state.gameStarted = true;
}

export function beginDeathFall(state) {
  state.pendingGameOver = true;
  state.pendingVictory = false;
  state.deathFallTime = 0;
}

export function beginVictoryTransition(state) {
  state.pendingVictory = true;
  state.pendingGameOver = false;
}

export function hasExceededBestScore(state) {
  return Math.floor(state.score) > state.bestScore;
}

export function markGameOver(state, runtime, didBeatRecordOnDeath) {
  state.pendingGameOver = false;
  state.pendingVictory = false;
  state.gameOverAnimationTime = 0;
  state.gameOver = true;
  runtime.didBeatRecordOnDeath = didBeatRecordOnDeath;
}
