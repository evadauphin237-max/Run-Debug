import { createBrowserRuntime } from "./game/browser-runtime.js";
import { createGame } from "./game/engine.js";
import { createGameDOMView } from "./game/game-dom-view.js";

// Composition root:
// this file wires the browser environment, the DOM view and the game engine together.
const browser = createBrowserRuntime();
const canvas = browser.documentRef.getElementById("gameCanvas");
const view = createGameDOMView({
  overlay: browser.documentRef.getElementById("overlay"),
  overlayTag: browser.documentRef.getElementById("overlayTag"),
  overlayTitle: browser.documentRef.getElementById("overlayTitle"),
  overlayText: browser.documentRef.getElementById("overlayText"),
  loadingProgress: browser.documentRef.getElementById("loadingProgress"),
  loadingProgressText: browser.documentRef.getElementById("loadingProgressText"),
  actionButton: browser.documentRef.getElementById("actionButton"),
  recordValue: browser.documentRef.getElementById("recordValue"),
  scoreValue: browser.documentRef.getElementById("scoreValue"),
  coinValue: browser.documentRef.getElementById("coinValue"),
  livesDisplay: browser.documentRef.getElementById("livesDisplay"),
  settingsButton: browser.documentRef.getElementById("settingsButton"),
  difficultyOptions: browser.documentRef.getElementById("difficultyOptions"),
  levelOptions: browser.documentRef.getElementById("levelOptions"),
  touchJumpButton: browser.documentRef.getElementById("touchJumpButton"),
}, browser);

const game = createGame({
  browser,
  canvas,
  view,
});

game.start();
