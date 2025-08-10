<template>
  <div class="chat-iframe-page">
    <GuestChatWidget 
      :show-quick-actions="true"
      :auto-open="true"
    />
  </div>
</template>

<script setup lang="ts">
import GuestChatWidget from 'src/components/GuestChatWidget.vue';
import { onMounted, onBeforeUnmount } from 'vue';

// Optimize for iframe embedding
onMounted(() => {
  // Remove any default margins/padding from body when in iframe
  if (window.self !== window.top) {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
  }
  
  // Send ready message to parent window
  window.parent?.postMessage({ type: 'chat-iframe-ready' }, '*');

  // Inform parent to disable outside-click closing once chat starts
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'chat-started') {
      window.parent?.postMessage({ type: 'disable-overlay-close' }, '*');
    }
  };
  window.addEventListener('message', onMessage);
  onBeforeUnmount(() => window.removeEventListener('message', onMessage));
});
</script>

<style scoped lang="scss">
.chat-iframe-page {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: var(--q-background);
}

// Ensure full height for iframe
:deep(.chat-widget-iframe) {
  position: static !important;
  width: 100% !important;
  height: 100% !important;
  display: block !important;
}

:deep(.chat-window-iframe) {
  width: 100% !important;
  height: 100% !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
</style> 