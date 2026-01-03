const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4545',
      changeOrigin: true,
      secure: false, // Set to false for HTTP (not HTTPS)
      logLevel: 'debug',
    })
  );
};

