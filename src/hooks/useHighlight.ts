import { useMemo } from 'react';

import { codeToHtml } from '@/modules/PromptHighlight/features/tokenize';

/**
 * Highlighted HTML for a prompt. Synchronous: the tokenizer runs in well
 * under a millisecond for a typical prompt, so there is no loading state and
 * no flash of unhighlighted text on each keystroke.
 */
export const useHighlight = (text: string, isDarkMode: boolean) => {
  const data = useMemo(() => {
    try {
      return codeToHtml(text ?? '', isDarkMode);
    } catch {
      return text;
    }
  }, [text, isDarkMode]);
  return { data, isLoading: false };
};
