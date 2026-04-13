// frontend/plugins/parse.client.js
import { defineNuxtPlugin } from '#app';
import Parse from 'parse/dist/parse.min.js';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  
  // Initialiser Parse uniquement côté client
  if (process.client) {
    console.log('Runtime config:', config.public);
    
    // Vérifier l'app-id actuel avant initialisation
    console.log('Current Parse Application ID:', Parse.applicationId);
    console.log('Current Parse JavaScript Key:', Parse.javaScriptKey);
    
    // Forcer l'initialisation avec les bonnes valeurs
    const expectedAppId = config.public.parseAppId || 'marki15-app';
    const expectedJsKey = config.public.parseJavaScriptKey;
    const expectedServerURL = config.public.parseServerURL || 'https://dev.api.markidiags.com/parse';
    
    Parse.initialize(expectedAppId, expectedJsKey);
    Parse.serverURL = expectedServerURL;
    
    // Vérifier que l'initialisation a bien été appliquée
    console.log('Parse initialized with:', {
      appId: Parse.applicationId,
      jsKey: Parse.javaScriptKey,
      serverURL: Parse.serverURL
    });
    
    // Forcer la correction si l'app-id n'est pas celui attendu
    if (Parse.applicationId !== expectedAppId) {
      console.warn('⚠️ WARNING: Parse app-id mismatch detected! Forcing correction...');
      console.warn('Expected:', expectedAppId);
      console.warn('Actual:', Parse.applicationId);
      
      // Nettoyer le cache de Parse
      if (Parse.CoreManager) {
        Parse.CoreManager.set('APPLICATION_ID', expectedAppId);
        Parse.CoreManager.set('JAVASCRIPT_KEY', expectedJsKey);
        Parse.CoreManager.set('SERVER_URL', expectedServerURL);
      }
      
      // Réinitialiser Parse avec les bonnes valeurs
      Parse._initialize = Parse.initialize; // Sauvegarder la méthode originale
      Parse.initialize = function(appId, jsKey) {
        Parse._initialize(expectedAppId, expectedJsKey);
      };
      
      // Réappliquer la configuration
      Parse.initialize(expectedAppId, expectedJsKey);
      Parse.serverURL = expectedServerURL;
      
      // Nettoyer la session actuelle pour forcer une nouvelle authentification
      if (Parse.User.currentAsync) {
        Parse.User.logOut().then(() => {
          console.log('✅ Parse session cleared and reinitialized with correct app-id:', Parse.applicationId);
        });
      } else {
        console.log('✅ Parse reinitialized with correct app-id:', Parse.applicationId);
      }
    }
    
    // Désactiver le cache pour les requêtes Parse
    if (Parse.CoreManager && Parse.CoreManager.getRESTController) {
      const RESTController = Parse.CoreManager.getRESTController();
      if (RESTController && RESTController.request) {
        const originalRequest = RESTController.request;
        RESTController.request = function(...args) {
          // Ajouter un paramètre de cache-busting à toutes les requêtes
          if (args[0] && args[0].headers) {
            args[0].headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            args[0].headers['Pragma'] = 'no-cache';
            args[0].headers['Expires'] = '0';
          }
          return originalRequest.apply(this, args);
        };
      }
    }
  }
  
  // Exposer Parse à l'application
  nuxtApp.provide('parse', Parse);
});