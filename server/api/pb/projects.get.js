// server/api/projects.get.js

import { pb } from '~/server/plugins/pocketbase'; // Import Pocketbase instance
import { getServerSession } from '#auth';
import rateLimit from "~/server/utils/rateLimit"; // Import manually

export default defineEventHandler(async (event) => {

  // Apply rate limiting here
  await rateLimit(event); 

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

  // Determine project limits based on the user's subscription plan
  const tierData = JSON.parse(process.env.NUXT_PUBLIC_TIERS);

  const planLimits = {
    [tierData.tier1.id]: tierData.tier1.limit,
    [tierData.tier2.id]: tierData.tier2.limit,
    [tierData.tier3.id]: tierData.tier3.limit,
    [tierData.tier4.id]: tierData.tier4.limit,
    [tierData.tier5.id]: tierData.tier5.limit,
    [tierData.tier6.id]: tierData.tier6.limit
  };
  const userPlan = authSession.user.plan;
  const projectLimit = planLimits[userPlan] || 0;

  // Validate the user's plan
  if (projectLimit === 0) {
    throw createError({
      statusCode: 403,
      message: 'Invalid subscription plan',
    });
  }

  try {
    // Fetch only the allowed number of projects corresponding to the user's ID
    const userProjects = await pb.collection('Projects').getList(1, projectLimit, {
      filter: `author.id="${authSession.user.userId}"`, // Filter projects by the userId field
      expand: 'author,locales', // Expand the author field to include the full user record
      sort: 'created',
    });


    // Iterate through projects and fetch history count for each
    for (let project of userProjects.items) {
      try {
        const historyRecords = await pb.collection('History').getList(1, 1, {
          filter: `courseId="${project.id}"`,
        });

        project.historyCount = historyRecords.totalItems; // Attach count to project
        console.log(`Fetched history count for project ${project.id}: ${project.historyCount}`);
      } catch (err) {
        console.error(`Error fetching history count for project ${project.id}:`, err.message);
        project.historyCount = 0; // Default to 0 if an error occurs
      }
    }
    
    // Preprocess each record to filter expanded fields
    const sanitizedProjects = userProjects.items.map((record) => {
      if (record.expand?.author) {
        const { name, email, id } = record.expand.author; // Extract only desired fields
        record.expand.author = { name, email, id }; // Replace the expanded author with filtered data
      }
      
      if (record.expand?.locales) { 
        // Iterate over the locales array, in the "dict" json field, get the "lang" key, and create a new json where the key is the lang value, and the value is the json object
        const localesdDict = {};

        for (let locale of record.expand.locales) {
          const { dict } = locale;
          const lang = dict.lang;
          localesdDict[lang] = dict;
        }
        record.expand.locales = localesdDict; // Replace the expanded locales with filtered data
      }

      return record;
    });


    // Define the response object that will hold the fetched data (sanitizedprojects, global configs and locales)
    let response = {}

    // Query the Configs collection to fetch the record with the name == to "global"
    const globalConfig = await pb.collection('Configs').getList(1, 1, {filter: `name="global"`});

    // Query the Locales collection and fetch all records
    const localeTemplates = await pb.collection('Locales').getFullList({
      filter: `template=true`,
      limit: 2 // Only get up to 2 records
    });

    // Add the fetched data to the response object
    response.projects = sanitizedProjects;
    response.configs = globalConfig.items[0];

    // Create a dictionary of locales where the key is the lang value and the value is the json object
    const localeTemplatesDict = {};
    for (let locale of localeTemplates) {
      localeTemplatesDict[locale.dict.lang] = locale.dict;
    }
    // Add the localeTemplatesDict to the response object
    response.locales = localeTemplatesDict;

    return response;

    // return sanitizedProjects;
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to fetch projects' });
  }
});
