import react from '@vitejs/plugin-react-swc';
import { consola } from 'consola';
import dotenv from 'dotenv';
import { resolve } from 'node:path';
import * as process from 'node:process';
import { type Plugin, defineConfig } from 'vite';

dotenv.config();

/**
 * javascript/main.js: the file the WebUI loads. A classic script, not a
 * module, on purpose:
 * - the WebUI serves files by extension, and some hosts (reForge) do not
 *   force a JavaScript type for .mjs, so on Windows, where Python takes file
 *   types from the registry, a .mjs file can arrive as text/plain and a
 *   browser refuses to run it as a module. Every host forces the type of .js;
 * - the WebUI adds a cache-busting query to the scripts it includes. If that
 *   URL were a module other chunks import from, the browser would evaluate
 *   it twice (two Reacts). The loader imports the entry chunk by a query-less
 *   URL, which every other import uses too. Chunk names carry a content hash,
 *   so an update still bypasses the browser cache.
 */
const classicLoader = (): Plugin => ({
  generateBundle(_options, bundle) {
    const entry = Object.values(bundle).find((file) => file.type === 'chunk' && file.isEntry);
    if (!entry) throw new Error('no entry chunk');
    const source = `/* Lobe Theme Redux loader */
(function () {
  if (window.__LOBE_THEME_ENTRY__) return;
  window.__LOBE_THEME_ENTRY__ = true;
  var script = document.currentScript;
  var base = (script && script.src) || location.href;
  import(new URL(${JSON.stringify(entry.fileName)}, base).href).catch(function (error) {
    console.error('[Lobe Theme Redux] could not load', error);
  });
})();
`;
    this.emitFile({ fileName: 'main.js', source, type: 'asset' });
  },
  name: 'lobe-classic-loader',
});

const isProduction = process.env.NODE_ENV === 'production';

const SD_HOST = process.env.SD_HOST || '127.0.0.1';
const SD_PORT = process.env.SD_PORT || 7860;

consola.info('Proxy:', `http://${SD_HOST}:${SD_PORT}`);
export default defineConfig(({ command }) => ({
  // The dev server is mounted under /dev; the build must use relative URLs so
  // lazily loaded chunks resolve next to each other wherever the WebUI serves them.
  base: command === 'build' ? './' : '/dev',
  build: {
    cssMinify: true,
    emptyOutDir: true,
    minify: 'terser',
    // The application is built as ES modules in javascript/chunks/, which the
    // WebUI does not load by itself (it only loads files directly in
    // javascript/). The WebUI loads javascript/main.js, a small classic script
    // written by the plugin below, which imports the entry chunk.
    // As modules, the theme's code has its own scope: the old single-file
    // main.js leaked hundreds of minified globals (A, e, t, ce…) into window
    // and collided with other extensions' scripts.
    modulePreload: false,
    outDir: './javascript',
    rollupOptions: {
      input: { main: resolve(__dirname, 'src/main.tsx') },
      output: {
        assetFileNames: `chunks/[name]-[hash].[ext]`,
        chunkFileNames: `chunks/[name]-[hash].js`,
        entryFileNames: `chunks/[name]-[hash].js`,
        format: 'es',
      },
    },
    target: 'es2020',
  },
  define: {
    'process.env': process.env,
  },
  plugins: [
    react({ devTarget: 'esnext', tsDecorators: true }),

    isProduction && classicLoader(),

    !isProduction && {
      configureServer: (server) => {
        server.middlewares.use((_request, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
          res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-non');
          next();
        });
      },
      name: 'configure-response-headers',
    },
    !isProduction && {
      configureServer: (server) => {
        server.middlewares.use(async(_request, res, next): Promise<void> => {
          if (
            _request.originalUrl === '/dev' ||
            _request.originalUrl === '/dev?__theme=dark' ||
            _request.originalUrl === '/dev?__theme=light'
          ) {
            const response = await fetch(`http://${SD_HOST}:${SD_PORT}/`);

            let updatedResponse = await response.text();

            const toAdd = `
                        <script type="module" src="/dev/src/_react_refresh.js"></script>
                        <script type="module" src="/dev/src/main.tsx"></script>
                       `;
            updatedResponse = updatedResponse.replace('</body>', `</body>${toAdd}`);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('charset', 'utf8');
            res.end(updatedResponse);
            return;
          }
          next();
        });
      },
      name: 'route-default-to-index',
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 8000,
    proxy: {
      '/queue/join': {
        target: `ws://${SD_HOST}:${SD_PORT}`,
        ws: true,
      },
      '^(?!.*dev).*$': `http://${SD_HOST}:${SD_PORT}`,
    },
  },
}));
