import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase('https://jdb.pockethost.io/'); // Replace with your Pocketbase URL

// Function to authenticate admin
async function authenticateAdmin() {
  try {
    await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);
    console.log('Pocketbase admin authenticated successfully.');
  } catch (error) {
    console.error('Failed to authenticate admin:', error.message);
    throw new Error('Pocketbase admin authentication failed.');
  }
}

// Call the authentication function inside the plugin
export default defineNitroPlugin(async (nitroApp) => {
  await authenticateAdmin(); // Authenticate admin on plugin load
  console.log('Pocketbase plugin initialized.');

  // Provide the Pocketbase instance globally
  nitroApp.hooks.hook('app:ready', () => {
    console.log('App is ready.');
  });

  return {
    provide: {
      pb, // Provide the Pocketbase instance
    },
  };
});

// Export PocketBase instance for direct use in server routes
export { pb };
