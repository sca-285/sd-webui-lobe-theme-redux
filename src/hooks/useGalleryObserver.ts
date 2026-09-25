import { useEffect, useState } from 'react';

const observerOptions = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
};

export const useGalleryObserver = (selector: string) => {
  const [value, setValue] = useState<string>('');
  const [allValue, setAllValue] = useState<string[]>([]);
  useEffect(() => {
    const read = (container: Element) => {
      const info = container.querySelector('img[data-testid="detailed-image"]') as HTMLImageElement | null;
      const infos = Array.from(container.querySelectorAll('.thumbnails button img'))
        .filter(Boolean)
        .map((i: any) => i.src);
      setValue(info?.src || '');
      setAllValue(infos);
    };
    // One read per batch of mutations, and none of the old crash when the
    // gallery has no preview image yet.
    const observer = new MutationObserver((mutationsList) => {
      if (!mutationsList.some((m) => m.type === 'childList' || m.type === 'characterData')) return;
      const container = gradioApp().querySelector(selector);
      if (container) read(container);
    });

    const infoContainer = gradioApp().querySelector(selector);

    if (infoContainer) {
      observer.observe(infoContainer, observerOptions);
      read(infoContainer);
    }

    return () => {
      observer.disconnect();
    };
  }, [selector]);

  return {
    image: value,
    images: allValue,
  };
};
