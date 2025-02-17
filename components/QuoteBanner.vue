<!-- QuoteBanner.vue -->
<template>
    <div 
      ref="bannerRef"
      class="relative w-full h-96 overflow-hidden opacity-0 transition-opacity duration-1000"
      :class="{ 'opacity-100': isVisible }"
    >
      <!-- Image Container with Extra Space for Parallax -->
      <div 
        class="absolute inset-0 -top-24 -bottom-24" 
        style="height: calc(100% + 12rem)"
      >
        <!-- Background Image with Parallax -->
        <img 
          ref="imageRef"
          :src="backgroundImage" 
          :alt="imageAlt"
          class="absolute w-full h-full object-cover transition-transform duration-100"
          :style="{ transform: `translateY(${parallaxOffset}px)` }"
        />
      </div>
      
      <!-- Dark Overlay -->
      <div class="absolute inset-0 bg-black/60"></div>
      
      <!-- Quote Container -->
      <div class="relative h-full flex items-center justify-center px-4 md:px-8">
        <div class="max-w-4xl mx-auto text-center">
          <!-- Quote Text -->
          <blockquote class="text-2xl md:text-4xl text-white mb-4">
            {{ quote }}
          </blockquote>
          
          <!-- Author Attribution -->
          <cite v-if="author" class="text-lg md:text-xl text-gray-200 font-light">
            — {{ author }}
          </cite>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  
  const props = defineProps({
    quote: {
      type: String,
      required: true
    },
    author: {
      type: String,
      default: ''
    },
    backgroundImage: {
      type: String,
      default: '/api/placeholder/1920/1080'
    },
    imageAlt: {
      type: String,
      default: 'Quote background'
    },
    parallaxStrength: {
      type: Number,
      default: 0.15
    }
  })
  
  const bannerRef = ref(null)
  const imageRef = ref(null)
  const isVisible = ref(false)
  const parallaxOffset = ref(0)
  
  onMounted(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isVisible.value = true
          }
        })
      },
      { threshold: 0.1 }
    )
  
    if (bannerRef.value) {
      observer.observe(bannerRef.value)
    }
  
    // Parallax effect on scroll
    const handleScroll = () => {
      if (!bannerRef.value) return
      
      const rect = bannerRef.value.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      
      // Only apply parallax when banner is in view
      if (rect.top < viewportHeight && rect.bottom > 0) {
        // Calculate how far the element is from the center of the viewport
        const distanceFromCenter = rect.top - viewportHeight / 2
        parallaxOffset.value = distanceFromCenter * props.parallaxStrength
      }
    }
  
    window.addEventListener('scroll', handleScroll, { passive: true })
  
    // Cleanup
    onUnmounted(() => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    })
  })
  </script>