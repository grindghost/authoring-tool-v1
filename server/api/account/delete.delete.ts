// server/api/account/delete.delete.ts
import { stripe } from '~/server/utils/stripe';
import { defineEventHandler, createError } from 'h3'
import { getServerSession } from '#auth'
import PocketBase from 'pocketbase'

export default defineEventHandler(async (event) => {
  try {
    // 1. Get authenticated user
    const session = await getServerSession(event)
    if (!session || !session.user || !session.user.email) {
      throw createError({
        statusCode: 401,
        message: 'You must be logged in to delete your account'
      })
    }
    
    const userEmail = session.user.email
    
    // 2. Initialize PocketBase and authenticate as admin
    const pb = new PocketBase('https://jdb.pockethost.io')
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    )
    
    pb.autoCancellation(false)
    
    // 3. Get account data to find Stripe customer ID
    const accounts = await pb.collection('accounts').getList(1, 1, {
      filter: `user.email="${userEmail}"`,
      expand: 'user',
    })
    
    if (accounts.items.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Account not found'
      })
    }
    
    const account = accounts.items[0]
    const userId = account.expand?.user?.id
    
    if (!userId) {
      throw createError({
        statusCode: 404,
        message: 'User record not found'
      })
    }
    
    // 4. Check if user has a Stripe customer ID
    if (account.stripe_customer_id) {
      try {
        // a. Find all active subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: account.stripe_customer_id,
          status: 'active',
        })
        
        // b. Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id)
        }

        // c. Instead of deleting, update the customer with metadata indicating deleted status
        await stripe.customers.update(account.stripe_customer_id, {
          metadata: { 
            account_deleted: 'true',
            deleted_at: new Date().toISOString(),
            pocketbase_user_id: userId || 'unknown',
            pocketbase_account_id: account.id || 'unknown'
          }
        })
        
        // d. Alternative: Delete the customer from Stripe if needed
        // Note: Stripe recommends keeping customer records for reporting
        // but if regulatory requirements mandate deletion:
        // await stripe.customers.del(account.stripe_customer_id)
      } catch (stripeError) {
        console.error('Stripe deletion error:', stripeError)
        // Continue with account deletion even if Stripe operations fail
      }
    }
    
    // 5. Delete user-related records from PocketBase
    // First find and delete any related collections based on your db structure
    
    // Example: Delete user's projects (adjust based on your DB structure)
    try {
      const projects = await pb.collection('Projects').getList(1, 100, {
        filter: `author="${userId}"`,
      })
      
      for (const project of projects.items) {
        await pb.collection('Projects').delete(project.id)
      }
    } catch (projectError) {
      console.error('Project deletion error:', projectError)
      // Continue with deletion process
    }
    
    // 6. Delete the account record
    await pb.collection('accounts').delete(account.id)
    
    // 7. Finally delete the user record
    await pb.collection('nuxtauth_users').delete(userId)
    
    // 8. Return success response
    return { success: true, message: 'Account successfully deleted' }
    
  } catch (error) {
    console.error('Account deletion error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete account. Please try again.'
    })
  }
})