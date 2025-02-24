// server/api/delete-project/[id].js

import { pb } from '~/server/plugins/pocketbase'; // Import Pocketbase instance
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
    const { id } = event.context.params; // Extract the project ID from the route 

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
      // Fetch the existing project to ensure the user is authorized to delete it
      const project = await pb.collection('Projects').getOne(id);

      // Check if the user is the author of the project
      if (project.author !== userId) {
        throw createError({ statusCode: 403, message: 'Unauthorized to delete this project' })
      }      

      // Find the file associated with this project in the Files collection
      // const fileRecords = await pb.collection('Files').getFullList({
      //   filter: `projectId="${id}"`,
      // });

      // // Delete the file record(s) if they exist
      // for (const fileRecord of fileRecords) {
      //   await pb.collection('Files').delete(fileRecord.id);
      //   console.log(`File ${fileRecord.id} associated with project ${id} deleted successfully.`);
      // }

      // Delete the project
      await pb.collection('Projects').delete(id);

      console.log(`Project ${id} deleted successfully.`);
      return { success: true, message: `Project ${id} deleted successfully.` };
    } catch (error) {
      console.error('Error deleting project:', error.message);
      throw createError({ statusCode: 500, message: 'Failed to delete project' });
    }
});
