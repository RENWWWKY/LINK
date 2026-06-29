<template>
  <section v-if="theater" class="screen no-tabs theater-detail-page">
    <header class="detail-topbar">
      <button class="detail-title-button" type="button" aria-label="返回小剧场列表" @click="goBack">
        <h1>{{ theater.title }}</h1>
      </button>
    </header>

    <iframe class="theater-frame" :title="theater.title" :srcdoc="theater.html" sandbox="allow-scripts"></iframe>
  </section>

  <section v-else class="screen no-tabs theater-detail-page missing-detail">
    <header class="detail-topbar">
      <button class="detail-title-button" type="button" aria-label="返回" @click="goBack">
        <h1>小剧场</h1>
      </button>
    </header>
    <main class="detail-empty">
      <Clapperboard :size="30" />
      <h2>没有找到这个小剧场</h2>
      <p>它可能已经被删除，或还没有完成生成。</p>
      <button type="button" @click="router.replace({ name: 'chats' })">回到聊天列表</button>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Clapperboard } from 'lucide-vue-next';
import { useAppStore } from '@/stores/appStore';

const props = defineProps<{ theaterId: string }>();

const router = useRouter();
const store = useAppStore();

const theater = computed(() => store.smallTheaterById(props.theaterId));

onMounted(() => {
  void store.hydrate();
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  const conversationId = theater.value?.conversationId;
  void router.replace(conversationId ? { name: 'small-theater', params: { id: conversationId } } : { name: 'chats' });
}

</script>

<style scoped>
.theater-detail-page {
  display: flex;
  flex-direction: column;
  background: #0f172a;
}

.detail-topbar {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: calc(6px + var(--safe-top)) 12px 6px;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  color: #111827;
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
}

.detail-title-button {
  display: block;
  min-width: 0;
  max-width: 100%;
  padding: 0;
  color: inherit;
  text-align: left;
}

.detail-title-button h1 {
  margin: 0;
  overflow: hidden;
  color: #111827;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-title-button h1 {
  font-size: 15px;
  font-weight: 900;
  line-height: 1.3;
}

.theater-frame {
  display: block;
  flex: 1;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #ffffff;
}

.missing-detail {
  background: linear-gradient(180deg, #f9fbff 0%, #eef5f4 100%);
  color: #111827;
}

.missing-detail .detail-topbar {
  background: rgba(255, 255, 255, 0.88);
  color: #111827;
}

.detail-empty {
  display: grid;
  place-items: center;
  gap: 10px;
  flex: 1;
  padding: 24px;
  color: #6b7280;
  text-align: center;
}

.detail-empty h2,
.detail-empty p {
  margin: 0;
}

.detail-empty h2 {
  color: #111827;
  font-size: 17px;
}

.detail-empty p {
  max-width: 260px;
  font-size: 13px;
  line-height: 1.55;
}

.detail-empty button {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 8px;
  background: #111827;
  color: #ffffff;
  font-weight: 800;
}
</style>