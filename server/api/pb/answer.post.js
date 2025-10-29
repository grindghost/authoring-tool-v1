import { getCookie, setCookie, readBody } from 'h3';
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase-unit';
import { encryptContent, decryptContent, validateOrCreateUser } from '~/server/utils/services';
import sanitizeHtml from 'sanitize-html'; 

export default defineEventHandler(async (event) => {
  const backpackId = getCookie(event, 'backpackId');
  const { token, data, date, timeElapsed, registration, actor } = await readBody(event);

  await ensureAuthenticated("Save answer");

  try {
    // Step 1: Validate or create user...
    const { valid, backpackId: validBackpackId, decryptedbackpackId } = await validateOrCreateUser(pb, backpackId, event);

    if (!valid) {
      throw createError({ statusCode: 500, message: 'Unable to validate user' });
    }

    // Step 2: Update cookie if a new backpackId was created
    if (validBackpackId !== backpackId) {
      setCookie(event, 'backpackId', validBackpackId, {
        httpOnly: true,
        secure: true,
        sameSite: process.env.SAME_SITE,
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds (permanent)
      });
    }

    // Hotfix: Get reference to Backpacks2 record if it exists
    let Backpack2;
    if (actor) {
      try {
        Backpack2 = await pb.collection('Backpacks2').getFirstListItem(`actor = '${actor}'`);
        console.log('Found Backpacks2 record:', Backpack2.id, 'with exception:', Backpack2.exception);
      } catch (error) {
        // Record doesn't exist yet, that's okay - profile endpoint will create it
        console.log('No Backpacks2 record found for this actor yet');
      }
    }

    // Decrypt the token
    const decryptedPayload = await decryptContent(token);
    console.log('Decrypted payload:', decryptedPayload);
    const decryptedPayloadJson = JSON.parse(decryptedPayload);
    const { source, project, exercice } = decryptedPayloadJson;

    const projectId = project;
    const activityId = exercice;

    // Get the project from the `Projects` collection
    const relatedProject = await pb.collection('Projects').getFirstListItem(`id = '${projectId}'`);

    // Step 3: Sanitize and encrypt the content
    const sanitizedData = sanitizeHtml(data, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'br',
        'ul', 'ol', 'li', 'b', 'i', 'u', 'strike', 'em', 'strong', 's', 'div',
      ],
      allowedAttributes: {
        '*': ['class'],
        'li': ['data-list'],
      },
      allowedClasses: {
        'div': ['ql-code-block'],
      }
    });
    
    // Debug - 0ctober 28th 2025 :
    console.log('⚙️ Actor:', actor);
    console.log('🧹 Sanitized data:', sanitizedData);

    // Encrypt the answer
    const encryptedAnswer = await encryptContent(sanitizedData);

    // Step 4: Get the latest record or create a new one
    let existingRecords;
    
    // Check if we should use actor-based lookup
    if (Backpack2 && Backpack2.exception === 2) {
      console.log('Using actor-based history save/update (exception === 2)');
      existingRecords = await pb.collection('history').getList(1, 1, {
        filter: `actor = '${actor}' && courseId = '${projectId}' && activityId = '${activityId}'`,
        sort: '-date', // Sort by date (newest first)
      });
    } else {
      // Use the original backpackId-based lookup
      existingRecords = await pb.collection('history').getList(1, 1, {
        filter: `backpackId = '${decryptedbackpackId}' && courseId = '${projectId}' && activityId = '${activityId}'`,
        sort: '-date', // Sort by date (newest first)
      });
    }

    const timestamp = new Date().toISOString();

    if (existingRecords.items.length > 0) {
      // Update the latest record
      const latestRecord = existingRecords.items[0];
      
      // For exception === 2, preserve the existing backpackId
      if (Backpack2 && Backpack2.exception === 2) {
        const historicEventUpdate = {
          // Do NOT update backpackId - keep the existing one
          courseId: projectId,  
          activityId: activityId, 
          answer: encryptedAnswer,
          date: timestamp,
          timeElapsed: timeElapsed || 0,
          project: [relatedProject.id],
          registration: registration,
          actor: actor,
        };
        await pb.collection('history').update(latestRecord.id, historicEventUpdate);
      } else {
        // Normal update with backpackId
        const historicEvent = {
          backpackId: decryptedbackpackId,
          courseId: projectId,  
          activityId: activityId, 
          answer: encryptedAnswer,
          date: timestamp,
          timeElapsed: timeElapsed || 0,
          project: [relatedProject.id],
          registration: registration,
          actor: actor,
        };
        await pb.collection('history').update(latestRecord.id, historicEvent);
      }
    } else {
      // Create a new record if none exists
      const historicEvent = {
        backpackId: decryptedbackpackId,
        courseId: projectId,  
        activityId: activityId, 
        answer: encryptedAnswer,
        date: timestamp,
        timeElapsed: timeElapsed || 0,
        project: [relatedProject.id],
        registration: registration,
        actor: actor,
      };
      await pb.collection('history').create(historicEvent);
    }

    return { message: 'Data saved successfully' };
  } catch (error) {
    console.error('Error in /answer endpoint:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to save the answer' });
  }
});