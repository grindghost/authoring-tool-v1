import { pb } from '~/server/plugins/pocketbase' // Import Pocketbase instance

export default defineEventHandler(async (event) => {
  const { id } = event.context.params // Extract the project ID from the route parameters
  const userId = getHeader(event, 'UserId') // Get userId from the request header

  try {
    const body = await readBody(event) // Get the updated profile data from the request body

    // Fetch the existing project to ensure the user is authorized to modify it
    const project = await pb.collection('Projects').getOne(id)

    // if (JSON.parse(project.profile?.author)['id'] !== userId) {
    //   throw createError({ statusCode: 403, message: 'Unauthorized to edit this project' })
    // }

    // Check if the user is an admin
    const isAdmin = userId === process.env.ADMIN_USER_ID; 

    if (!isAdmin) { 
      try {
        const author = JSON.parse(project.profile?.author);
        if (author['id'] !== userId) {
          throw createError({ statusCode: 403, message: 'Unauthorized to edit this project' });
        }
      } catch (error) {
        console.error('Invalid JSON in project profile author:', error);
        // Handle invalid JSON, e.g., by skipping or logging
        throw createError({ statusCode: 400, message: 'Invalid project data' });
      }
    }

    // Update the project with the new profile data
    const updatedProject = await pb.collection('Projects').update(id, {
      profile: body.profile,
      // author: userId,
    })

    console.log(`Project ${id} updated successfully.`)
    return updatedProject
  } catch (error) {
    console.error('Error updating project:', error.message)
    throw createError({ statusCode: 500, message: 'Failed to update project' })
  }
})
