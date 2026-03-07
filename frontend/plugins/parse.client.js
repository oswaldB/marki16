// frontend/plugins/parse.client.js
import { defineNuxtPlugin } from '#app';
import Parse from 'parse/dist/parse.min.js';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  
  // Initialiser Parse uniquement côté client
  if (process.client) {
    Parse.initialize(
      config.public.parseAppId,
      config.public.parseJavaScriptKey
    );
    Parse.serverURL = config.public.parseServerURL;
    
    console.log('Parse initialized with:', {
      appId: config.public.parseAppId,
      serverURL: config.public.parseServerURL
    });
  }
  
  // Exposer Parse à l'application
  nuxtApp.provide('parse', Parse);
});