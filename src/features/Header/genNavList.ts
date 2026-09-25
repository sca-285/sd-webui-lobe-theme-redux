import { consola } from 'consola';

const getNavTabs = (): HTMLDivElement[] =>
  Array.prototype.slice.call(
    gradioApp().querySelectorAll('#tabs > [id^="tab_"]') as NodeListOf<HTMLDivElement>,
  );
export const getNavButtons = (): HTMLButtonElement[] =>
  Array.prototype.slice.call(
    gradioApp().querySelectorAll(
      '#tabs > .tab-nav:first-of-type button',
    ) as NodeListOf<HTMLButtonElement>,
  );

export type NavGroup = 'generate' | 'tools' | 'extensions' | 'system';

export interface NavItem {
  group: NavGroup;
  id: string;
  index: number;
  label: string;
}

/** Tabs of the WebUI itself (A1111, Forge, reForge, Forge Classic); every other tab comes from an extension. */
const BUILT_IN: Record<string, NavGroup> = {
  tab_extensions: 'system',
  tab_extras: 'generate',
  tab_img2img: 'generate',
  tab_modelmerger: 'tools',
  tab_pnginfo: 'tools',
  tab_settings: 'system',
  tab_space: 'generate',
  tab_svd: 'generate',
  tab_train: 'tools',
  tab_txt2img: 'generate',
  tab_z123: 'generate',
};

export const genNavList = (): NavItem[] => {
  const navList = getNavTabs();
  const buttons = getNavButtons();
  consola.debug('🤯 [nav] generate nav list');
  return buttons.flatMap((button, index) => {
    const id = navList[index]?.id;
    if (!id) return [];
    // the WebUI's own label ("txt2img", "PNG Info", an extension's name)
    const label = String(button.textContent || '').trim() || id.replace(/^tab_/, '');
    return [{ group: BUILT_IN[id] || 'extensions', id, index, label }];
  });
};

export const selectNavTab = (id: string) => {
  const item = genNavList().find((nav) => nav.id === id);
  if (item) getNavButtons()[item.index]?.click();
};
