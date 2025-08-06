// server/api/pb/project-history.post.js
import { readBody } from 'h3';
import { pb } from '~/server/plugins/pocketbase-unit'; // Import Pocketbase instance
import { getServerSession } from '#auth';
import { decryptContent } from '~/server/utils/services';
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
  // Get the authenticated user's session
  const authSession = await getServerSession(event);

  if (!authSession) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  // Get the request body
  const body = JSON.parse(await readBody(event));

  const projectId = body.projectId;

  console.log('Fetching project history for projectId:', projectId);

  if (!projectId) {
    throw createError({
      statusCode: 400,
      message: 'projectId is required in the request body',
    });
  }

  try {
    // 1. Fetch the project record
    const projectRecord = await pb.collection('Projects').getOne(projectId);
    const projectActivities = projectRecord.profile.activities || {};

    // Fetch all history records related to the projectId
    const historyRecords = await pb.collection('History').getFullList({
      filter: `project="${projectId}"`,
      sort: 'created',
    });

    // Group history records by backpackId
    const historyByBackpack = {};
    for (const record of historyRecords) {
      const backpackId = record.backpackId;

      // 3. Add activity title to the record
      const activityId = record.activityId;
      const activity = projectActivities[activityId];
      record.activityTitle = activity ? activity.activityTitle : 'Unknown Activity';
      record.index = activity ? activity.index : 0;

      // Decrypt and sanitize the answer
      try {
        const decryptedContent = await decryptContent(record.answer);
        const sanitizedContent = sanitizeHtml(decryptedContent, {
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

        record.answer = sanitizedContent;
      } catch (error) {
        console.error(`Error decrypting or sanitizing answer for record ${record.id}:`, error.message);
        record.answer = "Error decrypting content";
      }

      if (!historyByBackpack[backpackId]) {
        historyByBackpack[backpackId] = [];
      }
      historyByBackpack[backpackId].push(record);
    }

    // Fetch backpack records based on the unique backpackIds
    const backpackIds = Object.keys(historyByBackpack);
    const backpackRecords = {};

    // Batch size (adjust as needed)
    const BATCH_SIZE = 20;

    if (backpackIds.length > 0) {
      for (let i = 0; i < backpackIds.length; i += BATCH_SIZE) {
        const batch = backpackIds.slice(i, i + BATCH_SIZE);
        const filter = batch.map(id => `token="${id}"`).join(' || ');
        const backpacks = await pb.collection('Backpacks').getFullList({
          filter: filter
        });

        for (const backpack of backpacks) {
          backpackRecords[backpack.token] = backpack;
        }
      }
    }

    // Sort history records by activity index
    for (const backpackId in historyByBackpack) {
      historyByBackpack[backpackId].sort((a, b) => a.index - b.index);
    }

    // Combine history and backpack data
    const combinedData = {
      historyByBackpack,
      backpackRecords,
    };

    console.log('Combined data:', combinedData);

    return combinedData;
  } catch (error) {
    console.error('Error fetching project history:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to fetch project history' });
  }
});
