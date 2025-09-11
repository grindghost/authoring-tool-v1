import { PDFDocument, PDFBool, PDFName } from 'pdf-lib';
import emojiStrip from 'emoji-strip';
import { pb } from '~/server/plugins/pocketbase-unit';
import { getServerSession } from '#auth';
import { decryptContent, convertQuillHtmlToText } from '~/server/utils/services';

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

  try {
    const { projectId, backpackId } = await readBody(event);

    if (!projectId || !backpackId) {
      throw createError({
        statusCode: 400,
        message: 'projectId and backpackId are required',
      });
    }

    // Get the project from the `Projects` collection
    const currentProject = await pb.collection('Projects').getFirstListItem(`id = '${projectId}'`);

    // Query the history collection for all events related to the project and backpack
    let allEvents = [];
    try {
      allEvents = await pb.collection('history').getFullList(200, {
        filter: `backpackId = '${backpackId}' && courseId = '${projectId}'`,
        sort: '-date', // Get the most recent events first
      });
    } catch (error) {
      // No matching events found, proceed with empty form data
      console.warn('No matching historic events found:', error.message);
    }

    // Group events by activityId and get the most recent one per activity
    const latestEvents = allEvents.reduce((acc, event) => {
      const { activityId, date } = event;
      if (!acc[activityId] || new Date(event.date) > new Date(acc[activityId].date)) {
        acc[activityId] = event; // Keep only the latest event for each activityId
      }
      return acc;
    }, {});

    const formData = {};

    // Helper function to remove BOM and non-printable characters
    const cleanText = (text) => {
      // Remove BOM character if present
      const noBOM = text.replace(/^\uFEFF/, '');
      // Remove non-printable Unicode characters (control characters)
      return noBOM.replace(/[^\P{C}\n\r\t]/gu, ''); // Removes control chars but keeps \n, \r, \t
    };

    // Populate formData with the most recent answers per activity
    for (const [activityId, event] of Object.entries(latestEvents)) {
      // Check in the currentProject.profile and get the activity with the current activityId and extract its fieldName key
      const activity = currentProject.profile.activities[activityId];
      const fieldName = activity.fieldName;
      
      // Decrypt the content
      const decryptedContent = await decryptContent(event.answer); 

      // Convert HTML to plain text while preserving structure
      const plainTextAnswer = convertQuillHtmlToText(decryptedContent);
    
      // Remove emojis, trim, and clean text
      const noEmojisAnswer = emojiStrip(plainTextAnswer).trim();
      const cleanedAnswer = cleanText(noEmojisAnswer); // Clean the text

      console.log(`Plain answer for activityId ${fieldName}: ${plainTextAnswer}`);
      console.log(`Answer for activityId ${fieldName}: ${cleanedAnswer}`);
    
      // Map the activityId to the corresponding cleaned answer
      formData[fieldName] = cleanedAnswer;
    }

    // Get the PDF URL dynamically, from the currentProject files field
    // Get the first file ID (supposed to be just one)
    const fileID = currentProject.files[0];

    // Get the corresponding Files record
    const fileRecord = await pb.collection('Files').getFirstListItem(`id = '${fileID}'`);
    
    // Retrieve the filename stored in the record
    const pdfFileName = fileRecord.pdf; 
    
    // Generate the correct URLs
    const pdfUrl = pb.files.getUrl(fileRecord, pdfFileName, { token: '' });
    console.log('PDF URL:', pdfUrl);

    const response = await fetch(pdfUrl);
    const pdfBytes = await response.arrayBuffer();

    // Load the PDF and fill the form fields
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Fill the PDF form fields with the retrieved data
    const fields = form.getFields();
    fields.forEach((field) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;

      // Check if the field is a PDFTextField, to avoid errors when filling it
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
    event.res.setHeader('Content-Disposition', `attachment; filename=user-${backpackId}-project-${projectId}.pdf`);
    return new Uint8Array(filledPdfBytes); // Return binary data

  } catch (error) {
    console.error('Error generating PDF for user:', error);
    throw createError({ statusCode: 500, message: 'Failed to generate PDF for user' });
  }
}); 