import {
  colorScales,
  neutralColors as nc,
  primaryColors as ps,
  neutralColorScales,
} from '@lobehub/ui';

import { type ColorScale, isHexColor, neutralScale, neutralSwatch, normalizeHex, primaryScale } from '@/styles/colorScale';
import { kitchenNeutral, kitchenPrimary } from '@/styles/kitchenColors';

/** Primary presets added to lobe-ui's twelve (name -> the colour itself). */
const EXTRA_PRIMARY: Record<string, string> = {
  amber: '#f59e0b',
  bronze: '#b45309',
  coral: '#ff7a59',
  crimson: '#e11d48',
  emerald: '#10b981',
  forest: '#15803d',
  fuchsia: '#d946ef',
  indigo: '#6366f1',
  lavender: '#a78bfa',
  mint: '#34d399',
  ocean: '#0284c7',
  peach: '#fb923c',
  pink: '#f472b6',
  rose: '#fb7185',
  ruby: '#be123c',
  sky: '#38bdf8',
  steel: '#4f7cac',
  sunflower: '#facc15',
  teal: '#14b8a6',
  turquoise: '#22d3ee',
  violet: '#8b5cf6',
  white: '#e5e7eb',
  wine: '#9f1239',
};

/** Neutral presets added to lobe-ui's five (name -> the tint). */
const EXTRA_NEUTRAL: Record<string, string> = {
  cool: '#6b7280',
  forest: '#5f7a66',
  graphite: '#737373',
  mocha: '#7d6a58',
  navy: '#5b6b8c',
  ocean: '#557a86',
  plum: '#7a6386',
  rose: '#86666f',
  stone: '#78716c',
  zinc: '#71717a',
};

export const primaryColors: Record<string, string> = {
  kitchen: kitchenPrimary.dark.colorPrimary,
  ...ps,
  ...EXTRA_PRIMARY,
};

export const neutralColors: Record<string, string> = {
  kitchen: kitchenNeutral.dark.colorNeutral,
  ...nc,
  ...Object.fromEntries(Object.entries(EXTRA_NEUTRAL).map(([name, tint]) => [name, neutralSwatch(tint)])),
};

const hue = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(normalizeHex(hex).slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d < 0.08) return 400;     // near-greys last
  if (max === r) return (((g - b) / d + 6) % 6) * 60;
  if (max === g) return ((b - r) / d + 2) * 60;
  return ((r - g) / d + 4) * 60;
};

/** Swatches in rainbow order, so similar colours sit together. */
export const primaryColorsSwatches = Object.values(primaryColors).sort((a, b) => hue(a) - hue(b));
export const neutralColorsSwatches = Object.values(neutralColors);

/** The setting value for a picked swatch: its preset name, or the colour itself. */
export const findCustomThemeName = (type: 'primary' | 'neutral', value?: string): string | undefined => {
  if (!value) return undefined;
  const map = type === 'primary' ? primaryColors : neutralColors;
  const found = Object.entries(map).find(([, color]) => color.toLowerCase() === value.toLowerCase());
  if (found) return found[0];
  return isHexColor(value) ? normalizeHex(value) : undefined;
};

/** The colour to show for a setting value (a preset name or a #hex). */
export const settingColor = (type: 'primary' | 'neutral', value?: string) => {
  if (!value) return undefined;
  if (isHexColor(value)) return type === 'primary' ? normalizeHex(value) : neutralSwatch(value);
  return (type === 'primary' ? primaryColors : neutralColors)[value];
};

/** The scale for a primary setting (not 'kitchen', which has its own tokens). */
export const primaryScaleFor = (value: string): ColorScale | undefined => {
  if ((colorScales as unknown as Record<string, ColorScale>)[value]) return (colorScales as unknown as Record<string, ColorScale>)[value];
  if (EXTRA_PRIMARY[value]) return primaryScale(EXTRA_PRIMARY[value]);
  if (isHexColor(value)) return primaryScale(value);
  return undefined;
};

export const neutralScaleFor = (value: string): ColorScale | undefined => {
  const lobe = neutralColorScales as unknown as Record<string, ColorScale>;
  if (lobe[value]) return lobe[value];
  if (EXTRA_NEUTRAL[value]) return neutralScale(EXTRA_NEUTRAL[value]);
  if (isHexColor(value)) return neutralScale(value);
  return undefined;
};

/** A preset name ('blue', 'kitchen', ...) or a colour picked freely ('#ff8800'). */
export type PrimaryColor = string;

export type NeutralColor = string;
