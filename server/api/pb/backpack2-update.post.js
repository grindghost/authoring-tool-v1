// server/api/pb/backpack2-update.post.js
import { readBody } from 'h3';
import { pb } from '~/server/plugins/pocketbase-unit';

export default defineEventHandler(async (event) => {
  const { actor, exceptionValue } = await readBody(event);

  if (!actor || actor === 'N/A') {
    throw createError({ 
      statusCode: 400, 
      message: 'Invalid actor value' 
    });
  }

  try {
    // Decode actor to extract mbox and name
    const decodedActor = decodeURIComponent(actor);
    const decryptedActor = atob(decodedActor);
    
    let mbox = 'mailto:unknown@example.com';
    let name = 'Unknown User';
    
    try {
      const parsedActor = JSON.parse(decryptedActor);
      ({ mbox, name } = parsedActor);
      mbox = mbox || 'mailto:unknown@example.com';
      name = name || 'Unknown User';
    } catch (error) {
      console.warn('Invalid actor encoding, using default values.');
    }

    // Check if record exists
    let Backpack2;
    try {
      Backpack2 = await pb.collection('Backpacks2').getFirstListItem(`actor = '${actor}'`);
      
      // Update the exception field
      Backpack2 = await pb.collection('Backpacks2').update(Backpack2.id, {
        exception: exceptionValue || 0
      });
      
      console.log('Updated Backpacks2 record:', Backpack2.id);
      return { 
        success: true, 
        message: 'Backpack2 record updated',
        record: Backpack2 
      };
    } catch (notFoundError) {
      // Record doesn't exist, create it
      Backpack2 = await pb.collection('Backpacks2').create({
        actor: actor,
        name: name,
        mbox: mbox,
        exception: exceptionValue || 0
      });
      
      console.log('Created new Backpacks2 record:', Backpack2.id);
      return { 
        success: true, 
        message: 'Backpack2 record created',
        record: Backpack2 
      };
    }
  } catch (error) {
    console.error('Error in backpack2-update endpoint:', error);
    throw createError({ 
      statusCode: 500, 
      message: 'Failed to update Backpack2 record' 
    });
  }
});

