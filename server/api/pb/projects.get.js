import { pb } from '~/server/plugins/pocketbase' // Import Pocketbase instance

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'UserId'); // Get userId from request header
  console.log(`User ID: ${userId} detected`);

  try {
    // Fetch the user record to check if the user is an admin
    const user = await pb.collection('nuxtauth_users').getOne(userId);

    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }

    console.log(`User record fetched: ${JSON.stringify(user)}`);

    // Check if the user is an admin
    const isAdmin = userId === process.env.ADMIN_USER_ID;

    if (isAdmin) {
      // Admin: Return all projects with expanded user data
      const allProjects = await pb.collection('Projects').getFullList(200, {
        expand: 'author',
      });
      return allProjects;
    } else {
      // Non-admin: Return only projects corresponding to the user's ID
      const userProjects = await pb.collection('Projects').getFullList(200, {
        filter: `author.id="${userId}"`, // Filter projects by the userId field in the related author record
        expand: 'author', // Expand the author field to include the full user record
      });
      return userProjects;
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to fetch projects' });
  }
});
