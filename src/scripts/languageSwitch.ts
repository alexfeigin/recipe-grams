// The header renders one language-switch link per layout variant: one in the
// desktop language picker and one in the mobile actions. A page that keeps
// state in the query string calls setLanguageSwitchQuery so both variants carry
// that state into the other language. The links are found by their explicit
// marker attribute, never by guessing which anchors on the page happen to point
// at a matching URL.
export const languageSwitchSelector = "a[data-language-switch]";

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
