import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { api } from './api/index.js';

async function bootstrap() {
  // Initialize Shopify App Bridge as early as possible so Shopify can handle
  // embedded-app redirects (forceRedirect, top-level navigation, etc.)
  try {
    const params = new URLSearchParams(window.location.search);
    const hostFromUrl = params.get('host');
    const shopFromUrl = params.get('shop');

    if (hostFromUrl && shopFromUrl) {
      const config = await api.getAppBridgeConfig();
      if (config.apiKey) {
        // host is already base64-encoded by Shopify in the URL query param
        const { default: createApp } = await import('@shopify/app-bridge');
        const app = createApp({
          apiKey: config.apiKey,
          host: hostFromUrl,
          forceRedirect: true,
        });
        // Expose globally so other parts of the app can use App Bridge (e.g. redirect)
        window.__SHOPIFY_APP__ = app;
      }
    }
  } catch (e) {
    console.warn('[App Bridge] Initialization skipped:', e.message);
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
}

bootstrap();
