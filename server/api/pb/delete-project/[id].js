// server/api/delete-project/[id].js

import { pb } from '~/server/plugins/pocketbase'; // Import Pocketbase instance

export default defineEventHandler(async (event) => {
  const { id } = event.context.params; // Extract the project ID from the route parameters
  const userId = getHeader(event, 'UserId'); // Get userId from the request header

  try {
    // Fetch the existing project to ensure the user is authorized to delete it
    const project = await pb.collection('Projects').getOne(id);

    // Check if the user is the author of the project
    // if (project.profile?.author !== userId) {
    //   throw createError({ statusCode: 403, message: 'Unauthorized to delete this project' });
    // }

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

    // Find the file associated with this project in the Files collection
    const fileRecords = await pb.collection('Files').getFullList({
      filter: `projectId="${id}"`,
    });

    // Delete the file record(s) if they exist
    for (const fileRecord of fileRecords) {
      await pb.collection('Files').delete(fileRecord.id);
      console.log(`File ${fileRecord.id} associated with project ${id} deleted successfully.`);
    }

    // Delete the project
    await pb.collection('Projects').delete(id);

    console.log(`Project ${id} deleted successfully.`);
    return { success: true, message: `Project ${id} deleted successfully.` };
  } catch (error) {
    console.error('Error deleting project:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to delete project' });
  }
});
