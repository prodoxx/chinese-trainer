/**
 * Cloudflare Worker to add CORS headers to R2 bucket responses
 * Deploy this as a Worker and bind it to your R2 bucket custom domain
 * 
 * Setup:
 * 1. Create a new Worker in Cloudflare dashboard
 * 2. Paste this code
 * 3. Bind the Worker to your custom domain (static.danbing.ai)
 * 4. Add R2 bucket binding in Worker settings
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '3600',
        },
      });
    }

    try {
      // Get the object from R2
      const key = url.pathname.slice(1); // Remove leading slash
      const object = await env.MY_BUCKET.get(key);

      if (object === null) {
        return new Response('Object Not Found', { status: 404 });
      }

      // Create response with the object
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      
      // Add CORS headers
      headers.set('Access-Control-Allow-Origin', getAllowedOrigin(request));
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Type, ETag');
      
      // Cache for 1 hour
      headers.set('Cache-Control', 'public, max-age=3600');

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      return new Response('Error fetching object: ' + error.message, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
        }
      });
    }
  },
};

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://danbing.ai',
    /^https:\/\/.*\.danbing\.ai$/,
    /^https:\/\/.*\.vercel\.app$/
  ];

  // Check if origin matches any allowed origin
  for (const allowed of allowedOrigins) {
    if (allowed instanceof RegExp) {
      if (allowed.test(origin)) return origin;
    } else if (allowed === origin) {
      return origin;
    }
  }

  // Default to the main domain if no match
  return 'https://danbing.ai';
}