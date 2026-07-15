<template>
  <section class="screen home-page">
    <header class="top-bar">
      <div></div>
      <div class="icon-row">
        <button class="icon-button" type="button" aria-label="收藏" @click="openFavoritesPage">
          <Bookmark :size="24" />
        </button>
        <button class="icon-button" type="button" aria-label="铃声设置" @click="openRingtoneSettings">
          <Bell :size="24" />
        </button>
        <button class="icon-button" type="button" aria-label="添加好友" @click="openAddFriendPage">
          <UserPlus :size="24" />
        </button>
        <button class="icon-button" type="button" aria-label="设置" @click="openSettingsPage">
          <Settings :size="24" />
        </button>
      </div>
    </header>

    <div class="home-content">
      <UserProfilePanel :user="store.user" @open="openProfilePage" />

      <label class="search-box">
        <Search :size="21" />
        <input placeholder="Search" />
        <ScanLine :size="21" />
      </label>

      <ServiceGrid :open-stickers="openStickers" :open-world-books="openWorldBookPage" :open-themes="openThemesPage" :open-all="openServicesPage" />

      <nav class="chat-filter" aria-label="聊天分类" role="tablist">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          :class="{ active: activeFilter === tab.value }"
          :aria-selected="activeFilter === tab.value"
          role="tab"
          type="button"
          @click="activeFilter = tab.value"
        >
          {{ tab.label }}
        </button>
      </nav>

      <template v-for="row in visibleCombinedRows" :key="row.id">
        <ConversationListItem
          v-if="row.type === 'friend'"
          :conversation="row.conversation"
          :character="row.character"
          :last-message="row.lastMessage"
        />
        <GroupConversationListItem
          v-else
          :conversation="row.conversation"
          :last-message="row.lastMessage"
        />
      </template>
      <div v-if="!visibleCombinedRows.length" class="empty-list">{{ emptyText }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Bookmark, ScanLine, Search, Settings, UserPlus } from 'lucide-vue-next';
import ConversationListItem from '@/components/chat/ConversationListItem.vue';
import GroupConversationListItem from '@/components/chat/GroupConversationListItem.vue';
import ServiceGrid from '@/components/home/ServiceGrid.vue';
import UserProfilePanel from '@/components/home/UserProfilePanel.vue';
import { useAppStore } from '@/stores/appStore';
import type { CharacterProfile, ChatMessage, Conversation } from '@/types/domain';

type ChatFilter = 'chats' | 'group' | 'friends' | 'all';

interface ChatListRow {
  id: string;
  type: 'friend';
  conversation: Conversation;
  character: CharacterProfile;
  lastMessage?: ChatMessage;
}

interface GroupListRow {
  id: string;
  type: 'group';
  conversation: Conversation;
  lastMessage?: ChatMessage;
}

const store = useAppStore();
const router = useRouter();
const activeFilter = ref<ChatFilter>('chats');

const filterTabs: Array<{ label: string; value: ChatFilter }> = [
  { label: 'Chats', value: 'chats' },
  { label: 'Group', value: 'group' },
  { label: 'Friends', value: 'friends' },
  { label: 'All', value: 'all' }
];

const friendRows = computed<ChatListRow[]>(() =>
  store.charactersForFriendsDisplay
    .flatMap((character) => {
      const conversation = store.conversations.find((item) => item.kind !== 'group' && item.charId === character.id && item.userId === character.boundUserId);
      if (!conversation) return [];
      return [{ id: `friend_${character.id}`, type: 'friend' as const, conversation, character, lastMessage: store.lastMessageForConversation(conversation.id) }];
    })
    .sort((left, right) => right.conversation.updatedAt - left.conversation.updatedAt)
);

const chatRows = computed<ChatListRow[]>(() =>
  [...store.conversationsForFriendsDisplay].sort((left, right) => right.updatedAt - left.updatedAt).flatMap((conversation) => {
    if (conversation.kind === 'group') return [];
    const character = store.characterById(conversation.charId);
    const lastMessage = store.lastMessageForConversation(conversation.id);
    if (!character || !lastMessage) return [];
    return [{ id: `chat_${conversation.id}`, type: 'friend' as const, conversation, character, lastMessage }];
  })
);

const groupRows = computed<GroupListRow[]>(() => store.conversationsForFriendsDisplay
  .filter((conversation) => conversation.kind === 'group')
  .sort((left, right) => Number(Boolean(right.groupPinned)) - Number(Boolean(left.groupPinned)) || right.updatedAt - left.updatedAt)
  .map((conversation) => ({ id: `group_${conversation.id}`, type: 'group' as const, conversation, lastMessage: store.lastMessageForConversation(conversation.id) })));
const groupChatRows = computed(() => groupRows.value.filter((row) => Boolean(row.lastMessage)));
const allFriendRows = computed(() => {
  const activeConversationIds = new Set(chatRows.value.map((row) => row.conversation.id));
  return [...chatRows.value, ...friendRows.value.filter((row) => !activeConversationIds.has(row.conversation.id))];
});
const visibleFriendRows = computed(() => {
  if (activeFilter.value === 'group') return [];
  if (activeFilter.value === 'friends') return friendRows.value;
  if (activeFilter.value === 'all') return allFriendRows.value;
  return chatRows.value;
});
const visibleGroupRows = computed(() => {
  if (activeFilter.value === 'group' || activeFilter.value === 'all') return groupRows.value;
  if (activeFilter.value === 'chats') return groupChatRows.value;
  return [];
});
const visibleCombinedRows = computed<Array<ChatListRow | GroupListRow>>(() => [...visibleFriendRows.value, ...visibleGroupRows.value]
  .sort((left, right) => Number(Boolean(right.conversation.groupPinned)) - Number(Boolean(left.conversation.groupPinned)) || right.conversation.updatedAt - left.conversation.updatedAt));
const emptyText = computed(() => {
  if (activeFilter.value === 'group') return '还没有加入群聊';
  if (activeFilter.value === 'chats') return '还没有对话记录';
  if (activeFilter.value === 'friends') return '还没有添加好友';
  return '还没有好友或群组';
});

function openProfilePage() {
  void router.push({ name: 'account' });
}

function openSettingsPage() {
  void router.push({ name: 'settings' });
}

function openServicesPage() {
  void router.push({ name: 'services' });
}

function openStickers() {
  void router.push({ name: 'stickers' });
}

function openWorldBookPage() {
  void router.push({ name: 'world-book' });
}

function openThemesPage() {
  void router.push({ name: 'themes' });
}

function openFavoritesPage() {
  void router.push({ name: 'favorites' });
}

function openRingtoneSettings() {
  void router.push({ name: 'ringtones' });
}

function openAddFriendPage() {
  void router.push({ name: 'add-friend', query: { from: 'home' } });
}

</script>

<style scoped>
.home-page {
  background: #ffffff;
}

.home-content {
  font-size: 13px;
}

.home-content :deep(.profile-panel) {
  gap: 10px;
  padding: 12px 16px 10px;
}

.home-content :deep(.profile-panel h1) {
  font-size: 20px;
}

.home-content :deep(.profile-panel p) {
  margin: 3px 0 5px;
  font-size: 12px;
}

.home-content :deep(.profile-avatar) {
  width: 54px;
  height: 54px;
}

.home-content .search-box {
  gap: 6px;
  height: 34px;
  margin: 2px 16px 8px;
  padding: 0 10px;
  font-size: 13px;
}

.home-content .search-box svg {
  width: 16px;
  height: 16px;
}

.home-content :deep(.see-all) {
  font-size: 12px;
}

.home-content :deep(.service-grid) {
  gap: 4px;
  padding: 2px 12px 16px;
}

.home-content :deep(.service-item) {
  gap: 5px;
  min-height: 56px;
  font-size: 10px;
}

.home-content :deep(.service-item svg) {
  width: 24px;
  height: 24px;
}

.chat-filter {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: start;
  height: 50px;
  padding: 6px 22px;
}

.chat-filter button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 30px;
  padding: 0;
  color: #939599;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.chat-filter button.active {
  color: #111111;
}

.chat-filter button.active::after {
  content: '';
  position: absolute;
  right: 18px;
  bottom: 0;
  left: 18px;
  height: 3px;
  border-radius: 3px;
  background: #222222;
}

.home-content :deep(.conversation-row) {
  gap: 11px;
  min-height: 66px;
  padding: 6px 22px;
}

.home-content :deep(.conversation-row .avatar) {
  width: 40px;
  height: 40px;
}

.home-content :deep(.conversation-top strong) {
  font-size: 15px;
}

.home-content :deep(.conversation-top time) {
  font-size: 11px;
}

.home-content :deep(.conversation-bottom) {
  margin-top: 2px;
  font-size: 12px;
}

.empty-list {
  padding: 28px 22px;
  color: #939599;
  font-size: 12px;
  text-align: center;
}
</style>