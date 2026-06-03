// Small adapter around browser globals.
// Keeping access to window/document here makes the rest of the code easier to test.
export function createBrowserRuntime({ windowRef = window, documentRef = document } = {}) {
  return {
    bodyRef: documentRef.body,
    documentRef,
    bindResize(onResize) {
      windowRef.addEventListener("resize", onResize);

      return () => {
        windowRef.removeEventListener("resize", onResize);
      };
    },
    clearTimeout(timerId) {
      windowRef.clearTimeout(timerId);
    },
    getInputMode() {
      return windowRef.matchMedia("(pointer: coarse)").matches ? "touch" : "keyboard";
    },
    requestAnimationFrame(callback) {
      return windowRef.requestAnimationFrame(callback);
    },
    setTimeout(callback, delay) {
      return windowRef.setTimeout(callback, delay);
    },
  };
}
