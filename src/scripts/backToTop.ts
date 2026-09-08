const fadeStart = 140;
const fadeEnd = 720;
const minimumOpacity = 0.14;

export type BackToTopOptions = {
  button: HTMLElement;
  focusTarget: HTMLElement;
  onLocationChange: () => void;
};

export function initializeBackToTop({
  button,
  focusTarget,
  onLocationChange,
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
    if (window.location.hash) {
      const destination = new URL(window.location.href);
      destination.hash = "";
      window.history.replaceState(
        window.history.state,
        "",
        `${destination.pathname}${destination.search}`,
      );
      onLocationChange();
    }

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
