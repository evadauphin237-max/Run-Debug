import test from "node:test";
import assert from "node:assert/strict";

import {
  computeNextCoinDelay,
  computeNextObstacleDelay,
  createCoinHitbox,
  createHeartHitbox,
  createPlayerHitbox,
  getWinFrameIndex,
  getObstacleHitbox,
  rectsIntersect,
  shouldSpawnCoin,
  shouldSpawnBonusHeart,
  shuffleList,
} from "../src/game/logic.js";

test("player hitbox leaves a safety margin around the sprite", () => {
  assert.deepEqual(
    createPlayerHitbox({ x: 150, y: 200, width: 62, height: 82 }),
    { x: 158, y: 206, width: 44, height: 78 }
  );
});

test("animated bug hitboxes differ from round ball hitboxes", () => {
  assert.deepEqual(
    getObstacleHitbox({ kind: "animated-bug", x: 300, y: 320, width: 82, height: 82 }),
    { x: 288, y: 324, width: 60, height: 74 }
  );

  assert.deepEqual(
    getObstacleHitbox({ kind: "animated-ball", x: 300, y: 320, width: 82, height: 82 }),
    { x: 304, y: 324, width: 74, height: 74 }
  );
});

test("heart hitbox includes the floating offset", () => {
  const hitbox = createHeartHitbox({ x: 400, y: 220, width: 38, height: 38, floatTime: Math.PI / 2 });
  assert.equal(hitbox.y, 232);
});

test("coin hitbox includes the floating offset", () => {
  const hitbox = createCoinHitbox({ x: 400, y: 220, width: 44, height: 44, floatTime: Math.PI / 2 });
  assert.equal(hitbox.y, 234);
});

test("rectangle collision helper detects overlap cleanly", () => {
  assert.equal(
    rectsIntersect(
      { x: 0, y: 0, width: 20, height: 20 },
      { x: 10, y: 10, width: 20, height: 20 }
    ),
    true
  );

  assert.equal(
    rectsIntersect(
      { x: 0, y: 0, width: 20, height: 20 },
      { x: 21, y: 10, width: 20, height: 20 }
    ),
    false
  );
});

test("obstacle delay scales with speed and difficulty profile", () => {
  const difficulty = {
    startSpeed: 320,
    maxSpeedFactor: 1.45,
    obstacleDelayMin: 0.85,
    obstacleDelayMax: 1.55,
  };

  const slowDelay = computeNextObstacleDelay(320, difficulty, () => 0.5);
  const fastDelay = computeNextObstacleDelay(480, difficulty, () => 0.5);

  assert.ok(fastDelay < slowDelay);
});

test("bonus hearts follow the configured cadence", () => {
  const difficulty = { bonusHeartEvery: 10 };
  assert.equal(shouldSpawnBonusHeart(10, difficulty), true);
  assert.equal(shouldSpawnBonusHeart(11, difficulty), false);
});

test("coins use a random delay window", () => {
  const difficulty = { coinDelayMin: 2, coinDelayMax: 4 };
  assert.equal(computeNextCoinDelay(difficulty, () => 0), 2);
  assert.equal(computeNextCoinDelay(difficulty, () => 1), 4);
  assert.equal(shouldSpawnCoin(3.1, 3), true);
  assert.equal(shouldSpawnCoin(2.9, 3), false);
});

test("shuffleList keeps the same members", () => {
  const source = ["a", "b", "c", "d"];
  const shuffled = shuffleList(source, () => 0.2);

  assert.deepEqual([...shuffled].sort(), [...source].sort());
  assert.notEqual(shuffled, source);
});

test("win animation plays once then loops on the last two frames", () => {
  assert.equal(getWinFrameIndex(0, 4), 0);
  assert.equal(getWinFrameIndex(0.35, 4), 1);
  assert.equal(getWinFrameIndex(0.7, 4), 2);
  assert.equal(getWinFrameIndex(1.0, 4), 3);
  assert.equal(getWinFrameIndex(1.3, 4), 2);
  assert.equal(getWinFrameIndex(1.6, 4), 3);
});
