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
  let suppressNextActionButtonClick = false;

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

  function handleActionButtonPointerDown(event) {
    if (event.cancelable) {
      event.preventDefault();
    }

    suppressNextActionButtonClick = true;
    onActionButtonClick(event);
  }

  function handleActionButtonClick(event) {
    if (suppressNextActionButtonClick) {
      suppressNextActionButtonClick = false;
      return;
    }

    onActionButtonClick(event);
  }

  actionButton.addEventListener("pointerdown", handleActionButtonPointerDown);
  actionButton.addEventListener("click", handleActionButtonClick);
  documentRef.addEventListener("keydown", handlePrimaryAction);
  canvas.addEventListener("pointerdown", handlePrimaryAction);
  touchJumpButton.addEventListener("pointerdown", handlePrimaryAction);

  return () => {
    actionButton.removeEventListener("pointerdown", handleActionButtonPointerDown);
    actionButton.removeEventListener("click", handleActionButtonClick);
    documentRef.removeEventListener("keydown", handlePrimaryAction);
    canvas.removeEventListener("pointerdown", handlePrimaryAction);
    touchJumpButton.removeEventListener("pointerdown", handlePrimaryAction);
  };
}
