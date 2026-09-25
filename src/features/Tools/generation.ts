/**
 * After each txt2img/img2img job: read what it produced, keep it in the
 * history (with small thumbnails), and notify when the page is in the
 * background.
 */
import { type GenTab, parseInfotext } from '@/scripts/webui';

import { historyApi } from './api';
import { bus } from './bus';
import { makeThumb, resultSignature, waitForResult } from './results';

const GEN_TABS = new Set(['txt2img', 'img2img']);

export const startGenerationCapture = ({
  history,
  notify,
  notifyTitle,
}: {
  history: boolean;
  notify: boolean;
  notifyTitle: string;
}) => {
  const before = new Map<string, string>();

  const offStart = bus.on('gen:start', ({ id, tab }) => {
    if (GEN_TABS.has(tab)) before.set(id, resultSignature(tab));
  });

  const offEnd = bus.on('gen:end', async({ id, tab }) => {
    const signature = before.get(id);
    before.delete(id);
    if (signature === undefined) return;
    const result = await waitForResult(tab as GenTab, signature);
    if (!result) return;
    const thumbs: (string | undefined)[] = [];
    if (history) {
      for (const url of result.images) thumbs.push(await makeThumb(url));
    } else if (notify && result.images[0]) {
      thumbs.push(await makeThumb(result.images[0], 128));
    }
    if (history) {
      try {
        const entry = await historyApi.add({
          images: result.images.map((url, index) => ({ thumb: thumbs[index], url })),
          infotext: result.infotext,
          tab: result.tab,
          time: Date.now(),
        });
        bus.emit('history:added', entry);
      } catch (error) {
        console.error('[lobe] history', error);
      }
    }
    if (notify && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const { prompt } = parseInfotext(result.infotext);
        const notification = new Notification(notifyTitle, {
          body: prompt.length > 140 ? `${prompt.slice(0, 140)}…` : prompt,
          icon: thumbs[0],
          tag: 'lobe-generation',
        });
        notification.addEventListener('click', () => {
          window.focus();
          notification.close();
        });
      } catch {
        // some browsers only allow notifications from a service worker
      }
    }
  });

  return () => {
    offStart();
    offEnd();
  };
};
