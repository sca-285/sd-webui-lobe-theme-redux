/**
 * Small, version-independent helpers for driving the WebUI from the theme.
 *
 * Everything here goes through what A1111, reForge, Forge and Forge Classic
 * all share - element ids, the `updateInput` helper, the paste-parameters
 * button - and was checked against Gradio 3.41 and 4.40 DOMs.
 */

export type GenTab = 'txt2img' | 'img2img';

const app = (): ParentNode => {
  try {
    return gradioApp();
  } catch {
    return document;
  }
};

export const $ = <T extends Element = HTMLElement>(selector: string) =>
  app().querySelector(selector) as T | null;

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** The generation tab in front, or the last one used. */
let lastGenTab: GenTab = 'txt2img';
export const currentGenTab = (): GenTab => {
  try {
    const id = get_uiCurrentTabContent()?.id || '';
    if (id === 'tab_img2img') lastGenTab = 'img2img';
    if (id === 'tab_txt2img') lastGenTab = 'txt2img';
  } catch {
    // not ready yet
  }
  return lastGenTab;
};

export const isGenTabVisible = () => {
  try {
    const id = get_uiCurrentTabContent()?.id || '';
    return id === 'tab_txt2img' || id === 'tab_img2img';
  } catch {
    return false;
  }
};

/** Set a textbox/number input the way the WebUI's own scripts do. */
export const setInputValue = (element: HTMLInputElement | HTMLTextAreaElement | null, value: string) => {
  if (!element) return false;
  element.value = value;
  try {
    updateInput(element);
  } catch {
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return true;
};

export const promptBox = (tab: GenTab) => $<HTMLTextAreaElement>(`#${tab}_prompt textarea`);
export const negativeBox = (tab: GenTab) => $<HTMLTextAreaElement>(`#${tab}_neg_prompt textarea`);

export const numberInput = (id: string) =>
  $<HTMLInputElement>(`#${id} input[type='number']`) || $<HTMLInputElement>(`#${id} input`);

export const readNumber = (id: string): number | undefined => {
  const value = numberInput(id)?.value;
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

/** The label shown in a single-select dropdown. */
export const readDropdown = (id: string): string | undefined => {
  const value = $<HTMLInputElement>(`#${id} input`)?.value;
  return value ? value.trim() : undefined;
};

const optionText = (li: Element) => (li.textContent || '').replace('✓', '').trim();

/**
 * Pick an entry in a Gradio dropdown by its label: open it, filter to the
 * label, press the matching option. Works on Gradio 3 and 4 (Gradio 4 puts a
 * "✓" in front of the selected option's text).
 */
export const setDropdown = async(id: string, label: string): Promise<boolean> => {
  const root = $(`#${id}`);
  const input = root?.querySelector('input') as HTMLInputElement | null;
  if (!root || !input) return false;
  input.focus();
  input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  input.value = label;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(120);
  const scope: ParentNode = root.querySelector('ul.options') ? root : document;
  const options = [...scope.querySelectorAll('ul.options li')];
  const option = options.find((li) => optionText(li) === label) ||
    options.find((li) => optionText(li).toLowerCase() === label.toLowerCase());
  if (!option) {
    input.blur();
    return false;
  }
  for (const type of ['mousedown', 'mouseup', 'click']) {
    option.dispatchEvent(new MouseEvent(type, { bubbles: true }));
  }
  await sleep(80);
  input.blur();
  return true;
};

/** The parameter line(s) of an infotext, without prompt and negative prompt. */
export const stripPrompts = (infotext: string) => {
  const lines = infotext.trim().split('\n');
  for (let index = lines.length - 1; index >= 0; index--) {
    if (/(^|,\s*)Steps:\s*\d/.test(lines[index])) return lines[index];
  }
  return lines.at(-1) || '';
};

/**
 * Apply infotext-style parameters through the WebUI's own "Read generation
 * parameters" button, so every field it knows (including extensions') is set
 * exactly as it would be from a PNG. `keepPrompts` keeps what is in the prompt
 * boxes now and applies only the parameters.
 */
export const pasteParameters = async(
  tab: GenTab,
  parameters: string,
  { keepPrompts = false }: { keepPrompts?: boolean } = {},
) => {
  const prompt = promptBox(tab);
  const button =
    $<HTMLButtonElement>(`#${tab}_toprow #paste`) ||
    $<HTMLButtonElement>(`#${tab}_tools #paste`) ||
    $<HTMLButtonElement>(`#${tab}_paste`);
  if (!prompt || !button) return false;
  let text = parameters.trim();
  if (keepPrompts) {
    const negative = negativeBox(tab)?.value || '';
    text = `${prompt.value}\n${negative ? `Negative prompt: ${negative}\n` : ''}${stripPrompts(parameters)}`;
  }
  setInputValue(prompt, text);
  await sleep(50);
  button.click();
  return true;
};


/** Split an infotext parameter line into ordered [key, value] pairs. */
export const parseParameterLine = (line: string): [string, string][] => {
  const pairs: [string, string][] = [];
  // the WebUI's own pattern (modules/infotext_utils.py, re_param_code)
  const re = /\s*(\w[\w /-]+):\s*("(?:\\.|[^"\\])+"|[^,]*)(?:,|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (!match[0]) break;
    pairs.push([match[1].trim(), match[2].trim()]);
    if (re.lastIndex >= line.length) break;
  }
  return pairs;
};

export const joinParameters = (pairs: [string, string | number | undefined][]) =>
  pairs
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

export const clickGenerate = (tab: GenTab = currentGenTab()) => $<HTMLButtonElement>(`#${tab}_generate`)?.click();
export const clickInterrupt = (tab: GenTab = currentGenTab()) => $<HTMLButtonElement>(`#${tab}_interrupt`)?.click();
export const clickSkip = (tab: GenTab = currentGenTab()) => $<HTMLButtonElement>(`#${tab}_skip`)?.click();

/** Go to a top-level WebUI tab by its element id (tab_txt2img, tab_settings, ...). */
export const selectTab = (tabId: string) => {
  const tabs = [...app().querySelectorAll('#tabs > [id^="tab_"], #tabs > .tabitem')] as HTMLElement[];
  const index = tabs.findIndex((tab) => tab.id === tabId);
  const buttons = [...app().querySelectorAll('#tabs > .tab-nav button, #tabs > div > .tab-nav button')] as HTMLButtonElement[];
  if (index >= 0 && buttons[index]) {
    buttons[index].click();
    return true;
  }
  return false;
};

/** Insert text at the end of a prompt, with a separating comma. */
export const appendToPrompt = (tab: GenTab, text: string) => {
  const box = promptBox(tab);
  if (!box) return false;
  const current = box.value.replace(/[\s,]+$/, '');
  return setInputValue(box, current ? `${current}, ${text}` : text);
};

export const copyText = async(text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
};

/** The WebUI's live `opts` object (it is replaced when settings are applied). */
export const webuiOpts = (): Record<string, any> | undefined => {
  try {
    return typeof opts === 'undefined' ? (window as any).opts : opts;
  } catch {
    return (window as any).opts;
  }
};

/** WebUI option value, if available. */
export const webuiOption = <T = unknown>(key: string, fallback: T): T => {
  try {
    const value = webuiOpts()?.[key];
    return value === undefined ? fallback : (value as T);
  } catch {
    return fallback;
  }
};

export interface ParsedInfotext {
  negative: string;
  parameters: [string, string][];
  parametersLine: string;
  prompt: string;
}

/** Prompt, negative prompt and parameters of an infotext (the WebUI's own rules). */
export const parseInfotext = (infotext: string): ParsedInfotext => {
  const lines = infotext.trim().split('\n');
  let parametersIndex = -1;
  for (let index = lines.length - 1; index >= 0; index--) {
    if (/(^|,\s*)Steps:\s*\d/.test(lines[index])) {
      parametersIndex = index;
      break;
    }
  }
  const parametersLine = parametersIndex >= 0 ? lines[parametersIndex] : '';
  const head = parametersIndex >= 0 ? lines.slice(0, parametersIndex) : lines;
  let prompt = '';
  let negative = '';
  let inNegative = false;
  for (const line of head) {
    if (line.startsWith('Negative prompt:')) {
      inNegative = true;
      negative = line.slice(16).trim();
    } else if (inNegative) {
      negative += `\n${line}`;
    } else {
      prompt += (prompt ? '\n' : '') + line;
    }
  }
  return {
    negative: negative.trim(),
    parameters: parseParameterLine(parametersLine),
    parametersLine,
    prompt: prompt.trim(),
  };
};

export const setPrompts = (tab: GenTab, prompt: string, negative?: string) => {
  setInputValue(promptBox(tab), prompt);
  if (negative !== undefined) setInputValue(negativeBox(tab), negative);
};

export const setSeed = (tab: GenTab, seed: string | number) => setInputValue(numberInput(`${tab}_seed`), String(seed));
