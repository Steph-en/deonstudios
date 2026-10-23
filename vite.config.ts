import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function sitemapBuildPlugin(): Plugin {
  return {
    name: 'vite-plugin-generate-sitemap',
    apply: 'build',
    async closeBundle() {
      try {
        const { generateSitemap } = await import('./scripts/generate-sitemap');
        const { xml, projectCount, slugs } = await generateSitemap();
        const distDir = path.resolve(__dirname, 'dist');
        if (fs.existsSync(distDir)) {
          fs.writeFileSync(path.resolve(distDir, 'sitemap.xml'), xml, 'utf-8');
          console.log(`[vite] Output sitemap.xml to dist/sitemap.xml (${projectCount} projects: ${slugs.join(', ')})`);
        }
      } catch (err) {
        console.warn('[vite] Error generating sitemap during build:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sitemapBuildPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: false,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Ignore backend data, backups, and storage report files to prevent infinite reload loops
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: [
                '**/data/**',
                '**/backups/**',
                '**/.tmp*/**',
                '**/storage-*',
                '**/public/uploads/**',
                '**/*.log',
              ],
            },
    },
  };
});
