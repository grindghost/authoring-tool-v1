// server/api/download-zip.js

import JSZip from 'jszip';
import { encryptContent } from '~/utils/encryption';
import { readFile } from 'fs/promises';
import { join } from 'path';

export default defineEventHandler(async (event) => {
  const { projectId, activities, lang } = await readBody(event);

  const zip = new JSZip();

  // Read the SVG logo file from the public folder
  const logoPath = join(process.cwd(), 'public/logo.svg');
  const logoSVG = await readFile(logoPath, 'utf8');

  for (const [key, activity] of Object.entries(activities)) {
    const tokenData = {
      source: 'brioeducation',
      project: projectId,
      exercice: key,
    };

    const token = await encryptContent(JSON.stringify(tokenData));
    const tokenUrl = `https://jdb-nuxt.vercel.app/?token=${encodeURIComponent(token)}&lang=${lang}`;

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Loading Page</title>
            <link href="https://fonts.googleapis.com/css2?family=Overpass:wght@400&display=swap" rel="stylesheet">
            <style>
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
                    height: 56.125vw; /* This ensures a 16:9 ratio (800/449 = 16/9) */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    position: relative;
                    opacity: 1;
                    transition: opacity 2s ease; /* Transition for fade-out */
                }

                img {
                    width: 20vw; /* Adjusts size relative to viewport width */
                    max-width: 150px;
                    height: auto;
                    animation: bounce 2s infinite;
                }

                .loading-text {
                    margin-top: 6vh;
                    font-size: 4vh; /* Text size scales with viewport height */
                    color: #333;
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

                @keyframes fade-out {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Replace 'logo.svg' with the path to your actual SVG file -->
                <img src="logo.svg" alt="Logo">
                <div class="loading-text">Loading...</div>
            </div>

            <script>
                const container = document.querySelector('.container');

                // Set a timeout to trigger the fade-out before redirect
                setTimeout(() => {
                    container.style.opacity = '0'; // Start fade-out effect

                    // Redirect after fade-out animation completes (2 seconds)
                    setTimeout(() => {
                        window.location.href = '${tokenUrl}';
                    }, 1000); // Wait for fade-out transition to finish before redirecting
                }, 2000); // Wait 1 second before starting fade-out
            </script>
        </body>
        </html>
    `;

    const folder = zip.folder(activity.activityTitle);
    folder.file(`${activity.activityTitle}.html`, htmlContent);
    folder.file('logo.svg', logoSVG);
  }

  const content = await zip.generateAsync({ type: 'nodebuffer' });

  // Set the filename dynamically using the project ID
  event.node.res.setHeader('Content-Type', 'application/zip');
  event.node.res.setHeader('Content-Disposition', `attachment; filename="${projectId}.zip"`);
  return send(event, content);
});
