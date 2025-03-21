import JSZip from 'jszip';
import { encryptContent } from '~/utils/encryption';

import { pb } from '~/server/plugins/pocketbase'; // Import Pocketbase instance
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  const { projectId, activities, lang } = await readBody(event);

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
  
  // Asset file URLs
  const assetFiles = {
    'logo.svg': `${process.env.NEXTAUTH_URL}/vestibule/logo.svg`,
    'pdf.svg': `${process.env.NEXTAUTH_URL}/vestibule/pdf.svg`,
    'book.svg': `${process.env.NEXTAUTH_URL}/vestibule/book.svg`,
    'check.svg': `${process.env.NEXTAUTH_URL}/vestibule/check.svg`,
  };


  // Fetch static assets
  const assetContents = {};
  for (const [name, url] of Object.entries(assetFiles)) {
    const response = await fetch(url);
    assetContents[name] = await response.text();
  }

  // Fetch the PDF file
  let pdfBuffer = null;
  if (pdfUrl) {
    const pdfResponse = await fetch(pdfUrl);
    pdfBuffer = await pdfResponse.arrayBuffer();
  }
  
    // Fetch the main index.html file
    const htmlResponse = await fetch(`${process.env.NEXTAUTH_URL}/vestibule/index.html`);
    const indexHTMLContent = await htmlResponse.text();

  for (const [key, activity] of Object.entries(activities)) {

    // Assemble a token for the activity
    const tokenData = {
        source: 'brioeducation',
        project: projectId,
        exercice: key,
    };
  
    const token = await encryptContent(JSON.stringify(tokenData));
    const tokenizedUrlEmbed = `https://monjournaldebord.ca/embed/?token=${encodeURIComponent(token)}&lang=${lang}`;
    const tokenizedUrlPortal = `https://monjournaldebord.ca/portal/?token=${encodeURIComponent(token)}&lang=${lang}`;

    const activityZip = new JSZip();
    const assetsFolder = activityZip.folder('assets');
    const xapiWrapperFolder = activityZip.folder('xapiwrapper');
    const distFolder = xapiWrapperFolder.folder('dist');
    const libFolder = xapiWrapperFolder.folder('lib');

    // Add static assets
    for (const [name, content] of Object.entries(assetContents)) {
      assetsFolder.file(name, content);
    }

    // Add PDF file
    if (pdfBuffer) {
      assetsFolder.file('document.pdf', pdfBuffer);
    }

    // Fetch and add xapiwrapper files
    const xapiFiles = {
        'dist/xapiwrapper.min.js': `${process.env.NEXTAUTH_URL}/vestibule/xapiwrapper/dist/xapiwrapper.min.js`,
        'dist/xapiwrapper.min.js.map': `${process.env.NEXTAUTH_URL}/vestibule/xapiwrapper/dist/xapiwrapper.min.js.map`,
        'lib/cryptojs_v3.1.2.js': `${process.env.NEXTAUTH_URL}/vestibule/xapiwrapper/lib/cryptojs_v3.1.2.js`,
        'lib/utf8-text-encoding.js': `${process.env.NEXTAUTH_URL}/vestibule/xapiwrapper/lib/utf8-text-encoding.js`
    };

    // Create the html for the provider
    const providerHTMLContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mon journal de bord</title>
            <link href="https://fonts.googleapis.com/css2?family=Overpass:wght@400&display=swap" rel="stylesheet">
            <style>

                * {
                    font-family: 'Overpass', sans-serif;
                    box-sizing: border-box;
                }

                body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: 'Overpass', sans-serif;
                }

                .container {
                    background-color: rgb(244, 246, 248);
                    border-radius: 8px;
                    max-width: 800px;
                    max-height: 449px;
                    width: 100vw;
                    height: 56.125vw;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    position: relative;
                    opacity: 1;
                    transition: opacity 2s ease;
                }

                .logo {
                    width: 20vw;
                    max-width: 150px;
                    height: auto;
                    animation: bounce 2s infinite;
                }

                .loading-text {
                    margin-top: 6vh;
                    font-size: 4vh;
                    color: #333;
                }

                .message {
                    color: #FF0000;
                    font-size: 2vh;
                    text-align: center;
                }

                .pdf-container, .new-window-container {
                    background-color: rgb(244, 246, 248);
                    border-radius: 8px;
                    max-width: 800px;
                    max-height: 449px;
                    width: 100vw;
                    height: 56.125vw;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    position: relative;
                }

                .download-block {
                    border-radius: 8px;
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                    gap: 8px;
                    background-color: #fff;
                    padding: 20px;
                    padding-right: 30px;
                    -webkit-box-shadow: 1px 4px 15px -5px rgba(0,0,0,0.55); 
                    box-shadow: 1px 4px 15px -5px rgba(0,0,0,0.55);
                }

                h1 {
                    margin-bottom: 10px;
                }

                p {
                    font-size: 1.2rem;
                    margin-bottom: 50px;
                    text-align: center;
                }

                .pdf-infos  {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    margin-right: 90px;
                }

                .pdf-icon {
                    width: 50px;
                    height: 50px;
                }

                .check-icon {
                    width: 50px;
                    height: 50px;
                    margin-bottom: 10px;
                }

                .check-icon img {
                    width: 100%;
                }

                .pdf-icon img {
                    width: 100%;
                }

                .pdf-title {
                    margin-top: 10px;
                    font-size: 1.1em;
                }

                .pdf-size {
                    margin-top: 2px;
                    margin-bottom: 8px;
                    font-size: 0.8em;
                    color: #777;
                }

                .checkmark {
                    font-size: 3em;
                    color: #28a745;
                    margin-bottom: 20px;
                }

                .blue-button {
                    background-color: #0e67d6;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1.2em;
                    padding: 14px 18px 14px 18px;  
                }

                .blue-button:hover {
                    background-color: #0056b3;
                }

                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-3vh);
                    }
                    60% {
                        transform: translateY(-1.5vh);
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <img src="assets/logo.svg" class="logo" alt="Logo">
                <div class="loading-text">Chargement...</div>
            </div>

            <!-- PDF or New Window Container -->
            <div id="pdfContainer" class="pdf-container" style="display: none;">

                <h1>Désolé...</h1>
                <p>L'application est actuellement indisponible.</br>Veuillez utiliser le document PDF.</p>
                <div class="download-block">
                    <div class="pdf-icon">
                        <img src="assets/pdf.svg" alt="PDF Icon">
                    </div>
                    <div class="pdf-infos">
                        <div class="pdf-title" id="pdfTitle">document.pdf</div>
                        <div class="pdf-size" id="pdfSize"></div>
                    </div>
                    <button id="openPdfButton" onclick="openPdf()" class="blue-button">Ouvrir le PDF</button>
                </div>

            </div>

            <div id="newWindowContainer" class="new-window-container" style="display: none;">
                <div class="check-icon">
                    <img src="assets/check.svg" alt="Check Icon">
                </div>
                <h1>Accédez à l'activité</h1>
                <p>Cliquez sur le bouton ci-dessous pour accéder à l'activité,</br>ou pour modifier votre réponse.</p>
                <button id="editButton" onclick="openInNewWindow()" class="blue-button">Ouvrir l'application</button>
            </div>


            <script>

                const container = document.querySelector('.container');
                const messageEl = document.getElementById('message');
                const pdfContainer = document.getElementById('pdfContainer');
                const newWindowContainer = document.getElementById('newWindowContainer');
                const apiBaseUrl = "https://jdb.pockethost.io";
                const targetUrl = '${tokenizedUrlEmbed}';
                const pdfUrl = 'assets/document.pdf';

                function openPdf() {
                    window.parent.postMessage({ action: 'openNewWindow', url: pdfUrl }, '*');
                }

                function openInNewWindow() {
                    window.parent.postMessage({ action: 'openNewWindow', url: '${tokenizedUrlPortal}' }, '*');
                }

                async function checkPocketBaseStatus() {
                    try {
                        const configResponse = await fetch(\`\$\{apiBaseUrl\}/api/collections/Configs/records/3znbpxwdnlhju0q\`);
                        if (!configResponse.ok) throw new Error("PocketBase instance is offline");

                        const configData = await configResponse.json();
                        const maintenanceMode = configData.maintenanceMode;
                        const openInNewWindowValue = configData.openInNewWindow;

                        if (maintenanceMode) {
                            container.style.display = 'none'; 
                            pdfContainer.style.display = 'flex';

                            // Fetch PDF size (assuming it's on the same server, adjust if necessary)
                            const pdfResponse = await fetch(pdfUrl);
                            const pdfBlob = await pdfResponse.blob();
                            const pdfSize = (pdfBlob.size / 1024).toFixed(2); // Size in KB
                            document.getElementById('pdfSize').textContent = \`\$\{pdfSize\} KB\`;
                            return;
                        }

                        
                        setTimeout(() => {
                            if (openInNewWindowValue) {
                                container.style.display = 'none'; 
                                newWindowContainer.style.display = 'flex';
                                openInNewWindow();
                            } else {
                                // Get user data from the URL params
                                const urlParams = new URLSearchParams(window.location.search);
                                
                                // const lmsUser = {
                                //    mbox: urlParams.get("mbox"),
                                //    name: urlParams.get("name")
                                // };
                                // const lmsUserMbox = encodeURIComponent(lmsUser.mbox);
                                // const lmsUserName = encodeURIComponent(lmsUser.name);
                                
                                const actorToken = urlParams.get("actor");
                                const lmsActor = encodeURIComponent(actorToken);

                                // Edit the window location to include the LMS user data
                                // window.location.href = targetUrl + '&mbox=' + lmsUserMbox + '&name=' + lmsUserName;
                                
                                window.location.href = targetUrl + '&actor=' + lmsActor;
                            }
                        }, 1000);

                    } catch (error) {
                        container.style.display = 'none'; // Start fade-out effect
                        pdfContainer.style.display = 'flex';
                        console.error(error);
                    }
                }

                setTimeout(checkPocketBaseStatus, 2000); // Wait 2 seconds before checking
            </script>
        </body>
        </html>
    `;

    // Create empty HTML files
    activityZip.file('index.html', indexHTMLContent);
    activityZip.file('provider.html', providerHTMLContent);

    // Add xapiwrapper files
    for (const [filePath, url] of Object.entries(xapiFiles)) {
        const response = await fetch(url);
        const content = await response.text();
        activityZip.file(`xapiwrapper/${filePath}`, content);
    }

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
  event.node.res.setHeader('Content-Disposition', `attachment; filename="${projectId}.zip"`);
  return send(event, content);
});