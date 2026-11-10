import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { renderInvitation, renderMetadata } from './src/render.mjs';

const contentPath = fileURLToPath(new URL('./content/wedding.json', import.meta.url));

export default defineConfig({
  // Relative paths also work at https://username.github.io/repository/.
  base: './',
  build: { target: ['es2018', 'safari13', 'chrome80'], cssTarget: 'safari13' },
  plugins: [{
    name: 'wedding-content',
    configureServer(server) {
      server.watcher.add(contentPath);
      server.watcher.on('change', (path) => {
        if (path === contentPath) server.ws.send({ type: 'full-reload' });
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const content = JSON.parse(readFileSync(contentPath, 'utf8'));
        return html
          .replace('<!-- wedding:metadata -->', renderMetadata(content))
          .replace('<!-- wedding:invitation -->', renderInvitation(content));
      },
    },
  }],
});
