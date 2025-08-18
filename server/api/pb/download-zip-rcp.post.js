import JSZip from 'jszip';
import { minify } from 'html-minifier-terser';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { encryptContent } from '~/utils/encryption';
import { pb } from '~/server/plugins/pocketbase'; // Import Pocketbase instance
import { getServerSession } from '#auth';

async function fetchRCPFiles() {
  const files = {
    'index.html': 'https://raw.githubusercontent.com/grindghost/xapi-state-utils/refs/heads/features/xsu-3_rcp-protocol/xapi-state-utils/dist/index.html',
    'tincan.xml': 'https://raw.githubusercontent.com/grindghost/xapi-state-utils/refs/heads/features/xsu-3_rcp-protocol/xapi-state-utils/dist/tincan.xml',
    'xapi-state-utils.umd.js': 'https://raw.githubusercontent.com/grindghost/xapi-state-utils/refs/heads/features/xsu-3_rcp-protocol/xapi-state-utils/dist/xapi-state-utils.umd.js'
  };

  const fileContents = {};
  for (const [name, url] of Object.entries(files)) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${name} from ${url}`);
    }
    fileContents[name] = await response.text();
  }

  return fileContents;
}

export default defineEventHandler(async (event) => {
  const { projectId, activities, lang, indexTarget } = await readBody(event);

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

  // Create the main zip file
  const mainZip = new JSZip();
  
  // Fetch project data from PocketBase to get the PDF URL
  const project = await pb.collection('Projects').getOne(projectId);
  const pdfUrl = project.profile?.pdfURL;
  
  // Fetch the PDF file
  let pdfBuffer = null;
  if (pdfUrl) {
    const pdfResponse = await fetch(pdfUrl);
    pdfBuffer = await pdfResponse.arrayBuffer();
  }

  // Fetch RCP files from GitHub
  const rcpFiles = await fetchRCPFiles();

  // Get sorted activities to determine which is the last one
  const sortedActivities = Object.entries(activities)
    .map(([id, activity]) => ({ id, ...activity }))
    .sort((a, b) => a.index - b.index);

  for (const [key, activity] of Object.entries(activities)) {
    // Determine if this is the last activity
    const isLastActivity = sortedActivities[sortedActivities.length - 1].id === key;

    // Create activity-specific config.json
    const configJson = {
      "indexKey": "notes-index",
      "indexTarget": indexTarget || {
        "activityId": "default-activity-id",
        "registration": "default-registration",
        "idcontenubrio": "default-idcontenubrio"
      },
      "description": "Configuration for xAPI State Utils",
      "version": "1.0.0",
      "placeholder": activity.useCustomPlaceholder ? activity.customPlaceholder : "Entrez votre réponse ici...",
      "defaultText": activity.defaultText || "",
      "fieldName": activity.fieldName || "field_1",
      "isEndpoint": isLastActivity || activity.isEndpoint || false,
      "endPointOnDemand": false,
      "documentImageUrl": project.profile?.pdfCoverImgUrl || "cover_image.png",
      "pdfUrl": project.profile?.pdfURL || "document.pdf",
      "activityTitle": activity.activityTitle || "Activité",
      "activityDescription": activity.contextText || "Exercice de réflexion personnelle",
      "allowedOrigin": "https://xapi-state-utils.vercel.app",
      "pdfConfig": {
        "filename": project.name || "Document",
        "extension": "pdf",
        "estimatedSize": project.pdfFileSize || "~1.48 MB"
      }
    };

    const activityZip = new JSZip();

    // Add the config.json file
    activityZip.file('config.json', JSON.stringify(configJson, null, 2));

    // Generate tincan.xml content dynamically (same logic as original download-zip)
    const tincanXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <manifest identifier="tincan-package"
            xmlns="http://www.adlnet.gov/xsd/adlcp"
            xmlns:lom="http://ltsc.ieee.org/xsd/LOM"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.adlnet.gov/xsd/adlcp 
                                http://www.adlnet.gov/xsd/adlcp.xsd">
        <resources>
            <resource identifier="index" href="index.html" type="tincan">
                <file href="index.html"/>
                <file href="config.json"/>
                <file href="tincan.xml"/>
            </resource>
        </resources>
        <tincan>
            <activities>
                <activity id="https://monjournaldebord.ca/activity/${key}">
                    <name>
                        <langstring xml:lang="fr">${activity.activityTitle}</langstring>
                    </name>
                    <description>
                        <langstring xml:lang="fr">${'Activité de réflexion personnelle'}</langstring>
                    </description>
                </activity>
            </activities>
        </tincan>
    </manifest>`;

    // Add the RCP files
    activityZip.file('index.html', rcpFiles['index.html']);
    activityZip.file('tincan.xml', tincanXmlContent);
    activityZip.file('xapi-state-utils.umd.js', rcpFiles['xapi-state-utils.umd.js']);

    // Add PDF file if available
    // if (pdfBuffer) {
    //   activityZip.file('document.pdf', pdfBuffer);
    // }

    // Generate the activity zip file
    const activityZipContent = await activityZip.generateAsync({ type: 'nodebuffer' });

    // Add the activity zip file to the main zip
    let formattedTitle = activity.activityTitle.toLowerCase(); // Convert to lowercase

    // Check if the title contains "télécharger"
    if (formattedTitle.includes('télécharger')) {
      formattedTitle = 'endpoint'; // Replace the entire title with "endpoint"
    } else {
      formattedTitle = formattedTitle
        .replace(/\s+/g, '_'); // Replace spaces with underscores
    }

    // Add the activity zip file to the main zip
    mainZip.file(`${formattedTitle}.zip`, activityZipContent);
  }

  const content = await mainZip.generateAsync({ type: 'nodebuffer' });

  // Set the filename dynamically using the project ID
  event.node.res.setHeader('Content-Type', 'application/zip');
  event.node.res.setHeader('Content-Disposition', `attachment; filename="${projectId}-rcp.zip"`);
  return send(event, content);
}); 