// Browser behavior for the floating back-to-top button. It owns its own
// visibility, scrolling, and post-scroll focus, and it is initialized with the
// element to focus afterwards so it never has to reach into the header's
// markup on its own.
const fadeStart = 140;
const fadeEnd = 720;
const minimumOpacity = 0.14;

export type BackToTopOptions = {
  button: HTMLElement;
  /** Focused after scrolling, so keyboard users continue from the page top. */
  focusTarget: HTMLElement;
};

export function initializeBackToTop({
  button,
  focusTarget,
}: BackToTopOptions): void {
  let pendingFrame = 0;

  function updateVisibility() {
    const scrollPosition = window.scrollY;

    if (scrollPosition <= fadeStart) {
      button.hidden = true;
      return;
    }

    const scrollProgress = Math.min(
      1,
      (scrollPosition - fadeStart) / (fadeEnd - fadeStart),
    );
    const opacity = minimumOpacity + (1 - minimumOpacity) * scrollProgress;

    button.style.setProperty("--back-to-top-opacity", opacity.toFixed(3));
    button.hidden = false;
  }

  function scheduleUpdate() {
    if (pendingFrame) {
      return;
    }

    pendingFrame = window.requestAnimationFrame(() => {
      pendingFrame = 0;
      updateVisibility();
    });
  }

  button.addEventListener("click", () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    focusTarget.focus({ preventScroll: true });
  });

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  updateVisibility();
}
