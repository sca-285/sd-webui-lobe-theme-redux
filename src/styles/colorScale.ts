/**
 * Colour scales for any colour, in the 13-step shape @lobehub/ui uses
 * (`colorScales` / `neutralColorScales`), so a preset added here or a colour
 * chosen with the picker goes through the same token generators as the
 * built-in ones.
 *
 * Primary: step 9 is the colour itself in both light and dark; lower steps
 * fade towards the page background (black in dark mode, white in light
 * mode), higher steps towards the text colour.
 *
 * Neutral: the lightness of each step follows lobe-ui's own neutral scales;
 * the colour only gives the greys their tint.
 */

export interface ColorScale {
  dark: string[];
  darkA: string[];
  light: string[];
  lightA: string[];
}

type RGB = [number, number, number];

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#([\da-f]{3}|[\da-f]{6})$/i.test(value.trim());

export const normalizeHex = (hex: string) => {
  let h = hex.trim().replace('#', '').toLowerCase();
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return `#${h}`;
};

const toRgb = (hex: string): RGB => {
  const h = normalizeHex(hex).slice(1);
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as RGB;
};

const toHex = ([r, g, b]: RGB) =>
  `#${[r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')}`;

const mix = (a: string, b: string, t: number) => {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as RGB);
};

const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 100) / 100})`;
};

const toHsl = (hex: string): [number, number, number] => {
  const [r, g, b] = toRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
};

const fromHsl = (h: number, s: number, l: number) => {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
};

// how far each step is from the background towards the colour (steps 0-8),
// then from the colour towards the text colour (steps 10-12)
const DARK_IN = [0.03, 0.13, 0.21, 0.3, 0.4, 0.51, 0.63, 0.76, 0.89];
const LIGHT_IN = [0, 0.04, 0.08, 0.13, 0.19, 0.26, 0.35, 0.48, 0.68];
const DARK_OUT = [0.35, 0.7, 1];
const LIGHT_OUT = [0.3, 0.65, 0.97];
const ALPHAS = [0.03, 0.15, 0.25, 0.35, 0.46, 0.58, 0.69, 0.8, 0.9];

export const primaryScale = (color: string): ColorScale => {
  const base = normalizeHex(color);
  const dark = [...DARK_IN.map((t) => mix('#000000', base, t)), base, ...DARK_OUT.map((t) => mix(base, '#ffffff', t))];
  const light = [...LIGHT_IN.map((t) => mix('#ffffff', base, t)), base, ...LIGHT_OUT.map((t) => mix(base, '#000000', t))];
  return {
    dark,
    darkA: [...ALPHAS.map((a) => rgba(base, a)), ...dark.slice(9)],
    light,
    lightA: [...ALPHAS.map((a) => rgba(base, a * 0.5)), ...light.slice(9)],
  };
};

// lightness of each step in lobe-ui's neutral scales (mauve, slate, ...)
const NEUTRAL_DARK_L = [0.11, 0.15, 0.19, 0.23, 0.27, 0.31, 0.36, 0.4, 0.45, 0.5, 0.73, 0.98, 1];
const NEUTRAL_LIGHT_L = [0.98, 0.92, 0.87, 0.82, 0.76, 0.7, 0.65, 0.6, 0.55, 0.5, 0.29, 0.11, 0.07];
const NEUTRAL_DARK_A = [0.12, 0.16, 0.2, 0.24, 0.29, 0.33, 0.38, 0.42, 0.47, 0.52, 0.74, 0.99, 1];
const NEUTRAL_LIGHT_A = [0.03, 0.09, 0.14, 0.2, 0.25, 0.31, 0.36, 0.41, 0.46, 0.51, 0.72, 0.9, 1];

export const neutralScale = (color: string): ColorScale => {
  const [h, s] = toHsl(normalizeHex(color));
  // greys stay greys: the tint is kept, its strength capped
  const sat = clamp(s, 0, 0.35);
  const grey = (l: number) => fromHsl(h, sat * (1 - Math.abs(l - 0.5)), l);
  const tintLight = fromHsl(h, sat, 0.96);
  const tintDark = fromHsl(h, sat, 0.06);
  return {
    dark: NEUTRAL_DARK_L.map(grey),
    darkA: NEUTRAL_DARK_A.map((a) => rgba(tintLight, a)),
    light: NEUTRAL_LIGHT_L.map(grey),
    lightA: NEUTRAL_LIGHT_A.map((a) => rgba(tintDark, a)),
  };
};

/** The swatch shown for a neutral colour: step 9 of its scale. */
export const neutralSwatch = (color: string) => neutralScale(color).dark[9];
