import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
          globIgnores: ["**/node_modules/**/*", "sw.js", "workbox-*.js"]
        },
        manifest: {
          name: 'Colégio em Movimento',
          short_name: 'Movimento',
          description: 'Gestão Escolar Colégio em Movimento',
          theme_color: '#00236f',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: "https://cdn-icons-png.flaticon.com/512/2997/2997316.png",
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: "https://cdn-icons-png.flaticon.com/512/2997/2997316.png",
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: "https://cdn-icons-png.flaticon.com/512/2997/2997316.png",
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (id.includes('framer-motion') || id.includes('motion')) {
                return 'vendor-motion';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
