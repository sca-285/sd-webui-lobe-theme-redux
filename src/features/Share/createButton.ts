export const createButton = (type: string, setOpen: (open: boolean) => void): HTMLButtonElement => {
  const button = document.createElement('button');
  button.id = `lobe_share_${type}`;
  button.type = 'button';
  button.innerHTML = '💞';
  button.title = 'Share';
  button.className = 'lg secondary gradio-button tool svelte-cmf5ev';
  button.addEventListener('click', () => setOpen(true));
  return button;
};

/**
 * Give an injected button the classes of its neighbours. Gradio scopes button
 * styles with a per-version svelte class; copying it from a sibling tool
 * button keeps the injected one identical on Gradio 3 and 4.
 */
export const adoptButtonClass = (button: HTMLButtonElement | null, container: Element) => {
  if (!button) return;
  const sibling = container.querySelector('button.gradio-button.tool') as HTMLButtonElement | null;
  if (sibling) button.className = sibling.className.replace(/\bhidden\b/, '').trim();
};
