type Child = Node | string | number | null | undefined | false;

interface ElAttrs {
  class?: string;
  id?: string;
  type?: string;
  href?: string;
  target?: string;
  rel?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  inputmode?: string;
  autocomplete?: string;
  maxlength?: number;
  min?: string;
  max?: string;
  step?: string;
  style?: string;
  title?: string;
  role?: string;
  'aria-label'?: string;
  'aria-live'?: string;
  'aria-pressed'?: string;
  'aria-valuenow'?: string;
  'aria-valuemin'?: string;
  'aria-valuemax'?: string;
  'data-key'?: string;
  onClick?: (ev: MouseEvent) => void;
  onInput?: (ev: Event) => void;
  onKeyDown?: (ev: KeyboardEvent) => void;
  onSubmit?: (ev: SubmitEvent) => void;
}

/** Tiny hyperscript. Keeps screens readable without pulling in a framework. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElAttrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;

    if (key === 'onClick') node.addEventListener('click', value as EventListener);
    else if (key === 'onInput') node.addEventListener('input', value as EventListener);
    else if (key === 'onKeyDown') node.addEventListener('keydown', value as EventListener);
    else if (key === 'onSubmit') node.addEventListener('submit', value as EventListener);
    else if (key === 'class') node.className = String(value);
    else if (key === 'disabled') node.toggleAttribute('disabled', Boolean(value));
    else node.setAttribute(key, String(value));
  }

  append(node, children);
  return node;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

export function clear(node: Element): void {
  node.replaceChildren();
}

export function button(label: Child, onClick: () => void, cls = 'btn'): HTMLButtonElement {
  return el('button', { class: cls, type: 'button', onClick }, label);
}

/** Runs after the next paint, so CSS transitions actually play. */
export function nextFrame(fn: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}
