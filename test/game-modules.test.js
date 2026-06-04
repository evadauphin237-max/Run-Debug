import test from "node:test";
import assert from "node:assert/strict";

import {
  findBonusHeartCollision,
  findCoinCollision,
  findObstacleCollision,
  findObstacleCollisionDetails,
} from "../src/game/collision-system.js";
import {
  beginVictoryTransition,
  createGameState,
  createRuntimeState,
  markGameOver,
  resetRuntimeState,
} from "../src/game/game-state.js";
import {
  computeFrameDelta,
  computeNextRunCycle,
  createActiveGameUpdate,
  createEndGameSnapshot,
  createFrameAnimationUpdate,
  createPostCoinSpawnStateUpdate,
  createPostSpawnStateUpdate,
  getEffectiveTravelSpeed,
  getImpactTravelMultiplier,
  shouldEndPendingGameOver,
  shouldResolveGameplayCollisions,
  shouldSpawnCoinNow,
  shouldSpawnObstacleNow,
} from "../src/game/gameplay-loop.js";
import { createPlayer, jumpPlayer, preparePlayerDeathFall, updatePlayer } from "../src/game/player-controller.js";
import {
  createPlayerAnimationFromVisualState,
  PLAYER_VISUAL_STATES,
  resolvePlayerVisualState,
} from "../src/game/player-visual-state.js";

test("player controller allows one jump and one double jump", () => {
  const difficulty = {
    startSpeed: 320,
    maxSpeedFactor: 1.35,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
    gravity: 2100,
    jumpStrength: 760,
    doubleJumpMultiplier: 0.94,
  };
  const world = { groundY: 430 };
  const state = createGameState(difficulty, 0);
  const player = createPlayer(world, difficulty);

  state.gameStarted = true;

  assert.equal(jumpPlayer(state, player), true);
  assert.equal(player.isJumping, true);
  assert.equal(player.jumpsUsed, 1);

  assert.equal(jumpPlayer(state, player), true);
  assert.equal(player.isDoubleJumping, true);
  assert.equal(player.jumpsUsed, 2);

  assert.equal(jumpPlayer(state, player), false);
});

test("player controller resets to the ground during a death fall", () => {
  const difficulty = {
    startSpeed: 320,
    maxSpeedFactor: 1.35,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
    gravity: 2100,
    jumpStrength: 760,
    doubleJumpMultiplier: 0.94,
  };
  const world = { groundY: 430 };
  const player = createPlayer(world, difficulty);

  player.y = 120;
  player.velocityY = -120;
  player.isJumping = true;
  player.jumpsUsed = 2;

  preparePlayerDeathFall(player);
  updatePlayer(player, 0.016);

  assert.equal(player.y, player.groundY);
  assert.equal(player.velocityY, 0);
  assert.equal(player.isJumping, false);
});

test("collision system finds overlapping obstacles, hearts and coins", () => {
  const player = { x: 150, y: 200, width: 62, height: 82 };
  const obstacle = { kind: "animated-ball", x: 160, y: 210, width: 60, height: 60 };
  const heart = { x: 160, y: 210, width: 38, height: 38, floatTime: 0 };
  const coin = { x: 160, y: 210, width: 44, height: 44, floatTime: 0 };

  assert.equal(findObstacleCollision(player, [obstacle], 0), obstacle);
  assert.equal(findObstacleCollision(player, [obstacle], 0.5), null);
  assert.equal(findBonusHeartCollision(player, [heart]), heart);
  assert.equal(findCoinCollision(player, [coin]), coin);
});

test("collision system still reports stomps during hit cooldown", () => {
  const player = {
    x: 150,
    y: 166,
    previousY: 140,
    width: 62,
    height: 82,
    velocityY: 240,
  };
  const obstacle = { kind: "animated-bug", x: 160, y: 240, width: 82, height: 82 };

  const collision = findObstacleCollisionDetails(player, [obstacle]);

  assert.equal(collision?.obstacle, obstacle);
  assert.equal(collision?.stomped, true);
  assert.equal(findObstacleCollision(player, [obstacle], 0.5), obstacle);
});

test("player visual state machine resolves states by priority", () => {
  const difficulty = {
    startSpeed: 320,
    maxSpeedFactor: 1.35,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
    gravity: 2100,
    jumpStrength: 760,
    doubleJumpMultiplier: 0.94,
  };
  const world = { groundY: 430 };
  const state = createGameState(difficulty, 0);
  const player = createPlayer(world, difficulty);
  const runtime = {
    didBeatRecordOnDeath: false,
    deathFallDuration: 0.96,
    isPlayerHeadInImpactState: false,
    hitAnimationTime: null,
  };

  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.IDLE);

  state.gameStarted = true;
  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.RUNNING);

  player.isJumping = true;
  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.JUMPING);

  player.isDoubleJumping = true;
  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.DOUBLE_JUMPING);

  runtime.isPlayerHeadInImpactState = true;
  runtime.hitAnimationTime = 0;
  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.HIT);

  state.pendingVictory = true;
  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.HIT);

  state.pendingGameOver = true;
  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.FALLING);

  state.gameOver = true;
  state.pendingVictory = false;
  state.pendingGameOver = false;
  runtime.isPlayerHeadInImpactState = false;
  runtime.hitAnimationTime = null;
  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.GAME_OVER);

  runtime.didBeatRecordOnDeath = true;
  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.VICTORY);
});

test("player visual state machine maps states to animation sheets", () => {
  const difficulty = {
    startSpeed: 320,
    maxSpeedFactor: 1.35,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
    gravity: 2100,
    jumpStrength: 760,
    doubleJumpMultiplier: 0.94,
  };
  const world = { groundY: 430 };
  const state = createGameState(difficulty, 0);
  const player = createPlayer(world, difficulty);
  const runtime = {
    didBeatRecordOnDeath: false,
    deathFallDuration: 0.96,
    isPlayerHeadInImpactState: false,
    hitAnimationTime: null,
  };

  assert.equal(
    createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.IDLE, state, player, runtime).sheet,
    "idleIntro"
  );
  assert.equal(
    createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.RUNNING, state, player, runtime).sheet,
    "run"
  );
  assert.equal(
    createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.JUMPING, state, player, runtime).sheet,
    "jump"
  );
  assert.equal(
    createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.DOUBLE_JUMPING, state, player, runtime).sheet,
    "doubleJump"
  );
  assert.equal(
    createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.HIT, state, player, runtime).sheet,
    "hit"
  );
  assert.equal(
    createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.FALLING, state, player, runtime).sheet,
    "chute"
  );
  assert.equal(
    createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.GAME_OVER, state, player, runtime).sheet,
    "gameOver"
  );
  assert.equal(
    createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.VICTORY, state, player, runtime).sheet,
    "win"
  );
});

test("victory state stays on win and loops over the last four frames", () => {
  const difficulty = {
    startSpeed: 320,
    maxSpeedFactor: 1.35,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
    gravity: 2100,
    jumpStrength: 760,
    doubleJumpMultiplier: 0.94,
  };
  const world = { groundY: 430 };
  const state = createGameState(difficulty, 0);
  const player = createPlayer(world, difficulty);
  const runtime = {
    didBeatRecordOnDeath: true,
    deathFallDuration: 0.96,
    isPlayerHeadInImpactState: false,
    hitAnimationTime: null,
  };

  state.gameOver = true;
  state.gameOverAnimationTime = 30;

  assert.equal(resolvePlayerVisualState(state, player, runtime), PLAYER_VISUAL_STATES.VICTORY);

  const animation = createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.VICTORY, state, player, runtime);
  assert.equal(animation.sheet, "win");
  assert.ok(animation.frameIndex >= 79);
  assert.ok(animation.frameIndex <= 82);
});

test("home idle animation loops across the full papillon sequence", () => {
  const difficulty = {
    startSpeed: 320,
    maxSpeedFactor: 1.35,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
    gravity: 2100,
    jumpStrength: 760,
    doubleJumpMultiplier: 0.94,
  };
  const world = { groundY: 430 };
  const state = createGameState(difficulty, 0);
  const player = createPlayer(world, difficulty);
  const runtime = {
    didBeatRecordOnDeath: false,
    deathFallDuration: 0.96,
    isPlayerHeadInImpactState: false,
    hitAnimationTime: null,
  };

  state.headSwingTime = 0;
  let animation = createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.IDLE, state, player, runtime);
  assert.equal(animation.frameIndex, 0);
  assert.equal(animation.height > 220, true);

  state.headSwingTime = 70 / 5;
  animation = createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.IDLE, state, player, runtime);
  assert.equal(animation.frameIndex, 70);

  state.headSwingTime = 71 / 5;
  animation = createPlayerAnimationFromVisualState(PLAYER_VISUAL_STATES.IDLE, state, player, runtime);
  assert.equal(animation.frameIndex, 0);
});

test("frame delta clamps long frames and initializes cleanly", () => {
  assert.deepEqual(computeFrameDelta(1000, 0), {
    deltaTime: 0,
    lastTime: 1000,
  });

  assert.deepEqual(computeFrameDelta(1100, 1000), {
    deltaTime: 0.033,
    lastTime: 1100,
  });

  assert.deepEqual(computeFrameDelta(1016, 1000), {
    deltaTime: 0.016,
    lastTime: 1016,
  });
});

test("frame updates advance run state while preserving ending state rules", () => {
  const difficulty = {
    scoreRate: 10,
    speedRamp: 8,
    speedRampGrowth: 1.2,
  };
  const activeState = {
    pendingGameOver: false,
    runTime: 2,
    score: 30,
    speed: 320,
    obstacleTimer: 0.4,
    coinTimer: 0.5,
    nextCoinIn: 2.4,
    hitCooldown: 0.5,
    groundOffset: 10,
    hillFarOffset: 12,
    hillNearOffset: 14,
    thirdgroundOffset: 15,
    cloudOffset: 16,
    deathFallTime: 0,
  };

  const activeUpdate = createActiveGameUpdate(activeState, difficulty, 960, 0.2);
  assert.equal(activeUpdate.runTime, 2.2);
  assert.equal(activeUpdate.score, 32);
  assert.ok(Math.abs(activeUpdate.obstacleTimer - 0.6) < 1e-9);
  assert.ok(Math.abs(activeUpdate.coinTimer - 0.7) < 1e-9);
  assert.ok(Math.abs(activeUpdate.hitCooldown - 0.3) < 1e-9);
  assert.ok(activeUpdate.speed > activeState.speed);
  assert.ok(activeUpdate.groundOffset > activeState.groundOffset);

  const endingUpdate = createActiveGameUpdate(
    { ...activeState, pendingGameOver: true, deathFallTime: 0.5 },
    difficulty,
    960,
    0.2
  );
  assert.equal(endingUpdate.runTime, activeState.runTime);
  assert.equal(endingUpdate.score, activeState.score);
  assert.equal(endingUpdate.speed, activeState.speed);
  assert.equal(endingUpdate.obstacleTimer, activeState.obstacleTimer);
  assert.equal(endingUpdate.coinTimer, activeState.coinTimer);
  assert.equal(endingUpdate.hitCooldown, activeState.hitCooldown);
  assert.equal(endingUpdate.deathFallTime, 0.7);

  const pendingVictoryUpdate = createActiveGameUpdate(
    { ...activeState, pendingVictory: true, deathFallTime: 0.5 },
    difficulty,
    960,
    0.2
  );
  assert.equal(pendingVictoryUpdate.runTime, activeState.runTime);
  assert.equal(pendingVictoryUpdate.score, activeState.score);
  assert.equal(pendingVictoryUpdate.speed, activeState.speed);
  assert.equal(pendingVictoryUpdate.obstacleTimer, activeState.obstacleTimer);
  assert.equal(pendingVictoryUpdate.coinTimer, activeState.coinTimer);
  assert.equal(pendingVictoryUpdate.hitCooldown, activeState.hitCooldown);
  assert.equal(pendingVictoryUpdate.deathFallTime, 0.5);
});

test("frame updates clamp speed when the difficulty defines a maximum", () => {
  const difficulty = {
    scoreRate: 10,
    speedRamp: 8,
    speedRampGrowth: 1.2,
    maxSpeed: 250,
  };
  const activeState = {
    pendingGameOver: false,
    pendingVictory: false,
    runTime: 2,
    score: 30,
    speed: 250,
    obstacleTimer: 0.4,
    coinTimer: 0.5,
    nextCoinIn: 2.4,
    hitCooldown: 0.5,
    groundOffset: 10,
    hillFarOffset: 12,
    hillNearOffset: 14,
    thirdgroundOffset: 15,
    cloudOffset: 16,
    deathFallTime: 0,
  };

  const activeUpdate = createActiveGameUpdate(activeState, difficulty, 960, 0.2);

  assert.equal(activeUpdate.speed, 250);
});

test("runtime reset clears the forest auto-transition loop counter", () => {
  const runtime = createRuntimeState();

  runtime.forestLoopCount = 13;
  runtime.isForestValleyTransitionPending = true;
  runtime.forestValleyTransitionLoopCount = 2;
  runtime.isForestValleyTransitionActive = true;
  runtime.forestValleyBridgeStartHillNearOffset = 123;
  runtime.valleyMidgroundSequenceIndex = 3;
  resetRuntimeState(runtime);

  assert.equal(runtime.forestLoopCount, 0);
  assert.equal(runtime.isForestValleyTransitionPending, false);
  assert.equal(runtime.forestValleyTransitionLoopCount, 0);
  assert.equal(runtime.isForestValleyTransitionActive, false);
  assert.equal(runtime.forestValleyBridgeStartHillNearOffset, 0);
  assert.equal(runtime.valleyMidgroundSequenceIndex, 0);
});

test("impact slowdown reduces visible travel speed during hit recovery", () => {
  assert.equal(getImpactTravelMultiplier(0), 1);
  assert.ok(getImpactTravelMultiplier(1.5) < 0.5);
  assert.ok(getImpactTravelMultiplier(0.5) > getImpactTravelMultiplier(1.2));
  assert.ok(Math.abs(getEffectiveTravelSpeed({ speed: 400, hitCooldown: 0 }) - 400) < 1e-9);
  assert.ok(getEffectiveTravelSpeed({ speed: 400, hitCooldown: 1.5 }) < 200);
});

test("loop helpers decide spawns, collisions and pending game over consistently", () => {
  const state = {
    pendingGameOver: false,
    hitCooldown: 0,
    obstacleTimer: 1.2,
    nextObstacleIn: 1.1,
    coinTimer: 1.7,
    nextCoinIn: 1.5,
    speed: 400,
    deathFallTime: 0.9,
  };
  const runtime = {
    isPlayerHeadInImpactState: false,
    deathFallDuration: 0.8,
  };
  const difficulty = {
    startSpeed: 320,
    maxSpeedFactor: 1.35,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
  };

  assert.equal(shouldSpawnObstacleNow(state, runtime), true);
  assert.equal(shouldSpawnCoinNow(state), true);
  assert.equal(shouldResolveGameplayCollisions(state), true);
  assert.equal(shouldEndPendingGameOver(state, runtime), false);

  const postSpawn = createPostSpawnStateUpdate(state, difficulty);
  const postCoinSpawn = createPostCoinSpawnStateUpdate({
    coinDelayMin: 2,
    coinDelayMax: 4,
  });
  assert.equal(postSpawn.obstacleTimer, 0);
  assert.ok(postSpawn.nextObstacleIn > 0);
  assert.equal(postCoinSpawn.coinTimer, 0);
  assert.ok(postCoinSpawn.nextCoinIn >= 2);
  assert.ok(postCoinSpawn.nextCoinIn <= 4);

  assert.equal(
    shouldSpawnObstacleNow({ ...state, pendingGameOver: true }, runtime),
    false
  );
  assert.equal(
    shouldSpawnObstacleNow({ ...state, pendingVictory: true }, runtime),
    false
  );
  assert.equal(
    shouldSpawnCoinNow({ ...state, pendingVictory: true }),
    false
  );
  assert.equal(
    shouldSpawnObstacleNow(state, { ...runtime, isPlayerHeadInImpactState: true }),
    false
  );
  assert.equal(
    shouldSpawnObstacleNow({ ...state, hitCooldown: 1.2 }, runtime),
    false
  );
  assert.equal(
    shouldSpawnObstacleNow({ ...state, hitCooldown: 0.4 }, runtime),
    false
  );
  assert.equal(
    shouldSpawnObstacleNow({ ...state, hitCooldown: 0 }, runtime),
    true
  );
  assert.equal(shouldResolveGameplayCollisions({ ...state, pendingGameOver: true }), false);
  assert.equal(shouldResolveGameplayCollisions({ ...state, pendingVictory: true }), false);
  assert.equal(
    shouldEndPendingGameOver({ ...state, pendingGameOver: true }, runtime),
    true
  );
});

test("victory transition keeps the last state until the game over screen starts", () => {
  const difficulty = {
    startSpeed: 320,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
  };
  const state = createGameState(difficulty, 10);
  const runtime = {
    didBeatRecordOnDeath: false,
  };

  beginVictoryTransition(state);
  assert.equal(state.pendingVictory, true);
  assert.equal(state.gameOver, false);

  markGameOver(state, runtime, true);
  assert.equal(state.pendingVictory, false);
  assert.equal(state.gameOver, true);
  assert.equal(runtime.didBeatRecordOnDeath, true);
});

test("loop helpers compute run cycle, frame animation updates and end game snapshot", () => {
  assert.equal(computeNextRunCycle(10, 400, 0.1), 11.76);

  const regularFrameUpdate = createFrameAnimationUpdate(
    { headSwingTime: 1, gameOver: false, gameOverAnimationTime: 3 },
    0.2
  );
  assert.ok(Math.abs(regularFrameUpdate.headSwingTime - 1.92) < 1e-9);
  assert.equal(regularFrameUpdate.gameOverAnimationTime, 3);

  const gameOverFrameUpdate = createFrameAnimationUpdate(
    { headSwingTime: 1, gameOver: true, gameOverAnimationTime: 3 },
    0.2
  );
  assert.ok(Math.abs(gameOverFrameUpdate.headSwingTime - 1.92) < 1e-9);
  assert.ok(Math.abs(gameOverFrameUpdate.gameOverAnimationTime - 3.2) < 1e-9);

  assert.deepEqual(createEndGameSnapshot(42.9, 40, "Rush"), {
    finalScore: 42,
    isNewRecord: true,
    nextBestScore: 42,
    title: "Super debugger !",
    text: "Score final : 42\nRecord : 42\nMode : Rush",
  });
});
