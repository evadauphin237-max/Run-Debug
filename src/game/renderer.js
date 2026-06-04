import { createBackgroundRenderer } from "./render-background.js";
import { createEffectsRenderer } from "./render-effects.js";
import { createObstacleRenderer } from "./render-obstacles.js";
import { createPlayerRenderer } from "./render-player.js";

// Renderer composes specialized drawing modules.
// It receives state snapshots from the engine and stays free of game rules.
export function createRenderer(ctx, world) {
  const backgroundRenderer = createBackgroundRenderer(ctx, world);
  const obstacleRenderer = createObstacleRenderer(ctx);
  const effectsRenderer = createEffectsRenderer(ctx);
  const playerRenderer = createPlayerRenderer(ctx);

  function drawPrompt() {
    // No in-canvas prompt; the overlay already explains how to start.
  }

  function draw({ state, player, runtime, clouds, obstacles, coins, bonusHearts, bugHitEffects, levelId }) {
    // Each frame fully redraws the scene in a predictable order:
    // background -> obstacles/effects -> player.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, world.width, world.height);

    backgroundRenderer.draw({ state, runtime, clouds, levelId });
    obstacleRenderer.draw(obstacles, state);
    effectsRenderer.draw({ coins, bonusHearts, bugHitEffects });
    playerRenderer.draw(state, player, runtime);

    if (!state.gameStarted) {
      drawPrompt();
    }
  }

  return {
    draw,
    warmAssets(options) {
      return playerRenderer.warmAssets(options);
    },
  };
}
