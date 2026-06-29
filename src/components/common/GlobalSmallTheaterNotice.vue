<template>
  <div v-if="activeTheater" class="theater-notice-backdrop" role="dialog" aria-modal="true" @click.self="closeNotice">
    <section class="theater-notice-sheet">
      <button class="theater-notice-close" type="button" aria-label="关闭小剧场提醒" @click="closeNotice">
        <X :size="18" />
      </button>
      <span>Theater notice</span>
      <h2>{{ activeTheater.authorName }} 生成了小剧场</h2>
      <article class="theater-notice-preview">
        <Clapperboard :size="24" />
        <strong>{{ activeTheater.title }}</strong>
        <small>{{ noticeSummary }}</small>
      </article>
      <button type="button" @click="openTheater">查看小剧场</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Clapperboard, X } from 'lucide-vue-next';
import { playRingtone } from '@/services/ringtone';
import { useAppStore } from '@/stores/appStore';
import type { SmallTheater } from '@/types/domain';

const seenStorageKey = 'link:global-small-theater-notices:seen-theaters';

const router = useRouter();
const store = useAppStore();
const activeTheater = ref<SmallTheater | null>(null);
const seenTheaterIds = ref<Set<string>>(new Set());
const initialized = ref(false);
const theaterIds = computed(() => store.sortedSmallTheaters.map((theater) => theater.id).join('|'));
const noticeSummary = computed(() => {
  const theater = activeTheater.value;
  if (!theater) return '';
  const summary = theater.summary.trim();
  const topicTitle = theater.topicTitle.trim();
  if (!summary || (topicTitle && summary.includes(topicTitle))) return '独立番外小剧场已生成，点击查看完整页面。';
  return summary;
});

function loadSeenTheaterIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(seenStorageKey) || '[]');
    seenTheaterIds.value = new Set(Array.isArray(parsed) ? parsed.map((id) => String(id)) : []);
  } catch {
    seenTheaterIds.value = new Set();
  }
}

function persistSeenTheaterIds() {
  localStorage.setItem(seenStorageKey, JSON.stringify([...seenTheaterIds.value]));
}

function markCurrentTheatersSeen() {
  seenTheaterIds.value = new Set([...seenTheaterIds.value, ...store.sortedSmallTheaters.map((theater) => theater.id)]);
  persistSeenTheaterIds();
}

function showNextNotice() {
  if (activeTheater.value) return;
  const nextTheater = store.sortedSmallTheaters.find((theater) => !seenTheaterIds.value.has(theater.id));
  if (!nextTheater) return;
  activeTheater.value = nextTheater;
  void playRingtone(store.settings, 'voom', nextTheater.charId);
}

function closeNotice() {
  if (activeTheater.value) {
    seenTheaterIds.value = new Set([...seenTheaterIds.value, activeTheater.value.id]);
    persistSeenTheaterIds();
  }
  activeTheater.value = null;
  showNextNotice();
}

function openTheater() {
  const theaterId = activeTheater.value?.id;
  closeNotice();
  if (theaterId) void router.push({ name: 'small-theater-detail', params: { theaterId } });
}

watch(
  () => [store.ready, theaterIds.value] as const,
  ([ready]) => {
    if (!ready) return;
    if (!initialized.value) {
      loadSeenTheaterIds();
      markCurrentTheatersSeen();
      initialized.value = true;
      return;
    }
    showNextNotice();
  },
  { immediate: true }
);
</script>

<style scoped>
.theater-notice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 76;
  display: grid;
  place-items: end center;
  padding: 18px calc(14px + var(--safe-right)) calc(18px + var(--safe-bottom)) calc(14px + var(--safe-left));
  background: rgba(15, 23, 42, 0.2);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.theater-notice-sheet {
  position: relative;
  display: grid;
  gap: 10px;
  width: min(100%, 440px);
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
}

.theater-notice-close {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: transparent;
  color: #111827;
}

.theater-notice-sheet > span {
  color: #2563eb;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.theater-notice-sheet h2 {
  margin: 0;
  padding-right: 28px;
}

.theater-notice-sheet h2 {
  color: #111827;
  font-size: 18px;
  line-height: 1.35;
}

.theater-notice-preview {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 4px 10px;
  padding: 12px;
  border-radius: 8px;
  background: #f0f7ff;
  color: #1d4ed8;
}

.theater-notice-preview svg {
  grid-row: span 2;
  align-self: center;
}

.theater-notice-preview strong,
.theater-notice-preview small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theater-notice-preview strong {
  color: #111827;
  font-size: 14px;
}

.theater-notice-preview small {
  color: #4b5563;
  font-size: 12px;
}

.theater-notice-sheet > button:last-child {
  min-height: 42px;
  border-radius: 8px;
  background: #111827;
  color: #ffffff;
  font-weight: 900;
}
</style>