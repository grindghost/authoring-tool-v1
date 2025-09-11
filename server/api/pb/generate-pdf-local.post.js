import { PDFDocument, PDFBool, PDFName } from 'pdf-lib';
import emojiStrip from 'emoji-strip';
import { pb, ensureAuthenticated } from '~/server/plugins/pocketbase-unit'; // Import Pocketbase instance
import { getCookie, setCookie, createError, readBody, getMethod, setResponseHeaders } from 'h3';
import { validateOrCreateUser, decryptContent, convertQuillHtmlToText } from '~/server/utils/services';

export default defineEventHandler(async (event) => {
  // Set CORS headers
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  if (getMethod(event) === 'OPTIONS') {
    return 'OK'; // Handle preflight requests
  }

  const backpackId = getCookie(event, 'backpackId'); // Get backpackId from the cookie
  const { answers, pdfUrl } = await readBody(event); // Read POST body

  await ensureAuthenticated("Generate PDF from Local"); // Ensure authentication before each request

  try {

    // Read the answers array as json
    const answersJson = JSON.parse(answers);
    console.log('Received answers:', answersJson);

    const formData = {};
    const pdfURL = pdfUrl; // URL or file path to the PDF form

    // Helper function to remove BOM and non-printable characters
    const cleanText = (text) => {
      // Remove BOM character if present
      const noBOM = text.replace(/^\uFEFF/, '');

      // Remove non-printable Unicode characters (control characters)
      return noBOM.replace(/[^\P{C}\n\r\t]/gu, ''); // Removes control chars but keeps \n, \r, \t

    };

    // Check if the answers array is empty  
    if (answersJson.length === 0) {

      // Load the PDF form
      const response = await fetch(pdfURL);
      const pdfBytes = await response.arrayBuffer();
      
      // Set response headers and return the PDF as a binary response
      event.res.setHeader('Content-Type', 'application/pdf');

      return new Uint8Array(pdfBytes); // Return binary data

    }

    // iterate over the objects in the answers array
    for (const answer of answersJson) {
      const activityId = answer.activityId;
      
      const answerContent = answer.answer;

      // Convert HTML to plain text while preserving structure
      const plainTextAnswer = convertQuillHtmlToText(answerContent);
    
      // Remove emojis, trim, and clean text
      const noEmojisAnswer = emojiStrip(plainTextAnswer).trim();
      const cleanedAnswer = cleanText(noEmojisAnswer); // Clean the text
      
      // Map the activityId to the corresponding cleaned answer
      formData[activityId] = cleanedAnswer;

    }

    // Load the PDF form
    const response = await fetch(pdfURL);
    const pdfBytes = await response.arrayBuffer();

    // Load the PDF and fill the form fields
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Fill the PDF form fields with the retrieved data
    const fields = form.getFields();
    fields.forEach((field) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;

      // Check if the field is a PDFTextField, to avoid errors when filling it: This tool is only to fill text fields...
      if (formData[fieldName] && fieldType == 'PDFTextField') {
        field.setText(formData[fieldName]); // Fill field if answer exists
        field.disableRichFormatting();

        // Fix the blink issue (with the black + sign and invisible text)
        field.acroField.dict.set(
          PDFName.of('NeedAppearances'),
          PDFBool.True
        );

      } else {
        console.warn(`No answer found for field: ${fieldName}`); // Skip if no answer
      }
    });

    // Important: regenerate appearance streams so text is visible immediately
    form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True);
    form.updateFieldAppearances();

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();

    // Set response headers and return the PDF as a binary response
    event.res.setHeader('Content-Type', 'application/pdf');
    return new Uint8Array(filledPdfBytes); // Return binary data

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw createError({ statusCode: 500, message: 'Failed to generate PDF' });
  }
});
