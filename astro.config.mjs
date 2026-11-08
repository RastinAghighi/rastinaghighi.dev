// @ts-check
import { defineConfig } from 'astro/config';

// Local development only.
//
// The chat page calls the relative URL /api/chat/v1. During `astro dev`,
// Vite's development proxy forwards that path, unchanged, to the local Python
// chat origin (Mascot-Lab: `python -m mascot_lab.local_origin`, which listens
// on http://127.0.0.1:8765). There is no production proxy, gateway, adapter
// or deployment configuration here: a static build contains no backend.

// Development-only pages: the chat test page and the black-hole experiment.
// They live in src/dev-pages/, outside src/pages/, so `astro build` never
// sees them and the production dist/ contains neither the pages nor their
// assets. Under `astro dev` they are served at their usual URLs.
/** @type {import('astro').AstroIntegration} */
const devOnlyPages = {
  name: 'dev-only-pages',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/chat-test', entrypoint: './src/dev-pages/chat-test.astro' });
      injectRoute({
        pattern: '/experiments/black-hole-motion',
        entrypoint: './src/dev-pages/experiments/black-hole-motion.astro',
      });
    },
  },
};

export default defineConfig({
  integrations: [devOnlyPages],
  server: {
    // The Python origin accepts browser requests only from
    // http://127.0.0.1:4321 and http://localhost:4321.
    host: '127.0.0.1',
    port: 4321,
  },
  vite: {
    server: {
      // Fail instead of moving to another port, which the origin would refuse.
      strictPort: true,
      proxy: {
        // The complete request path is forwarded; there is no rewrite.
        '/api/chat/v1': {
          target: 'http://127.0.0.1:8765',
          // Sets Host to 127.0.0.1:8765, which the origin requires. The
          // browser's Origin header (http://127.0.0.1:4321) is passed through.
          changeOrigin: true,
        },
      },
    },
  },
});
