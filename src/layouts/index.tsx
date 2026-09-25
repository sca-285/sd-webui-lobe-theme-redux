import {
  type DivProps,
  ThemeProvider,
  generateColorNeutralPalette,
  generateColorPalette,
} from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import qs from 'query-string';
import { memo, useCallback, useEffect } from 'react';

import { webfonts } from '@/app/assets';
import { neutralScaleFor, primaryScaleFor } from '@/features/Setting/data';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { selectors, useAppStore } from '@/store';
import { kitchenNeutral, kitchenPrimary } from '@/styles/kitchenColors';

const GlobalLayout = memo<DivProps>(({ children }) => {
  const { onSetThemeMode, themeMode } = useAppStore((st) => ({
    onInit: st.onInit,
    onSetThemeMode: st.onSetThemeMode,
    themeMode: st.themeMode,
  }));
  const setting = useAppStore(selectors.currentSetting, isEqual);
  const isDarkMode = useIsDarkMode();

  useEffect(() => {
    const queryTheme: any = String(qs.parseUrl(window.location.href).query.__theme || '');
    const mode = queryTheme === 'dark' || queryTheme === 'light' ? queryTheme : isDarkMode ? 'dark' : 'light';
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(mode);
    onSetThemeMode(mode);
  }, [isDarkMode]);

  const genCustomToken = useCallback(() => {
    let primaryTokens = {};
    let neutralTokens = {};
    if (setting.primaryColor) {
      if (setting.primaryColor === 'kitchen') {
        primaryTokens = kitchenPrimary[themeMode];
      } else {
        const scale = primaryScaleFor(setting.primaryColor);
        if (scale) primaryTokens = generateColorPalette({ appearance: themeMode, scale: scale as any, type: 'Primary' });
      }
    }
    if (setting.neutralColor) {
      if (setting.neutralColor === 'kitchen') {
        neutralTokens = kitchenNeutral[themeMode];
      } else {
        const scale = neutralScaleFor(setting.neutralColor);
        if (scale) neutralTokens = generateColorNeutralPalette({ appearance: themeMode, scale: scale as any });
      }
    }

    return { ...primaryTokens, ...neutralTokens };
  }, [setting.primaryColor, setting.neutralColor, themeMode]);

  return (
    setting && (
      <ThemeProvider
        customToken={genCustomToken}
        enableWebfonts={setting.enableWebFont}
        themeMode={themeMode}
        webfonts={webfonts(setting.i18n)}
      >
        {children}
      </ThemeProvider>
    )
  );
});

export default GlobalLayout;
