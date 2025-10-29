import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useStatusStore } from './status';

import DOMPurify from 'dompurify';
import Bowser from "bowser"; // To detect browser... (especially for Firefox)
import { set } from 'date-fns';

export const useAppStateStore = defineStore('app', () => {

  // States
  const unitToken = ref('');
  const unitProfile = ref(null);
  const lang = ref('fr');
  const actor = ref('');
  const registration = ref('');

  const mode = ref('');
  const editorContent = ref('');

  // Status messages
  const statusStore = useStatusStore();

  // Initialize the status message with "loading"
  const statusMessage = ref('');

  // Timers
  const startTime = ref(0);
  const endTime = ref(0);
  const timeElapsed = ref(0);

  const isLoading = ref(true);
  const isMaintenanceMode = ref(false); // From global config
  const isEndpoint = ref(false); // From global config
  const historyContent = ref(null); // From global config or fetched data
  const overlayVisible = ref(true); // Controls whether the overlay container is visible
  const currentOverlay = ref('loading'); // Tracks the current overlay ('loading', 'completed', 'isEndpoint', 'maintenance', or null)

  // Getters
  const enableEditor = computed(() => !overlayVisible.value && !isLoading.value);

  const resetAppState = () => {

    // Get the current state of the overlayVisible
    const overlayVisibleState = computed(() => {
      if (isLoading.value || isMaintenanceMode.value || isEndpoint.value) {
        return true;        
      }
      return false;
    });

    unitToken.value = '';
    unitProfile.value = null;

    mode.value = '';
    editorContent.value = '<p></p>';
    statusMessage.value = '';
    
    startTime.value = 0;
    endTime.value = 0;
    timeElapsed.value = 0;
    
    isLoading.value = true;
    isMaintenanceMode.value = false;
    isEndpoint.value = false;
    overlayVisible.value = overlayVisibleState;
    currentOverlay.value = 'loading';
  };
  
  const GetUnitProfile = async (token, language, actorParam, registrationParam) => {

    // Assign the token
    unitToken.value = token;

    // Assign the local lang (for the status message) from the token
    lang.value = language;

    // Assign the actor
    actor.value = actorParam;

    // Assign the registration
    registration.value = registrationParam;

    // Start the loading status
    isLoading.value = true;

    // Set the status message
    statusMessage.value = statusStore.status[lang.value].loading;

    // Fetch the unit profile
    unitProfile.value = await fetchFromApi(`/pb/profile?token=${encodeURIComponent(token)}&lang=${lang.value}&actor=${actorParam}`);

    // Start the loading status
    isLoading.value = false;

    // Return the Unit Profile
    return unitProfile.value;
  };

  // Pinia handler to handle API requests (adjusted to include credentials for cookies)  // API request handler using Nuxt's built-in fetch function
  const fetchFromApi = async (endpoint, method = 'GET', body = null, isBinary = false) => {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json'},
        body: body ? JSON.stringify(body) : null
      });
      if (!response.ok) throw new Error('API error');

      // Check if binary response is expected (like a PDF)
      if (isBinary) {
        return await response.arrayBuffer();  // Return binary data as ArrayBuffer
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return null;
    }
  };

  // Actions
  const SetUnitStateOnArrival = async (profile) => {

    // Make sure the unit profile is not null
    // When the object is passed directly as a static object
    if (unitProfile.value == null) {

      // Assign the profile
      unitProfile.value = profile;

      // Assign the token (assuming its there...)
      unitToken.value = profile.activity.token;
    }

    isMaintenanceMode.value = profile?.configs?.maintenanceMode;
    isEndpoint.value = profile?.activity?.isEndpoint;
    historyContent.value = profile?.history;
    
    // Check if there's a message (for error handling)
    if (profile?.message !== null) {
      currentOverlay.value = 'message';
      return;
    }

    if (isMaintenanceMode.value) {
      currentOverlay.value = 'maintenance';
      return; // Exit the function

    } else if (isEndpoint.value) {
      currentOverlay.value = 'isEndpoint';
    } else if (historyContent.value === null) {
      overlayVisible.value = false;
      currentOverlay.value = null;

      // Start the timer
      startTime.value = performance.now();
      console.log('Timer started for this session.');

    } else {

      // Check if the profile contains a mockup key and if it is set to true
      if (unitProfile.value.mockup) {
        
        // In "mockup", we don't need to show the completed overlay
        console.log('Mockup mode enabled for this session.');
        overlayVisible.value = false;
        currentOverlay.value = null;
      
      } else {
        mode.value = 'edition';
        currentOverlay.value = 'completed';
      }

      // Logic to assing a value to the editor content
      editorContent.value = historyContent.value;
    }

    // Logic to assing a value to the editor content
    if (historyContent.value === null) {
      if (unitProfile.value.activity.useDefaultText) {
        editorContent.value = unitProfile.value.activity.defaultText;
      } else {
        // If the useDefaultText is false, set the editor content to an empty string to trigger the quill editor to show the placeholder text
        editorContent.value = "";
      }
    } else {
      editorContent.value = historyContent.value;
    }

    isLoading.value = false;

  };

  const hideOverlay = () => {
    overlayVisible.value = false;
    currentOverlay.value = null;

    // Reset the timer, when the editor is shown
    startTime.value = performance.now();
    endTime.value = 0;
    console.log('Timer reset for this session.');

  };

  const showCompletedOverlay = () => {
    overlayVisible.value = true;
    currentOverlay.value = 'completed';
  };

  const submitEditor = async () => {

    // Check if maintenance mode is enabled
    if (isMaintenanceMode.value) {
      return;
    }
    
    overlayVisible.value = true;
    currentOverlay.value = 'loading';

    // Check if the unitProfile contains a "mockup" key and is set to true
    if (unitProfile.value.mockup) {

      saveAnswerToLocalStorage(unitProfile.value.project.id, unitProfile.value.activity.id, editorContent.value);
      currentOverlay.value = 'completed';
      // If the save was successful, set the mode to edition
      mode.value = 'edition';
      return;
    }

    try {
      await saveToDatabase();
      // Save to localStorage as well
      saveAnswerToLocalStorage(unitProfile.value.project.id, unitProfile.value.activity.id, editorContent.value);
    
      currentOverlay.value = 'completed';

      // If the save was successful, set the mode to edition
      mode.value = 'edition';

      return;
      
    } catch (error) {
      console.error('Failed to save:', error);
      currentOverlay.value = 'completed'; // Optionally handle errors differently
    }
  };

  const saveToDatabase = async () => {
  
    // Set the status message
    statusMessage.value = statusStore.status[lang.value].saveAnswer;

    // Get a timestamp, and the time elapsed since the start of the session
    const timestamp = Date.now().toString();
    endTime.value = performance.now();  

    // Get the time difference
    const timeDiff = (endTime.value - startTime.value) / 1000;
    timeElapsed.value = Math.round(timeDiff);
    
    // Sanitize the content on the client
    const sanitizedContent = DOMPurify.sanitize(editorContent.value, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'br',
        'ul', 'ol', 'li', 'b', 'i', 'u', 'strike', 'em', 'strong', 's',
        'div'
      ],
      ALLOWED_ATTR: ['class', 'id', 'style', 'data-list'],
      ALLOWED_CLASSES: {
        'div': ['ql-code-block'] // ✅ Allow class 'ql-code-block' on divs
      }
    });

    // Reset the current editor content with the sanitized value (to make sure...)
    editorContent.value = sanitizedContent;

    // Send the sanitized content to the API
    const response = await fetchFromApi('/pb/answer', 'POST', {
      token: unitToken.value,
      data: sanitizedContent,
      date: timestamp,
      timeElapsed: timeElapsed.value,
      registration: registration.value,
      actor: actor.value,
    });
  
    if (response && response.message === 'Data saved successfully') {
      return;
    } else {
      console.error("Failed to save the answer");
    }
  };

  const getAnswerFromLocalStorage = (projectId, activityId) => {
    // Check if local storage contains a answers object, if not create one
    if (!localStorage.getItem('fallbackHistory')) {
      localStorage.setItem('fallbackHistory', JSON.stringify([]));
    }

    // Get the answers object from local storage
    const answers = JSON.parse(localStorage.getItem('fallbackHistory'));

    // Find the answer for the given projectId and activityId
    const answer = answers.find((a) => a.projectId === projectId && a.activityId === activityId);

    if (answer) {
      // If the answer is found, return it

      const sanitizedAnswer = DOMPurify.sanitize(answer.answer, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'br',
          'ul', 'ol', 'li', 'b', 'i', 'u', 'strike', 'em', 'strong', 's',
          'div'
        ],
        ALLOWED_ATTR: ['class', 'id', 'style', 'data-list'],
        ALLOWED_CLASSES: {
          'div': ['ql-code-block'] // ✅ Allow class 'ql-code-block' on divs
        }
      });

      return sanitizedAnswer;

    } else {
      // If the answer is not found, return null
      return null;
    }
  }

  const saveAnswerToLocalStorage = (projectId, activityId, answer) => {
    // Check if local storage contains a answers object, if not create one
    if (!localStorage.getItem('fallbackHistory')) {
      localStorage.setItem('fallbackHistory', JSON.stringify([]));
    }

    const sanitizedAnswer = DOMPurify.sanitize(answer, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'br',
        'ul', 'ol', 'li', 'b', 'i', 'u', 'strike', 'em', 'strong', 's',
        'div'
      ],
      ALLOWED_ATTR: ['class', 'id', 'style', 'data-list'],
      ALLOWED_CLASSES: {
        'div': ['ql-code-block'] // ✅ Allow class 'ql-code-block' on divs
      }
    });  

    // Get the answers object from local storage
    const answers = JSON.parse(localStorage.getItem('fallbackHistory'));

    // Find the answer for the given projectId and activityId
    const existingAnswer = answers.find((a) => a.projectId === projectId && a.activityId === activityId);

    if (existingAnswer) {
      // If the answer is found, update it
      existingAnswer.answer = sanitizedAnswer;
      existingAnswer.activityId = activityId;
      existingAnswer.projectId = projectId;
    } else {
      // If the answer is not found, add it to the answers array
      answers.push({ projectId, activityId, answer: sanitizedAnswer });
    }

    // Update the answers object in local storage
    localStorage.setItem('fallbackHistory', JSON.stringify(answers));
  }

  const handleDownloadFilledPdf = async() => {
    // Check if unitProfile has a key "mockup" and is set to true
    if (unitProfile.value.mockup) {

      // Check the virtual history array in the local storage, and check if it exists, if not initialize it to an empty array
      if (!localStorage.getItem('fallbackHistory')) {
        localStorage.setItem('fallbackHistory', JSON.stringify([]));
      }

      // Decrypt the virtual history array from the local storage
      // ...

      // Get the virtual history array from the local storage
      const fallbackHistory = JSON.parse(localStorage.getItem('fallbackHistory'));

      // Filter the answers and create an array of the answers objects where the projectId matches the current project
      const answers = fallbackHistory.filter((a) => a.projectId === unitProfile.value.project.id);

      const answersString = JSON.stringify(answers);

      await downloadFilledPdfLocal(answersString);
      return;
    
      // If not mockup, download the filled PDF with the answers from the database
    } else {
      await downloadFilledPdf();
      return;
    }
  }

  const downloadFilledPdfLocal = async (answers) => {

    // Check if maintenance mode is enabled
    if (isMaintenanceMode.value) {
      return;
    }
    overlayVisible.value = true;
    currentOverlay.value = 'loading';
  
    // Set the status message
    statusMessage.value = statusStore.status[lang.value].downloadPDF;
  
    try {
      // Send the request without the userId, as it's handled by the server
      const response = await fetchFromApi('/pb/generate-pdf-local', 'POST', {
        answers: answers,
        pdfUrl: unitProfile.value.project.profile.pdfURL,
      }, true);  // Pass true to indicate a binary response (PDF)
  
      if (response) {
        // Extract filename from the unit profile
        const filename = `${unitProfile.value["project"]["profile"]["pdfFilename"]}.pdf`;
        
        // Check if the current browser is Firefox (discover this on 11 december 2022)
        let currentBrowser = Bowser.getParser(window.navigator.userAgent);
  
        if (currentBrowser.parsedResult.browser.name == "Firefox") {
          const blob = new Blob([response], { type: 'application/pdf' });
          var fileURL = await window.URL.createObjectURL(blob);
          let tab = window.open();
          tab.location.href = fileURL;
        } else {
          // Handle binary PDF data for other browsers
          const blob = new Blob([response], { type: 'application/pdf' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Failed to download filled PDF:', error);
    }
    // Reset the overlay to the endpoint
    currentOverlay.value = 'isEndpoint';
    return;
  };

  const downloadFilledPdf = async () => {

    // Check if maintenance mode is enabled
    if (isMaintenanceMode.value) {
      return;
    }
    overlayVisible.value = true;
    currentOverlay.value = 'loading';
  
    // Set the status message
    statusMessage.value = statusStore.status[lang.value].downloadPDF;
  
    try {
      // Send the request without the userId, as it's handled by the server
      const response = await fetchFromApi('/pb/generate-pdf', 'POST', {
        token: unitToken.value,
        actor: actor.value,
      }, true);  // Pass true to indicate a binary response (PDF)
  
      if (response) {
        // Extract filename from the unit profile
        const filename = `${unitProfile.value["project"]["profile"]["pdfFilename"]}.pdf`;
        
        // Check if the current browser is Firefox (discover this on 11 december 2022)
        let currentBrowser = Bowser.getParser(window.navigator.userAgent);
  
        if (currentBrowser.parsedResult.browser.name == "Firefox") {
          const blob = new Blob([response], { type: 'application/pdf' });
          var fileURL = await window.URL.createObjectURL(blob);
          let tab = window.open();
          tab.location.href = fileURL;
        } else {
          // Handle binary PDF data for other browsers
          const blob = new Blob([response], { type: 'application/pdf' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Failed to download filled PDF:', error);
    }
    // Reset the overlay to the endpoint
    currentOverlay.value = 'isEndpoint';
    return;
  };

  const RestoreDefaultText = () => {
    const defaultText = unitProfile.value.activity.defaultText;
    const sanitizedContent = DOMPurify.sanitize(defaultText);
    editorContent.value = sanitizedContent;
  };

  return {
    isLoading,
    isMaintenanceMode,
    isEndpoint,
    historyContent,
    overlayVisible,
    currentOverlay,
    enableEditor,

    unitProfile,
    lang,
    mode,
    statusMessage,
    editorContent,
    unitToken,

    GetUnitProfile,
    resetAppState,
    SetUnitStateOnArrival,

    hideOverlay,
    showCompletedOverlay,
    submitEditor,
    downloadFilledPdf,
    handleDownloadFilledPdf,

    getAnswerFromLocalStorage,
    saveAnswerToLocalStorage,

    RestoreDefaultText,
  };
});
