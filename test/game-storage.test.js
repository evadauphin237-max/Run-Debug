import test from "node:test";
import assert from "node:assert/strict";

import {
  loadBestScore,
  loadPreferredDifficulty,
  loadPreferredLevel,
  resetBestScores,
  saveBestScore,
  savePreferredDifficulty,
  savePreferredLevel,
} from "../src/game/storage.js";

function createLocalStorageMock() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test("score storage saves by difficulty and resets cleanly", () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: createLocalStorageMock(),
  };

  try {
    assert.equal(loadBestScore("normal"), 0);

    saveBestScore("normal", 12);
    saveBestScore("rush", 28);
    saveBestScore("normal", 8);

    assert.equal(loadBestScore("normal"), 12);
    assert.equal(loadBestScore("rush"), 28);

    resetBestScores();

    assert.equal(loadBestScore("normal"), 0);
    assert.equal(loadBestScore("rush"), 0);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("preferred difficulty persists independently from score reset", () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: createLocalStorageMock(),
  };

  try {
    savePreferredDifficulty("zen");
    saveBestScore("zen", 14);
    resetBestScores();

    assert.equal(loadPreferredDifficulty(), "zen");
    assert.equal(loadBestScore("zen"), 0);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("preferred level persists independently from score reset", () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: createLocalStorageMock(),
  };

  try {
    savePreferredLevel("forest");
    saveBestScore("normal", 18);
    resetBestScores();

    assert.equal(loadPreferredLevel(), "forest");
    assert.equal(loadBestScore("normal"), 0);
  } finally {
    globalThis.window = previousWindow;
  }
});
