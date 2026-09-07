// Browser behavior for the site header: the mobile navigation drawer and the
// Pagefind-backed search field. Pages hand the header element to
// initializeSiteHeader once; everything else is internal. Navigation and search
// coordinate through the controller returned by createNavigation instead of a
// shared global, and every element lookup is scoped to the header that was
// passed in, so a page can change one behavior without touching the other or
// the rest of its markup.
import { uiLabels } from "../i18n/ui";
import { isRecipeLanguage, sitePath } from "../lib/site";
import type { RecipeLanguage } from "../lib/site";

const mobileNavigationQuery = "(max-width: 880px)";
const shortestSearchQuery = 2;
const maximumSearchResults = 8;

/** The only thing search needs from navigation: get the drawer out of the way. */
type NavigationController = {
  close(): void;
};

type SiteHeaderSettings = {
  language: RecipeLanguage;
  basePath: string;
};

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`The site header is missing ${selector}.`);
  }
  return element;
}

function readSettings(header: HTMLElement): SiteHeaderSettings {
  const { language, basePath } = header.dataset;
  if (!isRecipeLanguage(language) || basePath === undefined) {
    throw new Error(
      "The site header needs data-language and data-base-path attributes.",
    );
  }
  return { language, basePath };
}

function createNavigation(header: HTMLElement): NavigationController {
  const trigger = requireElement<HTMLButtonElement>(header, ".menu-button");
  const panel = requireElement<HTMLElement>(header, "#main-navigation");
  const mobileNavigation = window.matchMedia(mobileNavigationQuery);
  let lastFocusedElement: Element | null = document.activeElement;

  function setOpen(open: boolean, restoreFocus = false) {
    const expanded = open && mobileNavigation.matches;
    trigger.setAttribute("aria-expanded", String(expanded));
    panel.classList.toggle("is-open", expanded);
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }

  function focusFirstLink() {
    panel.querySelector("a")?.focus();
  }

  setOpen(window.location.hash === "#nav-open");

  trigger.addEventListener("click", (event) => {
    const open = trigger.getAttribute("aria-expanded") !== "true";
    setOpen(open);
    // The drawer precedes the trigger in DOM order. Keyboard activation
    // starts at its first link so subsequent Tab presses follow the links.
    if (open && event.detail === 0) focusFirstLink();
  });

  panel.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setOpen(false, mobileNavigation.matches);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      trigger.getAttribute("aria-expanded") === "true"
    ) {
      event.preventDefault();
      setOpen(false, true);
    }
  });

  document.addEventListener("focusin", (event) => {
    lastFocusedElement =
      event.target instanceof Element ? event.target : lastFocusedElement;
    if (
      event.target instanceof Node &&
      !panel.contains(event.target) &&
      !trigger.contains(event.target)
    ) {
      setOpen(false);
    }
  });

  mobileNavigation.addEventListener("change", () => {
    // CSS can hide and blur the focused control before the media event fires.
    const focusedElement =
      document.activeElement === document.body
        ? lastFocusedElement
        : document.activeElement;
    const focusInNavigation = panel.contains(focusedElement);
    const focusOnTrigger = focusedElement === trigger;
    setOpen(false, mobileNavigation.matches && focusInNavigation);
    if (!mobileNavigation.matches && focusOnTrigger) focusFirstLink();
  });

  return { close: () => setOpen(false) };
}

function createSearch(
  header: HTMLElement,
  settings: SiteHeaderSettings,
  navigation: NavigationController,
) {
  const { language, basePath } = settings;
  const labels = uiLabels[language].search;
  const pagefindBundle = sitePath(basePath, "pagefind/pagefind.js");
  const area = requireElement<HTMLElement>(header, "[data-search-area]");
  const overlay = requireElement<HTMLElement>(header, "[data-search-overlay]");
  const input = requireElement<HTMLInputElement>(header, "[data-search-input]");
  const status = requireElement<HTMLElement>(header, "[data-search-status]");
  const summary = requireElement<HTMLElement>(header, "[data-search-summary]");
  const results = requireElement<HTMLElement>(header, "[data-search-results]");
  const closeButton = requireElement<HTMLButtonElement>(
    header,
    "[data-search-close]",
  );
  const retryButton = requireElement<HTMLButtonElement>(
    header,
    "[data-search-retry]",
  );

  let pagefindPromise: Promise<PagefindModule> | undefined;
  let loadAttempt = 0;
  let lastSearchId = 0;

  function normalizeResultUrl(url: string) {
    const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
    if (url.startsWith(normalizedBase)) {
      return url;
    }
    return `${normalizedBase}${url.replace(/^\/+/, "")}`;
  }

  async function getPagefind() {
    // Browsers can cache failed module imports, so retries need a fresh URL.
    const bundleUrl = loadAttempt
      ? `${pagefindBundle}?retry=${loadAttempt}`
      : pagefindBundle;
    // Pagefind indexes the built pages, so its bundle only exists after the
    // build. The bundler must leave this import alone and let it resolve in
    // the browser.
    pagefindPromise ??= (
      import(/* @vite-ignore */ bundleUrl) as Promise<PagefindModule>
    )
      .then(async (pagefind) => {
        await pagefind.init?.();
        return pagefind;
      })
      .catch((error: unknown) => {
        pagefindPromise = undefined;
        ++loadAttempt;
        throw error;
      });
    return pagefindPromise;
  }

  function hideResultsLayer() {
    overlay.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function showResultsLayer(message: string) {
    summary.textContent = message;
    status.textContent = message;
    overlay.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function activate() {
    header.classList.add("search-active");
    navigation.close();
  }

  function close(restoreFocus = false) {
    ++lastSearchId;
    input.removeAttribute("aria-busy");
    hideResultsLayer();
    if (restoreFocus) {
      input.focus();
    }
    header.classList.remove("search-active");
  }

  function clearResults() {
    results.replaceChildren();
  }

  function renderResults(searchResults: PagefindResultData[]) {
    results.replaceChildren();

    for (const result of searchResults) {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = normalizeResultUrl(result.url);

      const title = document.createElement("strong");
      title.textContent = result.meta.title ?? link.href;
      link.append(title);

      const details = [result.meta.category, result.meta.markers]
        .filter(Boolean)
        .join(" | ");
      if (details) {
        const meta = document.createElement("span");
        meta.className = "search-result-meta";
        meta.textContent = details;
        link.append(meta);
      }

      const excerpt = document.createElement("span");
      excerpt.className = "search-result-excerpt";
      excerpt.innerHTML = result.excerpt;
      link.append(excerpt);

      results.append(link);
    }
  }

  async function run() {
    activate();
    const query = input.value.trim();
    const searchId = ++lastSearchId;

    retryButton.hidden = true;
    if (query.length < shortestSearchQuery) {
      input.removeAttribute("aria-busy");
      status.textContent = "";
      clearResults();
      hideResultsLayer();
      return;
    }

    input.setAttribute("aria-busy", "true");
    status.textContent = labels.loading;
    clearResults();
    hideResultsLayer();
    try {
      const pagefind = await getPagefind();
      const search = await pagefind.search(query, { filters: { language } });
      const searchResults = await Promise.all(
        search.results
          .slice(0, maximumSearchResults)
          .map((result) => result.data()),
      );
      if (searchId !== lastSearchId) return;
      input.removeAttribute("aria-busy");
      if (searchResults.length === 0) {
        showResultsLayer(labels.empty);
        return;
      }
      const foundMessage = labels.found.replace(
        "{count}",
        String(searchResults.length),
      );
      renderResults(searchResults);
      showResultsLayer(foundMessage);
    } catch {
      if (searchId !== lastSearchId) return;
      input.removeAttribute("aria-busy");
      showResultsLayer(labels.error);
      retryButton.hidden = false;
    }
  }

  function isActive() {
    return header.classList.contains("search-active");
  }

  closeButton.addEventListener("click", () => close(true));
  retryButton.addEventListener("click", () => {
    input.focus();
    run();
  });
  input.addEventListener("pointerdown", activate);
  input.addEventListener("focus", activate);
  input.addEventListener("input", () => {
    run();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") run();
    if (event.key === "ArrowDown" && !overlay.hidden) {
      event.preventDefault();
      results.querySelector("a")?.focus();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (
      isActive() &&
      event.target instanceof Node &&
      !area.contains(event.target)
    ) {
      close();
    }
  });
  document.addEventListener("focusin", (event) => {
    if (
      isActive() &&
      event.target instanceof Node &&
      !area.contains(event.target)
    ) {
      close();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isActive()) {
      event.preventDefault();
      close(true);
    }
  });
}

type PagefindResultData = {
  url: string;
  excerpt: string;
  meta: {
    title?: string;
    category?: string;
    markers?: string;
  };
};

type PagefindModule = {
  init?: () => Promise<void> | void;
  search: (
    query: string,
    options: { filters: { language: string } },
  ) => Promise<{ results: { data: () => Promise<PagefindResultData> }[] }>;
};

/**
 * Wire up one rendered site header. The header element carries the language and
 * base path the behavior needs, so a page only has to hand over the element.
 */
export function initializeSiteHeader(header: HTMLElement): void {
  const settings = readSettings(header);
  const navigation = createNavigation(header);
  createSearch(header, settings, navigation);
}
