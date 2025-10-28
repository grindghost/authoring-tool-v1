// server/api/pb/profile.get.js

import { getCookie, setCookie, createError } from 'h3';
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase-unit';
import { validateOrCreateUser, decryptContent } from '~/server/utils/services';
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
  const backpackId = getCookie(event, 'backpackId');
  const token = getQuery(event).token;
  let lang = getQuery(event).lang;
  const actor = getQuery(event).actor;

  // Normalize the iso language received from the query
  if (lang !== 'fr' || lang !== 'en') {
    lang = 'fr';
  }

  // Ensure authentication on pocketbase
  // With some retries, if needed...
  await ensureAuthenticated("Get profile");

  // Derive the actor mbox and name from the encrypted actor token passed as a query
  // The query actor is base64 encoded, so decode it
  const decodedActor = decodeURIComponent(actor);
  const decryptedActor = atob(decodedActor);

  let mbox = 'mailto:unknown@example.com';
  let name = 'Unknown User';

  // check if the actor is a valid JSON
  try {
    const parsedActor = JSON.parse(decryptedActor);
    // Now that we know it's valid JSON, destructure mbox and name
    ({ mbox, name } = parsedActor);
    // Ensure mbox and name are not undefined or null
    mbox = mbox || 'mailto:unknown@example.com';
    name = name || 'Unknown User';
  } catch (error) {
    // If not a valid JSON, use the default values already set
    console.warn('Invalid actor encoding, using default values.');
  }

  // Hotfix: Create or retrieve Backpacks2 record
  let Backpack2;
  try {
    // First, check if a record with this actor already exists
    try {
      Backpack2 = await pb.collection('Backpacks2').getFirstListItem(`actor = '${actor}'`);
      console.log('Found existing Backpacks2 record:', Backpack2.id);
    } catch (notFoundError) {
      // Record doesn't exist, create it
      console.log('Creating new Backpacks2 record for actor');
      Backpack2 = await pb.collection('Backpacks2').create({
        actor: actor,           // Save the original URI-encoded actor string
        name: name,             // Save the decoded name
        mbox: mbox,             // Save the decoded mbox
        exception: 0            // Default value for exception field
      });
      console.log('Created new Backpacks2 record:', Backpack2.id);
    }
  } catch (error) {
    console.error('Error handling Backpacks2 record:', error);
    // Continue execution even if this fails - it's a hotfix, don't break the main flow
  }

  // Initialize the unit profile
  const UnitProfile = { message: null };

  // Check DB instance availability
  try {
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
    const { valid, backpackId: validBackpackId, decryptedbackpackId } = await validateOrCreateUser(pb, backpackId, event, name, mbox);
    if (!valid) {
      UnitProfile.message = 'User validation failed';
      return UnitProfile;
    }

    if (validBackpackId !== backpackId) {
      setCookie(event, 'backpackId', validBackpackId, { httpOnly: true, secure: true, sameSite: process.env.SAME_SITE, maxAge: 60 * 60 * 24 * 365 * 10, });
    }

    // Validate the received token
    let decryptedPayload;
    try {
      decryptedPayload = JSON.parse(await decryptContent(token));
    } catch {
      UnitProfile.message = 'Invalid token';
      return UnitProfile;
    }

    const { project, exercice, source } = decryptedPayload;

    if (!project || !exercice || !source || source !== process.env.NUXT_PUBLIC_ALLOWED_SOURCE) {
      UnitProfile.message = 'Token validation failed';
      return UnitProfile;
    } 

    // Validate project existence (could be a wrong value, or deleted...)
    let currentProject;
    try {
      currentProject = await pb.collection('Projects').getFirstListItem(`id = '${project}'`);
      // Get the project details
      UnitProfile['project'] = currentProject;
      
      // Get the activity details
      UnitProfile['activity'] = currentProject.profile.activities[exercice];

      // If the activity doesn't have the useDefaultText field, set it to true
      if (!UnitProfile['activity'].useDefaultText) {
        if (UnitProfile['activity'].isEndpoint) {
          UnitProfile['activity']['useDefaultText'] = false;
        } else {
          UnitProfile['activity']['useDefaultText'] = true;
        }
      }

      // Add the activityId to the activity object
      UnitProfile['activity'].id = exercice;

      // Initialize the history
      UnitProfile['history'] = null;

    } catch {
      UnitProfile.message = 'Project not found';
      return UnitProfile;
    }

    // Get the locale
    // const allLocales = await pb.collection('Locales').getFullList(10);
    // const locale = allLocales.find(l => l.dict?.lang === currentProject.profile.lang);
    // UnitProfile['locale'] = locale?.dict || {};

    // Retrieve the locale record specific to the project and language
    try {
      const localeRecord = await pb.collection('Locales').getFirstListItem(
          `project = "${currentProject.id}" && dict.lang = "${currentProject.profile.lang}"`
      );
      UnitProfile['locale'] = localeRecord.dict || {};
  } catch (error) {
      console.error(`Error fetching locale for project ${currentProject.id} and language ${currentProject.profile.lang}:`, error);
      UnitProfile['locale'] = {}; // Set to empty object if not found
  }

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

    // Validate project publication status
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
    
    /*
    if (historyRecords.length > 150) {
      UnitProfile.message = 'Too many history records';
      return UnitProfile;
    }
    */

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
      UnitProfile['history'] = null;
      UnitProfile['registration'] = null;
    } else {

    // Step 5: Get the most recent event (first in the sorted list)
    const latestEvent = matchingEvents[0];

    // Step 6: Decrypt and sanitize the answer content
    const decryptedContent = await decryptContent(latestEvent.answer);

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
    UnitProfile['history'] = sanitizedContent;
    UnitProfile['registration'] = latestEvent.registration || 'unknown-registration';
    }

    // Return the unit profile
    return UnitProfile;

  } catch (error) {
    UnitProfile.message = error.message;
    return UnitProfile;
  }
});
