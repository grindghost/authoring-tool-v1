import { readBody } from 'h3';
import { pb } from '~/server/plugins/pocketbase-unit';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  // Get the authenticated user's session
  const authSession = await getServerSession(event);

  if (!authSession) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Check if the user is subscribed to a plan
  if (!authSession.user.isSubscribed) {
    throw createError({
      statusCode: 403,
      message: 'User is not subscribed to a plan',
    });
  }

  const { recordIds, newRegistration } = await readBody(event);

  if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
    throw createError({ statusCode: 400, message: 'No record IDs provided' });
  }

  if (!newRegistration) {
    throw createError({ statusCode: 400, message: 'No registration value provided' });
  }

  try {
    const results = {
      success: [],
      failed: []
    };

    // Update each record
    for (const recordId of recordIds) {
      try {
        await pb.collection('history').update(recordId, {
          registration: newRegistration
        });
        results.success.push(recordId);
      } catch (error) {
        console.error(`Failed to update record ${recordId}:`, error);
        results.failed.push({ recordId, error: error.message });
      }
    }

    return { 
      message: `Successfully updated ${results.success.length} of ${recordIds.length} records`,
      results
    };
  } catch (error) {
    console.error('Error in batch update registration endpoint:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to update registration' });
  }
});

