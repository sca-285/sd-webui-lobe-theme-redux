import { consola } from 'consola';
import type { StateCreator } from 'zustand/vanilla';

import { getLocaleOptions, getSetting, getVersion, postSetting } from './api';
import { DEFAULT_SETTING, type WebuiSetting } from './initialState';
import type { Store } from './store';

export const SETTING_KEY = 'SD-LOBE-SETTING';

/** A JSON value from localStorage, or undefined if missing or unreadable. */
const readLocal = (key: string) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined;
  }
};
export const FALLBACK_SETTING_KEY = 'SD-KITCHEN-SETTING';
export interface StoreAction {
  onInit: () => void;
  onLoadLocalOptions: () => void;
  onLoadSetting: () => void;
  onLoadVersion: () => void;
  onSetSetting: (setting: Partial<WebuiSetting>) => void;
  onSetThemeMode: (themeMode: 'light' | 'dark') => void;
  setCurrentTab: () => void;
}

export const createSettings: StateCreator<Store, [['zustand/devtools', never]], [], StoreAction> = (
  set,
  get,
) => ({
  onInit: async() => {
    set(() => ({ loading: true }), false, 'onInit');
    const { onLoadSetting, onLoadVersion, onLoadLocalOptions } = get();
    // Local requests in parallel; each one falls back to a default on failure,
    // so the theme always leaves its loading screen.
    await Promise.allSettled([onLoadLocalOptions(), onLoadVersion(), onLoadSetting()]);
    set(() => ({ loading: false }), false, 'onInit');
  },
  onLoadLocalOptions: async() => {
    const localeOptions = await getLocaleOptions();
    set(() => ({ localeOptions }), false, 'onLoadLocalOptions');
  },
  onLoadSetting: async() => {
    let themeSetting;
    const webuiSetting: any = await getSetting();

    if (webuiSetting) {
      consola.start('🤯 [setting] loaded webui setting');
      themeSetting = webuiSetting;
    }

    if (!themeSetting) {
      themeSetting = readLocal(SETTING_KEY);
      if (themeSetting) consola.info('🤯 [setting] loaded local setting');
    }

    if (!themeSetting) {
      themeSetting = readLocal(FALLBACK_SETTING_KEY);
      if (themeSetting) consola.info('🤯 [setting] loaded fallback local setting');
    }

    if (!themeSetting) {
      consola.info('🤯 [setting] loaded default setting');
      themeSetting = DEFAULT_SETTING;
    }

    const setting = { ...DEFAULT_SETTING, ...themeSetting };

    // Only write back when something changed (a new default, or a setting
    // recovered from localStorage), not on every page load.
    if (!webuiSetting || Object.keys(setting).some((key) => (webuiSetting as any)[key] !== (setting as any)[key])) {
      postSetting(setting);
    }
    set(() => ({ setting }), false, 'onLoadSetting');
    consola.success('🤯 [setting] loaded');
  },
  onLoadVersion: async() => {
    const version = await getVersion();
    set(() => ({ version }), false, 'onLoadVersion');
  },
  onSetSetting: async(setting) => {
    const oldSetting = get().setting;
    const newSetting = { ...oldSetting, ...setting };
    localStorage.setItem(SETTING_KEY, JSON.stringify(newSetting));
    await postSetting(newSetting);
    set(() => ({ setting: newSetting }), false, 'onSetSetting');
  },
  onSetThemeMode: (themeMode) => {
    set(() => ({ themeMode }), false, 'onSetThemeMode');
  },
  setCurrentTab: () => {
    const currentTab = get_uiCurrentTabContent()?.id;
    consola.info('🤯 [tab] onChange', currentTab);
    if (currentTab && currentTab !== get().currentTab) {
      set({ currentTab }, false, 'setCurrentTab');
    }
  },
});
