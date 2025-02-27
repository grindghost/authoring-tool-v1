// server/api/proxy.js
export default defineEventHandler(async (event) => {
    // Get the request headers
    const headers = getRequestHeaders(event);
    const origin = headers.origin || '';
    const referer = headers.referer || '';
    
    // Add this near the top of the file
    const allowedOrigins = [
        process.env.PROXY_ALLOWED_ORIGIN_PRODUCTION,
        process.env.PROXY_ALLOWED_ORIGIN_DEV,
    ];
    
    // Then modify the origin check:
    const requestOrigin = origin !== '' ? origin : (referer ? new URL(referer).origin : '');
    const isAllowedOrigin = allowedOrigins.includes(requestOrigin);
    
    if (!isAllowedOrigin) {
        return new Response('Unauthorized: Access denied', { status: 403 });
    }
    
    // And use the actual requesting origin in the response headers:
    const responseOrigin = isAllowedOrigin ? requestOrigin : allowedOrigins[0];
    setResponseHeaders(event, {
    'Access-Control-Allow-Origin': responseOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
  
    // Handle OPTIONS preflight requests
    if (getMethod(event) === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }
  
    try {
      // Get the target URL from the query parameter
      const query = getQuery(event);
      const targetUrl = query.url;
      
      if (!targetUrl) {
        return new Response('Missing URL parameter', { status: 400 });
      }
      
      // Fetch the file from the target URL
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        return new Response(`Error fetching from target URL: ${response.status} ${response.statusText}`, { 
          status: response.status 
        });
      }
      
      // Get the response data
      const data = await response.arrayBuffer();
      
      // Return the data with appropriate headers
      return new Response(data, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="file.pdf"`,
          'Access-Control-Allow-Origin': responseOrigin,
          'Access-Control-Expose-Headers': 'Content-Disposition'
        }
      });
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response('Error fetching resource', { status: 500 });
    }
  });