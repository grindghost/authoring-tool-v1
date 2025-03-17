// server/api/update-project-files.js

import { pb } from '~/server/plugins/pocketbase';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { getServerSession } from '#auth';

// Format the pdf file size to a human-readable format...
const formatFileSize = (sizeInBytes) => {
    const sizeInKB = sizeInBytes / 1024;
    if (sizeInKB < 1024) {
        return `${Math.round(sizeInKB)} KB`;
    } else {
        const sizeInMB = sizeInKB / 1024;
        return `${sizeInMB.toFixed(2)} MB`;
    }
    };

export default defineEventHandler(async (event) => {

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

  const formData = await readMultipartFormData(event);

  const projectId = formData.find((field) => field.name === 'projectId').data.toString();
  const pdfFileField = formData.find((field) => field.name === 'pdfFile');
  const pdfFileBuffer = pdfFileField.data;
  const originalPdfFilename = pdfFileField.filename || `project_${Date.now()}.pdf`;
  console.log('originalPdfFilename', originalPdfFilename)
  const pdfImageField = formData.find((field) => field.name === 'pdfImage');
  const coverImageBuffer = pdfImageField ? pdfImageField.data : null;

  const pdfTempPath = path.join('/tmp', `${Date.now()}_temp.pdf`);
  const outputImagePath = path.join('/tmp', `${Date.now()}_cover.png`);

  try {
    if (!projectId || !pdfFileBuffer) {
      throw createError({ statusCode: 400, message: 'Project ID and PDF file are required' });
    }

    // Get the project
    const project = await pb.collection('Projects').getOne(projectId);
    
    // Check if the user is the author of the project
    if (project.author !== userId) {
      throw createError({ statusCode: 403, message: 'Unauthorized to edit this project' })
    }

    // Retrieve the activities from the project.profile
    const activitiesData = project.profile.activities;
    console.log('activitiesData', project.profile)

    // Filter out activities where "isEndpoint" is true
    const activities = Object.entries(activitiesData)
      .filter(([key, value]) => !value.isEndpoint) // Keep entries where "isEndpoint" is false
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    // Load the PDF with PDFLib
    const pdfDoc = await PDFDocument.load(pdfFileBuffer);
    
    // Check if the new PDF contains any text fields, and extract them from the PDF
    const textFields = pdfDoc.getForm().getFields().filter(field => {
      const fieldType = field.constructor.name;
      const fieldName = field.getName();
    
      // Keep only fields of type PDFTextField and exclude those with the name "store"
      return fieldType === 'PDFTextField' && fieldName !== 'store';
    });

    // Throw an error if no valid text fields are found
    if (textFields.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid text fields found in the PDF',
      });
    }

    // Iterate over the text fields and update the activities
    // Create the activities from the text fields
    const updatedActivities = {};

    textFields.forEach((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;

      // Make sure to skip non-text fields
      if (fieldType !== 'PDFTextField') {
        return; // Continue to the next iteration
      }
    
      // Skip fields named "store"
      if (fieldName.toLowerCase() === "store") {
        return; // Continue to the next iteration
      }
      
      // Check if the field name already exists in the activities
      if (activities[fieldName]) {
        // If it does, keep the existing activity
        updatedActivities[fieldName] = activities[fieldName];
      } else {
        updatedActivities[fieldName] = {
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
      }
    });
    
    // Proceed to create an additional endpoint activity, duplicating the last activity
    if (textFields.length > 0) {
      const lastFieldName = textFields[textFields.length - 1].getName();
      const endpointFieldName = `${lastFieldName}_endpoint`;

      updatedActivities[endpointFieldName] = {
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

    // Update tokens with the actual project ID
    for (const activityKey in updatedActivities) {
      if (updatedActivities.hasOwnProperty(activityKey)) {
        const tokenData = {
          source: 'brioeducation',
          project: project.id, // Use the actual project ID
          exercice: activityKey,
        };

        // Encrypt the tokenData to regenerate the token with the project ID
        const token = await encryptContent(JSON.stringify(tokenData));

        // Update the token in the activities object, if it's not already set
        if (updatedActivities[activityKey].token == '_') {
          updatedActivities[activityKey].token = token;
        }
      }
    }

    // Find the existing Files record linked to this project
    const fileRecords = await pb.collection('Files').getList(1, 1, {
      filter: `projectId="${projectId}"`,
    });

    // If no Files record found, throw an error
    if (fileRecords.items.length === 0) {
      throw createError({ statusCode: 404, message: 'No Files record found for this project ID' });
    }

    // Get the existing Files record
    const fileRecord = fileRecords.items[0];

    // Save the new PDF temporarily
    fs.writeFileSync(pdfTempPath, pdfFileBuffer);

    // Prepare a new form data for the updated files to send to pocketbase
    const formDataToUpload = new FormData();
    const pdfFilename = `project_${Date.now()}.pdf`; // New filename for the PDF
    formDataToUpload.append('pdf', new Blob([pdfFileBuffer]), pdfFilename);
    
    if (coverImageBuffer) {
      formDataToUpload.append('cover_image', new Blob([coverImageBuffer]), 'cover_image.png');
    }

    // Update the existing Files record with the new files
    const updatedFileRecord = await pb.collection('Files').update(fileRecord.id, formDataToUpload);

    // Retrieve the updated Files record to get the new file URLs
    const updatedRecord = await pb.collection('Files').getOne(updatedFileRecord.id);
    const pdfFileName = updatedRecord.pdf; // Updated PDF filename
    const coverImageName = updatedRecord.cover_image;

    const pdfFileUrl = pb.files.getUrl(updatedRecord, pdfFileName, { token: '' });
    const coverImageUrl = pb.files.getUrl(updatedRecord, coverImageName);

    // Update the Projects collection with the new URLs
    // ...


    const updatedProfile = {
      ...project.profile,
      activities: updatedActivities,
      pdfFileSize: formatFileSize(pdfFileBuffer.length),
      pdfFilename: originalPdfFilename,
      pdfURL: pdfFileUrl,
      pdfCoverImgUrl: coverImageUrl,
    };

    // Update the project with the new profile
    await pb.collection('Projects').update(projectId, { profile: updatedProfile });

    console.log(`Project ${projectId} files updated successfully.`);
    return { success: true, projectId, pdfFileUrl, coverImageUrl };
  } catch (error) {
    console.error('Error updating project files:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to update project files' });
  } finally {
    if (fs.existsSync(pdfTempPath)) fs.unlinkSync(pdfTempPath);
    if (fs.existsSync(`${outputImagePath}.png`)) fs.unlinkSync(`${outputImagePath}.png`);
  }
});
