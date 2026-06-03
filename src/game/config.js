// Central place for tuning values.
// The engine consumes these constants instead of hardcoding dimensions and gameplay balance.
export const MAX_LIVES = 3;
export const BEST_SCORE_STORAGE_KEY = "run-and-debug-best-score-v8";
export const DIFFICULTY_STORAGE_KEY = "run-and-debug-difficulty-v1";
export const LEVEL_STORAGE_KEY = "run-and-debug-level-v1";

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
export const GROUND_Y = 430;

export const SPRITE_SHEET_VIEWBOX = {
  width: 1500,
  height: 1500,
};

export const obstaclePalette = [
  { kind: "solid", value: "#3d8bff" },
  { kind: "solid", value: "#ff8a00" },
  { kind: "solid", value: "#111111" },
  { kind: "solid", value: "#8a4dff" },
  { kind: "solid", value: "#b0176b" },
  { kind: "gradient", start: "#3d8bff", end: "#8a4dff" },
  { kind: "gradient", start: "#ff4fd8", end: "#8fdcff" },
];

export const obstacleTypes = [
  { kind: "animated-bug" },
  { kind: "animated-bug" },
  { kind: "animated-bug-b" },
  { kind: "animated-bug-b" },
  { kind: "animated-bug" },
];

export const BUG_OBSTACLE_CLIP = {
  x: 40,
  y: 60,
  width: 400,
  height: 540,
};

export const BUG_B_OBSTACLE_CLIP = {
  x: 0,
  y: 80,
  width: 260,
  height: 430,
};

export const BUG_OBSTACLE_SCALE = 1.87;
export const BUG_OBSTACLE_FOOT_OFFSET = 8;
export const BUG_OBSTACLE_SIZE = 82;
export const BUG_B_OBSTACLE_SCALE = 1.34;
export const BUG_B_OBSTACLE_FOOT_OFFSET = -5;
export const BUG_B_OBSTACLE_SIZE = 82;

export const DIFFICULTY_OPTIONS = [
  {
    id: "zen",
    label: "Zen",
    description: "Sauts plus généreux et rythme plus doux.",
    startSpeed: 240,
    speedRamp: 4.5,
    speedRampGrowth: 0.85,
    obstacleDelayMin: 1.35,
    obstacleDelayMax: 2.05,
    maxSpeedFactor: 1.08,
    scoreRate: 7,
    bonusHeartEvery: 7,
    coinDelayMin: 2.8,
    coinDelayMax: 4.2,
    jumpStrength: 900,
    gravity: 1725,
    doubleJumpMultiplier: 0.99,
  },
  {
    id: "normal",
    label: "Normal",
    description: "L'équilibre d'origine, parfait pour enchaîner.",
    startSpeed: 240,
    speedRamp: 8,
    speedRampGrowth: 1.2,
    maxSpeed: 1400,
    obstacleDelayMin: 0.9,
    obstacleDelayMax: 1.55,
    maxSpeedFactor: 1.35,
    scoreRate: 10,
    bonusHeartEvery: 10,
    coinDelayMin: 2.1,
    coinDelayMax: 3.2,
    jumpStrength: 760,
    gravity: 2100,
    doubleJumpMultiplier: 0.94,
  },
  {
    id: "rush",
    label: "Rush",
    description: "Plus rapide, plus serré, plus nerveux.",
    startSpeed: 430,
    speedRamp: 15,
    speedRampGrowth: 1.8,
    obstacleDelayMin: 0.5,
    obstacleDelayMax: 0.95,
    maxSpeedFactor: 1.9,
    scoreRate: 13,
    bonusHeartEvery: 13,
    coinDelayMin: 1.6,
    coinDelayMax: 2.7,
    jumpStrength: 690,
    gravity: 2525,
    doubleJumpMultiplier: 0.88,
  },
];

export const LEVEL_OPTIONS = [
  {
    id: "arcade",
    label: "1. Piste Arcade",
    description: "Le decor d'origine pour lancer la partie.",
  },
  {
    id: "forest",
    label: "2. Foret du Code",
    description: "La foret animee avec un premier plan dense.",
  },
  {
    id: "valley",
    label: "3. Vallee des Variables",
    description: "La vallee panoramique sur plusieurs plans.",
  },
];

export function getDifficultyById(id) {
  return DIFFICULTY_OPTIONS.find((difficulty) => difficulty.id === id) ?? DIFFICULTY_OPTIONS[1];
}

export function getLevelById(id) {
  return LEVEL_OPTIONS.find((level) => level.id === id) ?? LEVEL_OPTIONS[0];
}

export function createWorld() {
  // The canvas always renders inside this fixed logical world,
  // then CSS scales it responsively in the browser.
  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    groundY: GROUND_Y,
  };
}
