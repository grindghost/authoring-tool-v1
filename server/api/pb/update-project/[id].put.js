import { pb } from '~/server/plugins/pocketbase' // Import Pocketbase instance
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  const { id } = event.context.params // Extract the project ID from the route parameters
  // const userId = getHeader(event, 'UserId') // Get userId from the request header

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

  try {
    const body = await readBody(event) // Get the updated profile data from the request body

    // Fetch the existing project to ensure the user is authorized to modify it
    const project = await pb.collection('Projects').getOne(id);

    // Check if the user is the author of the project
    if (project.author !== userId) {
      throw createError({ statusCode: 403, message: 'Unauthorized to edit this project' })
    }

    // Update the project with the new profile data
    const updatedProject = await pb.collection('Projects').update(id, {
      profile: body.profile,
    })

    console.log(`Project ${id} updated successfully.`);
    return updatedProject;

  } catch (error) {
    console.error('Error updating project:', error.message)
    throw createError({ statusCode: 500, message: 'Failed to update project' })
  }
})
