const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4545',
      changeOrigin: true,
      secure: false, // Set to false for HTTP (not HTTPS)
      logLevel: 'info',
      onProxyReq: (proxyReq, req, res) => {
        // Log proxy requests for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PROXY] ${req.method} ${req.url} -> http://localhost:4545${req.url}`);
        }
      },
      onError: (err, req, res) => {
        console.error('[PROXY ERROR]', err.message);
        res.status(500).json({ error: 'Proxy error', message: err.message });
      },
    })
  );
};

