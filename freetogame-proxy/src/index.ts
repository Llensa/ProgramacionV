export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Manejo simple de preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // Evitar romper en "/" y "/favicon.ico"
    if (url.pathname === '/' || url.pathname === '/favicon.ico') {
      return new Response('FreeToGame Proxy OK', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Base oficial de la API de FreeToGame
    const base = 'https://www.freetogame.com/api';

    // Mapear /api/... de nuestro worker a /... de FreeToGame
    // ej: https://tu-worker/api/games -> https://www.freetogame.com/api/games
    const path = url.pathname.replace(/^\/api/, '');
    const query = url.search; // incluye ?...

    const targetUrl = `${base}${path}${query}`;

    // Cache de Cloudflare
    const cache = caches.default;
    const cacheKey = new Request(targetUrl, request);
    let response = await cache.match(cacheKey);

    if (!response) {
      // Petición real a FreeToGame
      const upstream = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Free2Play-Proxy/1.0' },
      });

      // Si no está ok, devolvemos error directo
      if (!upstream.ok) {
        return new Response(
          JSON.stringify({
            error: true,
            status: upstream.status,
            message: 'Error llamando a FreeToGame API',
          }),
          {
            status: upstream.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Intentar parsear JSON solo si el content-type lo indica
      const contentType = upstream.headers.get('content-type') || '';
      let data: unknown;

      if (contentType.includes('application/json')) {
        data = await upstream.json();
      } else {
        // Si FreeToGame algún día devolviera HTML u otra cosa, lo pasamos crudo
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: {
            'Content-Type': contentType || 'text/plain',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Paginación simple si la respuesta es un array
      const page = Number(url.searchParams.get('page') || 1);
      const pageSize = Number(url.searchParams.get('pageSize') || 24);
      let body: unknown = data;

      if (Array.isArray(data)) {
        const start = (page - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        body = {
          page,
          pageSize,
          total: data.length,
          items,
        };
      }

      response = new Response(JSON.stringify(body), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=60',
        },
      });

      // Guardar en caché en background
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  },
};
