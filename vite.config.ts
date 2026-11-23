import fs from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const certPath = 'C:/sistema-estoque-ti/certs/estoque-ti.pem';
const keyPath = 'C:/sistema-estoque-ti/certs/estoque-ti-key.pem';
const httpsConfig =
  fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
    : undefined;

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
};

const caPath = 'C:/sistema-estoque-ti/certs/rootCA.crt';

const httpToHttpsRedirectPlugin = {
  name: 'http-to-https-redirect',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url === '/certificado.crt' && fs.existsSync(caPath)) {
        res.setHeader('Content-Type', 'application/x-x509-ca-cert');
        res.setHeader('Content-Disposition', 'attachment; filename="certificado-estoque-ti.crt"');
        res.end(fs.readFileSync(caPath));
        return;
      }
      next();
    });
    server.httpServer?.on('tlsClientError', (_err: any, tlsSocket: any) => {
      const rawSocket = tlsSocket?._parent || tlsSocket;
      if (rawSocket && rawSocket.writable) {
        rawSocket.end(
          'HTTP/1.1 302 Found\r\n' +
            'Location: https://192.168.100.11:5173/\r\n' +
            'Connection: close\r\n\r\n',
        );
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), httpToHttpsRedirectPlugin],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: httpsConfig,
    headers: securityHeaders,
    proxy: apiProxy,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    https: httpsConfig,
    headers: securityHeaders,
    proxy: apiProxy,
  },
});
