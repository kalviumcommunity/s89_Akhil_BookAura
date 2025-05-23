import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Base public path when served in production
    base: '/',

    // Server options
    server: {
      port: 5173,
      strictPort: false,
      cors: true,
      proxy: {
        // Proxy API requests to backend during development
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // Build options
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      // Use terser if available, otherwise fall back to esbuild
      minify: env.VITE_TERSER_INSTALLED ? 'terser' : 'esbuild',
      // Terser options (only used if terser is available)
      terserOptions: {
        compress: {
          drop_console: false, // Keep console logs for debugging
          passes: 1,
        },
        format: {
          comments: false,
        },
      },
      // esbuild options (used as fallback)
      esbuildOptions: {
        target: 'es2020',
        supported: {
          'top-level-await': true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react', 'framer-motion'],
          },
        },
      },
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    },
  }
})
