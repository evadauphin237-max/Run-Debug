import { preloadCoreAssets, warmGameplayAssets } from "./assets.js";
import { createWorld, DIFFICULTY_OPTIONS, getDifficultyById, getLevelById, LEVEL_OPTIONS, MAX_LIVES } from "./config.js";
import { findBonusHeartCollision, findCoinCollision, findObstacleCollisionDetails, removeEntity } from "./collision-system.js";
import {
  beginDeathFall as beginDeathFallState,
  beginVictoryTransition as beginVictoryTransitionState,
  createGameState,
  createRuntimeState,
  hasExceededBestScore,
  markGameOver,
  markGameStarted,
  resetGameState,
  resetRuntimeState,
} from "./game-state.js";
import {
  computeFrameDelta,
  computeNextRunCycle,
  createActiveGameUpdate,
  createEndGameSnapshot,
  createFrameAnimationUpdate,
  createPostCoinSpawnStateUpdate,
  createPostSpawnStateUpdate,
  getEffectiveTravelSpeed,
  shouldEndPendingGameOver,
  shouldResolveGameplayCollisions,
  shouldSpawnCoinNow,
  shouldSpawnObstacleNow,
} from "./gameplay-loop.js";
import { createClouds, isAnimatedBugKind } from "./logic.js";
import { bouncePlayer, createPlayer, jumpPlayer, preparePlayerDeathFall, resetPlayer, updatePlayer } from "./player-controller.js";
import { createRenderer } from "./renderer.js";
import { advanceSpawnedEntities, createBugHitEffect, createCoin, spawnObstacle as spawnNextObstacle } from "./spawner.js";
import {
  loadBestScore,
  loadPreferredDifficulty,
  loadPreferredLevel,
  resetBestScores,
  saveBestScore,
  savePreferredDifficulty,
  savePreferredLevel,
} from "./storage.js";

// Engine is the orchestration layer of the game.
// It owns the main loop, coordinates state updates and tells the view/renderer what to show.
export function createGame(elements) {
  const { browser, canvas, view } = elements;
  const FOREST_LEVEL_LOOP_TARGET = 10;
  const FOREST_TO_VALLEY_BRIDGE_LOOPS = 1;
  const VALLEY_MIDGROUND_SEQUENCE_LAST_INDEX = 7;
  const HIT_ANIMATION_DURATION = 0.5;

  const ctx = canvas.getContext("2d");
  const world = createWorld();
  const renderer = createRenderer(ctx, world);

  canvas.width = world.width;
  canvas.height = world.height;

  let difficulty = getDifficultyById(loadPreferredDifficulty());
  let level = getLevelById(loadPreferredLevel());
  // Long-lived simulation state.
  const state = createGameState(difficulty, loadBestScore(difficulty.id));
  // Player physics state.
  const player = createPlayer(world, difficulty);
  // Ephemeral runtime bookkeeping for the loop and asset loading.
  const runtime = createRuntimeState();

  let obstacles = [];
  let coins = [];
  let bonusHearts = [];
  let bugHitEffects = [];
  let clouds = [];
  let cleanupInput = null;
  let cleanupResetScores = null;
  let cleanupSettingsButton = null;
  let cleanupViewportResize = null;
  let isSettingsOverlayOpen = false;

function getJumpInstructions() {
  return "Choisis ton niveau, ajuste le rythme, puis lance la partie.";
}

  function syncTouchMode() {
    runtime.inputMode = view.getInputMode();
    view.setTouchMode(runtime.inputMode === "touch");
    view.setSettingsButtonActive(isSettingsOverlayOpen);
    view.setTouchJumpVisible(
      runtime.inputMode === "touch" &&
      state.gameStarted &&
      !state.gameOver &&
      !isSettingsOverlayOpen &&
      !state.pendingGameOver &&
      !state.pendingVictory &&
      state.lives > 0
    );
  }

  function clearHeadImpactTimer() {
    if (runtime.headImpactTimer !== null) {
      browser.clearTimeout(runtime.headImpactTimer);
      runtime.headImpactTimer = null;
    }
  }

  function ensureDeferredAssetsWarmed() {
    if (runtime.deferredAssetsWarmed) {
      return;
    }

    runtime.deferredAssetsWarmed = true;
    warmGameplayAssets();
  }

  function updateHudDisplay() {
    view.updateScoreDisplay(state.score, state.bestScore);
    view.updateCoinDisplay(state.coinsCollected);
  }

  function triggerHeadImpact() {
    runtime.isPlayerHeadInImpactState = true;
    runtime.hitAnimationTime = 0;
    clearHeadImpactTimer();
    runtime.headImpactTimer = browser.setTimeout(() => {
      runtime.isPlayerHeadInImpactState = false;
      runtime.headImpactTimer = null;

      if (state.pendingVictory) {
        endGame();
      }
    }, 1000);
  }

  function beginDeathFall() {
    clearHeadImpactTimer();
    runtime.isPlayerHeadInImpactState = false;
    runtime.hitAnimationTime = null;
    preparePlayerDeathFall(player);
    beginDeathFallState(state);
    syncTouchMode();
  }

  function beginVictoryTransition() {
    beginVictoryTransitionState(state);
    syncTouchMode();
  }

  function loseLife(obstacle) {
    if (isAnimatedBugKind(obstacle.kind)) {
      bugHitEffects.push(createBugHitEffect(obstacle));
    }

    obstacles = removeEntity(obstacles, obstacle);
    state.lives = Math.max(0, state.lives - 1);
    state.hitCooldown = 5;
    view.breakHeart(state.lives, state.lives);

    if (state.lives === 0) {
      clearHeadImpactTimer();
      runtime.isPlayerHeadInImpactState = false;
      runtime.hitAnimationTime = null;
      view.updateLivesAriaLabel(state.lives);
      endGame();
      return;
    }

    triggerHeadImpact();
    view.updateLivesAriaLabel(state.lives);
  }

  function squashBug(collision) {
    const { obstacle, obstacleTop } = collision;
    bugHitEffects.push(createBugHitEffect(obstacle));
    obstacles = removeEntity(obstacles, obstacle);
    bouncePlayer(player, obstacleTop);
  }

  function collectBonusHeart(heart) {
    bonusHearts = removeEntity(bonusHearts, heart);

    if (state.lives >= MAX_LIVES) {
      return;
    }

    view.restoreHeart(state.lives, state.lives + 1);
    state.lives += 1;
    view.updateLivesAriaLabel(state.lives);
  }

  function collectCoin(coin) {
    coins = removeEntity(coins, coin);
    state.coinsCollected += 1;
    view.updateCoinDisplay(state.coinsCollected);
  }

  function checkCollision() {
    const collision = findObstacleCollisionDetails(player, obstacles, state.hitCooldown);

    if (!collision) {
      return;
    }

    if (collision.stomped && isAnimatedBugKind(collision.obstacle.kind)) {
      squashBug(collision);
      return;
    }

    loseLife(collision.obstacle);
  }

  function checkBonusHeartCollision() {
    const heart = findBonusHeartCollision(player, bonusHearts);

    if (heart) {
      collectBonusHeart(heart);
    }
  }

  function checkCoinCollision() {
    const coin = findCoinCollision(player, coins);

    if (coin) {
      collectCoin(coin);
    }
  }

  function spawnObstacle() {
    const { obstacle, bonusHeart } = spawnNextObstacle(runtime, difficulty, world);
    obstacles.push(obstacle);

    if (bonusHeart) {
      bonusHearts.push(bonusHeart);
    }
  }

  function spawnCoin() {
    coins.push(createCoin(world));
  }

  function advanceObstacleVisuals(deltaTime, bugsOnly = false, speedOverride = state.speed) {
    const advancedEntities = advanceSpawnedEntities({
      obstacles,
      coins,
      bonusHearts,
      bugHitEffects,
      speed: speedOverride,
      worldWidth: world.width,
      deltaTime,
      bugsOnly,
    });

    obstacles = advancedEntities.obstacles;
    coins = advancedEntities.coins;
    bonusHearts = advancedEntities.bonusHearts;
    bugHitEffects = advancedEntities.bugHitEffects;
  }

  function jump() {
    jumpPlayer(state, player);
  }

  function initGame() {
    isSettingsOverlayOpen = false;
    view.clearHeartBreakTimers();
    clearHeadImpactTimer();
    obstacles = [];
    coins = [];
    bonusHearts = [];
    bugHitEffects = [];
    clouds = createClouds();
    resetRuntimeState(runtime);
    resetGameState(state, difficulty, loadBestScore(difficulty.id));
    resetPlayer(player, difficulty);

    // Resetting the simulation also resets the UI so the next run starts from a clean baseline.
    view.resetLivesDisplay(state.lives);
    updateHudDisplay();
    view.showOverlay("Run & Debug", getJumpInstructions(), "Commencer le jeu", {
      screen: "home",
      tag: "Sélection du niveau",
    });
    syncTouchMode();
    renderer.draw({ state, player, runtime, clouds, obstacles, coins, bonusHearts, bugHitEffects, levelId: getRenderedLevelId() });
  }

  function startGame() {
    if (!runtime.assetsReady) {
      return;
    }

    ensureDeferredAssetsWarmed();
    isSettingsOverlayOpen = false;
    markGameStarted(state);
    view.hideOverlay();
    syncTouchMode();
  }

  function openSettings() {
    if (!runtime.assetsReady || !state.gameStarted || state.gameOver) {
      return;
    }

    isSettingsOverlayOpen = true;
    view.showOverlay(
      "Paramètres",
      "Choisis ton rythme et ton niveau.\nToute modification relance la partie.",
      "Reprendre",
      {
        screen: "settings",
        tag: "Options",
      }
    );
    syncTouchMode();
  }

  function closeSettings() {
    isSettingsOverlayOpen = false;
    view.hideOverlay();
    syncTouchMode();
  }

  function restartGame(autoStart = false) {
    initGame();
    if (autoStart) {
      startGame();
    }
  }

  function resetScores() {
    resetBestScores();
    state.bestScore = 0;
    updateHudDisplay();
    initGame();
    view.announceScoresReset(state.bestScore);
  }

  function endGame() {
    isSettingsOverlayOpen = false;
    clearHeadImpactTimer();
    runtime.isPlayerHeadInImpactState = false;
    const gameOverSnapshot = createEndGameSnapshot(state.score, state.bestScore, difficulty.label);

    markGameOver(state, runtime, gameOverSnapshot.isNewRecord);
    state.bestScore = gameOverSnapshot.nextBestScore;
    saveBestScore(difficulty.id, state.bestScore);

    view.showOverlay(
      gameOverSnapshot.isNewRecord ? "NOUVEAU RECORD" : "GAME OVER",
      gameOverSnapshot.text,
      "Essaye encore",
      {
        celebrateRecord: gameOverSnapshot.isNewRecord,
        screen: "end",
        tag: gameOverSnapshot.isNewRecord ? "Victoire" : "Game Over",
      }
    );
    syncTouchMode();
  }

  function setDifficulty(difficultyId) {
    difficulty = getDifficultyById(difficultyId);
    savePreferredDifficulty(difficulty.id);
    view.setDifficultySelection(difficulty.id);
    initGame();
  }

  function setLevel(levelId) {
    level = getLevelById(levelId);
    savePreferredLevel(level.id);
    view.setLevelSelection(level.id);
    runtime.forestLoopCount = 0;
    runtime.isForestValleyTransitionPending = false;
    runtime.forestValleyTransitionLoopCount = 0;
    runtime.isForestValleyTransitionActive = false;
    runtime.valleyMidgroundSequenceIndex = 0;
    initGame();
  }

  function beginForestValleyTransition() {
    runtime.isForestValleyTransitionPending = false;
    runtime.isForestValleyTransitionActive = true;
    runtime.forestValleyTransitionLoopCount = 0;
    runtime.forestValleyBridgeStartHillNearOffset = state.hillNearOffset;
  }

  function advanceLevelFromForest() {
    level = getLevelById("valley");
    savePreferredLevel(level.id);
    view.setLevelSelection(level.id);
    runtime.forestLoopCount = 0;
    runtime.isForestValleyTransitionPending = false;
    runtime.forestValleyTransitionLoopCount = 0;
    runtime.isForestValleyTransitionActive = false;
    runtime.forestValleyBridgeStartHillNearOffset = 0;
    runtime.valleyMidgroundSequenceIndex = 0;
  }

  function getRenderedLevelId() {
    if (runtime.isForestValleyTransitionActive) {
      return "forest-valley-bridge";
    }

    return level.id;
  }

  function canSpawnObstacles() {
    return level.id !== "storybook";
  }

  function update(timestamp) {
    // requestAnimationFrame drives the whole game:
    // compute time delta -> update state -> resolve collisions -> render -> schedule next frame.
    const frameDelta = computeFrameDelta(timestamp, state.lastTime);
    const deltaTime = frameDelta.deltaTime;

    state.lastTime = frameDelta.lastTime;
    Object.assign(state, createFrameAnimationUpdate(state, deltaTime));

    if (state.gameOver) {
      advanceObstacleVisuals(deltaTime, true);
    }

    if (state.gameStarted && !state.gameOver && !isSettingsOverlayOpen) {
      const previousGroundOffset = state.groundOffset;
      const previousHillNearOffset = state.hillNearOffset;
      const wasForestValleyTransitionActive = runtime.isForestValleyTransitionActive;
      Object.assign(state, createActiveGameUpdate(state, difficulty, world.width, deltaTime));
      const effectiveTravelSpeed = getEffectiveTravelSpeed(state);
      const didGroundLoop = state.groundOffset < previousGroundOffset;
      const didHillNearLoop = state.hillNearOffset < previousHillNearOffset;

      if (didGroundLoop) {
        if (!runtime.isForestValleyTransitionActive && level.id === "forest") {
          runtime.forestLoopCount += 1;

          if (runtime.forestLoopCount >= FOREST_LEVEL_LOOP_TARGET) {
            runtime.isForestValleyTransitionPending = true;
          }
        }
      }

      if (
        level.id === "forest" &&
        runtime.isForestValleyTransitionPending &&
        !runtime.isForestValleyTransitionActive &&
        didHillNearLoop
      ) {
        beginForestValleyTransition();
      }

      if (wasForestValleyTransitionActive && didHillNearLoop) {
        runtime.forestValleyTransitionLoopCount += 1;

        if (runtime.forestValleyTransitionLoopCount >= FOREST_TO_VALLEY_BRIDGE_LOOPS) {
          advanceLevelFromForest();
        }
      } else if (
        level.id === "valley" &&
        didHillNearLoop &&
        runtime.valleyMidgroundSequenceIndex < VALLEY_MIDGROUND_SEQUENCE_LAST_INDEX
      ) {
        runtime.valleyMidgroundSequenceIndex += 1;
      }

      player.runCycle = computeNextRunCycle(player.runCycle, effectiveTravelSpeed, deltaTime);
      updatePlayer(player, deltaTime);

      if (runtime.hitAnimationTime !== null) {
        runtime.hitAnimationTime = Math.min(runtime.hitAnimationTime + deltaTime, HIT_ANIMATION_DURATION);

        if (runtime.hitAnimationTime >= HIT_ANIMATION_DURATION) {
          runtime.hitAnimationTime = null;
        }
      }

      if (shouldSpawnObstacleNow(state, runtime)) {
        if (canSpawnObstacles()) {
          spawnObstacle();
        }

        Object.assign(state, createPostSpawnStateUpdate(state, difficulty));
      }

      if (shouldSpawnCoinNow(state)) {
        spawnCoin();
        Object.assign(state, createPostCoinSpawnStateUpdate(difficulty));
      }

      advanceObstacleVisuals(deltaTime, false, effectiveTravelSpeed);

      if (shouldResolveGameplayCollisions(state)) {
        checkCollision();
        checkBonusHeartCollision();
        checkCoinCollision();
      }

      if (shouldEndPendingGameOver(state, runtime)) {
        endGame();
      }

      updateHudDisplay();
    }

    renderer.draw({ state, player, runtime, clouds, obstacles, coins, bonusHearts, bugHitEffects, levelId: getRenderedLevelId() });
    browser.requestAnimationFrame(update);
  }

  function start() {
    view.setupLivesDisplay(MAX_LIVES, state.lives);
    view.renderDifficultyOptions(DIFFICULTY_OPTIONS, difficulty.id, setDifficulty);
    view.renderLevelOptions(LEVEL_OPTIONS, level.id, setLevel);
    view.setDifficultySelection(difficulty.id);
    view.setLevelSelection(level.id);
    syncTouchMode();
    clouds = createClouds();
    initGame();
    view.setActionButtonDisabled(true);
    view.setResetScoresButtonDisabled(true);
    view.setSettingsButtonDisabled(true);
    renderer.draw({ state, player, runtime, clouds, obstacles, coins, bonusHearts, bugHitEffects, levelId: getRenderedLevelId() });
    browser.requestAnimationFrame(update);

    cleanupInput = view.bindControls({
      canvas,
      onPrimaryAction: jump,
      canTriggerPrimaryAction: () =>
        state.gameStarted &&
        !state.gameOver &&
        !isSettingsOverlayOpen &&
        state.lives > 0,
      onActionButtonClick: () => {
        if (!runtime.assetsReady) {
          return;
        }

        if (isSettingsOverlayOpen) {
          closeSettings();
          return;
        }

        if (state.gameOver) {
          restartGame(true);
          return;
        }

        if (!state.gameStarted) {
          startGame();
        }
      },
    });

    cleanupViewportResize = view.bindViewportResize(syncTouchMode);
    cleanupSettingsButton = view.bindSettingsButton(() => {
      openSettings();
    });
    cleanupResetScores = view.bindResetScores(() => {
      if (!runtime.assetsReady) {
        return;
      }

      resetScores();
    });
    preloadCoreAssets()
      .then(() => {
        runtime.assetsReady = true;
        view.setActionButtonDisabled(false);
        view.setResetScoresButtonDisabled(false);
        view.setSettingsButtonDisabled(false);
        initGame();
      })
      .catch((error) => {
        console.error(error);
        view.showOverlay("Run & Debug", "Impossible de charger les sprites du jeu.", "Recharge la page", {
          screen: "error",
          tag: "Erreur de chargement",
        });
      });
  }

  function destroy() {
    cleanupInput?.();
    cleanupResetScores?.();
    cleanupSettingsButton?.();
    cleanupViewportResize?.();
    clearHeadImpactTimer();
    view.clearHeartBreakTimers();
  }

  return {
    destroy,
    start,
  };
}
