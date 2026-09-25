import { consola } from 'consola';
import { createRoot } from 'react-dom/client';

import Page from './app/page';

if (window.global === undefined) window.global = window;

// The dev server (vite, mounted at /dev) injects the source itself; the built
// bundle must then stay out of the way. Only the path counts: a host name that
// merely contains "dev" (http://devbox:7860) used to disable the theme.
const skipLoad =
  window.location.pathname.startsWith('/dev') && process.env.NODE_ENV === 'production';

const mount = () => {
  consola.start(`🤯 Lobe Theme Redux load in ${process.env.NODE_ENV}`);
  const root = document.createElement('div');
  root.setAttribute('id', 'root');
  try {
    gradioApp()?.append(root);
  } catch {
    document.querySelector('gradio-app')?.append(root);
  }
  const client = createRoot(root);
  client.render(<Page />);
};

if (!skipLoad) {
  // Loaded through a dynamic import (see entry.ts), so the document may
  // already be parsed by the time this runs.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}
