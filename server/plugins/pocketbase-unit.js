import PocketBase from 'pocketbase';

let isAuthenticated = false;

// Initialize PocketBase client
const pb = new PocketBase('https://jdb.pockethost.io/'); // Replace with your Pocketbase URL

// globally disable auto cancellation
pb.autoCancellation(false);

async function ensureAuthenticated(origin) {
  
  // Check if the admin is authenticated
  console.log('Checking auth status from :', `${origin}`);

  if (!pb.authStore.isValid || !isAuthenticated) {
    let retries = 3;
    while (retries > 0) {
      console.log(`Retrying authentication. Retries left: ${retries}`);
      try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD, {
          autoRefreshThreshold: 30 * 60,
          autoCancel: false,
        });
        console.log('Pocketbase admin re-authenticated successfully.');
        isAuthenticated = true;
        break;
      } catch (error) {
        retries -= 1;
        console.error(`Authentication attempt failed. Retries left: ${retries}`, error.message);
        if (retries === 0) throw new Error('Pocketbase admin authentication failed.');
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
  }
}


// Function to ensure the admin is authenticated
async function _ensureAuthenticated(origin) {

  console.log('Checking auth status from :', `${origin}`);
  
  if (!pb.authStore.isValid || !isAuthenticated) {
    try {
      await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD, {
        autoRefreshThreshold: 30 * 60,
        autoCancel: false, // Prevents auto-cancellation of this request
      });
      console.log('Re-authenticated admin successfully.');
      isAuthenticated = true;
    } catch (error) {
      console.error('Failed to authenticate admin:', error.message);
      throw new Error('Pocketbase admin authentication failed.');
    }
  }
}


// Function to authenticate admin
async function authenticateAdmin() {
  try {
    await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD, {
      // This will trigger auto refresh or auto reauthentication in case
      // the token has expired or is going to expire in the next 30 minutes.
      autoRefreshThreshold: 30 * 60
    });
    console.log('Pocketbase admin authenticated successfully.');
  } catch (error) {
    console.error('Failed to authenticate admin:', error.message);
    throw new Error('Pocketbase admin authentication failed.');
  }
}

// Call the authentication function inside the plugin
export default defineNitroPlugin(async (nitroApp) => {
  // await authenticateAdmin(); // Authenticate admin on plugin load
  await ensureAuthenticated("Plugin");
  console.log('Pocketbase plugin initialized.');

  // Provide the Pocketbase instance globally
  nitroApp.hooks.hook('app:ready', () => {
    console.log('App is ready.');
  });

  return {
    provide: {
      pb, // Provide the Pocketbase instance
      ensureAuthenticated,
    },
  };
});

// Export PocketBase instance for direct use in server routes
export { pb, ensureAuthenticated };
