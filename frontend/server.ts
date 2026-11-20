import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Web application health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    framework: 'Hono',
    frontend: 'React 18',
    backend_target: process.env.BACKEND_URL || 'http://localhost:5000',
    timestamp: new Date().toISOString(),
  });
});

// Proxy or forward API requests to NestJS Backend
app.all('/api/*', async (c) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const targetUrl = `${backendUrl}${c.req.path}${c.req.raw.url.includes('?') ? '?' + c.req.raw.url.split('?')[1] : ''}`;

  try {
    const headers = new Headers(c.req.raw.headers);
    headers.delete('host');

    const res = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : await c.req.raw.arrayBuffer(),
    });

    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  } catch (err: any) {
    return c.json(
      {
        error: 'Failed to communicate with NestJS backend API',
        message: err.message,
      },
      502,
    );
  }
});

// Serve frontend static assets in production
app.use('/*', serveStatic({ root: './dist' }));
app.get('*', serveStatic({ path: './dist/index.html' }));

const port = Number(process.env.PORT) || 3000;
console.log(`🌐 Hono Web Server running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });
