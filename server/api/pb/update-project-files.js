// server/api/update-project-files.js

import { pb } from '~/server/plugins/pocketbase';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';


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

    // Find the existing Files record linked to this project
    const fileRecords = await pb.collection('Files').getList(1, 1, {
      filter: `projectId="${projectId}"`,
    });

    if (fileRecords.items.length === 0) {
      throw createError({ statusCode: 404, message: 'No Files record found for this project ID' });
    }

    const fileRecord = fileRecords.items[0];

    // Save the new PDF temporarily
    fs.writeFileSync(pdfTempPath, pdfFileBuffer);

    // Load the PDF with PDFLib
    const pdfDoc = await PDFDocument.load(pdfFileBuffer);

    // Prepare new form data for the updated files
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
    const project = await pb.collection('Projects').getOne(projectId);
    const updatedProfile = {
      ...project.profile,
      pdfFileSize: formatFileSize(pdfFileBuffer.length),
      pdfFilename: originalPdfFilename,
      pdfURL: pdfFileUrl,
      pdfCoverImgUrl: coverImageUrl,
    };

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
