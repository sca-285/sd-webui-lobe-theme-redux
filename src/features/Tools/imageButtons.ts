/**
 * The row of image buttons (open folder, save, zip, send to img2img / inpaint /
 * extras...) moved from under the gallery to right under Generate /
 * Interrupt / Skip, where they are within reach whatever the gallery's height.
 * The row keeps its id, so the WebUI's handlers and the theme's Share button
 * work as before. It follows the Generate box when the split previewer moves it.
 */
import { $, type GenTab } from '@/scripts/webui';

const TABS: GenTab[] = ['txt2img', 'img2img'];

const CSS = `
.lobe-image-buttons-top { width: 100%; margin-top: 8px !important; flex-grow: 0 !important; }
.lobe-image-buttons-top button.gradio-button.tool, .lobe-image-buttons-top button.tool { flex: 1 1 0; min-width: 32px !important; }
`;

const place = (tab: GenTab) => {
  const generate = $(`#${tab}_generate_box`);
  const row = $(`#image_buttons_${tab}`);
  if (!generate || !row) return false;
  if (generate.nextElementSibling !== row) generate.after(row);
  row.classList.add('lobe-image-buttons-top');
  return true;
};

const run = () => TABS.map(place);

export const startImageButtons = () => {
  const style = document.createElement('style');
  style.id = 'lobe-image-buttons-style';
  style.textContent = CSS;
  document.head.append(style);
  run();
  // the split previewer moves the Generate box once the UI is up: follow it for a while
  let count = 0;
  const timer = setInterval(() => {
    run();
    if (++count > 30) clearInterval(timer);
  }, 500);
  return () => {
    clearInterval(timer);
    style.remove();
  };
};
