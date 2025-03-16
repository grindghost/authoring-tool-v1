// server/api/create-project.js

import { pb } from '~/server/plugins/pocketbase';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { decryptContent, encryptContent } from '~/server/utils/services';
import { getServerSession } from '#auth';
import { replaceInDesignSpecialChars } from '~/server/utils/replaceInDesignSpecialChars';

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
  
  // Get access to the passed PDF file
  const formData = await readMultipartFormData(event);
  const projectName = formData.find((field) => field.name === 'projectName').data.toString();
  const projectDescription = formData.find((field) => field.name === 'projectDescription').data.toString();
  const courseId = formData.find((field) => field.name === 'courseId').data.toString();

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

     // Check if the PDF contains text fields, and extract them from the PDF
    // const textFields = pdfDoc.getForm().getFields();
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
    console.log(storeData);

    // Throw an error if no valid text fields are found
    if (textFields.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid text fields found in the PDF',
      });
    }

    // Prepare a new form data with the PDF file and the cover image for Pocketbase
    const formDataToUpload = new FormData();
    const pdfFilename = `project_${Date.now()}.pdf`; // Desired filename for the PDF
    formDataToUpload.append('pdf', new Blob([pdfFileBuffer]), pdfFilename);
    formDataToUpload.append('cover_image', new Blob([coverImageBuffer]), 'cover_image.png');

    // Create the record in the Files collection with the PDF and cover image
    const fileRecord = await pb.collection('Files').create(formDataToUpload);

    // Retrieve the record to get the filename and URL for each file
    const pdfFileName = fileRecord.pdf; // Retrieve the filename stored in the record
    const coverImageName = fileRecord.cover_image;

    // Generate the correct URLs
    const pdfFileUrl = pb.files.getUrl(fileRecord, pdfFileName, { token: '' });
    const coverImageUrl = pb.files.getUrl(fileRecord, coverImageName);

    // Create the activities from the text fields
    const activities = {};

    // Generate a unique token for each activity
    const generateUniqueId = () => {
      let id;
      do {
        id = crypto.randomUUID();
      } while (activities[id]); // Ensure no duplicate keys
      return id;
    };

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

      // Get the default text for the field from the store data
      const defaultText = storeData[fieldName] || '<p></p>';
 
      // Generate a unique ID
      const id = generateUniqueId();

      activities[id] = {
        activityTitle: `Exercice ${index + 1}`,
        contextText: '<p></p>',
        customPlaceholder: '...',
        defaultText: defaultText,
        isEndpoint: false,
        maxCharactersAllowed: 1000,
        useCharactersLimit: false,
        useCustomPlaceholder : false,
        token: '_',
        fieldName: fieldName,
        index: index,
      };
    });
    
    // Add an additional endpoint activity, duplicating the last activity
    if (textFields.length > 0) {
      const lastFieldName = textFields[textFields.length - 1].getName();
      const endpointFieldName = `${lastFieldName}_endpoint`;

      // Generate a unique ID
      const id = generateUniqueId();

      activities[id] = {
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
        fieldName: endpointFieldName,
        index: textFields.length,
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
        courseId: courseId,
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
      files: [fileRecord.id],
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
    const updatedProject = await pb.collection('Projects').update(project.id, {
      profile: {
        ...project.profile, // Keep other project profile properties
        activities, // Include updated activities with tokens
      },
    });

    // Update the Files record with the new project ID (as a relation)
    await pb.collection('Files').update(fileRecord.id, {
      project: [project.id],
    });

    console.log(`Project ${project.id} created successfully.`);
    return { projectId: project.id, project: updatedProject, success: true };

  } catch (error) {
    console.error('Error creating project:', error.message);
    throw createError({ statusCode: 500, message: 'Failed to create project' });
  } finally {
    if (fs.existsSync(pdfTempPath)) fs.unlinkSync(pdfTempPath);
    if (fs.existsSync(`${outputImagePath}.png`)) fs.unlinkSync(`${outputImagePath}.png`);
  }
});

