/**
 * The theme's tools that are not tied to one panel: the progress hook, tab
 * progress, history capture, LoRA card tools, and the lazily loaded command
 * palette and history drawer.
 */
import { useTheme } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { Suspense, lazy, memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { selectors, useAppStore } from '@/store';

import { bus } from './bus';
import { startGenerationCapture } from './generation';
import { installProgressHook } from './hook';
import { startLoraTools } from './loraTools';
import { startTabProgress } from './tabProgress';

const CommandPalette = lazy(() => import('./CommandPalette'));
const HistoryDrawer = lazy(() => import('./HistoryDrawer'));

const isPaletteShortcut = (event: KeyboardEvent) =>
  (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k';

const Tools = memo(() => {
  const setting = useAppStore(selectors.currentSetting, isEqual);
  const theme = useTheme();
  const { t } = useTranslation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    if (installProgressHook()) return;
    // progressbar.js not run yet: try again once the UI is up
    onUiLoaded(() => installProgressHook());
  }, []);

  useEffect(() => {
    if (!setting.enableTabProgress) return;
    return startTabProgress({ color: theme.colorPrimary, doneColor: theme.colorSuccess });
  }, [setting.enableTabProgress]);

  useEffect(() => {
    if (!setting.enableHistory && !setting.enableNotification) return;
    return startGenerationCapture({
      history: setting.enableHistory,
      notify: setting.enableNotification,
      notifyTitle: t('tools.notify.done'),
    });
  }, [setting.enableHistory, setting.enableNotification]);

  useEffect(() => {
    if (!setting.enableLoraTools) return;
    return startLoraTools({
      colors: { fill: theme.colorFillTertiary, primary: theme.colorPrimary, primaryLight: theme.colorPrimaryTextHover },
      text: {
        all: t('tools.lora.all'),
        compatible: t('tools.lora.compatible'),
        favorite: t('tools.lora.favorite'),
        favorites: t('tools.lora.favorites'),
        recent: t('tools.lora.recent'),
        triggerWords: t('tools.lora.triggerWords'),
        weight: t('tools.lora.weight'),
      },
    });
  }, [setting.enableLoraTools]);

  useEffect(() => {
    const offPalette = bus.on('open:palette', () => {
      if (!setting.enableCommandPalette) return;
      setPaletteLoaded(true);
      setPaletteOpen(true);
    });
    const offHistory = bus.on('open:history', () => {
      if (!setting.enableHistory) return;
      setHistoryLoaded(true);
      setHistoryOpen(true);
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (!setting.enableCommandPalette || !isPaletteShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setPaletteLoaded(true);
      setPaletteOpen((value) => !value);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      offPalette();
      offHistory();
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [setting.enableCommandPalette, setting.enableHistory]);

  return (
    <>
      {paletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setPaletteOpen(false)} open={paletteOpen} />
        </Suspense>
      )}
      {historyLoaded && (
        <Suspense fallback={null}>
          <HistoryDrawer onClose={() => setHistoryOpen(false)} open={historyOpen} />
        </Suspense>
      )}
    </>
  );
});

export default Tools;
