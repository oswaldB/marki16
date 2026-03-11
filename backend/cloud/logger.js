// backend/cloud/logger.js
// Logger simple pour Parse Cloud Code

module.exports = {
  info: function(...args) {
    console.log('[' + new Date().toISOString() + '] INFO:', ...args);
  },
  
  error: function(...args) {
    console.error('[' + new Date().toISOString() + '] ERROR:', ...args);
  },
  
  debug: function(...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[' + new Date().toISOString() + '] DEBUG:', ...args);
    }
  }
};