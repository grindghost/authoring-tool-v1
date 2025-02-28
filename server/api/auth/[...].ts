import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google'; // Change import path

import { NuxtAuthHandler } from '#auth';
import { PocketBaseAdapter } from '~/server/adapters/pocketbase';
import { stripe } from '~/server/utils/stripe';

const runtimeConfig = useRuntimeConfig()

export default NuxtAuthHandler({
  secret: runtimeConfig.AUTH_SECRET,
  adapter: {
    ...PocketBaseAdapter(),
    async linkAccount(account) {
      // Fetch the user using the PocketBase adapter's functionality
      const user = await PocketBaseAdapter().getUser(account.userId);

      if (!user || !user.email) {
        throw new Error('User email is required to create a Stripe customer');
      }

      // Create a Stripe customer
      const customer = await stripe.customers.create({ email: user.email });

      console.log('Stripe customer created:', customer.id);

      // Add Stripe customer ID to account data
      const accountData = {
        ...account,
        stripe_customer_id: customer.id, // Ensure this matches your PocketBase field name
      };

      console.log('Account data to be saved:', accountData);

      // Save the account with additional data
      const createdAccount = await PocketBaseAdapter().linkAccount(accountData);

      console.log('Created account with Stripe ID:', createdAccount);
      return createdAccount;
    },
  },
  providers: [
    // @ts-expect-error
    GithubProvider.default({
      clientId: runtimeConfig.GITHUB_CLIENT_ID,
      clientSecret: runtimeConfig.GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: 'read:user user:email', prompt: "select_account" } },
      options: { timeout: 10000 }, // Increase timeout to 10 seconds
    }),

    // @ts-expect-error
    GoogleProvider.default({
      clientId: runtimeConfig.GOOGLE_CLIENT_ID,
      clientSecret: runtimeConfig.GOOGLE_CLIENT_SECRET,
      authorization: { 
        params: { 
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        } 
      },
      options: { timeout: 10000 },
    }),

  ],

  callbacks: {
    // Adding subscription status to default useAuth data object.
    async session({ session }) {

      if (session.user?.email) {
        const accounts = await getAccountsByEmail(session.user.email)

        return {
          ...session,
          user: {
            ...session.user,
            isSubscribed: accounts[0].is_subscribed,
            plan: accounts[0].plan,
            userId: accounts[0].userId,
          },
        }
      }

      return {
        ...session,
        user: {
          ...session.user,
          isSubscribed: undefined,
          plan: 'tier-free',
          userId: undefined,
        },
      }
    },
  },

})
