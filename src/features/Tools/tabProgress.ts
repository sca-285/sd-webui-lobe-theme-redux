/**
 * Generation progress where it can be seen from other tabs and windows: a
 * ring around the favicon while a job runs, a check mark on the favicon and
 * in the title when it finishes while the page is in the background.
 *
 * The WebUI already writes "[42% ETA: 3s]" into the title when its
 * "Show generation progress in window title" option is on; the theme only
 * adds it when that option is off.
 */
import { webuiOption } from '@/scripts/webui';

import { bus } from './bus';

const DONE_MARK = '✓ ';
const SIZE = 64;

interface IconLink {
  element: HTMLLinkElement;
  original: string;
}

export const startTabProgress = ({ color, doneColor }: { color: string; doneColor: string }) => {
  const running = new Map<string, number>();
  let doneUnseen = false;
  let links: IconLink[] = [];
  let base: HTMLImageElement | undefined;
  let lastDrawn = -1;

  const iconLinks = () =>
    [...document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="shortcut icon"]')];

  const loadBase = () => {
    const href = iconLinks().find((link) => /32x32|\.png/.test(link.href))?.href || iconLinks()[0]?.href;
    if (!href) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.addEventListener('load', () => {
      base = img;
    });
    img.src = href;
  };

  const draw = (progress: number | 'done') => {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const context = canvas.getContext('2d');
    if (!context) return;
    const center = SIZE / 2;
    const paintBase = (inset: number) => {
      if (!base) return;
      try {
        context.drawImage(base, inset, inset, SIZE - inset * 2, SIZE - inset * 2);
      } catch {
        // not drawable
      }
    };
    if (progress === 'done') {
      paintBase(0);
      context.beginPath();
      context.arc(SIZE - 17, SIZE - 17, 16, 0, Math.PI * 2);
      context.fillStyle = doneColor;
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = '#fff';
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(SIZE - 26, SIZE - 17);
      context.lineTo(SIZE - 19.5, SIZE - 10.5);
      context.lineTo(SIZE - 8, SIZE - 23);
      context.stroke();
    } else {
      paintBase(14);
      context.lineWidth = 8;
      context.beginPath();
      context.arc(center, center, center - 5, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(128,128,128,0.35)';
      context.stroke();
      context.beginPath();
      context.arc(center, center, center - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, progress));
      context.strokeStyle = color;
      context.lineCap = 'round';
      context.stroke();
    }
    let url: string;
    try {
      url = canvas.toDataURL('image/png');
    } catch {
      // a cross-origin icon without CORS taints the canvas: draw without it
      base = undefined;
      draw(progress);
      return;
    }
    if (links.length === 0) links = iconLinks().map((element) => ({ element, original: element.href }));
    for (const { element } of links) element.href = url;
  };

  const restoreIcon = () => {
    for (const { element, original } of links) element.href = original;
    links = [];
    lastDrawn = -1;
  };

  const stripMark = () => {
    if (document.title.startsWith(DONE_MARK)) document.title = document.title.slice(DONE_MARK.length);
  };

  const ownTitle = (progress?: number, eta?: number) => {
    // only when the WebUI does not put progress in the title itself
    if (webuiOption('show_progress_in_title', true)) return;
    const clean = document.title.replace(/^\[[^\]]*]\s*/, '');
    if (progress === undefined) {
      document.title = clean;
      return;
    }
    const eta_ = eta ? ` ETA: ${Math.round(eta)}s` : '';
    document.title = `[${Math.round(progress * 100)}%${eta_}] ${clean}`;
  };

  const overall = () => {
    const values = [...running.values()];
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const offStart = bus.on('gen:start', ({ id }) => {
    if (!base) loadBase();
    if (doneUnseen) {
      doneUnseen = false;
      stripMark();
    }
    running.set(id, 0);
    draw(0);
  });
  const offProgress = bus.on('gen:progress', ({ id, info }) => {
    if (!running.has(id)) return;
    running.set(id, info.progress);
    const value = overall();
    ownTitle(value, info.eta);
    // redraw only on visible change (whole percents)
    const step = Math.round(value * 100);
    if (step !== lastDrawn) {
      lastDrawn = step;
      draw(value);
    }
  });
  const offEnd = bus.on('gen:end', ({ id }) => {
    running.delete(id);
    if (running.size > 0) return;
    ownTitle();
    if (document.hidden) {
      doneUnseen = true;
      draw('done');
      if (!document.title.startsWith(DONE_MARK)) document.title = DONE_MARK + document.title;
    } else {
      restoreIcon();
    }
  });
  const onVisible = () => {
    if (document.hidden || !doneUnseen) return;
    doneUnseen = false;
    stripMark();
    if (running.size === 0) restoreIcon();
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onVisible);

  return () => {
    offStart();
    offProgress();
    offEnd();
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', onVisible);
    restoreIcon();
    stripMark();
  };
};
