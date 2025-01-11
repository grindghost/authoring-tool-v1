import { stripe } from '~/server/utils/stripe';
import { getServerSession } from '#auth';
import PocketBase from 'pocketbase';

const baseUrl = 'https://authoring-tool-v1.vercel.app';
const pb = new PocketBase('https://jdb.pockethost.io');

export default eventHandler(async event => {

  // Authenticate admin in PocketBase
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );

  pb.autoCancellation(false);
  console.log('Authenticated as admin...');

  // Get the server session 
  const session = await getServerSession(event);

  if (!session?.user?.email) {
    return { error: 'User not authenticated' }
  }

  const account = await pb.collection('accounts').getFirstListItem(
    `user.email = "${session.user.email}"`, 
    { expand: 'user' }
  );

  if (!account?.stripe_customer_id) {
    return { error: 'Stripe customer not found' }
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: baseUrl,
  })

  return { url: portalSession.url }
})