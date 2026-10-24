// Typed helpers for querying the DOM.
// `strict` mode would complain about "possibly null" everywhere, so each helper
// throws a clear error if the element is missing (that would mean index.html is out of sync).

export function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

export function on<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void
): void {
  element.addEventListener(event, handler);
}
