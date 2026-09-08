const languageSwitchSelector = "a[data-language-switch]";

export function setLanguageSwitchQuery(
  query: URLSearchParams,
  root: ParentNode = document,
): void {
  const search = query.toString();
  for (const link of root.querySelectorAll<HTMLAnchorElement>(
    languageSwitchSelector,
  )) {
    const destination = new URL(link.href, window.location.href);
    destination.search = search;
    link.href = `${destination.pathname}${destination.search}`;
  }
}
