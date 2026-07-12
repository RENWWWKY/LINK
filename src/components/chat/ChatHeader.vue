<template>
  <header class="chat-header">
    <div class="chat-title-row">
      <button class="icon-button" type="button" aria-label="返回" @click="router.back()">
        <ChevronLeft :size="24" />
      </button>
      <div class="chat-person">
        <strong>{{ displayName }}</strong>
      </div>
    </div>
    <div class="icon-row">
      <button v-if="mode === 'online'" class="icon-button" type="button" aria-label="搜索聊天记录" @click="$emit('search')">
        <Search :size="24" />
      </button>
      <button v-else class="icon-button" type="button" aria-label="退出线下模式" @click="$emit('online')">
        <MessageCircle :size="24" />
      </button>
      <button v-if="mode === 'online'" class="icon-button" type="button" aria-label="进入线下模式" :disabled="offlineDisabled" @click="$emit('offline')">
        <DoorOpen :size="24" />
      </button>
      <button v-else class="icon-button" type="button" aria-label="通话">
        <Phone :size="24" />
      </button>
      <button class="icon-button" type="button" aria-label="更多" @click="$emit('open-menu')">
        <Menu :size="24" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeft, DoorOpen, MessageCircle, Menu, Phone, Search } from 'lucide-vue-next';
import type { CharacterProfile, ChatMode } from '@/types/domain';
import { getCharacterDisplayName } from '@/utils/character';

const props = defineProps<{
  character?: CharacterProfile;
  title?: string;
  mode: ChatMode;
  offlineDisabled?: boolean;
}>();

defineEmits<{
  offline: [];
  online: [];
  search: [];
  'open-menu': [];
}>();

const router = useRouter();
const displayName = computed(() => props.title?.trim() || (props.character ? getCharacterDisplayName(props.character) : '聊天'));
</script>

<style scoped>
.chat-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 42px;
  padding: calc(3px + var(--safe-top)) calc(10px + var(--safe-right)) 3px calc(10px + var(--safe-left));
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
}

.chat-title-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--top-icon-gap);
}

.chat-person {
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: var(--top-icon-button-height);
  padding: 0 2px;
}

.chat-person strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--compact-heading-font-size);
  line-height: 1;
}

:global(#app .mobile-shell .screen .chat-header .chat-person strong) {
  font-size: var(--compact-heading-font-size);
}

.icon-row {
  gap: var(--top-icon-gap);
}

.icon-button:disabled {
  opacity: 0.45;
  cursor: default;
}
</style>