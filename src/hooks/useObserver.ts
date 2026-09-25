import { useEffect, useState } from 'react';

const observerOptions = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
};

export const useObserver = (
  selector: string,
  { subSelector, valueProp = 'innerHTML' }: { subSelector?: string; valueProp?: string } = {},
) => {
  const [value, setValue] = useState<string>('');
  useEffect(() => {
    // One read per batch of mutations (a generation can queue hundreds), and
    // no crash when the watched element is briefly empty.
    const read = () => {
      const container = gradioApp().querySelector(selector);
      const info = subSelector ? container?.querySelector(subSelector) : container;
      if (info) setValue(String((info as any)[valueProp] ?? ''));
    };
    const observer = new MutationObserver((mutationsList) => {
      if (mutationsList.some((m) => m.type === 'childList' || m.type === 'characterData')) read();
    });

    const infoContainer = gradioApp().querySelector(selector);

    if (infoContainer) {
      observer.observe(infoContainer, observerOptions);
      read();
    }

    return () => {
      observer.disconnect();
    };
  }, [selector, subSelector, valueProp]);

  return String(value);
};
