// server/api/projects/update-course-ids.post.js

import { pb } from '~/server/plugins/pocketbase';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {

    try {
      const { projects } = await readBody(event);
      console.log(projects)
      // Validate data
      if (!projects || !Array.isArray(projects) || projects.length === 0) {
        return createError({
          statusCode: 400,
          statusMessage: 'Invalid data format'
        });
      }
      
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
      
      // Assuming you have a database service or ORM
      const updatedProjects = [];
      
      // Process each project update
      for (const project of projects) {
        // Check if the user has permission to update this project

        // Check if the user is the author of the project
        if (project.author !== userId) {
            throw createError({ statusCode: 403, message: 'Unauthorized to edit this project' })
        }
            
        // Update the project with the new profile data
        const updatedProject = await pb.collection('Projects').update(project.id, {
            profile: {
                ...project.profile,
                courseId: project.profile.courseId,
            }
        })
        
        updatedProjects.push(updatedProject);
      }
      
      return {
        success: true,
        message: 'Projects updated successfully',
        updatedProjects
      };
    } catch (error) {
      console.error('Error updating projects:', error);
      return createError({
        statusCode: 500,
        statusMessage: 'Failed to update projects'
      });
    }
  });
  
  // This function would connect to your actual database
  // Replace with your actual database logic
  async function updateProjectInDatabase(projectId, updateData) {
    // Example implementation:
    // return await db.projects.update({
    //   where: { id: projectId },
    //   data: updateData
    // });
    
    // Mock implementation for this example
    return {
      id: projectId,
      ...updateData
    };
  }