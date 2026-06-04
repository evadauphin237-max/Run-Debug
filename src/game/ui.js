// DOM-only presentation layer.
// It updates overlays, score panels and heart animations, but never runs game rules.
export function createUI({
  overlay,
  overlayTag,
  overlayTitle,
  overlayText,
  loadingProgress,
  loadingProgressText,
  actionButton,
  resetScoresButton,
  recordValue,
  scoreValue,
  coinValue,
  livesDisplay,
  settingsButton,
  difficultyOptions,
  levelOptions,
  touchJumpButton,
}, browser) {
  const heartBreakTimers = new Map();
  const renderCache = {
    bestScoreText: null,
    coinText: null,
    loadingLabel: null,
    loadingPercent: null,
    scoreText: null,
  };
  const HOME_LOGO_MARKUP = `
    <span class="overlay-logo-word" aria-hidden="true">
      <span class="overlay-logo-letter overlay-logo-letter--r">R</span>
      <span class="overlay-logo-letter overlay-logo-letter--u">U</span>
      <span class="overlay-logo-letter overlay-logo-letter--n">N</span>
    </span>
    <span class="overlay-logo-amp" aria-hidden="true">&amp;</span>
    <span class="overlay-logo-word" aria-hidden="true">
      <span class="overlay-logo-letter overlay-logo-letter--d">D</span>
      <span class="overlay-logo-letter overlay-logo-letter--e">E</span>
      <span class="overlay-logo-letter overlay-logo-letter--b">B</span>
      <span class="overlay-logo-letter overlay-logo-letter--u2">U</span>
      <span class="overlay-logo-letter overlay-logo-letter--g">G</span>
    </span>
  `;
  const GAME_OVER_LOGO_MARKUP = `
    <span class="overlay-logo-word overlay-logo-word--game-over" aria-hidden="true">
      <span class="overlay-logo-letter overlay-logo-letter--g">G</span>
      <span class="overlay-logo-letter overlay-logo-letter--a">A</span>
      <span class="overlay-logo-letter overlay-logo-letter--m">M</span>
      <span class="overlay-logo-letter overlay-logo-letter--e">E</span>
    </span>
    <span class="overlay-logo-word overlay-logo-word--game-over" aria-hidden="true">
      <span class="overlay-logo-letter overlay-logo-letter--o">O</span>
      <span class="overlay-logo-letter overlay-logo-letter--v">V</span>
      <span class="overlay-logo-letter overlay-logo-letter--e2">E</span>
      <span class="overlay-logo-letter overlay-logo-letter--r2">R</span>
    </span>
  `;
  const NEW_RECORD_LOGO_MARKUP = `
    <span class="overlay-logo-word overlay-logo-word--new-record" aria-hidden="true">
      <span class="overlay-logo-letter overlay-logo-letter--n">N</span>
      <span class="overlay-logo-letter overlay-logo-letter--o">O</span>
      <span class="overlay-logo-letter overlay-logo-letter--u3">U</span>
      <span class="overlay-logo-letter overlay-logo-letter--v2">V</span>
      <span class="overlay-logo-letter overlay-logo-letter--e3">E</span>
      <span class="overlay-logo-letter overlay-logo-letter--a2">A</span>
      <span class="overlay-logo-letter overlay-logo-letter--u4">U</span>
    </span>
    <span class="overlay-logo-word overlay-logo-word--new-record" aria-hidden="true">
      <span class="overlay-logo-letter overlay-logo-letter--r3">R</span>
      <span class="overlay-logo-letter overlay-logo-letter--e4">E</span>
      <span class="overlay-logo-letter overlay-logo-letter--c">C</span>
      <span class="overlay-logo-letter overlay-logo-letter--o2">O</span>
      <span class="overlay-logo-letter overlay-logo-letter--r4">R</span>
      <span class="overlay-logo-letter overlay-logo-letter--d2">D</span>
    </span>
  `;

  function applyOverlayScreen(screen) {
    const activeScreen = screen ?? "default";
    overlay.dataset.screen = activeScreen;
    overlay.classList.toggle("overlay--home", activeScreen === "home");
    overlay.classList.toggle("overlay--loading-screen", activeScreen === "loading");
    overlay.classList.toggle("overlay--settings-screen", activeScreen === "settings");
    overlay.classList.toggle("overlay--end-screen", activeScreen === "end");
    overlay.classList.toggle("overlay--error-screen", activeScreen === "error");
    browser.bodyRef.classList.toggle("is-home-screen", activeScreen === "home");
  }

  function updateLivesAriaLabel(lives) {
    const label = lives > 1 ? `${lives} vies restantes` : `${lives} vie restante`;
    livesDisplay.setAttribute("aria-label", label);
  }

  function renderOverlayTitle(title, screen) {
    overlayTitle.classList.remove("overlay-title--logo");
    overlayTitle.removeAttribute("aria-label");

    if (screen === "home" && title === "Run & Debug") {
      overlayTitle.classList.add("overlay-title--logo");
      overlayTitle.setAttribute("aria-label", title);
      overlayTitle.innerHTML = HOME_LOGO_MARKUP;
      return;
    }

    if (screen === "end" && title === "GAME OVER") {
      overlayTitle.classList.add("overlay-title--logo");
      overlayTitle.setAttribute("aria-label", title);
      overlayTitle.innerHTML = GAME_OVER_LOGO_MARKUP;
      return;
    }

    if (screen === "end" && title === "NOUVEAU RECORD") {
      overlayTitle.classList.add("overlay-title--logo");
      overlayTitle.setAttribute("aria-label", title);
      overlayTitle.innerHTML = NEW_RECORD_LOGO_MARKUP;
      return;
    }

    overlayTitle.textContent = title;
  }

  function updateLoadingProgress({ loaded = 0, total = 0, progress = 0 } = {}) {
    if (!loadingProgress || !loadingProgressText) {
      return;
    }

    const safeProgress = Number.isFinite(progress)
      ? Math.max(0, Math.min(progress, 1))
      : 0;
    const roundedPercent = Math.round(safeProgress * 100);
    const loadingLabel = total > 0
      ? `Chargement des assets ${loaded}/${total} (${roundedPercent}%)`
      : `Chargement des assets (${roundedPercent}%)`;

    if (renderCache.loadingPercent !== roundedPercent) {
      loadingProgress.style.width = `${roundedPercent}%`;
      loadingProgress.setAttribute("aria-valuenow", String(roundedPercent));
      renderCache.loadingPercent = roundedPercent;
    }

    if (renderCache.loadingLabel !== loadingLabel) {
      loadingProgressText.textContent = loadingLabel;
      renderCache.loadingLabel = loadingLabel;
    }
  }

  function showLoadingOverlay(progressState) {
    applyOverlayScreen("loading");
    if (overlayTag) {
      overlayTag.textContent = "Initialisation";
    }
    renderOverlayTitle("Chargement du jeu", "loading");
    overlayText.textContent = "Preparation des sprites et de l'interface pour un demarrage fluide.";
    actionButton.textContent = "";
    overlay.classList.remove("overlay--record");
    overlay.setAttribute("aria-busy", "true");
    overlay.classList.add("visible");
    updateLoadingProgress(progressState);
  }

  function showOverlay(title, text, buttonLabel, options = {}) {
    const {
      celebrateRecord = false,
      screen = "default",
      tag = "",
    } = options;

    applyOverlayScreen(screen);
    if (overlayTag) {
      overlayTag.textContent = tag;
    }
    renderOverlayTitle(title, screen);
    overlayText.textContent = text;
    actionButton.textContent = buttonLabel;
    overlay.classList.toggle("overlay--record", celebrateRecord);
    overlay.setAttribute("aria-busy", "false");
    overlay.classList.add("visible");
  }

  function hideOverlay() {
    applyOverlayScreen("default");
    overlay.classList.remove("overlay--record");
    overlay.setAttribute("aria-busy", "false");
    overlay.classList.remove("visible");
  }

  function updateScoreDisplay(score, bestScore) {
    const nextScoreText = String(Math.floor(score));
    const nextBestScoreText = String(bestScore);

    if (renderCache.scoreText !== nextScoreText) {
      scoreValue.textContent = nextScoreText;
      renderCache.scoreText = nextScoreText;
    }

    if (renderCache.bestScoreText !== nextBestScoreText) {
      recordValue.textContent = nextBestScoreText;
      renderCache.bestScoreText = nextBestScoreText;
    }
  }

  function updateCoinDisplay(coinsCollected) {
    if (coinValue) {
      const nextCoinText = String(coinsCollected);

      if (renderCache.coinText !== nextCoinText) {
        coinValue.textContent = nextCoinText;
        renderCache.coinText = nextCoinText;
      }
    }
  }

  function setupLivesDisplay(maxLives, lives) {
    livesDisplay.innerHTML = "";

    // Hearts are generated once, then their CSS classes reflect the current state.
    for (let index = 0; index < maxLives; index += 1) {
      const heart = browser.documentRef.createElement("span");
      heart.className = "heart";
      heart.dataset.index = String(index);
      heart.setAttribute("aria-hidden", "true");
      livesDisplay.appendChild(heart);
    }

    updateLivesAriaLabel(lives);
  }

  function resetLivesDisplay(lives) {
    const hearts = livesDisplay.querySelectorAll(".heart");
    hearts.forEach((heart) => {
      heart.className = "heart";
    });
    updateLivesAriaLabel(lives);
  }

  function clearHeartBreakTimers() {
    heartBreakTimers.forEach((timer) => browser.clearTimeout(timer));
    heartBreakTimers.clear();
  }

  function breakHeart(index, lives) {
    const heart = livesDisplay.querySelector(`.heart[data-index="${index}"]`);

    if (!heart || heart.classList.contains("heart--breaking") || heart.classList.contains("heart--gone")) {
      updateLivesAriaLabel(lives);
      return;
    }

    heart.classList.add("heart--breaking");
    // The engine updates lives immediately; this timeout only drives the visual transition.
    const timer = browser.setTimeout(() => {
      heart.classList.remove("heart--breaking");
      heart.classList.add("heart--gone");
      heartBreakTimers.delete(index);
      updateLivesAriaLabel(lives);
    }, 450);

    heartBreakTimers.set(index, timer);
    updateLivesAriaLabel(lives);
  }

  function restoreHeart(index, lives) {
    const heart = livesDisplay.querySelector(`.heart[data-index="${index}"]`);

    if (!heart) {
      updateLivesAriaLabel(lives);
      return;
    }

    const pendingTimer = heartBreakTimers.get(index);
    if (pendingTimer) {
      browser.clearTimeout(pendingTimer);
      heartBreakTimers.delete(index);
    }

    heart.className = "heart";
    updateLivesAriaLabel(lives);
  }

  function renderSelectableOptions(container, options, currentId, selectedDatasetKey, onChange) {
    container.innerHTML = "";

    // Difficulty buttons are rendered from config data,
    // which keeps balancing concerns outside the UI layer.
    options.forEach((option) => {
      const button = browser.documentRef.createElement("button");
      button.type = "button";
      button.className = "difficulty-option";
      button.dataset[selectedDatasetKey] = option.id;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(option.id === currentId));
      button.innerHTML = `
        <span class="difficulty-option__label">${option.label}</span>
        <span class="difficulty-option__description">${option.description}</span>
      `;
      button.addEventListener("click", () => onChange(option.id));
      container.appendChild(button);
    });
  }

  function renderDifficultyOptions(options, currentId, onChange) {
    renderSelectableOptions(difficultyOptions, options, currentId, "difficultyId", onChange);
  }

  function setDifficultySelection(currentId) {
    difficultyOptions.querySelectorAll(".difficulty-option").forEach((button) => {
      const isSelected = button.dataset.difficultyId === currentId;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-checked", String(isSelected));
    });
  }

  function renderLevelOptions(options, currentId, onChange) {
    renderSelectableOptions(levelOptions, options, currentId, "levelId", onChange);
  }

  function setLevelSelection(currentId) {
    levelOptions.querySelectorAll(".difficulty-option").forEach((button) => {
      const isSelected = button.dataset.levelId === currentId;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-checked", String(isSelected));
    });
  }

  function setTouchMode(enabled) {
    browser.bodyRef.classList.toggle("is-touch", enabled);
  }

  function setTouchJumpVisible(visible) {
    touchJumpButton.classList.toggle("is-visible", visible);
    touchJumpButton.disabled = !visible;
  }

  function setSettingsButtonActive(active) {
    settingsButton.classList.toggle("is-active", active);
  }

  function announceScoresReset(bestScore) {
    overlayText.textContent = `Le score et les records ont ete remis a zero.\nRecord actuel : ${bestScore}`;
  }

  return {
    announceScoresReset,
    breakHeart,
    clearHeartBreakTimers,
    hideOverlay,
    renderDifficultyOptions,
    renderLevelOptions,
    resetLivesDisplay,
    restoreHeart,
    setDifficultySelection,
    showLoadingOverlay,
    setLevelSelection,
    setSettingsButtonActive,
    setTouchJumpVisible,
    setTouchMode,
    setupLivesDisplay,
    showOverlay,
    updateLoadingProgress,
    updateCoinDisplay,
    updateLivesAriaLabel,
    updateScoreDisplay,
  };
}
