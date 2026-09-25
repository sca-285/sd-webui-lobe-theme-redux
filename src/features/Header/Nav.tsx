import { Burger, TabsNav } from '@lobehub/ui';
import { useResponsive } from 'antd-style';
import { memo, useMemo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { selectors, useAppStore } from '@/store';

import TabLauncher from './TabLauncher';
import { useNavBar } from './useNavBar';
import { useNavPins } from './useNavPins';

/**
 * The header bar shows the pinned tabs (and the open one, if it is not
 * pinned); every tab, grouped and searchable, is in "All tabs", where a
 * tab can be pinned or unpinned.
 */
const Nav = memo(() => {
  const currentTab = useAppStore(selectors.currentTab);
  const { mobile } = useResponsive();
  const { list, onChange } = useNavBar();
  const { pins, toggle, reset } = useNavPins();
  const [opened, setOpened] = useState(false);

  const barItems = useMemo(
    () =>
      list
        .filter((item) => pins.includes(item.id) || item.id === currentTab)
        .map((item) => ({ key: item.id, label: item.label })),
    [list, pins, currentTab],
  );

  if (mobile) {
    return (
      <Burger
        items={list.map((item) => ({
          key: item.id,
          label: <div onClick={() => onChange(item.id)}>{item.label}</div>,
        }))}
        opened={opened}
        setOpened={setOpened}
      />
    );
  }

  const hiddenCount = list.filter((item) => !pins.includes(item.id)).length;

  return (
    <Flexbox align={'center'} gap={8} horizontal style={{ minWidth: 0 }}>
      <TabsNav activeKey={currentTab} items={barItems} onChange={onChange} style={{ minWidth: 0 }} />
      <TabLauncher
        activeKey={currentTab}
        hiddenCount={hiddenCount}
        items={list}
        onOpen={onChange}
        onReset={reset}
        onTogglePin={toggle}
        pins={pins}
      />
    </Flexbox>
  );
});

export default Nav;
