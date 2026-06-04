import { bindInput } from "./input.js";
import { createUI } from "./ui.js";

// Bridge between the engine and the DOM-specific pieces:
// UI rendering, input binding and viewport resize handling.
export function createGameDOMView(elements, browser) {
  const {
    overlay,
    overlayTag,
    overlayTitle,
    overlayText,
    loadingProgress,
    loadingProgressText,
    actionButton,
    recordValue,
    scoreValue,
    coinValue,
    livesDisplay,
    settingsButton,
    difficultyOptions,
    levelOptions,
    touchJumpButton,
  } = elements;

  const ui = createUI({
    overlay,
    overlayTag,
    overlayTitle,
    overlayText,
    loadingProgress,
    loadingProgressText,
    actionButton,
    recordValue,
    scoreValue,
    coinValue,
    livesDisplay,
    settingsButton,
    difficultyOptions,
    levelOptions,
    touchJumpButton,
  }, browser);

  function setActionButtonDisabled(disabled) {
    actionButton.disabled = disabled;
  }

  function setSettingsButtonDisabled(disabled) {
    settingsButton.disabled = disabled;
  }

  function bindSettingsButton(onSettingsClick) {
    settingsButton.addEventListener("click", onSettingsClick);

    return () => {
      settingsButton.removeEventListener("click", onSettingsClick);
    };
  }

  function bindControls({ canvas, onPrimaryAction, canTriggerPrimaryAction, onActionButtonClick }) {
    return bindInput({
      documentRef: browser.documentRef,
      canvas,
      actionButton,
      touchJumpButton,
      onPrimaryAction,
      canTriggerPrimaryAction,
      onActionButtonClick,
    });
  }

  return {
    ...ui,
    bindControls,
    bindSettingsButton,
    bindViewportResize: browser.bindResize,
    getInputMode: browser.getInputMode,
    setActionButtonDisabled,
    setSettingsButtonDisabled,
  };
}
