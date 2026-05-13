import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: "Colégio Horizonte 2026",
          short_name: "Horizonte",
          start_url: "/",
          display: "standalone",
          background_color: "#faf8ff",
          theme_color: "#00236f",
          description: "App pedagógico para gestão de turmas e ocorrências.",
          orientation: "portrait",
          icons: [
            {
              "src": "https://cdn-icons-png.flaticon.com/512/2997/2997315.png",
              "sizes": "512x512",
              "type": "image/png",
              "purpose": "any maskable"
            },
            {
              "src": "https://cdn-icons-png.flaticon.com/192/2997/2997315.png",
              "sizes": "192x192",
              "type": "image/png",
              "purpose": "any maskable"
            }
          ]
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
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
