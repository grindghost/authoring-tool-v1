// server/api/projects.get.js

import { pb } from '~/server/plugins/pocketbase' // Import Pocketbase instance
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  
   // Get userId from request header
  // const _userId = getHeader(event, 'UserId');

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

  // Access the current user's ID
  const userId = authSession?.user?.userId;
  console.log('');
  console.log(`Auth session: ${JSON.stringify(authSession)}`);
  console.log('');

  try {

    // Return only projects corresponding to the user's ID
    const userProjects = await pb.collection('Projects').getFullList(200, {
      filter: `author.id="${userId}"`, // Filter projects by the userId field in the related author record
      expand: 'author', // Expand the author field to include the full user record
      sort: 'created',
    });

    // Preprocess each record to filter expanded fields
    userProjects.forEach(record => {
      if (record.expand?.author) {
        const { name, email, id } = record.expand.author; // Extract only desired fields
        record.expand.author = { name, email, id }; // Replace the expanded author with filtered data
      }
    });

    return userProjects;


  } catch (error) {
    console.error('Error:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to fetch projects' });
  }
});
