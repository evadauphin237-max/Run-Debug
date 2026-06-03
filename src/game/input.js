// Input layer translates keyboard, mouse and touch into one "primary action"
// so the engine only deals with gameplay intent, not device-specific events.
export function bindInput({
  documentRef,
  canvas,
  actionButton,
  touchJumpButton,
  onPrimaryAction,
  onActionButtonClick,
  canTriggerPrimaryAction,
}) {
  function handlePrimaryAction(event) {
    if (event.type === "keydown" && event.code !== "Space") {
      return;
    }

    if (!canTriggerPrimaryAction()) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    onPrimaryAction(event);
  }

  actionButton.addEventListener("click", onActionButtonClick);
  documentRef.addEventListener("keydown", handlePrimaryAction);
  canvas.addEventListener("pointerdown", handlePrimaryAction);
  touchJumpButton.addEventListener("pointerdown", handlePrimaryAction);

  return () => {
    actionButton.removeEventListener("click", onActionButtonClick);
    documentRef.removeEventListener("keydown", handlePrimaryAction);
    canvas.removeEventListener("pointerdown", handlePrimaryAction);
    touchJumpButton.removeEventListener("pointerdown", handlePrimaryAction);
  };
}
