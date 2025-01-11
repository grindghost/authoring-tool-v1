import { stripe } from '~/server/utils/stripe';
import { getServerSession } from '#auth';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://jdb.pockethost.io');

export default eventHandler(async event => {
  // Parse the request body
  const { lookup_key } = await readBody(event);

  // Authenticate admin in PocketBase
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );

  pb.autoCancellation(false);
  console.log('Authenticated as admin...');

  // Get the server session
  const authSession = await getServerSession(event);

  if (authSession && authSession.user?.email) {
    // Fetch the account associated with the user email
    const accounts = await pb.collection('accounts').getList(1, 1, {
      filter: `user.email="${authSession.user.email}"`,
      expand: 'user',
    });
    const account = accounts.items[0];

    if (account && account.stripe_customer_id && !account.is_subscribed) {
      // Fetch Stripe prices
      const prices = await stripe.prices.list({
        lookup_keys: [lookup_key],
        expand: ['data.product'],
      });

      // Create a checkout session in Stripe
      const session = await stripe.checkout.sessions.create({
        customer: account.stripe_customer_id,         // Stripe customer ID
        billing_address_collection: 'auto',          // Automatically collect billing address
        line_items: [                                 // Line items for the subscription
          {
            price: prices.data[0].id,
            quantity: 1,
          },
        ],
        mode: 'subscription',                         // Set the mode to 'subscription'
        success_url: `http://localhost:3000/success`, // URL for successful subscription
        cancel_url: `http://localhost:3000/cancelled`,// URL for cancelled subscription
      });

      if (session.url) {
        return { url: session.url };
      }
    } else {
      console.log('Account not found or already subscribed.');
    }
  }
});
