import { themeConfig } from './promptTheme';
import { escapeHtml, tokenizeLine } from './tokenize-core';

export { tokenizeLine } from './tokenize-core';

interface ThemeColors {
  background?: string;
  foreground: string;
  scopes: Record<string, { fontStyle?: string; foreground?: string }>;
}

const themeCache: Record<'dark' | 'light', ThemeColors | undefined> = {
  dark: undefined,
  light: undefined,
};

const getTheme = (isDarkMode: boolean): ThemeColors => {
  const key = isDarkMode ? 'dark' : 'light';
  const cached = themeCache[key];
  if (cached) return cached;
  const config = themeConfig(isDarkMode);
  const scopes: ThemeColors['scopes'] = {};
  for (const token of config.tokenColors) {
    for (const scope of [token.scope].flat()) scopes[scope] = token.settings;
  }
  const theme = { foreground: config.colors['editor.foreground'], scopes };
  themeCache[key] = theme;
  return theme;
};

/** The prompt as highlighted HTML, in the shape Shiki produced. */
export const codeToHtml = (text: string, isDarkMode: boolean): string => {
  const theme = getTheme(isDarkMode);
  const lines = text.split(/\r\n|\r|\n/).map((line) => {
    // merge neighbours with the same colour, as Shiki does
    const merged: { style: string; text: string }[] = [];
    for (const [segmentText, scope] of tokenizeLine(line)) {
      const settings = scope ? theme.scopes[scope] : undefined;
      const color = settings?.foreground || theme.foreground;
      const style =
        `color:${color}` + (settings?.fontStyle === 'italic' ? ';font-style:italic' : '');
      const last = merged.at(-1);
      if (last && last.style === style) last.text += segmentText;
      else merged.push({ style, text: segmentText });
    }
    return `<span class="line">${merged
      .map((part) => `<span style="${part.style}">${escapeHtml(part.text)}</span>`)
      .join('')}</span>`;
  });
  return `<pre class="shiki ${isDarkMode ? 'dark' : 'light'}" style="color:${theme.foreground}" tabindex="0"><code id="lobe_highlighter">${lines.join('\n')}</code></pre>`;
};
