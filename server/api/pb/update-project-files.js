// server/api/update-project-files.js

import { pb } from '~/server/plugins/pocketbase';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { getServerSession } from '#auth';
import { encryptContent } from '~/server/utils/services';
import { replaceInDesignSpecialChars } from '~/server/utils/replaceInDesignSpecialChars';

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
  console.log('originalPdfFilename', originalPdfFilename);
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
      throw createError({ statusCode: 403, message: 'Unauthorized to edit this project' });
    }

    // Retrieve the activities from the project.profile
    const existingActivities = project.profile.activities;
    console.log('existing activities', existingActivities);

    // Create a map of field names to activity IDs for easy lookup
    const fieldNameToActivityId = {};
    const endpointActivity = {};
    
    for (const [activityKey, activity] of Object.entries(existingActivities)) {
      if (activity.isEndpoint) {
        endpointActivity.id = activityKey;
        endpointActivity.data = activity;
      } else if (activity.fieldName) {
        fieldNameToActivityId[activity.fieldName] = activityKey;
      }
    }

    // Load the PDF with PDFLib
    const pdfDoc = await PDFDocument.load(pdfFileBuffer);
    
    // Check if the new PDF contains any text fields, and extract them from the PDF
    const textFields = pdfDoc.getForm().getFields().filter(field => {
      const fieldType = field.constructor.name;
      const fieldName = field.getName();
    
      // Keep only fields of type PDFTextField and exclude those with the name "store"
      return fieldType === 'PDFTextField' && fieldName !== 'store';
    });

    // If there's a field name 'store', get its content, which would be a json string, and parse it
    const storeField = pdfDoc.getForm().getFields().find(field => field.getName() === 'store');
    const storeContent = storeField ? storeField.getText() : null;
    const storeData = storeContent ? JSON.parse(storeContent) : {};

    // Replace special characters in the store data (which are inserted by InDesign)
    replaceInDesignSpecialChars(storeData);
    console.log('Store data:', storeData);

    // Throw an error if no valid text fields are found
    if (textFields.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid text fields found in the PDF',
      });
    }

    // Extract all field names from the new PDF
    const newPdfFieldNames = textFields.map(field => field.getName());
    console.log('New PDF field names:', newPdfFieldNames);

    // Function to generate a unique ID for new activities
    const generateUniqueId = () => {
      return crypto.randomUUID();
    };

    // Create updated activities object
    const updatedActivities = {};

    // Process each text field from the PDF
    textFields.forEach((field, index) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;

      // Skip non-text fields and "store" field
      if (fieldType !== 'PDFTextField' || fieldName.toLowerCase() === "store") {
        return;
      }
      
      // Get the default text for the field from the store data
      const defaultText = storeData[fieldName] || '<p></p>';
      
      // Check if an activity with this field name already exists
      const existingActivityId = fieldNameToActivityId[fieldName];
      
      if (existingActivityId) {
        // If it exists, preserve the existing activity with its ID
        updatedActivities[existingActivityId] = {
          ...existingActivities[existingActivityId],
          index: index,              // Update the index
        };
      } else {
        // Create a new activity with a unique ID
        const newActivityId = generateUniqueId();
        updatedActivities[newActivityId] = {
          activityTitle: `Exercice ${index + 1}`,
          contextText: '<p></p>',
          customPlaceholder: '...',
          defaultText: defaultText,
          isEndpoint: false,
          maxCharactersAllowed: 1000,
          useCharactersLimit: false,
          useCustomPlaceholder: false,
          token: '_',
          fieldName: fieldName,
          index: index,
        };
      }
    });

    // Add the endpoint activity
    if (textFields.length > 0) {
      const lastField = textFields[textFields.length - 1];
      const lastFieldName = lastField.getName();
      const endpointFieldName = `${lastFieldName}_endpoint`;
      
      if (endpointActivity.id) {
        // If an endpoint activity already exists, update it
        updatedActivities[endpointActivity.id] = {
          ...endpointActivity.data,
          fieldName: endpointFieldName,
          index: textFields.length,
        };
      } else {
        // Create a new endpoint activity
        const lastActivityId = Object.keys(updatedActivities).find(key => {
          return updatedActivities[key].fieldName === lastFieldName;
        });
        
        const newEndpointId = generateUniqueId();
        updatedActivities[newEndpointId] = {
          ...(lastActivityId ? updatedActivities[lastActivityId] : {}),
          isEndpoint: true,
          activityTitle: `Télécharger le PDF de votre journal de bord`,
          contextText: '<p></p>',
          customPlaceholder: '...',
          defaultText: '<p></p>',
          maxCharactersAllowed: 1000,
          useCharactersLimit: false,
          useCustomPlaceholder: false,
          token: '_',
          fieldName: endpointFieldName,
          index: textFields.length,
        };
      }
    }

    // Calculate statistics about removed activities
    const removedActivities = [];
    for (const [activityId, activity] of Object.entries(existingActivities)) {
      // Skip endpoint activities as they're handled separately
      if (activity.isEndpoint) continue;
      
      // If the activity has a fieldName and it's not in the new PDF, add it to removedActivities
      if (activity.fieldName && !newPdfFieldNames.includes(activity.fieldName)) {
        removedActivities.push({
          id: activityId,
          fieldName: activity.fieldName,
          title: activity.activityTitle
        });
      }
    }
    
    console.log(`Removed ${removedActivities.length} activities that no longer exist in the new PDF`);
    if (removedActivities.length > 0) {
      console.log('Removed activities:', removedActivities);
    }

    // Update tokens with the project ID
    for (const activityKey in updatedActivities) {
      if (updatedActivities.hasOwnProperty(activityKey)) {
        const tokenData = {
          source: 'brioeducation',
          project: project.id,
          exercice: activityKey,
        };

        // Only update tokens that are not set or are set to '_'
        if (!updatedActivities[activityKey].token || updatedActivities[activityKey].token === '_') {
          const token = await encryptContent(JSON.stringify(tokenData));
          updatedActivities[activityKey].token = token;
        }
      }
    }

    // Get the existing Files record linked to this project
    const fileRecords = await pb.collection('Files').getList(1, 1, {
      filter: `project~"${projectId}"`,
    });

    // If no Files record found, create a new one
    let fileRecord;
    if (fileRecords.items.length === 0) {
      console.log('No existing file record found, creating a new one');
      // Create a new Files record
      const formDataToUpload = new FormData();
      const pdfFilename = `project_${Date.now()}.pdf`;
      formDataToUpload.append('pdf', new Blob([pdfFileBuffer]), pdfFilename);
      
      if (coverImageBuffer) {
        formDataToUpload.append('cover_image', new Blob([coverImageBuffer]), 'cover_image.png');
      }

      fileRecord = await pb.collection('Files').create(formDataToUpload);
      
      // Update the Files record with the project relation
      await pb.collection('Files').update(fileRecord.id, {
        project: [projectId],
      });
    } else {
      // Update the existing Files record
      fileRecord = fileRecords.items[0];
      
      const formDataToUpload = new FormData();
      const pdfFilename = `project_${Date.now()}.pdf`;
      formDataToUpload.append('pdf', new Blob([pdfFileBuffer]), pdfFilename);
      
      if (coverImageBuffer) {
        formDataToUpload.append('cover_image', new Blob([coverImageBuffer]), 'cover_image.png');
      }

      await pb.collection('Files').update(fileRecord.id, formDataToUpload);
    }

    // Get the updated Files record to get the new file URLs
    const updatedRecord = await pb.collection('Files').getOne(fileRecord.id);
    const pdfFileName = updatedRecord.pdf;
    const coverImageName = updatedRecord.cover_image;

    const pdfFileUrl = pb.files.getUrl(updatedRecord, pdfFileName, { token: '' });
    const coverImageUrl = pb.files.getUrl(updatedRecord, coverImageName);

    // Update the project profile
    const updatedProfile = {
      ...project.profile,
      activities: updatedActivities,
      pdfFileSize: formatFileSize(pdfFileBuffer.length),
      pdfFilename: originalPdfFilename.replace(/\.pdf$/i, ''), // Remove .pdf extension
      pdfURL: pdfFileUrl,
      pdfCoverImgUrl: coverImageUrl,
    };

    // Update the project with the new profile
    await pb.collection('Projects').update(projectId, { 
      profile: updatedProfile,
      files: [updatedRecord.id], // Make sure the project has the correct file relation
    });

    console.log(`Project ${projectId} files updated successfully.`);
    return { 
      success: true, 
      projectId, 
      pdfFileUrl, 
      coverImageUrl,
      stats: {
        activitiesRemoved: removedActivities.length,
        activitiesTotal: Object.keys(updatedActivities).length,
        removedActivities: removedActivities
      }
    };
  } catch (error) {
    console.error('Error updating project files:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to update project files' });
  } finally {
    if (fs.existsSync(pdfTempPath)) fs.unlinkSync(pdfTempPath);
    if (fs.existsSync(`${outputImagePath}.png`)) fs.unlinkSync(`${outputImagePath}.png`);
  }
});