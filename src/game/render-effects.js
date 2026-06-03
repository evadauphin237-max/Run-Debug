import { bonusHeartSprite, bugVisualSettings, coinSprite, isImageReady } from "./assets.js";
import { clamp } from "./logic.js";

export function createEffectsRenderer(ctx) {
  function drawObstacleFallback(width, height) {
    ctx.fillStyle = "rgba(22, 50, 79, 0.9)";
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, width * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.beginPath();
    ctx.arc(width * 0.38, height * 0.34, width * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBonusHeartFallback(width, height) {
    ctx.fillStyle = "#e63572";
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.9);
    ctx.bezierCurveTo(width * 0.1, height * 0.64, width * 0.08, height * 0.24, width * 0.3, height * 0.18);
    ctx.bezierCurveTo(width * 0.44, height * 0.12, width * 0.5, height * 0.24, width * 0.5, height * 0.28);
    ctx.bezierCurveTo(width * 0.5, height * 0.24, width * 0.56, height * 0.12, width * 0.7, height * 0.18);
    ctx.bezierCurveTo(width * 0.92, height * 0.24, width * 0.9, height * 0.64, width * 0.5, height * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  function drawCoinFallback(width, height) {
    const radius = Math.min(width, height) * 0.48;
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    ctx.fillStyle = "#ffcf4d";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 244, 204, 0.92)";
    ctx.lineWidth = Math.max(2, width * 0.08);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawBugHitEffects(bugHitEffects) {
    bugHitEffects.forEach((effect) => {
      const alpha = clamp(effect.timeLeft / 0.42, 0, 1);
      const settings = bugVisualSettings[effect.kind];
      const hitFrame = settings.hitFrame;
      const sourceImage = settings.image;
      const drawHeight = effect.height * settings.scale;
      const drawWidth = drawHeight * (hitFrame.width / hitFrame.height);
      const drawX = (effect.width - drawWidth) * 0.5;
      const drawY = effect.height - drawHeight + settings.footOffset;

      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = "rgba(22, 50, 79, 0.18)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      if (isImageReady(sourceImage)) {
        ctx.drawImage(
          sourceImage,
          hitFrame.x,
          hitFrame.y,
          hitFrame.width,
          hitFrame.height,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        );
      } else {
        drawObstacleFallback(effect.width, effect.height);
      }

      ctx.restore();
    });
  }

  function drawBonusHearts(bonusHearts) {
    bonusHearts.forEach((heart) => {
      const floatOffset = Math.sin(heart.floatTime) * 8;
      const pulseScale = 1 + Math.sin(heart.floatTime * 2.4) * 0.1;
      const pulseWidth = heart.width * pulseScale;
      const pulseHeight = heart.height * pulseScale;
      const pulseX = -(pulseWidth - heart.width) * 0.5;
      const pulseY = -(pulseHeight - heart.height) * 0.5;

      ctx.save();
      ctx.translate(heart.x, heart.y + floatOffset);
      ctx.shadowColor = "rgba(230, 53, 114, 0.28)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;

      if (isImageReady(bonusHeartSprite.image)) {
        ctx.drawImage(bonusHeartSprite.image, pulseX, pulseY, pulseWidth, pulseHeight);
      } else {
        ctx.save();
        ctx.translate(heart.width * 0.5, heart.height * 0.5);
        ctx.scale(pulseScale, pulseScale);
        ctx.translate(-heart.width * 0.5, -heart.height * 0.5);
        drawBonusHeartFallback(heart.width, heart.height);
        ctx.restore();
      }

      ctx.restore();
    });
  }

  function drawCoins(coins) {
    coins.forEach((coin) => {
      const floatOffset = Math.sin(coin.floatTime) * 8;
      const pulseScale = 1 + Math.sin(coin.floatTime * 2) * 0.06;
      const rotation = Math.sin(coin.spinTime) * 0.16;
      const drawWidth = coin.width * pulseScale;
      const drawHeight = coin.height * pulseScale;

      ctx.save();
      ctx.translate(coin.x + coin.width * 0.5, coin.y + floatOffset + coin.height * 0.5);
      ctx.rotate(rotation);
      ctx.shadowColor = "rgba(255, 205, 79, 0.34)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;

      if (isImageReady(coinSprite.image)) {
        ctx.drawImage(
          coinSprite.image,
          -drawWidth * 0.5,
          -drawHeight * 0.5,
          drawWidth,
          drawHeight
        );
      } else {
        ctx.translate(-coin.width * 0.5, -coin.height * 0.5);
        drawCoinFallback(coin.width, coin.height);
      }

      ctx.restore();
    });
  }

  function draw({ coins, bonusHearts, bugHitEffects }) {
    drawBugHitEffects(bugHitEffects);
    drawCoins(coins);
    drawBonusHearts(bonusHearts);
  }

  return {
    draw,
  };
}
