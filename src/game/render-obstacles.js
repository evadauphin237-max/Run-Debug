import { bugVisualSettings, isImageReady } from "./assets.js";
import { obstaclePalette } from "./config.js";
import { isAnimatedBugKind } from "./logic.js";

export function createObstacleRenderer(ctx) {
  function createObstacleFill(obstacle) {
    const palette = obstacle.palette ?? obstaclePalette[0];

    if (palette.kind === "gradient") {
      const gradient = ctx.createLinearGradient(0, 0, obstacle.width, obstacle.height);
      gradient.addColorStop(0, palette.start);
      gradient.addColorStop(1, palette.end);
      return gradient;
    }

    return palette.value;
  }

  function drawObstacleFallback(width, height, obstacle) {
    ctx.fillStyle =
      obstacle.kind === "animated-ball"
        ? createObstacleFill(obstacle)
        : "rgba(22, 50, 79, 0.9)";
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, width * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.beginPath();
    ctx.arc(width * 0.38, height * 0.34, width * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAnimatedBallObstacle(obstacle, state) {
    const cycle = (state.headSwingTime * 1.85 + obstacle.animationOffset) % (Math.PI * 2);
    const bounceProgress = (Math.sin(cycle) + 1) / 2;
    const shadowScale = 0.7 + bounceProgress * 0.4;
    const ballHeight = obstacle.height * (0.68 + bounceProgress * 0.28);
    const ballWidth = obstacle.width * (0.52 + (1 - bounceProgress) * 0.12);
    const groundY = obstacle.height;
    const ballY = groundY - ballHeight - bounceProgress * obstacle.height * 0.58;

    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    ctx.fillStyle = "rgba(22, 50, 79, 0.16)";
    ctx.beginPath();
    ctx.ellipse(
      obstacle.width * 0.5,
      obstacle.height * 0.98,
      obstacle.width * 0.24 * shadowScale,
      obstacle.height * 0.07 * shadowScale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = createObstacleFill(obstacle);
    ctx.beginPath();
    ctx.ellipse(
      obstacle.width * 0.5,
      ballY + ballHeight * 0.5,
      ballWidth * 0.5,
      ballHeight * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.ellipse(
      obstacle.width * 0.42,
      ballY + ballHeight * 0.32,
      ballWidth * 0.16,
      ballHeight * 0.12,
      -0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  function drawAnimatedBugObstacle(obstacle) {
    const settings = bugVisualSettings[obstacle.kind];
    const frameIndex = Math.floor(obstacle.animationTime * 12) % settings.frames.length;
    const frame = settings.frames[frameIndex];
    const drawHeight = obstacle.height * settings.scale;
    const drawWidth = drawHeight * (frame.width / frame.height);
    const drawX = (obstacle.width - drawWidth) * 0.5;
    const drawY = obstacle.height - drawHeight + settings.footOffset;
    const sourceImage = settings.image;

    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.shadowColor = "rgba(22, 50, 79, 0.18)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    if (isImageReady(sourceImage)) {
      ctx.drawImage(
        sourceImage,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
    } else {
      drawObstacleFallback(obstacle.width, obstacle.height, obstacle);
    }

    ctx.restore();
  }

  function draw(obstacles, state) {
    obstacles.forEach((obstacle) => {
      if (obstacle.kind === "animated-ball") {
        drawAnimatedBallObstacle(obstacle, state);
        return;
      }

      if (isAnimatedBugKind(obstacle.kind)) {
        drawAnimatedBugObstacle(obstacle);
        return;
      }

      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      ctx.shadowColor = "rgba(22, 50, 79, 0.18)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      drawObstacleFallback(obstacle.width, obstacle.height, obstacle);
      ctx.restore();
    });
  }

  return {
    draw,
  };
}
