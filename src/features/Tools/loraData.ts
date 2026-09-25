/** LoRA details and the user's LoRA lists, shared by the LoRA tools and the command palette. */
import { $, webuiOption } from '@/scripts/webui';

import { type Arch, type LoraInfo, getLoras, getModel, userdata } from './api';

let loraPromise: Promise<Map<string, LoraInfo>> | undefined;

export const loadLoras = (force = false) => {
  if (!loraPromise || force) {
    loraPromise = getLoras().then((list) => new Map(list.map((item) => [item.name, item])));
  }
  return loraPromise;
};

export interface LoraLists {
  favorites: string[];
  recent: string[];
  weights: Record<string, number>;
}

let lists: LoraLists | undefined;
let listsPromise: Promise<LoraLists> | undefined;

export const loadLoraLists = () => {
  listsPromise ||= Promise.all([
    userdata.get<string[]>('loraFavorites', []),
    userdata.get<string[]>('loraRecent', []),
    userdata.get<Record<string, number>>('loraWeights', {}),
  ]).then(([favorites, recent, weights]) => {
    lists = {
      favorites: Array.isArray(favorites) ? favorites : [],
      recent: Array.isArray(recent) ? recent : [],
      weights: weights && typeof weights === 'object' ? weights : {},
    };
    return lists;
  });
  return listsPromise;
};

const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const saveLater = (key: string, value: unknown) => {
  clearTimeout(saveTimers[key]);
  saveTimers[key] = setTimeout(() => {
    userdata.set(key, value).catch(() => undefined);
  }, 400);
};

// Updates apply to the loaded lists at once (the UI re-reads them right
// away), and reach the server a moment later.
export const toggleFavorite = async(name: string) => {
  const l = lists || (await loadLoraLists());
  l.favorites = l.favorites.includes(name) ? l.favorites.filter((item) => item !== name) : [...l.favorites, name];
  saveLater('loraFavorites', l.favorites);
  return l.favorites.includes(name);
};

export const pushRecent = async(name: string) => {
  const l = lists || (await loadLoraLists());
  l.recent = [name, ...l.recent.filter((item) => item !== name)].slice(0, 40);
  saveLater('loraRecent', l.recent);
};

export const setWeight = (name: string, weight: number | undefined) => {
  if (!lists) return;
  const l = lists;
  if (weight === undefined) delete l.weights[name];
  else l.weights[name] = weight;
  saveLater('loraWeights', l.weights);
};

export const defaultWeight = () => Number(webuiOption('extra_networks_default_multiplier', 1)) || 1;

export const weightOf = (name: string) => lists?.weights[name] ?? defaultWeight();

export const formatWeight = (weight: number) => String(Math.round(weight * 100) / 100);

export const ARCH_LABEL: Record<Arch, string> = {
  flux: 'FLUX',
  sd1: 'SD1',
  sd2: 'SD2',
  sd3: 'SD3',
  sdxl: 'XL',
  unknown: '',
};

/** Model family of what is loaded now (Forge's UI preset first, then the server). */
export const currentArch = async(): Promise<Arch | 'sd'> => {
  const preset =
    $<HTMLInputElement>('#forge_ui_preset input[type=radio]:checked')?.value ||
    $<HTMLInputElement>('#forge_ui_preset input:not([type=radio])')?.value ||
    '';
  const value = preset.trim().toLowerCase();
  if (value === 'sd') return 'sd';
  if (value === 'xl') return 'sdxl';
  if (value === 'flux') return 'flux';
  const model = await getModel();
  return model.arch;
};

export const isCompatible = (lora: Arch | undefined, model: Arch | 'sd') => {
  if (!lora || lora === 'unknown' || model === 'unknown') return true;
  if (model === 'sd') return lora === 'sd1' || lora === 'sd2';
  return lora === model;
};

/** The alias the WebUI writes into the prompt for a card (from its click handler). */
export const cardAlias = (card: Element) => {
  const handler = card.getAttribute('onclick') || '';
  const match = handler.match(/<lora:(.*?):["']\s*\+/);
  return match ? match[1] : undefined;
};

const escapeRegExp = (text: string) => text.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');

/** The tag for a LoRA in a prompt, if present. */
export const loraTagPattern = (alias: string) => new RegExp(`<lora:${escapeRegExp(alias)}:([^>:]*)((?::[^>]*)?)>`, 'g');
