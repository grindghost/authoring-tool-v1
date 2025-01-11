// server/api/stripe/webhook.ts
import { stripe } from '~/server/utils/stripe';
import PocketBase from 'pocketbase';

const runtimeConfig = useRuntimeConfig();
const pb = new PocketBase('https://jdb.pockethost.io');

export default eventHandler(async (event) => {
  // 1. Parse the raw request body and extract Stripe signature
  const body = await readRawBody(event, false);
  let stripeEvent: any = body;
  let subscription;
  let status;
  let plan;

  const signature = getHeader(event, 'stripe-signature');

  if (!body) {
    return { error: 'Invalid request body' };
  }

  if (!signature) {
    return { error: 'Invalid stripe-signature' };
  }

  // 2. Validate the Stripe event
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      runtimeConfig.STRIPE_WEBHOOK_SECRET_KEY
    );
  } catch (err) {
    const error = createError({
      statusCode: 400,
      statusMessage: `Webhook error: ${err}`,
    });
    return sendError(event, error);
  }

  // Authenticate as PocketBase admin
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );

  pb.autoCancellation(false);

  // 3. Handle the event types
  switch (stripeEvent.type) {
    // 4. Handle subscription deletion
    case 'customer.subscription.deleted':
      subscription = stripeEvent.data.object;
      status = subscription.status;

      await updatePocketBaseAccount(subscription.customer, {
        is_subscribed: false,
      });

      break;

    // 5. Handle subscription creation
    case 'customer.subscription.created':
      subscription = stripeEvent.data.object;
      status = subscription.status;
      plan = stripeEvent.data.object.items.data[0].price.lookup_key;

      await updatePocketBaseAccount(subscription.customer, {
        is_subscribed: true,
        plan,
      });

      break;

    // 6. Handle subscription creation
    case 'customer.subscription.updated':
      subscription = stripeEvent.data.object;
      status = subscription.status;
      plan = stripeEvent.data.object.items.data[0].price.lookup_key;

      await updatePocketBaseAccount(subscription.customer, {
        plan,
      });

      break;

    default:
      console.log(`Unhandled event type ${stripeEvent.type}.`);
  }

  return { received: true };
});

// Helper function to update PocketBase account
async function updatePocketBaseAccount(customerId: string, updateData: any) {
  try {
    const accounts = await pb.collection('accounts').getList(1, 1, {
      filter: `stripe_customer_id="${customerId}"`,
    });

    const account = accounts.items[0];
    if (account) {
      await pb.collection('accounts').update(account.id, updateData);
      console.log(
        `Account with stripe_customer_id=${customerId} updated successfully...`
      );
    } else {
      console.error(
        `No account found for stripe_customer_id=${customerId}.`
      );
    }
  } catch (error) {
    console.error('Error updating PocketBase account:', error);
  }
}
