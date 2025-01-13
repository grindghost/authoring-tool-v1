// server/api/create-project.js

import { pb } from '~/server/plugins/pocketbase';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { decryptContent, encryptContent } from '~/server/utils/auth';


export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'UserId');
  console.log(`User ID: ${userId}`);
  
  const formData = await readMultipartFormData(event);

  const projectName = formData.find((field) => field.name === 'projectName').data.toString();

  const projectDescription = formData.find((field) => field.name === 'projectDescription').data.toString();
  const pdfFileField = formData.find((field) => field.name === 'pdfFile');
  const pdfFileBuffer = pdfFileField.data;
  const originalPdfFilename = pdfFileField.filename || `project_${Date.now()}.pdf`;
  
  // Remove .pdf extension if present
  const pdfFilenameWithoutExtension = originalPdfFilename.replace(/\.pdf$/i, '');

  // Access pdfImage binary data (already in Blob format)
  const pdfImageField = formData.find((field) => field.name === 'pdfImage');
  const coverImageBuffer = pdfImageField ? pdfImageField.data : null;

  const pdfTempPath = path.join('/tmp', `${Date.now()}_temp.pdf`);
  const outputImagePath = path.join('/tmp', `${Date.now()}_cover.png`);

  try {
    if (!pdfFileBuffer || !projectName) {
      throw createError({ statusCode: 400, message: 'Project name and PDF file are required' });
    }

    fs.writeFileSync(pdfTempPath, pdfFileBuffer);

    // Get the doc with PDFLib
    const pdfDoc = await PDFDocument.load(pdfFileBuffer);

    // Prepare form data with PDF and cover image for Pocketbase
    const formDataToUpload = new FormData();
    const pdfFilename = `project_${Date.now()}.pdf`; // Desired filename for the PDF
    formDataToUpload.append('pdf', new Blob([pdfFileBuffer]), pdfFilename);
    
    formDataToUpload.append('cover_image', new Blob([coverImageBuffer]), 'cover_image.png');

    // Create the record in the Files collection with the PDF and cover image
    const fileRecord = await pb.collection('Files').create(formDataToUpload);

    // Retrieve the record to get the filename and URL for each file
    const record = await pb.collection('Files').getOne(fileRecord.id);
    const pdfFileName = record.pdf; // Retrieve the filename stored in the record
    const coverImageName = record.cover_image;

    // Generate the correct URLs
    const pdfFileUrl = pb.files.getUrl(record, pdfFileName, { token: '' });
    const coverImageUrl = pb.files.getUrl(record, coverImageName);

    const textFields = pdfDoc.getForm().getFields();
    const activities = {};

    textFields.forEach((field, index) => {
      const fieldName = field.getName();
    
      // Skip fields named "store"
      if (fieldName.toLowerCase() === "store") {
        return; // Continue to the next iteration
      }
    
      activities[fieldName] = {
        activityTitle: `Exercice ${index + 1}`,
        contextText: '<p></p>',
        customPlaceholder: '...',
        defaultText: '<p></p>',
        isEndpoint: false,
        maxCharactersAllowed: 1000,
        useCharactersLimit: false,
        useCustomPlaceholder : false,
        token: '_',
      };
    });
    

    // Add an additional endpoint activity, duplicating the last activity
    if (textFields.length > 0) {
      const lastFieldName = textFields[textFields.length - 1].getName();
      const endpointFieldName = `${lastFieldName}_endpoint`;

      activities[endpointFieldName] = {
        ...activities[lastFieldName], // Copy properties from the last activity
        isEndpoint: true,             // Set isEndpoint to true for this activity
        activityTitle: `Télécharger le PDF de votre journal de bord`,
        contextText: '<p></p>',
        customPlaceholder: '...',
        defaultText: '<p></p>',
        maxCharactersAllowed: 1000,
        useCharactersLimit: false,
        useCustomPlaceholder : false,
        token: '_',
      };
    }
  
    // Format the pdf file size to a human-readable format
    const formatFileSize = (sizeInBytes) => {
      const sizeInKB = sizeInBytes / 1024;
      if (sizeInKB < 1024) {
        return `${Math.round(sizeInKB)} KB`;
      } else {
        const sizeInMB = sizeInKB / 1024;
        return `${sizeInMB.toFixed(2)} MB`;
      }
    };

    const project = await pb.collection('Projects').create({
      profile: {
        activities,
        author: userId,
        courseId: 'L\'apprentissage du savoir faire...',
        lang: 'fr',
        name: projectName,
        description: projectDescription,
        pdfCoverImgUrl: coverImageUrl,
        pdfFileSize: formatFileSize(pdfFileBuffer.length),
        pdfFilename: pdfFilenameWithoutExtension,
        pdfURL: pdfFileUrl,
        published: true,
        useCustomTheme: false,
        customTheme: "#32a852",
        theme: 'brio',
        useExpirationDate: false,
        expirationDate: null,
        maintenanceMode: false,
      },
      author: userId,
    });


    // Update tokens with the actual project ID
    for (const activityKey in activities) {
      if (activities.hasOwnProperty(activityKey)) {
        const tokenData = {
          source: 'brioeducation',
          project: project.id, // Use the actual project ID
          exercice: activityKey,
        };

        // Encrypt the tokenData to regenerate the token with the project ID
        const token = await encryptContent(JSON.stringify(tokenData));

        // Update the token in the activities object
        activities[activityKey].token = token;
      }
    }

    // Rewrite the updated activities back to the project in PocketBase
    await pb.collection('Projects').update(project.id, {
      profile: {
        ...project.profile, // Keep other project profile properties
        activities, // Include updated activities with tokens
      },
    });

    // Update the Files record with the new project ID
    await pb.collection('Files').update(fileRecord.id, {
      projectId: project.id,
    });

    console.log(`Project ${project.id} created successfully.`);
    return { projectId: project.id, project: project, success: true };

  } catch (error) {
    console.error('Error creating project:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to create project' });
  } finally {
    if (fs.existsSync(pdfTempPath)) fs.unlinkSync(pdfTempPath);
    if (fs.existsSync(`${outputImagePath}.png`)) fs.unlinkSync(`${outputImagePath}.png`);
  }
});

