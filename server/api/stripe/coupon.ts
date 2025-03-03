// server/api/stripe/coupon.js
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  try {
    // Initialize Stripe with your secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    
    // The coupon code to check - make sure this matches exactly what you set in Stripe
    const couponCode = process.env.WELCOME_COUPON_CODE // Update this to match your coupon code
    
    // Fetch the coupon from Stripe
    const promotionCodes = await stripe.promotionCodes.list({
      code: couponCode,
      active: true,
      limit: 1
    })
    
    if (!promotionCodes || promotionCodes.data.length === 0) {
      console.log('No matching promotion code found')
      return { 
        valid: false,
        code: couponCode,
        remaining: null,
        discount: null,
        error: 'Coupon not found or inactive'
      }
    }
    
    // Get the promotion code object
    const promoCode = promotionCodes.data[0]
    
    // Make sure we can access the coupon details
    if (!promoCode.coupon) {
      console.log('Promotion code found but missing coupon details')
      return {
        valid: false,
        code: promoCode.code,
        remaining: null,
        discount: null,
        error: 'Coupon details not available'
      }
    }
    
    // Check if there's a max_redemptions limit set
    let remaining = null
    let times_redeemed = 0
    
    if (promoCode.max_redemptions) {
      times_redeemed = promoCode.times_redeemed || 0
      remaining = promoCode.max_redemptions - times_redeemed
    }
    
    // Determine the discount amount
    let discount = null
    if (promoCode.coupon.percent_off) {
      discount = `${promoCode.coupon.percent_off}%`
    } else if (promoCode.coupon.amount_off) {
      discount = `$${promoCode.coupon.amount_off/100}`
    }
    
    return {
      code: promoCode.code,
      remaining: remaining,
      times_redeemed: times_redeemed,
      discount: discount,
      valid: true
    }
  } catch (error) {
    console.error('Error fetching coupon data:', error)
    return { 
      valid: false,
      code: null,
      remaining: null,
      discount: null,
      error: 'Failed to fetch coupon information' 
    }
  }
})