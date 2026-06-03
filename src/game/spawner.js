import { bugVisualSettings } from "./assets.js";
import { obstaclePalette, obstacleTypes } from "./config.js";
import {
  getObstacleSpeedMultiplier,
  isAnimatedBugKind,
  randomChoice,
  randomRange,
  shouldSpawnBonusHeart,
  shuffleList,
} from "./logic.js";

// Spawning is handled in its own module so obstacle cadence and variety
// can evolve without touching rendering or player code.
function nextObstacleType(runtime) {
  if (runtime.obstacleTypeQueue.length === 0) {
    runtime.obstacleTypeQueue = shuffleList(obstacleTypes);
  }

  return runtime.obstacleTypeQueue.pop();
}

export function createBugHitEffect(obstacle) {
  return {
    kind: obstacle.kind,
    x: obstacle.x,
    y: obstacle.y,
    width: obstacle.width,
    height: obstacle.height,
    timeLeft: 0.42,
  };
}

export function createBonusHeart(world) {
  return {
    x: world.width + 56,
    y: randomRange(150, 280),
    width: 38,
    height: 38,
    floatTime: Math.random() * Math.PI * 2,
  };
}

export function createCoin(world) {
  return {
    x: world.width + 64,
    y: randomRange(120, 298),
    width: 44,
    height: 44,
    floatTime: Math.random() * Math.PI * 2,
    spinTime: Math.random() * Math.PI * 2,
  };
}

export function spawnObstacle(runtime, difficulty, world) {
  const type = nextObstacleType(runtime);
  const size = isAnimatedBugKind(type.kind)
    ? bugVisualSettings[type.kind].size
    : randomRange(64, 102);

  runtime.spawnedObstacleCount += 1;

  const obstacle = {
    kind: type.kind,
    x: world.width + size,
    y: world.groundY + 24 - size,
    width: size,
    height: size,
    palette: type.kind === "animated-ball" ? randomChoice(obstaclePalette) : null,
  };

  if (type.kind === "animated-ball") {
    obstacle.animationOffset = Math.random() * Math.PI * 2;
  }

  if (isAnimatedBugKind(type.kind)) {
    obstacle.animationTime = Math.random() * bugVisualSettings[type.kind].frames.length * 0.09;
  }

  return {
    obstacle,
    bonusHeart: shouldSpawnBonusHeart(runtime.spawnedObstacleCount, difficulty)
      ? createBonusHeart(world)
      : null,
  };
}

export function advanceSpawnedEntities({
  obstacles,
  coins,
  bonusHearts,
  bugHitEffects,
  speed,
  worldWidth,
  deltaTime,
  bugsOnly = false,
}) {
  // During the game-over sequence we only keep moving bug actors
  // to let the death animation breathe without advancing the whole run.
  obstacles.forEach((obstacle) => {
    if (!bugsOnly || isAnimatedBugKind(obstacle.kind)) {
      const direction = bugsOnly && obstacle.kind === "animated-bug-b" ? 1 : -1;
      obstacle.x += direction * speed * getObstacleSpeedMultiplier(obstacle.kind) * deltaTime;
    }

    if (isAnimatedBugKind(obstacle.kind)) {
      obstacle.animationTime += deltaTime;
    }
  });

  if (!bugsOnly) {
    coins.forEach((coin) => {
      coin.x -= speed * deltaTime;
      coin.floatTime += deltaTime * 5.2;
      coin.spinTime += deltaTime * 4.4;
    });

    bonusHearts.forEach((heart) => {
      heart.x -= speed * deltaTime;
      heart.floatTime += deltaTime * 5.2;
    });
  }

  bugHitEffects.forEach((effect) => {
    const direction = bugsOnly && effect.kind === "animated-bug-b" ? 1 : -1;
    effect.x += direction * speed * getObstacleSpeedMultiplier(effect.kind) * deltaTime;
    effect.timeLeft -= deltaTime;
  });

  return {
    obstacles: obstacles.filter(
      (obstacle) => obstacle.x + obstacle.width > -40 && obstacle.x < worldWidth + obstacle.width + 40
    ),
    coins: coins.filter((coin) => coin.x + coin.width > -40),
    bonusHearts: bonusHearts.filter((heart) => heart.x + heart.width > -40),
    bugHitEffects: bugHitEffects.filter(
      (effect) =>
        effect.x + effect.width > -40 &&
        effect.x < worldWidth + effect.width + 40 &&
        effect.timeLeft > 0
    ),
  };
}
