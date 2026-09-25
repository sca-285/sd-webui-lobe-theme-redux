/**
 * Where the theme's static assets (favicons, logo, web fonts) come from.
 *
 * They ship with the extension (assets/, served at /lobe/assets/), so the
 * theme looks the same without internet access. Anything not bundled, and
 * everything when "Local assets" is off, comes from the npm CDN as before.
 */
import { genCdnUrl } from '@lobehub/ui';

import { DEFAULT_SETTING, SETTING_KEY, useAppStore } from '@/store';

interface CdnParameters {
  path: string;
  pkg: string;
  version?: string;
}

type Resolver = (_path: string) => string | undefined;

const LOCAL: Record<string, Resolver> = {
  '@lobehub/assets-favicons': (path) => `/lobe/assets/favicons/${path.replace(/^assets\//, '')}`,
  '@lobehub/assets-logo': (path) => (path === 'assets/logo-3d.webp' ? '/lobe/assets/logo/logo-3d.webp' : undefined),
  '@lobehub/webfont-harmony-sans': (path) =>
    path === 'css/index.css' ? '/lobe/assets/fonts/harmony-sans/css/index.css' : undefined,
  '@lobehub/webfont-mono': (path) => (path === 'css/index.css' ? '/lobe/assets/fonts/mono/css/index.css' : undefined),
};

const readStoredSetting = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTING_KEY) || 'null');
  } catch {
    return null;
  }
};

export const preferLocalAssets = () => {
  const state = useAppStore.getState();
  if (!state.loading) return state.setting.localAssets ?? DEFAULT_SETTING.localAssets;
  // before the server setting arrives: last known choice
  return readStoredSetting()?.localAssets ?? DEFAULT_SETTING.localAssets;
};

export const cdnUrl = ({ pkg, version, path }: CdnParameters) => {
  if (preferLocalAssets()) {
    const local = LOCAL[pkg]?.(path);
    if (local) return local;
  }
  return genCdnUrl({ path, pkg, proxy: 'aliyun', version });
};

/**
 * Web fonts for the ThemeProvider: the Latin UI font and the monospace font
 * (bundled), plus the large CJK font from the CDN only for Chinese/Japanese
 * UIs. KaTeX styles are not needed by the theme.
 */
export const webfonts = (language: string) => {
  const fonts = [
    cdnUrl({ path: 'css/index.css', pkg: '@lobehub/webfont-mono', version: '1.0.0' }),
    cdnUrl({ path: 'css/index.css', pkg: '@lobehub/webfont-harmony-sans', version: '1.0.0' }),
  ];
  if (/^(zh|ja)/.test(language)) {
    fonts.push(cdnUrl({ path: 'css/index.css', pkg: '@lobehub/webfont-harmony-sans-sc', version: '1.0.0' }));
  }
  return fonts;
};
