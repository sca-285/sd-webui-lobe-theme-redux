/**
 * What a finished generation produced, read from the page the way the user
 * sees it: the infotext under the gallery and the gallery's images.
 */
import { $, type GenTab, sleep } from '@/scripts/webui';

export interface GenResult {
  images: string[];
  infotext: string;
  tab: GenTab;
}

const decode = (html: string) => {
  const area = document.createElement('textarea');
  area.innerHTML = html;
  return area.value;
};

/** The infotext shown under the gallery, as plain text with its line breaks. */
export const readInfotext = (tab: string): string => {
  const root = $(`#html_info_${tab}`);
  if (!root) return '';
  const element = root.querySelector('.infotext') || root.querySelector('p') || root;
  const html = element.innerHTML
    .replaceAll(/<br\s*\/?>\s*\n?/gi, '\n')
    .replaceAll(/<[^>]+>/g, '');
  return decode(html).trim();
};

/** Gallery image URLs, relative to this WebUI, in gallery order. */
export const readGalleryImages = (tab: string): string[] => {
  const gallery = $(`#${tab}_gallery`);
  if (!gallery) return [];
  const urls: string[] = [];
  for (const img of gallery.querySelectorAll('img')) {
    if (img.closest('.livePreview')) continue;
    const source = img.getAttribute('src') || '';
    if (!source || source.startsWith('data:') || source.startsWith('blob:')) continue;
    let url = source;
    try {
      const parsed = new URL(source, location.href);
      if (parsed.origin === location.origin) url = parsed.pathname.replace(/^\/+/, '/') + parsed.search;
      else url = parsed.href;
    } catch {
      // keep as is
    }
    if (!urls.includes(url)) urls.push(url);
  }
  return urls.slice(0, 16);
};

export const resultSignature = (tab: string) =>
  `${$(`#html_info_${tab}`)?.innerHTML.length || 0}|${readInfotext(tab)}|${readGalleryImages(tab).join('|')}`;

/**
 * Wait for the page to show the result of the job that just ended: the
 * progress poll ends before Gradio delivers the outputs, so poll until the
 * gallery/infotext differ from what they were when the job started and have
 * settled. Undefined if nothing new appears (error, interrupted before the
 * first image, another tab's job).
 */
export const waitForResult = async(tab: GenTab, before: string, timeout = 30_000): Promise<GenResult | undefined> => {
  const start = Date.now();
  let last = '';
  while (Date.now() - start < timeout) {
    await sleep(300);
    const now = resultSignature(tab);
    if (now === before) continue;
    if (now !== last) {
      last = now;
      continue;
    }
    const infotext = readInfotext(tab);
    if (!/(^|\n|,\s*)Steps:\s*\d/.test(infotext)) return undefined;
    return { images: readGalleryImages(tab), infotext, tab };
  }
  return undefined;
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = url;
  });

/** A small WebP (PNG where WebP encoding is unavailable) data URL of an image. */
export const makeThumb = async(url: string, size = 256): Promise<string | undefined> => {
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.imageSmoothingQuality = 'high';
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL('image/webp', 0.82);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
};
