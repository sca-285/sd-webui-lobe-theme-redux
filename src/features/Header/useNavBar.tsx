import { consola } from 'consola';
import { useCallback, useMemo } from 'react';

import { useSelectorHide } from '@/hooks/useSelectorHide';

import { type NavItem, genNavList, getNavButtons } from './genNavList';

export const useNavBar = (): { list: NavItem[]; onChange: (id: string) => void } => {
  const list = useMemo(() => {
    try {
      const items = genNavList();
      consola.success('🤯 [layout] inject - Header');
      return items;
    } catch (error) {
      consola.error('🤯 [layout] inject - Header', error);
      return [];
    }
  }, []);
  const onChange = useCallback(
    (id: string) => {
      consola.debug('🤯 [nav] onClick', id);
      const index = list.find((nav) => nav.id === id)?.index ?? 0;
      getNavButtons()[index]?.click();
    },
    [list],
  );
  useSelectorHide('#tabs > .tab-nav:first-of-type');
  return { list, onChange };
};
