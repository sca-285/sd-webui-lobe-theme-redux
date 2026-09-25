/**
 * Parameter presets: named sets of generation parameters (sampler, steps,
 * CFG, size, hires fix, ...) without prompts, applied through the WebUI's own
 * "read generation parameters" logic so every field is set the way pasting a
 * PNG's parameters would set it.
 */
import {
  $,
  type GenTab,
  joinParameters,
  numberInput,
  parseInfotext,
  parseParameterLine,
  pasteParameters,
  readDropdown,
  readNumber,
  setInputValue,
} from '@/scripts/webui';

import { userdata } from './api';
import { bus } from './bus';

export interface Preset {
  batchCount?: number;
  batchSize?: number;
  created: number;
  id: string;
  name: string;
  parameters: string;
  tab: GenTab;
}

const KEY = 'presets';
/** Parameters that describe a particular image or model rather than a way of generating. */
const DROP = new Set([
  'Model hash',
  'Model',
  'Version',
  'Lora hashes',
  'TI hashes',
  'Hashes',
  'VAE hash',
  'VAE',
  'Variation seed',
  'Variation seed strength',
  'Seed resize from',
  'Size-1',
  'Size-2',
  'Batch size',
  'Batch pos',
  'Module 1',
  'Module 2',
  'Module 3',
]);

let cache: Preset[] | undefined;

export const loadPresets = async(force = false): Promise<Preset[]> => {
  if (cache && !force) return cache;
  const list = await userdata.get<Preset[]>(KEY, []);
  cache = Array.isArray(list) ? list : [];
  return cache;
};

export const savePresets = async(list: Preset[]) => {
  cache = list;
  await userdata.set(KEY, list);
  bus.emit('presets:changed');
};

const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const visible = (id: string) => {
  const element = $(`#${id}`);
  return Boolean(element && element.offsetParent !== null);
};

const hiresEnabled = () => {
  const box =
    $<HTMLInputElement>('#txt2img_hr-visible-checkbox') ||
    $<HTMLInputElement>('#txt2img_hr input[type=checkbox]') ||
    $<HTMLInputElement>('#txt2img_enable_hr input[type=checkbox]');
  return Boolean(box?.checked);
};

/** The parameters currently set in a generation tab, as an infotext parameter line. */
export const readCurrentParameters = (tab: GenTab, { includeSeed = false } = {}) => {
  const width = readNumber(`${tab}_width`);
  const height = readNumber(`${tab}_height`);
  const pairs: [string, string | number | undefined][] = [
    ['Steps', readNumber(`${tab}_steps`)],
    ['Sampler', readDropdown(`${tab}_sampling`)],
    ['Schedule type', readDropdown(`${tab}_scheduler`)],
    ['CFG scale', readNumber(`${tab}_cfg_scale`)],
  ];
  if (visible(`${tab}_distilled_cfg_scale`)) {
    pairs.push(['Distilled CFG Scale', readNumber(`${tab}_distilled_cfg_scale`)]);
  }
  if (includeSeed) pairs.push(['Seed', readNumber(`${tab}_seed`)]);
  if (width && height) pairs.push(['Size', `${width}x${height}`]);
  if (tab === 'img2img') {
    pairs.push(['Denoising strength', readNumber('img2img_denoising_strength')]);
  } else if (hiresEnabled()) {
    pairs.push(
      ['Denoising strength', readNumber('txt2img_denoising_strength')],
      ['Hires upscale', readNumber('txt2img_hr_scale')],
      ['Hires steps', readNumber('txt2img_hires_steps')],
      ['Hires upscaler', readDropdown('txt2img_hr_upscaler')],
    );
  }
  return {
    batchCount: readNumber(`${tab}_batch_count`),
    batchSize: readNumber(`${tab}_batch_size`),
    parameters: joinParameters(pairs),
  };
};

const quote = (value: string) => (/[",:]/.test(value) && !value.startsWith('"') ? JSON.stringify(value) : value);

/** A preset's parameter line from a full infotext (e.g. a history entry). */
export const parametersFromInfotext = (infotext: string, { includeSeed = false } = {}) => {
  const { parameters } = parseInfotext(infotext);
  return joinParameters(
    parameters
      .filter(([key]) => !DROP.has(key) && (includeSeed || key !== 'Seed'))
      .map(([key, value]) => [key, quote(value)]),
  );
};

export const createPreset = async(preset: Omit<Preset, 'id' | 'created'>) => {
  const list = await loadPresets();
  const entry: Preset = { ...preset, created: Date.now(), id: newId() };
  await savePresets([...list, entry]);
  return entry;
};

export const updatePreset = async(id: string, patch: Partial<Preset>) => {
  const list = await loadPresets();
  await savePresets(list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
};

export const deletePreset = async(id: string) => {
  const list = await loadPresets();
  await savePresets(list.filter((item) => item.id !== id));
};

export const movePreset = async(id: string, direction: -1 | 1) => {
  const list = [...(await loadPresets())];
  const index = list.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  await savePresets(list);
};

export const applyPreset = async(preset: Preset, tab: GenTab) => {
  const ok = await pasteParameters(tab, preset.parameters, { keepPrompts: true });
  if (preset.batchCount) setInputValue(numberInput(`${tab}_batch_count`), String(preset.batchCount));
  if (preset.batchSize) setInputValue(numberInput(`${tab}_batch_size`), String(preset.batchSize));
  return ok;
};

/** Short "key value" pairs for showing a preset. */
export const presetSummary = (preset: Preset) => {
  const pairs = new Map(parseParameterLine(preset.parameters));
  const chips: string[] = [];
  const add = (key: string, label = key) => {
    const value = pairs.get(key);
    if (value) chips.push(label ? `${label} ${value}` : value);
  };
  add('Sampler', '');
  add('Schedule type', '');
  add('Steps');
  add('CFG scale', 'CFG');
  add('Distilled CFG Scale', 'DCFG');
  add('Size', '');
  if (pairs.has('Hires upscale')) chips.push(`Hires ×${pairs.get('Hires upscale')}`);
  else if (pairs.has('Denoising strength')) chips.push(`Denoise ${pairs.get('Denoising strength')}`);
  add('Seed');
  if (preset.batchCount && preset.batchCount > 1) chips.push(`×${preset.batchCount}`);
  if (preset.batchSize && preset.batchSize > 1) chips.push(`batch ${preset.batchSize}`);
  return chips;
};
