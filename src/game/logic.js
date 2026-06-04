// Pure gameplay helpers shared by multiple modules.
// This file intentionally stays DOM-free and canvas-free so it is easy to test.
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function randomRange(min, max, random = Math.random) {
  return random() * (max - min) + min;
}

export function randomChoice(list, random = Math.random) {
  return list[Math.floor(random() * list.length)];
}

export function shuffleList(list, random = Math.random) {
  const clone = [...list];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

export function isAnimatedBugKind(kind) {
  return kind === "animated-bug" || kind === "animated-bug-b";
}

export function getObstacleSpeedMultiplier(kind) {
  if (kind === "animated-bug") {
    return 1.18;
  }

  if (kind === "animated-bug-b") {
    return 0.88;
  }

  return 1;
}

export function getObstacleHitbox(obstacle) {
  // Visual sprites are slightly larger than their collision boxes
  // so hits feel fair to the player.
  if (obstacle.kind === "animated-bug") {
    return {
      x: obstacle.x - 12,
      y: obstacle.y + 4,
      width: obstacle.width - 22,
      height: obstacle.height - 8,
    };
  }

  if (obstacle.kind === "animated-bug-b") {
    return {
      x: obstacle.x + 6,
      y: obstacle.y + 18,
      width: obstacle.width - 12,
      height: obstacle.height - 22,
    };
  }

  return {
    x: obstacle.x + 4,
    y: obstacle.y + 4,
    width: obstacle.width - 8,
    height: obstacle.height - 8,
  };
}

export function createPlayerHitbox(player) {
  return {
    x: player.x + 8,
    y: player.y + 6,
    width: player.width - 18,
    height: player.height - 4,
  };
}

export function createHeartHitbox(heart) {
  const floatOffset = Math.sin(heart.floatTime) * 8;

  return {
    x: heart.x + 4,
    y: heart.y + floatOffset + 4,
    width: heart.width - 8,
    height: heart.height - 8,
  };
}

export function createCoinHitbox(coin) {
  const floatOffset = Math.sin(coin.floatTime) * 8;

  return {
    x: coin.x + 6,
    y: coin.y + floatOffset + 6,
    width: coin.width - 12,
    height: coin.height - 12,
  };
}

export function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function computeNextObstacleDelay(speed, difficulty, random = Math.random) {
  const speedFactor = Math.min(speed / difficulty.startSpeed, difficulty.maxSpeedFactor);
  return randomRange(difficulty.obstacleDelayMin, difficulty.obstacleDelayMax, random) / speedFactor;
}

export function computeNextCoinDelay(difficulty, random = Math.random) {
  const minDelay = difficulty.coinDelayMin ?? 2.2;
  const maxDelay = difficulty.coinDelayMax ?? 3.4;
  return randomRange(minDelay, maxDelay, random);
}

export function shouldSpawnBonusHeart(spawnedObstacleCount, difficulty) {
  return spawnedObstacleCount % difficulty.bonusHeartEvery === 0;
}

export function shouldSpawnCoin(coinTimer, nextCoinIn) {
  return coinTimer >= nextCoinIn;
}

export function getIdleFrameIndex(animationTime, frameCount = 68, framesPerSecond = 4) {
  return Math.min(frameCount - 1, Math.floor(animationTime * framesPerSecond));
}

export function getJumpFrameIndex(jumpAnimationTime, jumpStrength, gravity) {
  const totalJumpDuration = (jumpStrength * 2) / gravity;
  const progress = Math.min(1, jumpAnimationTime / totalJumpDuration);
  const thresholds = [0.1, 0.22, 0.34, 0.46, 0.6, 0.74, 0.88];

  for (let index = 0; index < thresholds.length; index += 1) {
    if (progress < thresholds[index]) {
      return index;
    }
  }

  return 7;
}

export function getDoubleJumpFrameIndex(jumpAnimationTime, jumpStrength, gravity) {
  const totalJumpDuration = (jumpStrength * 2) / gravity;
  const progress = Math.min(1, jumpAnimationTime / totalJumpDuration);
  const thresholds = [0.16, 0.32, 0.48, 0.66, 0.84];

  for (let index = 0; index < thresholds.length; index += 1) {
    if (progress < thresholds[index]) {
      return index;
    }
  }

  return 5;
}

export function getChuteFrameIndex(deathFallTime, deathFallDuration, frameCount) {
  const progress = Math.min(0.999, deathFallTime / deathFallDuration);
  return Math.min(frameCount - 1, Math.floor(progress * frameCount));
}

export function getIntroThenLoopTailFrameIndex(
  animationTime,
  frameCount,
  introFramesPerSecond = 3.2,
  loopTailCount = 4,
  loopFramesPerSecond = introFramesPerSecond
) {
  if (frameCount <= 0 || introFramesPerSecond <= 0 || loopFramesPerSecond <= 0) {
    return 0;
  }

  const loopLength = Math.max(1, Math.min(loopTailCount, frameCount));
  const introLength = Math.max(0, frameCount - loopLength);

  if (introLength === 0) {
    return Math.floor(animationTime * loopFramesPerSecond) % frameCount;
  }

  const introDuration = introLength / introFramesPerSecond;

  if (animationTime < introDuration) {
    return Math.min(introLength - 1, Math.floor(animationTime * introFramesPerSecond));
  }

  const loopStart = frameCount - loopLength;
  const loopTime = animationTime - introDuration;
  const loopStep = Math.floor(loopTime * loopFramesPerSecond);

  if (loopStep < loopLength) {
    return loopStart + loopStep;
  }

  return loopStart + ((loopStep - loopLength) % loopLength);
}

export function getWinFrameIndex(
  animationTime,
  frameCount,
  introFramesPerSecond = 3.2,
  loopTailCount = 4,
  loopFramesPerSecond = introFramesPerSecond
) {
  return getIntroThenLoopTailFrameIndex(
    animationTime,
    frameCount,
    introFramesPerSecond,
    loopTailCount,
    loopFramesPerSecond
  );
}

export function createClouds() {
  return [
    { x: 70, y: 100, scale: 1, speedFactor: 1 },
    { x: 300, y: 150, scale: 0.8, speedFactor: 0.85 },
    { x: 570, y: 88, scale: 1.15, speedFactor: 1.1 },
    { x: 780, y: 142, scale: 0.92, speedFactor: 0.95 },
  ];
}
