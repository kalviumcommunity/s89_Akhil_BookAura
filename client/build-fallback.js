// This is a fallback build script in case the normal build process fails
// It uses esbuild instead of terser for minification

import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildProject() {
  console.log('Starting fallback build process...');
  
  try {
    // Build with esbuild minifier instead of terser
    await build({
      configFile: resolve(__dirname, 'vite.config.js'),
      mode: 'production',
      build: {
        minify: 'esbuild', // Use esbuild instead of terser
        outDir: 'dist',
        emptyOutDir: true,
      },
    });
    
    console.log('Fallback build completed successfully!');
  } catch (error) {
    console.error('Fallback build failed:', error);
    process.exit(1);
  }
}

buildProject();
