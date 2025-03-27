// server/api/pb/delete-history-record/[id].delete.js
import { pb } from '~/server/plugins/pocketbase-unit'; // Import Pocketbase instance
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

  const recordId = event.context.params.id;

  if (!recordId) {
    throw createError({
      statusCode: 400,
      message: 'recordId is required',
    });
  }

  try {
    // Delete the record from the History collection
    await pb.collection('History').delete(recordId);

    return { success: true, message: 'Record deleted successfully' };
  } catch (error) {
    console.error('Error deleting history record:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to delete history record' });
  }
});
