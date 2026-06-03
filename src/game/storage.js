import { BEST_SCORE_STORAGE_KEY, DIFFICULTY_STORAGE_KEY, LEVEL_STORAGE_KEY } from "./config.js";

function safeRead(key, fallback) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function parseScore(value) {
  const score = Number.parseInt(value, 10);
  return Number.isFinite(score) && score > 0 ? score : 0;
}

function loadBestScoreMap() {
  const legacyScore = parseScore(safeRead(BEST_SCORE_STORAGE_KEY, "0"));

  try {
    const rawValue = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);

    if (!rawValue) {
      return legacyScore > 0 ? { normal: legacyScore } : {};
    }

    const parsed = JSON.parse(rawValue);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([difficultyId, score]) => [difficultyId, parseScore(String(score))])
      );
    }
  } catch {
    return legacyScore > 0 ? { normal: legacyScore } : {};
  }

  return legacyScore > 0 ? { normal: legacyScore } : {};
}

export function loadBestScore(difficultyId) {
  const scoreMap = loadBestScoreMap();
  return scoreMap[difficultyId] ?? 0;
}

export function saveBestScore(difficultyId, score) {
  try {
    const scoreMap = loadBestScoreMap();
    scoreMap[difficultyId] = Math.max(scoreMap[difficultyId] ?? 0, score);
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, JSON.stringify(scoreMap));
  } catch {
    // Ignore storage failures so the game still works normally.
  }
}

export function resetBestScores() {
  try {
    window.localStorage.removeItem(BEST_SCORE_STORAGE_KEY);
  } catch {
    // Ignore storage failures so the game still works normally.
  }
}

export function loadPreferredDifficulty() {
  return safeRead(DIFFICULTY_STORAGE_KEY, "normal");
}

export function savePreferredDifficulty(difficultyId) {
  try {
    window.localStorage.setItem(DIFFICULTY_STORAGE_KEY, difficultyId);
  } catch {
    // Ignore storage failures so the game still works normally.
  }
}

export function loadPreferredLevel() {
  return safeRead(LEVEL_STORAGE_KEY, "arcade");
}

export function savePreferredLevel(levelId) {
  try {
    window.localStorage.setItem(LEVEL_STORAGE_KEY, levelId);
  } catch {
    // Ignore storage failures so the game still works normally.
  }
}
