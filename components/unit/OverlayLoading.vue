  <template>
    <div class="overlay-content">
      <fa v-if="isMounted" :icon="['fas', 'spinner']" class="fa-pulse icon" />
      <p v-html="statusMessage"></p>
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
    justify-content: center;
    align-items: center;
    gap: 3.5rem;
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .icon {
    color: #fff;
    font-size: 50px;
    margin-top: 30px;
    margin-bottom: -20px;
  }

p {
  font-size: 1.3rem; 
  font-weight: 300; 
  line-height: 140%; 
  white-space: pre;
  text-align: center; 
}

</style>