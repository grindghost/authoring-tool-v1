// server/api/encrypt-actor.js
import { encryptContent } from '~/server/utils/services';

export default defineEventHandler(async (event) => {
  // Get the request headers
  const headers = getRequestHeaders(event);
  const origin = headers.origin || '';
  const referer = headers.referer || '';
  
  // Define allowed origins
  const allowedOrigins = [
    'https://pr.cloudfront.brioeducation.ca',
    'https://www.monjournaldebord.ca',
    // Add other origins as needed
  ];
  
  // Determine the request origin
  const requestOrigin = origin !== '' ? origin : (referer ? new URL(referer).origin : '');
  const isAllowedOrigin = allowedOrigins.includes(requestOrigin);
  
  // Set response origin based on request
  const responseOrigin = isAllowedOrigin ? requestOrigin : allowedOrigins[0];
  
  // Handle OPTIONS preflight requests
  if (getMethod(event) === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    // Get the request body
    const body = await readBody(event);
    
    // Check if actor is present in the request body
    const { actor } = body;
    if (!actor) {
      return new Response(JSON.stringify({ message: 'Actor is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': responseOrigin
        }
      });
    }

    // Decode the actor
    let decodedActor;
    try {
      decodedActor = JSON.parse(atob(actor));
    } catch (error) {
      return new Response(JSON.stringify({ message: 'Invalid actor encoding' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': responseOrigin
        }
      });
    }

    // Encrypt the actor object
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      return new Response(JSON.stringify({ message: 'Server secret key is not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': responseOrigin
        }
      });
    }

    const encryptedActor = await encryptContent(JSON.stringify(decodedActor));

    // Return the encrypted token
    return new Response(JSON.stringify({ token: encryptedActor }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': responseOrigin
      }
    });
  } catch (error) {
    console.error('Error in encrypting actor:', error);
    return new Response(JSON.stringify({ message: 'Encryption failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': responseOrigin
      }
    });
  }
});