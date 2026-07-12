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

      <section>
        <div class="section-heading">
          <span>Groups {{ groupRows.length }}</span>
          <ChevronUp :size="18" class="muted" />
        </div>
        <GroupConversationListItem v-for="row in groupRows" :key="row.conversation.id" :conversation="row.conversation" :last-message="row.lastMessage" />
      </section>

      <section>
        <div class="section-heading">
          <span>Friends {{ friendRows.length }}</span>
          <ChevronUp :size="18" class="muted" />
        </div>
        <button v-for="row in friendRows" :key="row.character.id" class="list-row friend-row" type="button" @click="openCharacterChat(row.conversation.id)">
          <img class="avatar" :src="row.character.avatar" :alt="getCharacterDisplayName(row.character)" />
          <div class="row-main">
            <div class="row-title">{{ getCharacterDisplayName(row.character) }}</div>
            <div class="row-subtitle">{{ row.character.signature }}</div>
          </div>
          <i v-if="row.conversation.unreadCount" class="friend-unread" aria-hidden="true"></i>
        </button>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Bookmark, ChevronUp, ScanLine, Search, Settings, UserPlus } from 'lucide-vue-next';
import ServiceGrid from '@/components/home/ServiceGrid.vue';
import UserProfilePanel from '@/components/home/UserProfilePanel.vue';
import GroupConversationListItem from '@/components/chat/GroupConversationListItem.vue';
import { useAppStore } from '@/stores/appStore';
import { getCharacterDisplayName } from '@/utils/character';

const store = useAppStore();
const router = useRouter();
const groupRows = computed(() => store.conversationsForFriendsDisplay
  .filter((conversation) => conversation.kind === 'group')
  .sort((left, right) => Number(Boolean(right.groupPinned)) - Number(Boolean(left.groupPinned)) || right.updatedAt - left.updatedAt)
  .map((conversation) => ({ conversation, lastMessage: store.lastMessageForConversation(conversation.id) })));
const friendRows = computed(() =>
  store.charactersForFriendsDisplay
    .flatMap((character) => {
      const conversation = store.conversations.find((item) => item.kind !== 'group' && item.charId === character.id && item.userId === character.boundUserId);
      if (!conversation) return [];
      return [{ character, conversation }];
    })
    .sort((left, right) => right.conversation.updatedAt - left.conversation.updatedAt)
);

function openCharacterChat(conversationId: string) {
  const conversation = store.conversationById(conversationId);
  void router.push({
    name: conversation?.activeMode === 'offline' ? 'offline-room' : 'chat-room',
    params: { id: conversationId }
  });
}

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

.home-content :deep(.section-heading) {
  padding: 11px 16px 6px;
  font-size: 13px;
}

.home-content :deep(.section-heading svg) {
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

.home-content :deep(.list-row) {
  gap: 9px;
  min-height: 56px;
  padding: 6px 16px;
}

.home-content :deep(.avatar) {
  width: 40px;
  height: 40px;
}

.home-content :deep(.row-title) {
  font-size: 14px;
}

.home-content :deep(.row-subtitle) {
  margin-top: 2px;
  font-size: 12px;
}

.home-content :deep(.group-conversation-row) {
  gap: 9px;
  min-height: 56px;
  padding: 6px 16px;
}

.home-content :deep(.group-conversation-row .conversation-top strong) {
  font-size: 14px;
}

.home-content :deep(.group-conversation-row .conversation-top time) {
  font-size: 11px;
}

.home-content :deep(.group-conversation-row .conversation-bottom) {
  margin-top: 2px;
  font-size: 12px;
}

.friend-row {
  width: 100%;
  text-align: left;
}

.friend-unread {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  margin-left: auto;
  border-radius: 50%;
  background: #ff405a;
}
</style>