// frontend/nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
  ],
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
  imports: {
    dirs: ['app/stores'],
  },
  css: ['~/assets/css/main.css', '@toast-ui/editor/dist/toastui-editor.css'],
  runtimeConfig: {
    public: {
      parseAppId: process.env.PARSE_APP_ID || 'marki15-app-id',
      parseServerURL: process.env.PARSE_SERVER_URL || 'https://dev.api.markidiags.com:8444/parse',
      parseJavaScriptKey: process.env.PARSE_JS_KEY || '',
    }
  },
  vite: {
    optimizeDeps: {
      include: ['@toast-ui/editor'],
    },
    server: {
      proxy: {
        '/api': {
          target: 'https://dev.api.markidiags.com:8444',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  },
})