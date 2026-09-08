const languageSwitchSelector = "a[data-language-switch]";

function languageSwitches(root: ParentNode): NodeListOf<HTMLAnchorElement> {
  return root.querySelectorAll<HTMLAnchorElement>(languageSwitchSelector);
}

function writeDestination(link: HTMLAnchorElement, destination: URL): void {
  link.href = `${destination.pathname}${destination.search}${destination.hash}`;
}

export function setLanguageSwitchHash(
  hash: string,
  root: ParentNode = document,
): void {
  for (const link of languageSwitches(root)) {
    const destination = new URL(link.href, window.location.href);
    destination.hash = hash;
    writeDestination(link, destination);
  }
}

export function setLanguageSwitchQuery(
  query: URLSearchParams,
  root: ParentNode = document,
): void {
  const search = query.toString();
  for (const link of languageSwitches(root)) {
    const destination = new URL(link.href, window.location.href);
    destination.search = search;
    destination.hash = window.location.hash;
    writeDestination(link, destination);
  }
}

export function initializeLanguageSwitch(root: ParentNode = document): void {
  const syncHash = () => setLanguageSwitchHash(window.location.hash, root);

  syncHash();
  for (const link of languageSwitches(root)) {
    link.addEventListener("click", syncHash);
  }

  window.addEventListener("hashchange", syncHash);
  window.addEventListener("popstate", syncHash);
}
