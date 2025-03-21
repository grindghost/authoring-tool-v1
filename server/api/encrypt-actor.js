import { encryptContent } from '~/server/utils/services';

export default defineEventHandler(async (event) => {
  try {
    // Get the request body using 'event' directly
    const body = await readBody(event);
    console.log('Request body:', body);

    // Check if actor is present in the request body
    const { actor } = body;
    if (!actor) {
      console.error('Actor not found in the request body');
      return { statusCode: 400, message: 'Actor is required' };
    }
    // Decode the actor (assuming it's base64 encoded)
    let decodedActor;
    try {
      decodedActor = JSON.parse(atob(actor)); // Decode from base64 and then parse
    } catch (error) {
      console.error('Error decoding actor:', error);
      return { statusCode: 400, message: 'Invalid actor encoding' };
    }

    // Encrypt the actor object with your secret key
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      console.error('Secret key is missing');
      return { statusCode: 500, message: 'Server secret key is not configured' };
    }

    const encryptedActor = await encryptContent(JSON.stringify(decodedActor));

    // Return the encrypted token
    return { token: encryptedActor };
  } catch (error) {
    console.error('Error in encrypting actor:', error);
    return { statusCode: 500, message: 'Encryption failed' };
  }
});
