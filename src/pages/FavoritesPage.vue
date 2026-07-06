<template>
  <section class="screen no-tabs favorites-page">
    <header class="top-bar favorites-topbar">
      <button class="favorites-title-button" type="button" aria-label="返回首页" @click="goBack">
        <h1 class="top-title">Favorites</h1>
      </button>
      <span class="favorite-count">{{ favoriteItems.length }}</span>
    </header>

    <main class="favorites-main">
      <section v-if="!store.ready" class="favorites-state favorites-state--loading">
        <LoaderCircle :size="20" class="spin" />
        <p>正在整理收藏...</p>
      </section>

      <template v-else>
        <section class="favorites-hero" aria-label="收藏概览">
          <div class="favorites-hero-copy">
            <span class="eyebrow">LINK Collection</span>
            <h2>把聊天里的心动瞬间收进这里</h2>
            <p>图片、贴纸、位置、语音和文字按社交动态的节奏轻轻排好，随时回到原聊天。</p>
          </div>
          <div class="favorites-metrics" aria-label="收藏统计">
            <span>
              <strong>{{ mediaCount }}</strong>
              <small>Media</small>
            </span>
            <span>
              <strong>{{ textCount }}</strong>
              <small>Text</small>
            </span>
            <span>
              <strong>{{ voiceCount }}</strong>
              <small>Voice</small>
            </span>
          </div>
        </section>

        <nav class="favorite-filters" aria-label="收藏筛选">
          <button
            v-for="filter in favoriteFilters"
            :key="filter.id"
            class="favorite-filter"
            :class="{ active: activeFilter === filter.id }"
            type="button"
            @click="activeFilter = filter.id"
          >
            <component :is="filter.icon" :size="15" stroke-width="2.3" />
            <span>{{ filter.label }}</span>
            <b>{{ filter.count }}</b>
          </button>
        </nav>

        <section v-if="!favoriteItems.length" class="favorites-state favorites-state--empty">
          <Bookmark :size="24" />
          <h2>还没有收藏</h2>
          <p>在聊天里长按消息气泡、图片、Stickers、转账或定位，点收藏后会出现在这里。</p>
        </section>

        <section v-else-if="!filteredFavorites.length" class="favorites-state favorites-state--empty">
          <Sparkles :size="24" />
          <h2>这个分类还空着</h2>
          <p>换个筛选看看，或者在聊天里收藏更多同类型内容。</p>
        </section>

        <section v-else class="favorite-feed" aria-label="收藏列表">
          <article
            v-for="item in filteredFavorites"
            :key="item.id"
            class="favorite-card"
            :class="[`favorite-card--${item.kind}`, { 'favorite-card--visual': hasVisualPreview(item) }]"
          >
            <header class="favorite-card-head">
              <img v-if="favoriteAuthorAvatar(item)" class="favorite-avatar" :src="favoriteAuthorAvatar(item)" :alt="item.authorName" />
              <span v-else class="favorite-avatar favorite-avatar--empty">{{ item.authorName.slice(0, 1) }}</span>
              <div class="favorite-author">
                <strong>{{ item.authorName }}</strong>
                <span>{{ cardMeta(item) }}</span>
              </div>
              <button class="favorite-delete-button" type="button" aria-label="删除收藏" @click="deleteFavorite(item.id)">
                <X :size="17" stroke-width="2.35" />
              </button>
            </header>

            <figure v-if="item.message.image" class="favorite-visual-card favorite-visual-card--image">
              <img v-if="item.message.image.url" :src="item.message.image.url" :alt="item.message.image.description" />
              <figcaption>{{ item.message.image.description }}</figcaption>
            </figure>

            <figure v-else-if="item.message.sticker" class="favorite-visual-card favorite-visual-card--sticker">
              <img :src="getStickerDisplayImageUrl(item.message.sticker)" :alt="item.message.sticker.description" />
              <figcaption>{{ item.message.sticker.description }}</figcaption>
            </figure>

            <section v-else-if="item.message.location" class="favorite-rich-card favorite-rich-card--location">
              <MapPin :size="22" stroke-width="2.25" />
              <div>
                <small>Location</small>
                <strong>{{ item.message.location.name }}</strong>
                <span v-if="item.message.location.address">{{ item.message.location.address }}</span>
                <em>{{ item.message.location.distance }}</em>
              </div>
            </section>

            <section v-else-if="item.message.transfer" class="favorite-rich-card favorite-rich-card--transfer">
              <WalletCards :size="22" stroke-width="2.25" />
              <div>
                <small>{{ transferStatusLabel(item) }}</small>
                <strong>¥{{ item.message.transfer.amount }}</strong>
                <em>{{ item.message.transfer.note || '无备注' }}</em>
              </div>
            </section>

            <section v-else-if="item.message.theaterLink" class="favorite-rich-card favorite-rich-card--link">
              <Globe2 :size="22" stroke-width="2.25" />
              <div>
                <small>Link</small>
                <strong>{{ item.message.theaterLink.title }}</strong>
                <em>{{ item.message.theaterLink.summary }}</em>
              </div>
            </section>

            <section v-else-if="item.message.voice" class="favorite-rich-card favorite-rich-card--voice">
              <Mic2 :size="22" stroke-width="2.25" />
              <div>
                <small>{{ formatVoiceDuration(item.message.voice.duration) }}</small>
                <strong>Voice note</strong>
                <p>{{ item.message.voice.transcript }}</p>
              </div>
            </section>

            <section v-else-if="item.message.offlineInvitation" class="favorite-rich-card favorite-rich-card--invite">
              <MessageCircle :size="22" stroke-width="2.25" />
              <div>
                <small>Offline RP</small>
                <strong>{{ offlineInvitationLabel(item.message.offlineInvitation.status) }}</strong>
                <p>{{ item.message.offlineInvitation.prompt }}</p>
              </div>
            </section>

            <p v-else class="favorite-text" :class="{ narration: item.kind === 'narration' }">{{ item.summary }}</p>

            <footer class="favorite-card-foot">
              <span class="favorite-kind-pill">{{ kindLabel(item) }}</span>
              <span class="favorite-time">{{ formatFavoriteTime(item.favoritedAt) }}</span>
              <button type="button" @click="openConversation(item)">
                <MessageCircle :size="15" stroke-width="2.35" />
                <span>查看聊天</span>
              </button>
            </footer>
          </article>
        </section>
      </template>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bookmark, FileText, Globe2, Images, LoaderCircle, MapPin, MessageCircle, Mic2, Sparkles, WalletCards, X } from 'lucide-vue-next';
import { useAppStore } from '@/stores/appStore';
import type { ChatOfflineInvitationStatus, Conversation, FavoriteMessageKind, FavoriteMessageRecord } from '@/types/domain';
import { getStickerDisplayImageUrl } from '@/utils/stickers';

type FavoriteFilter = 'all' | 'media' | 'text' | 'voice' | 'places' | 'money';

const router = useRouter();
const store = useAppStore();
const activeFilter = ref<FavoriteFilter>('all');

const favoriteItems = computed(() => store.sortedFavorites);
const mediaCount = computed(() => favoriteItems.value.filter(isMediaFavorite).length);
const textCount = computed(() => favoriteItems.value.filter((item) => item.kind === 'text' || item.kind === 'narration').length);
const voiceCount = computed(() => favoriteItems.value.filter((item) => item.kind === 'voice').length);
const favoriteFilters = computed(() => [
  { id: 'all' as FavoriteFilter, label: '全部', icon: Bookmark, count: favoriteItems.value.length },
  { id: 'media' as FavoriteFilter, label: '媒体', icon: Images, count: mediaCount.value },
  { id: 'text' as FavoriteFilter, label: '文字', icon: FileText, count: textCount.value },
  { id: 'voice' as FavoriteFilter, label: '语音', icon: Mic2, count: voiceCount.value },
  { id: 'places' as FavoriteFilter, label: '地点', icon: MapPin, count: favoriteItems.value.filter((item) => item.kind === 'location').length },
  { id: 'money' as FavoriteFilter, label: '转账', icon: WalletCards, count: favoriteItems.value.filter((item) => item.kind === 'transfer').length }
]);
const filteredFavorites = computed(() => favoriteItems.value.filter((item) => matchesFilter(item, activeFilter.value)));

void store.hydrate();

function isMediaFavorite(item: FavoriteMessageRecord) {
  return item.kind === 'image' || item.kind === 'sticker' || item.kind === 'theaterLink';
}

function matchesFilter(item: FavoriteMessageRecord, filter: FavoriteFilter) {
  if (filter === 'all') return true;
  if (filter === 'media') return isMediaFavorite(item);
  if (filter === 'text') return item.kind === 'text' || item.kind === 'narration' || item.kind === 'offlineInvitation';
  if (filter === 'voice') return item.kind === 'voice';
  if (filter === 'places') return item.kind === 'location';
  return item.kind === 'transfer';
}

function goBack() {
  if (window.history.length > 1) router.back();
  else void router.push({ name: 'home' });
}

function cardMeta(item: FavoriteMessageRecord) {
  const modeLabel = item.mode === 'offline' ? '线下 RP' : '线上聊天';
  const targetName = item.characterName || item.userName || 'LINK';
  return `${targetName} · ${modeLabel}`;
}

function transferStatusLabel(item: FavoriteMessageRecord) {
  const status = item.message.transfer?.status ?? 'pending';
  const label = ({ pending: '等待处理', accepted: '已接收', rejected: '已拒绝' } as const)[status];
  return item.message.transfer?.responseToMessageId ? `转账回执 · ${label}` : label;
}

function favoriteAuthorAvatar(item: FavoriteMessageRecord) {
  if (item.sender !== 'char') return item.authorAvatar;
  const characterId = item.characterId || store.conversationById(item.conversationId)?.charId || '';
  return store.characterById(characterId)?.avatar || item.authorAvatar;
}

function formatVoiceDuration(duration: number) {
  const seconds = Math.max(1, Math.round(Number(duration) || 1));
  return `${seconds}" 语音`;
}

function formatFavoriteTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(timestamp);
}

function offlineInvitationLabel(status: ChatOfflineInvitationStatus) {
  return ({ pending: '等待开启', accepted: '已开启', rejected: '已拒绝' } as const)[status];
}

function kindLabel(item: FavoriteMessageRecord) {
  const labels: Record<FavoriteMessageKind, string> = {
    text: 'Text',
    image: 'Photo',
    sticker: 'Sticker',
    voice: 'Voice',
    location: 'Place',
    transfer: 'Pay',
    theaterLink: 'Link',
    offlineInvitation: 'RP',
    narration: 'Note'
  };
  return labels[item.kind];
}

function hasVisualPreview(item: FavoriteMessageRecord) {
  return Boolean(item.message.image || item.message.sticker);
}

async function deleteFavorite(favoriteId: string) {
  await store.deleteFavorite(favoriteId);
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

function findFavoriteConversation(item: FavoriteMessageRecord): Conversation | null {
  const directIds = uniqueIds([item.conversationId, item.message.conversationId]);
  for (const id of directIds) {
    const conversation = store.conversationById(id);
    if (conversation) return conversation;
  }
  if (item.characterId) {
    const conversation = store.conversations.find((entry) => entry.charId === item.characterId);
    if (conversation) return conversation;
  }
  if (item.userId) {
    const conversation = store.conversations.find((entry) => entry.userId === item.userId);
    if (conversation) return conversation;
  }
  return null;
}

function favoriteRouteMode(item: FavoriteMessageRecord, conversation: Conversation) {
  const liveMessage = store.messagesForConversation(conversation.id).find((message) => message.id === item.sourceMessageId);
  return liveMessage?.mode ?? item.message.mode ?? item.mode ?? conversation.activeMode;
}

async function openConversation(item: FavoriteMessageRecord) {
  await store.hydrate();
  const conversation = findFavoriteConversation(item);
  if (!conversation) {
    void router.push({ name: 'chats' });
    return;
  }
  const mode = favoriteRouteMode(item, conversation);
  void router.push({
    name: mode === 'offline' ? 'offline-room' : 'chat-room',
    params: { id: conversation.id },
    query: { focus: item.sourceMessageId }
  });
}
</script>

<style scoped>
.favorites-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-bottom: 0;
  overflow-x: hidden;
  background:
    linear-gradient(135deg, rgba(255, 242, 246, 0.88) 0%, rgba(255, 255, 255, 0) 34%),
    linear-gradient(225deg, rgba(226, 247, 236, 0.88) 0%, rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, #ffffff 0%, #f7f7f4 46%, #f1f3ef 100%);
}

.favorites-topbar {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  min-width: 0;
  background: rgba(255, 255, 255, 0.82);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
}

.favorite-delete-button {
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  color: #171717;
}

.favorites-title-button {
  display: inline-flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  margin-right: auto;
  padding: 0;
  color: inherit;
}

.favorites-title-button .top-title {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(23, 23, 23, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #171717;
  font-size: 12px;
  font-weight: 900;
}

.favorites-main {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 10px calc(16px + var(--safe-right)) calc(22px + var(--safe-bottom)) calc(16px + var(--safe-left));
  container-type: inline-size;
}

.favorites-hero {
  display: grid;
  gap: 18px;
  min-width: 0;
  padding: 18px;
  border: 1px solid rgba(23, 23, 23, 0.06);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.7)),
    linear-gradient(135deg, rgba(255, 210, 221, 0.42), rgba(206, 239, 222, 0.54) 48%, rgba(210, 223, 255, 0.34));
  box-shadow: 0 18px 44px rgba(34, 38, 32, 0.07);
}

.favorites-hero-copy {
  min-width: 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #6e756d;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
}

.favorites-hero h2,
.favorites-hero p {
  margin: 0;
}

.favorites-hero h2 {
  margin-top: 14px;
  max-width: 390px;
  color: #171717;
  font-size: 24px;
  font-weight: 930;
  line-height: 1.16;
  letter-spacing: 0;
}

.favorites-hero p {
  max-width: 420px;
  margin-top: 10px;
  color: #696d66;
  font-size: 13px;
  font-weight: 720;
  line-height: 1.6;
}

.favorites-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  min-width: 0;
}

.favorites-metrics span {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 12px 10px;
  border: 1px solid rgba(23, 23, 23, 0.05);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
}

.favorites-metrics strong,
.favorites-metrics small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorites-metrics strong {
  color: #171717;
  font-size: 19px;
  font-weight: 930;
  line-height: 1;
}

.favorites-metrics small {
  color: #8a8a82;
  font-size: 10px;
  font-weight: 850;
}

.favorite-filters {
  display: flex;
  gap: 8px;
  min-width: 0;
  margin: 14px -2px 0;
  padding: 0 2px 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.favorite-filters::-webkit-scrollbar {
  display: none;
}

.favorite-filter {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(23, 23, 23, 0.06);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  color: #666a64;
  font-size: 12px;
  font-weight: 850;
}

.favorite-filter.active {
  border-color: rgba(23, 23, 23, 0.12);
  background: #171717;
  color: #ffffff;
}

.favorite-filter b {
  font-size: 11px;
  font-weight: 930;
}

.favorite-feed {
  display: grid;
  gap: 14px;
  min-width: 0;
  margin-top: 10px;
}

.favorite-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(23, 23, 23, 0.06);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 34px rgba(34, 38, 32, 0.06);
}

.favorite-card--visual {
  background: #ffffff;
}

.favorite-card-head {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 36px;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 14px 14px 12px;
}

.favorite-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: #edf1ea;
}

.favorite-avatar--empty {
  display: grid;
  place-items: center;
  color: #747a72;
  font-size: 16px;
  font-weight: 930;
}

.favorite-author {
  min-width: 0;
}

.favorite-author strong,
.favorite-author span {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-author strong {
  color: #171717;
  font-size: 14px;
  font-weight: 930;
}

.favorite-author span {
  margin-top: 4px;
  color: #8a8a82;
  font-size: 11px;
  font-weight: 760;
}

.favorite-delete-button {
  width: 36px;
  height: 36px;
  color: #9a9b94;
}

.favorite-delete-button:active {
  background: #fff1f4;
  color: #ef445a;
}

.favorite-visual-card {
  overflow: hidden;
  margin: 0;
  background: #f3f4f0;
}

.favorite-visual-card img {
  display: block;
  width: 100%;
}

.favorite-visual-card--image img {
  max-height: 470px;
  object-fit: cover;
}

.favorite-visual-card--sticker {
  display: grid;
  justify-items: center;
  padding: 24px 16px 0;
  background:
    linear-gradient(135deg, rgba(255, 239, 243, 0.72), rgba(240, 247, 241, 0.86)),
    #f7f7f4;
}

.favorite-visual-card--sticker img {
  width: min(54vw, 230px);
  height: min(54vw, 230px);
  object-fit: contain;
}

.favorite-visual-card figcaption {
  width: 100%;
  padding: 12px 14px 14px;
  color: #555a53;
  font-size: 12px;
  font-weight: 720;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.favorite-rich-card,
.favorite-text {
  margin: 0 14px 2px;
  border-radius: 22px;
  background: #f6f6f2;
  color: #171717;
}

.favorite-rich-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 15px;
}

.favorite-rich-card > svg {
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: 16px;
  background: #ffffff;
  color: #171717;
}

.favorite-rich-card--location > svg {
  background: #eaf5ff;
  color: #377fc2;
}

.favorite-rich-card--transfer > svg {
  background: #fff4d8;
  color: #a46b00;
}

.favorite-rich-card--voice > svg {
  background: #f0edf8;
  color: #6652a8;
}

.favorite-rich-card--link > svg {
  background: #eaf7ee;
  color: #16824d;
}

.favorite-rich-card > div {
  min-width: 0;
}

.favorite-rich-card small,
.favorite-rich-card strong,
.favorite-rich-card span,
.favorite-rich-card em,
.favorite-rich-card p {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
}

.favorite-rich-card small {
  color: #8a8a82;
  font-size: 11px;
  font-weight: 850;
  line-height: 1.2;
}

.favorite-rich-card strong {
  margin-top: 3px;
  color: #171717;
  font-size: 15px;
  font-weight: 930;
  line-height: 1.28;
}

.favorite-rich-card--transfer strong {
  font-size: 24px;
  line-height: 1.05;
}

.favorite-rich-card span,
.favorite-rich-card em,
.favorite-rich-card p {
  margin: 5px 0 0;
  color: #666a64;
  font-size: 12px;
  font-weight: 720;
  font-style: normal;
  line-height: 1.48;
}

.favorite-text {
  padding: 16px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.72;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.favorite-text.narration {
  color: #71766f;
  font-style: italic;
}

.favorite-card-foot {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 12px 14px 14px;
}

.favorite-kind-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  background: #f1f1ec;
  color: #666a64;
  font-size: 10px;
  font-weight: 930;
}

.favorite-time {
  min-width: 0;
  overflow: hidden;
  color: #9a9b94;
  font-size: 11px;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-card-foot button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #171717;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.favorite-card-foot button:active,
.favorite-filter:active,
.favorites-title-button:active {
  transform: translateY(1px);
}

.favorites-state {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 11px;
  min-height: 320px;
  min-width: 0;
  margin-top: 14px;
  padding: 28px 18px;
  border: 1px solid rgba(23, 23, 23, 0.06);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  color: #73776f;
  text-align: center;
  box-shadow: 0 16px 38px rgba(34, 38, 32, 0.06);
}

.favorites-state > svg {
  width: 48px;
  height: 48px;
  padding: 12px;
  border-radius: 18px;
  background: #f2f4ef;
  color: #171717;
}

.favorites-state h2,
.favorites-state p {
  margin: 0;
}

.favorites-state h2 {
  color: #171717;
  font-size: 20px;
  font-weight: 930;
  line-height: 1.18;
}

.favorites-state p {
  max-width: 286px;
  color: #73776f;
  font-size: 12px;
  font-weight: 720;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.favorites-state--loading {
  margin-top: 0;
}

.spin {
  animation: spin 0.85s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@container (max-width: 360px) {
  .favorites-main {
    padding-inline: max(10px, var(--safe-left)) max(10px, var(--safe-right));
  }

  .favorites-hero {
    gap: 14px;
    padding: 15px;
    border-radius: 24px;
  }

  .favorites-hero h2 {
    font-size: 21px;
  }

  .favorites-metrics span {
    padding: 10px 8px;
    border-radius: 15px;
  }

  .favorite-card {
    border-radius: 22px;
  }

  .favorite-card-head {
    grid-template-columns: 40px minmax(0, 1fr) 34px;
    padding: 12px 12px 10px;
  }

  .favorite-avatar {
    width: 40px;
    height: 40px;
  }

  .favorite-delete-button {
    width: 34px;
    height: 34px;
  }

  .favorite-rich-card,
  .favorite-text {
    margin-right: 12px;
    margin-left: 12px;
    border-radius: 19px;
  }

  .favorite-rich-card {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
    padding: 13px;
  }

  .favorite-rich-card > svg {
    width: 38px;
    height: 38px;
    border-radius: 14px;
  }

  .favorite-card-foot {
    padding: 10px 12px 12px;
  }
}

@media (min-width: 680px) {
  .favorites-hero {
    grid-template-columns: minmax(0, 1fr) 240px;
    align-items: end;
  }

  .favorite-feed {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

@media (max-width: 420px) {
  .favorites-main {
    padding-top: 8px;
    padding-bottom: calc(18px + var(--safe-bottom));
  }
}
</style>
