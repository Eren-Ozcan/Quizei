import { JSDOM } from 'jsdom';

/**
 * Installs a DOM (plus the browser globals the app touches) onto globalThis so
 * the real UI modules can be driven from Node. Returns a teardown function.
 *
 * The app modules read `document` at call time rather than import time, so the
 * environment must be in place before the first render — not before the import.
 */
export function installDom(): () => void {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'https://domina.test/',
    pretendToBeVisual: true,
  });

  const { window } = dom;

  const store = new Map<string, string>();
  const localStorageStub = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };

  const globals: Record<string, unknown> = {
    window,
    document: window.document,
    navigator: window.navigator,
    localStorage: localStorageStub,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLButtonElement: window.HTMLButtonElement,
    Node: window.Node,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    DOMException: window.DOMException,
    requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: (id: number) => clearTimeout(id),
    confirm: () => true,
  };

  // jsdom leaves these unimplemented and logs a "Not implemented" error per call.
  window.scrollTo = () => {};
  Object.defineProperty(globalThis, 'scrollTo', { value: () => {}, configurable: true });

  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }

  return () => {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as Record<string, unknown>)[key];
    }
    window.close();
  };
}

/** Waits for queued rAF/timeout callbacks (reveal animations) to run. */
export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 5));
}

export function $(selector: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(selector);
}

export function $$(selector: string): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(selector)];
}

/** Clicks the first element matching the selector, failing loudly if absent. */
export function click(selector: string): void {
  const node = $(selector);
  if (!node) throw new Error(`click: nothing matches "${selector}"`);
  node.click();
}

export function textOf(selector: string): string {
  return $(selector)?.textContent?.trim() ?? '';
}

/** Finds a button (or any element) whose text contains the given string. */
export function byText(selector: string, text: string): HTMLElement {
  const node = $$(selector).find((n) => (n.textContent ?? '').includes(text));
  if (!node) throw new Error(`no "${selector}" containing "${text}"`);
  return node;
}
