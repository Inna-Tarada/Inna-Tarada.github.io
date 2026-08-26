import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {copyFileSync, mkdirSync} from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// Three.js loads these files by URL at runtime, so Vite cannot discover them
// from the module graph. Copy only the assets used by main_s_v2.js.
const copyThreeRuntimeAssets = () => ({
  name: 'copy-three-runtime-assets',
  closeBundle() {
    const runtimeAssets = [
      '3DM/DoricBuilding.glb',
      '3DM/PhotoFrameEmpty.glb',
      'images/textures/whiteSkyBox.jpg',
      'images/textures/inna1.png',
      'images/textures/ScreenMenu.png',
    ];

    runtimeAssets.forEach((asset) => {
      const destination = path.resolve(__dirname, 'docs', asset);
      mkdirSync(path.dirname(destination), {recursive: true});
      copyFileSync(path.resolve(__dirname, asset), destination);
    });
  },
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), copyThreeRuntimeAssets()],
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
    build: {
      outDir: 'docs',
    },
  };
});
