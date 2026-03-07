// frontend/nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
  ],
  imports: {
    dirs: ['stores'],
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      parseAppId: process.env.PARSE_APP_ID || 'marki15-app-id',
      parseServerURL: process.env.PARSE_SERVER_URL || 'http://localhost:1555/parse',
      parseJavaScriptKey: process.env.PARSE_JS_KEY || '',
    }
  },
  // Configuration du proxy pour éviter les problèmes CORS
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:1555',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  },
})