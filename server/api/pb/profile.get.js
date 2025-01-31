// server/api/pb/profile.get.js

import { getCookie, setCookie, createError } from 'h3';
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase-unit';
import { validateOrCreateUser, decryptContent } from '~/server/utils/authPB';
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
  const backpackId = getCookie(event, 'backpackId');
  const token = getQuery(event).token;
  const lang = getQuery(event).lang;

  // Ensure authentication on pocketbase
  await ensureAuthenticated("Get answer");

  const UnitProfile = { message: null };

  try {
    // Check PocketBase availability
    let globalConfig;
    try {
      globalConfig = await pb.collection('Configs').getFirstListItem(`name = 'global'`);
      UnitProfile['configs'] = globalConfig;
    } catch {
      UnitProfile.message = 'PocketBase instance unavailable';
      return UnitProfile;
    }

    // Check maintenance mode
    if (globalConfig.maintenanceMode) {
      const allLocales = await pb.collection('Locales').getFullList(10);
      const locale = allLocales.find(l => l.dict?.lang === lang);
      UnitProfile['locale'] = locale?.dict || {};
      UnitProfile.message = 'Maintenance mode enabled';
      return UnitProfile;
    }

    // Validate user
    const { valid, backpackId: validBackpackId, decryptedbackpackId } = await validateOrCreateUser(pb, backpackId, event);
    if (!valid) {
      UnitProfile.message = 'User validation failed';
      return UnitProfile;
    }

    if (validBackpackId !== backpackId) {
      setCookie(event, 'backpackId', validBackpackId, { httpOnly: true, secure: true, sameSite: process.env.SAME_SITE, maxAge: 60 * 60 * 24 * 365 * 10, });
    }

    const decryptedPayload = JSON.parse(await decryptContent(token));
    const { project, exercice } = decryptedPayload;

    // Validate project existence
    let currentProject;
    try {
      currentProject = await pb.collection('Projects').getFirstListItem(`id = '${project}'`);
      // Get the project details
      UnitProfile['project'] = currentProject;
      
      // Get the activity details
      UnitProfile['activity'] = currentProject.profile.activities[exercice];

      // Initialize the history
      UnitProfile['history'] = null;

    } catch {
      UnitProfile.message = 'Project not found';
      return UnitProfile;
    }

    // Get the locale
    const allLocales = await pb.collection('Locales').getFullList(10);
    const locale = allLocales.find(l => l.dict?.lang === currentProject.profile.lang);
    UnitProfile['locale'] = locale?.dict || {};

    // Validate account subscription
    let account;
    try {
      account = await pb.collection('accounts').getFirstListItem(`userId = '${currentProject.author}'`);
    } catch {
      UnitProfile.message = 'Author account not found';
      return UnitProfile;
    }
    if (!account.is_subscribed) {
      UnitProfile.message = 'Subscription required';
      return UnitProfile;
    }

    // Validate profile publication
    if (!currentProject.profile.published) {
      UnitProfile.message = 'Profile not published';
      return UnitProfile;
    }

    // Validate expiration date
    if (currentProject.profile.useExpirationDate) {
      const expirationDate = new Date(currentProject.profile.expirationDate);
      if (expirationDate < new Date()) {
        UnitProfile.message = 'Profile expired';
        return UnitProfile;
      }
    }
        
    // Validate history record count (for the whole project)
    const historyRecords = await pb.collection('History').getFullList(200, { filter: `courseId = '${project}'` });

    if (historyRecords.length > 100) {
      UnitProfile.message = 'Too many history records';
      return UnitProfile;
    }

    delete currentProject.profile.activities;
    UnitProfile['project'] = currentProject;

    // Retrieve latest historic event
    let matchingEvents = [];
    try {
      matchingEvents = await pb.collection('History').getFullList(200, {
        filter: `backpackId = '${decryptedbackpackId}' && courseId = '${project}' && activityId = '${exercice}'`,
        sort: '-date', // Sort by creationDate in descending order
      });
    } catch (error) {
      // console.warn('No matching records found or query failed:', error.message);
      UnitProfile['history'] = null; // Gracefully handle no matches
      UnitProfile.message = 'No matching records found or query failed';
      return UnitProfile;
    }

    if (matchingEvents.length === 0) {
      UnitProfile['history'] = null; // No matching records found
    } else {

    // Step 5: Get the most recent event (first in the sorted list)
    const latestEvent = matchingEvents[0];

    // Step 6: Decrypt and sanitize the answer content
    const decryptedContent = await decryptContent(latestEvent.answer);

    const sanitizedContent = sanitizeHtml(decryptedContent, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'br',
        'ul', 'ol', 'li', 'b', 'i', 'u', 'strike', 'em', 'strong', 's',
      ],
      allowedAttributes: {
        '*': ['class'],
        'li': ['data-list'],
      },
    });

    UnitProfile['history'] = sanitizedContent;

    }

    // Return the unit profile
    return UnitProfile;

  } catch (error) {
    UnitProfile.message = error.message;
    return UnitProfile;
  }
});
