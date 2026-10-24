export function createElementLookup(owner: string) {
  return function requireElement<T extends Element>(
    root: ParentNode,
    selector: string,
  ): T {
    const element = root.querySelector<T>(selector);
    if (!element) {
      throw new Error(`${owner} is missing ${selector}.`);
    }
    return element;
  };
}
