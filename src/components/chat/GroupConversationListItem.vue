<template>
  <RouterLink class="conversation-row group-conversation-row" :to="conversationRoute">
    <img class="avatar" :src="groupAvatar" :alt="conversation.title" />
    <div class="conversation-main">
      <div class="conversation-top"><strong>{{ conversation.title }}</strong><time>{{ formatListTime(conversation.updatedAt) }}</time></div>
      <div class="conversation-bottom"><span>{{ preview }}</span><i v-if="conversation.unreadCount" aria-hidden="true"></i></div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ChatMessage, Conversation } from '@/types/domain';
import { formatListTime } from '@/utils/time';

const props = defineProps<{ conversation: Conversation; lastMessage?: ChatMessage }>();
const conversationRoute = computed(() => ({ name: props.conversation.activeMode === 'offline' ? 'offline-room' : 'group-chat', params: { id: props.conversation.id } }));
const groupAvatar = computed(() => props.conversation.groupAvatar || props.conversation.groupMembers?.find((member) => member.identityType !== 'user' && member.avatar)?.avatar || fallbackAvatar);
const preview = computed(() => props.lastMessage ? `${props.lastMessage.authorName ? `${props.lastMessage.authorName}: ` : ''}${props.lastMessage.content}` : props.conversation.groupAnnouncement || '开始群聊');
const fallbackAvatar = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#eaf5ee"/><circle cx="24" cy="27" r="10" fill="#79b88e"/><circle cx="43" cy="29" r="8" fill="#9ac9aa"/><path d="M9 57c2-13 12-20 23-20s20 7 23 20" fill="#79b88e"/></svg>')}`;
</script>

<style scoped>
.conversation-row { display:flex;align-items:center;gap:14px;min-height:78px;padding:8px 24px }
.avatar { width:48px;height:48px;border-radius:50%;object-fit:cover;flex:0 0 auto }
.conversation-main { min-width:0;flex:1 }.conversation-top,.conversation-bottom { display:flex;align-items:center;justify-content:space-between;gap:8px }
.conversation-top strong { overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px }.conversation-top time { flex:0 0 auto;color:#c0c2c6;font-size:12px }
.conversation-bottom { margin-top:3px;color:var(--muted) }.conversation-bottom span { min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }.conversation-bottom i { width:10px;height:10px;border-radius:50%;background:#ff405a;flex:0 0 auto }
</style>
