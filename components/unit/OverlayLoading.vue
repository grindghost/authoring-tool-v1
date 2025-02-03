  <template>
    <div class="overlay-content">
        <fa v-if="isMounted" :icon="['fas', 'spinner']" class="fa-pulse icon" />
      <div class="text-wrapper">
          <p v-html="statusMessage"></p>
      </div>
    </div>
  </template>
  
  <script setup>

    import { useAppStateStore } from '/stores/appState';
    const appStore = useAppStateStore();

    // Reactive reference to track if the component has been mounted on the client
    const isMounted = ref(false);

    // Set `isMounted` to true once the component has been mounted
    onMounted(() => {
      isMounted.value = true;
    });

    const isServer = computed (() => {
      return process.server;
    });
    
    // Compute the status message
    const statusMessage = computed (() => {
      return appStore.statusMessage;
    });

  </script>

<style scoped>

.overlay-content{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.8rem;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .text-wrapper {
    margin: 0 auto;
    max-width: 450px;
    /* width: 100%; */
  }

  p {
    font-size: 1.3rem; 
    font-weight: 300; 
    line-height: 140%; 
    text-align: center;
    font-family: var(--theme-font) !important; 
    color: #fff;
  }
  
  .icon {
    color: #fff;
    font-size: 50px;
  }

@media only screen and (max-width: 600px) {
    .text-wrapper {
      margin: 0 2.2rem;
    }
  }

</style>