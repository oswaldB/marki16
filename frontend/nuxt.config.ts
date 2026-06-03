// frontend/nuxt.config.ts
export default defineNuxtConfig({
    ssr: false,
    devtools: { enabled: true },
    modules: ["@nuxt/ui", "@pinia/nuxt"],
    colorMode: {
        preference: "light",
        fallback: "light",
    },
    imports: {
        dirs: ["app/stores"],
    },
    css: ["~/assets/css/main.css", "@toast-ui/editor/dist/toastui-editor.css"],
    runtimeConfig: {
        public: {
            parseAppId: process.env.PARSE_APP_ID || "marki15-app",
            parseServerURL: process.env.PARSE_SERVER_URL || "/parse",
            parseJavaScriptKey: process.env.PARSE_JS_KEY || "",
            apiBaseUrl: process.env.API_BASE_URL || "",
        },
    },
    vite: {
        optimizeDeps: {
            include: ["@toast-ui/editor", "js-yaml"],
        },
        server: {
            // Proxy activé via Caddy : dev.markidiags.com/api → localhost:1556
            allowedHosts: ["dev.markidiags.com"],
        },
    },
});
