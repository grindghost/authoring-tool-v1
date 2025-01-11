import PocketBase from 'pocketbase';

const pb = new PocketBase('https://jdb.pockethost.io');

export const getAccountsByEmail = async (email) => {

  // Check if already authenticated
  if (!pb.authStore.isValid) {
    console.log('🔑 Authenticating as admin...');
    try {
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      );
      console.log('🔥 Authenticated as admin...');
    } catch (error) {
      console.error('❌ Failed to authenticate as admin:', error);
      return [];
    }
  } else {
    console.log('✅ Already authenticated as admin.');
  }

  pb.autoCancellation(false);

  try {
    return await pb.collection('accounts').getFullList({
      filter: `user.email = "${email}"`,
      expand: 'user', // Expand the 'user' relation if you need related data.
    });
  } catch (error) {
    console.error('❌ Error fetching accounts:', error);
    return [];
  }
};
