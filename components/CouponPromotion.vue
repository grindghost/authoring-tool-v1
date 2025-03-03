<script setup>
    import { OhVueIcon, addIcons } from "oh-vue-icons";
    import { MdDiscount, BiArrowClockwise } from "oh-vue-icons/icons";

    // Register the icons
    addIcons(MdDiscount, BiArrowClockwise);

  const isLoading = ref(true)
  const couponData = ref({
    valid: false,
    code: '',
    remaining: null,
    discount: '',
    originalCount: null
  })
  
  // Add a ref to control toast visibility
  const showToast = ref(false)
  
  // Modified function to show toast
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Display toast message
      showToast.value = true
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    })
  }
  
  // Fetch coupon data when component mounts
  onMounted(async () => {
    try {
      const response = await fetch('/api/stripe/coupon', {
        method: 'GET'
      })
  
      const data = await response.json()
      
      // If we got valid data back
      if (data && data.valid) {
        // Calculate original count if max_redemptions was set
        if (data.remaining !== null && data.times_redeemed !== undefined) {
          data.originalCount = data.remaining + data.times_redeemed
        }
        
        couponData.value = data
      }
    } catch (error) {
      console.error('Failed to fetch coupon data:', error)
    } finally {
      isLoading.value = false
    }
  })
</script>

<template>
    <div v-if="isLoading" class="text-sm md:text-base flex justify-center items-center gap-2 text-gray-600 p-2 mb-2">
      <OhVueIcon name="bi-arrow-clockwise" fill="#e5e7eb" class="animate-spin" scale="1.5" />

      <span>Recherche des offres promotionnelles...</span>
    </div>
    
    <p v-else-if="couponData && couponData.valid" class="text-sm md:text-base flex flex-col justify-center items-center md:flex-row gap-2 md:text-sm mb-8 text-left">
      <!-- Discount -->
      <span class="flex flex-row justify-center items-center gap-2"> 
        <img src="/gift.svg" class="w-5 h-5 fill-accent animate-pulse" alt="">
        <span>
            <span class="text-accent">
                {{ couponData.discount }}
            </span> 
            <span>
                pour les premiers clients ({{ couponData.remaining }} restants)
            </span>
        </span>       
      </span>

      <!-- Coupon code -->
      <span class="font-bold cursor-pointer" v-on:click="copyToClipboard(couponData.code)">
        <span class="bg-white shadow-md text primary px-2 py-1 pr-3 rounded flex flex-row justify-center items-center gap-1">
            <OhVueIcon name="md-discount" class="text-primary"  scale="0.7"/>
            <span>
                {{ couponData.code }}
            </span>
        </span> 
      </span> 
    </p>
    
    <!-- Toast component from DaisyUI -->
    <div class="toast toast-end z-50" v-if="showToast">
      <div class="customToast animate-popup alert bg-white text-black shadow-lg pr-8">
        <span class="text-2xl">👍</span> 
        <span>
            <span>Le code promo a été copié!</span>
            <span class="text-xs block">Utilisez-le lors de votre achat.</span>
        </span>
      </div>
    </div>
</template>

<style scoped>
.customToast {
  /* border-left: 0.5rem solid theme('colors.primary'); */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}
</style>