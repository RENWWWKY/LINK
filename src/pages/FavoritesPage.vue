<template>
  <section class="screen no-tabs favorites-page">
    <header class="top-bar favorites-topbar">
      <button class="favorites-title-button" type="button" aria-label="返回首页" @click="goBack">
        <h1 class="top-title">Favorites</h1>
      </button>
      <span class="favorite-count">{{ favoriteItems.length }}</span>
    </header>

    <main class="favorites-main">
      <section class="favorites-panel" :class="{ 'favorites-panel--empty': !store.ready || !favoriteItems.length }">
        <section v-if="!store.ready" class="empty-favorites-card">
          <LoaderCircle :size="18" class="spin" />
          <p>正在整理收藏...</p>
        </section>

        <section v-else-if="!favoriteItems.length" class="empty-favorites-card">
          <Bookmark :size="22" />
          <h2>还没有收藏</h2>
          <p>在聊天里长按消息气泡、图片、Stickers、转账或定位，点收藏后会出现在这里。</p>
        </section>

        <section v-else class="favorite-timeline" aria-label="收藏时间线">
        <article v-for="item in favoriteItems" :key="item.id" class="favorite-card" :class="`favorite-card--${item.kind}`">
          <header class="favorite-card-head">
            <img v-if="item.authorAvatar" class="favorite-avatar" :src="item.authorAvatar" :alt="item.authorName" />
            <span v-else class="favorite-avatar favorite-avatar--empty">{{ item.authorName.slice(0, 1) }}</span>
            <div>
              <strong>{{ item.authorName }}</strong>
              <span>{{ cardMeta(item) }}</span>
            </div>
            <button class="favorite-delete-button" type="button" aria-label="删除收藏" @click="deleteFavorite(item.id)">
              <Trash2 :size="16" />
            </button>
          </header>

          <figure v-if="item.message.image" class="favorite-image-card">
            <img v-if="item.message.image.url" :src="item.message.image.url" :alt="item.message.image.description" />
            <figcaption>{{ item.message.image.description }}</figcaption>
          </figure>

          <figure v-else-if="item.message.sticker" class="favorite-sticker-card">
            <img :src="getStickerDisplayImageUrl(item.message.sticker)" :alt="item.message.sticker.description" />
            <figcaption>{{ item.message.sticker.description }}</figcaption>
          </figure>

          <section v-else-if="item.message.location" class="favorite-location-card">
            <MapPin :size="22" />
            <div>
              <strong>{{ item.message.location.name }}</strong>
              <span v-if="item.message.location.address">{{ item.message.location.address }}</span>
              <small>{{ item.message.location.distance }}</small>
            </div>
          </section>

          <section v-else-if="item.message.transfer" class="favorite-transfer-card">
            <span aria-hidden="true">¥</span>
            <div>
              <small>{{ transferStatusLabel(item) }}</small>
              <strong>¥{{ item.message.transfer.amount }}</strong>
              <em>{{ item.message.transfer.note || '无备注' }}</em>
            </div>
          </section>

          <section v-else-if="item.message.voice" class="favorite-voice-card">
            <Mic2 :size="18" />
            <div>
              <strong>{{ formatVoiceDuration(item.message.voice.duration) }}</strong>
              <p>{{ item.message.voice.transcript }}</p>
            </div>
          </section>

          <p v-else class="favorite-text" :class="{ narration: item.kind === 'narration' }">{{ item.summary }}</p>

          <footer class="favorite-card-foot">
            <span>{{ formatFavoriteTime(item.favoritedAt) }}</span>
            <button type="button" @click="openConversation(item)">查看聊天</button>
          </footer>
        </article>
        </section>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Bookmark, LoaderCircle, MapPin, Mic2, Trash2 } from 'lucide-vue-next';
import { useAppStore } from '@/stores/appStore';
import type { FavoriteMessageRecord } from '@/types/domain';
import { getStickerDisplayImageUrl } from '@/utils/stickers';

const router = useRouter();
const store = useAppStore();

const favoriteItems = computed(() => store.sortedFavorites);

onMounted(() => {
  void store.hydrate();
});

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
  return ({ pending: '等待处理', accepted: '已接收', rejected: '已拒绝' } as const)[status];
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

async function deleteFavorite(favoriteId: string) {
  await store.deleteFavorite(favoriteId);
}

function openConversation(item: FavoriteMessageRecord) {
  void router.push({
    name: item.mode === 'offline' ? 'offline-room' : 'chat-room',
    params: { id: item.conversationId },
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
    radial-gradient(circle at 8% 0%, rgba(255, 218, 227, 0.54), transparent 30%),
    radial-gradient(circle at 94% 10%, rgba(6, 199, 85, 0.14), transparent 28%),
    linear-gradient(180deg, #fbfcfb 0%, #f5f7f6 52%, #edf3f1 100%);
}

.favorites-topbar {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  min-width: 0;
  background: rgba(251, 252, 251, 0.9);
  backdrop-filter: blur(18px);
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
  flex: 0 0 auto;
  min-width: 34px;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 999px;
  background:
    radial-gradient(circle at top right, rgba(255, 221, 232, 0.72), transparent 44%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(238, 248, 241, 0.94));
  color: #138046;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  box-shadow:
    inset 0 0 0 1px rgba(17, 17, 17, 0.05),
    0 12px 28px rgba(16, 24, 20, 0.08);
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
}

.favorites-panel {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  border: 1px solid rgba(17, 17, 17, 0.04);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 32px rgba(16, 24, 20, 0.06);
  container-type: inline-size;
}

.favorites-panel--empty {
  min-height: 330px;
  align-content: center;
}

.empty-favorites-card {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 10px;
  min-height: 260px;
  min-width: 0;
  padding: 24px 18px;
  border-radius: 26px;
  background:
    radial-gradient(circle at top right, rgba(255, 221, 232, 0.9), transparent 30%),
    linear-gradient(135deg, #fff8fb, #f1f6fb 56%, #eef8f1);
  color: #767d86;
  text-align: center;
  overflow: hidden;
}

.empty-favorites-card > svg {
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
  color: #64736a;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.05);
}

.empty-favorites-card h2,
.empty-favorites-card p {
  margin: 0;
}

.empty-favorites-card h2 {
  color: #191b1f;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.16;
}

.empty-favorites-card p {
  max-width: 270px;
  color: #767d86;
  font-size: 12px;
  font-weight: 720;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.favorite-timeline {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.favorite-card {
  overflow: hidden;
  min-width: 0;
  border: 1px solid rgba(17, 17, 17, 0.04);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 249, 252, 0.96));
  box-shadow: 0 12px 30px rgba(26, 30, 38, 0.05);
}

.favorite-card-head {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 14px;
}

.favorite-avatar {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  object-fit: cover;
  background: var(--soft);
}

.favorite-avatar--empty {
  display: grid;
  place-items: center;
  color: #64736a;
  font-weight: 900;
}

.favorite-card-head > div {
  min-width: 0;
}

.favorite-card-head strong,
.favorite-card-head span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-card-head strong {
  color: #191b1f;
  font-size: 14px;
  font-weight: 900;
}

.favorite-card-head span {
  margin-top: 3px;
  color: #767d86;
  font-size: 12px;
  font-weight: 720;
}

.favorite-delete-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  color: #8b929b;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.05);
}

.favorite-delete-button:active {
  background: #fff1f4;
  color: #ef445a;
}

.favorite-image-card,
.favorite-sticker-card {
  overflow: hidden;
  margin: 0 14px 4px;
  border-radius: 20px;
  background: rgba(244, 246, 248, 0.82);
}

.favorite-image-card img,
.favorite-sticker-card img {
  display: block;
  width: 100%;
  max-height: 420px;
  object-fit: cover;
}

.favorite-sticker-card {
  display: grid;
  justify-items: center;
  padding: 20px 14px 0;
}

.favorite-sticker-card img {
  width: min(58vw, 220px);
  height: min(58vw, 220px);
  object-fit: contain;
}

.favorite-image-card figcaption,
.favorite-sticker-card figcaption {
  padding: 10px 12px 12px;
  color: #505862;
  font-size: 12px;
  font-weight: 720;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.favorite-location-card,
.favorite-transfer-card,
.favorite-voice-card,
.favorite-text {
  margin: 0 14px 4px;
  border-radius: 20px;
  background: rgba(244, 246, 248, 0.82);
  color: #191b1f;
}

.favorite-location-card,
.favorite-transfer-card,
.favorite-voice-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 14px;
}

.favorite-location-card strong,
.favorite-location-card span,
.favorite-location-card small,
.favorite-transfer-card small,
.favorite-transfer-card strong,
.favorite-transfer-card em {
  display: block;
}

.favorite-location-card span,
.favorite-location-card small,
.favorite-transfer-card small,
.favorite-transfer-card em {
  margin-top: 4px;
  color: #767d86;
  font-size: 12px;
  font-weight: 720;
  font-style: normal;
}

.favorite-location-card > div,
.favorite-transfer-card > div,
.favorite-voice-card > div {
  min-width: 0;
}

.favorite-location-card strong,
.favorite-transfer-card strong,
.favorite-voice-card strong {
  overflow-wrap: anywhere;
}

.favorite-transfer-card > span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(180deg, #111111, #2c2f39);
  color: #ffffff;
  font-weight: 900;
}

.favorite-transfer-card strong {
  font-size: 22px;
  line-height: 1.12;
}

.favorite-voice-card p {
  margin: 4px 0 0;
  color: #505862;
  font-size: 12px;
  font-weight: 720;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.favorite-text {
  padding: 14px;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.favorite-text.narration {
  color: #707781;
  font-style: italic;
}

.favorite-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 10px 14px 14px;
  color: #767d86;
  font-size: 12px;
  font-weight: 720;
}

.favorite-card-foot span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-card-foot button {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(231, 248, 236, 0.96);
  color: #138046;
  font-size: 12px;
  font-weight: 900;
  box-shadow:
    inset 0 0 0 1px rgba(19, 128, 70, 0.08),
    0 10px 24px rgba(16, 24, 20, 0.06);
}

.favorite-card-foot button:active {
  background: #dff4e6;
}

.spin {
  animation: spin 0.85s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@container (max-width: 360px) {
  .favorites-panel {
    gap: 12px;
    padding: 12px;
    border-radius: 18px;
  }

  .favorites-panel--empty {
    min-height: 300px;
  }

  .empty-favorites-card {
    min-height: 240px;
    padding: 22px 14px;
    border-radius: 22px;
  }

  .favorite-card {
    border-radius: 20px;
  }

  .favorite-card-head {
    grid-template-columns: 38px minmax(0, 1fr) 32px;
    gap: 9px;
    padding: 11px;
  }

  .favorite-avatar {
    width: 38px;
    height: 38px;
    border-radius: 14px;
  }

  .favorite-delete-button {
    width: 32px;
    height: 32px;
  }

  .favorite-image-card,
  .favorite-sticker-card,
  .favorite-location-card,
  .favorite-transfer-card,
  .favorite-voice-card,
  .favorite-text {
    margin-right: 11px;
    margin-left: 11px;
  }

  .favorite-location-card,
  .favorite-transfer-card,
  .favorite-voice-card,
  .favorite-text {
    padding: 12px;
    border-radius: 18px;
  }

  .favorite-card-foot {
    padding: 9px 11px 11px;
  }
}

@media (max-width: 420px) {
  .favorites-main {
    padding: 8px max(10px, var(--safe-right)) calc(18px + var(--safe-bottom)) max(10px, var(--safe-left));
  }
}
</style>