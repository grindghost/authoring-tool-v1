import { getCookie, setCookie, readBody } from 'h3';
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase-unit';
import { encryptContent, decryptContent, validateOrCreateUser } from '~/server/utils/services';
import sanitizeHtml from 'sanitize-html'; 

export default defineEventHandler(async (event) => {
  const backpackId = getCookie(event, 'backpackId');
  console.log('🍪 Cookie backpackId for that user:', backpackId);
  const { token, data, date, timeElapsed, registration } = await readBody(event);

  console.log('Token received from the query:', token);

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
    
    // Encrypt the answer
    const encryptedAnswer = await encryptContent(sanitizedData);

    // Step 4: Get the latest record or create a new one
    const existingRecords = await pb.collection('history').getList(1, 1, {
      filter: `backpackId = '${decryptedbackpackId}' && courseId = '${projectId}' && activityId = '${activityId}'`,
      sort: '-date', // Sort by date (newest first)
    });

    const timestamp = new Date().toISOString();
    const historicEvent = {
      backpackId: decryptedbackpackId,
      courseId: projectId,  
      activityId: activityId, 
      answer: encryptedAnswer,
      date: timestamp,
      timeElapsed: timeElapsed || 0,
      project: [relatedProject.id],
      registration: registration,
    };

    if (existingRecords.items.length > 0) {
      // Update the latest record
      const latestRecord = existingRecords.items[0];
      await pb.collection('history').update(latestRecord.id, historicEvent);
    } else {
      // Create a new record if none exists
      await pb.collection('history').create(historicEvent);
    }

    return { message: 'Data saved successfully' };
  } catch (error) {
    console.error('Error in /answer endpoint:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to save the answer' });
  }
});