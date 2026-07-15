<template>
  <main class="mobile-shell">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.fullPath" />
    </RouterView>
    <BottomTabs v-if="showTabs" />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BottomTabs from './BottomTabs.vue';

const route = useRoute();

const showTabs = computed(() => route.name === 'home');
</script>

<style scoped>
.mobile-shell {
  position: relative;
  width: 100%;
  min-height: var(--app-height);
  height: var(--app-height);
  padding-right: var(--safe-right);
  padding-left: var(--safe-left);
  overflow: hidden;
  background: #ffffff;
}
</style>