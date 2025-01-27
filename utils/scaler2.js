export default function ScalerForContainer(parentContainer) {
    const _width = 800; // Target width of the container
    const _height = 449; // Target height of the container
  
    try {
      if (!parentContainer) {
        throw new Error("Parent container is required.");
      }
  
      // Reset previous styles
      parentContainer.style.removeProperty('transform-origin');
      parentContainer.style.removeProperty('transform');
      parentContainer.style.removeProperty('height');
      parentContainer.style.removeProperty('width');
      
      // Get the parent container dimensions
      const parentWidth = parentContainer.offsetWidth;
      const parentHeight = parentContainer.offsetHeight;
  
      // Calculate the scale factors based on the target ratio
      const scaleWidth = parentWidth / _width;
      const scaleHeight = parentHeight / _height;
      const scale = Math.min(scaleWidth, scaleHeight); // Fit content to container
  
      // Set the width and height of the parent container to maintain the aspect ratio
      parentContainer.style.width = `${_width * scale}px`;
      parentContainer.style.height = `${_height * scale}px`;
  
      // Prevent overflow within the parent container
      parentContainer.style.overflow = 'hidden';
  
      // Select the custom component and apply scaling
      const customComponent = parentContainer.querySelector('.custom-component');
      if (customComponent) {
        customComponent.style.transform = `scale(${scale})`;
        customComponent.style.width = '100%';  // Fill width of parent container
        customComponent.style.height = '100%'; // Fill height of parent container
      }
    } catch (error) {
      console.error('ScalerForContainer error:', error);
    }
  }
  
  // Initialize scaler with event listeners
  export function initializeContainerScaler(parentContainer) {
    const resizeHandler = () => ScalerForContainer(parentContainer);
  
    // Apply Scaler on window resize
    window.addEventListener('resize', resizeHandler);
  
    // Trigger scaling initially
    resizeHandler();
  
    // Cleanup function (optional, if you need to remove event listeners)
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }
  