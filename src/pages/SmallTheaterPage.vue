<template>
  <section v-if="conversation && character" class="screen no-tabs small-theater-page">
    <header class="top-bar theater-topbar">
      <button class="theater-title-button" type="button" aria-label="返回聊天" @click="goBack">
        <h1 class="top-title">Small Theater</h1>
      </button>
      <div class="theater-header-actions">
        <button class="header-action-button" type="button" aria-label="新增题材" title="新增题材" @click="openCreateTopic">
          <Plus :size="18" stroke-width="2.4" />
        </button>
      </div>
    </header>

    <main class="theater-main">
      <section class="theater-panel">
      <section v-if="activeTab === 'topics'" class="theater-section" aria-label="题材管理">
        <header class="theater-section-head">
          <div>
            <p class="section-kicker">Topics</p>
            <h2>题材管理</h2>
          </div>
          <span class="section-count">{{ topics.length }}</span>
        </header>
        <article
          v-for="topic in topics"
          :key="topic.id"
          class="topic-card"
          :class="{ disabled: !topic.enabled }"
          role="button"
          tabindex="0"
          @click="openEditTopic(topic)"
          @keydown.enter.prevent="openEditTopic(topic)"
          @keydown.space.prevent="openEditTopic(topic)"
        >
          <button class="topic-switch" :class="{ active: topic.enabled }" type="button" role="switch" :aria-checked="topic.enabled" @click.stop="toggleTopic(topic)">
            <span></span>
          </button>
          <strong class="topic-title">{{ topic.title }}</strong>
        </article>

        <section v-if="!topics.length" class="theater-empty">
          <Sparkles :size="26" />
          <h2>还没有题材</h2>
          <p>新增一个题材后，就能让角色生成独立番外页面。</p>
          <button type="button" @click="openCreateTopic">新增题材</button>
        </section>
      </section>

      <section v-else class="theater-section" aria-label="生成卡片">
        <header class="theater-section-head">
          <div>
            <p class="section-kicker">Cards</p>
            <h2>生成卡片</h2>
          </div>
          <span class="section-count">{{ theaters.length }}</span>
        </header>
        <section class="generate-panel">
          <label>
            <span>生成题材</span>
            <select v-model="selectedTopicId" :disabled="generatingTheater || !enabledTopics.length">
              <option value="">随机启用题材</option>
              <option v-for="topic in enabledTopics" :key="topic.id" :value="topic.id">{{ topic.title }}</option>
            </select>
          </label>
          <button class="generate-button" type="button" :disabled="generatingTheater || !enabledTopics.length" @click="generateTheater">
            <LoaderCircle v-if="generatingTheater" class="spin" :size="17" />
            <Sparkles v-else :size="17" />
            <span>{{ generatingTheater ? '生成中' : '生成小剧场' }}</span>
          </button>
        </section>

        <article v-for="theater in theaters" :key="theater.id" class="theater-card" role="button" tabindex="0" @click="openTheater(theater.id)" @keydown.enter.prevent="openTheater(theater.id)">
          <span class="theater-card-icon"><Clapperboard :size="19" /></span>
          <span class="theater-card-content">
            <strong>{{ theater.title }}</strong>
            <em>{{ theater.summary }}</em>
          </span>
          <button class="theater-card-delete" type="button" aria-label="删除小剧场" @click.stop="deleteTheater(theater.id)">
            <Trash2 :size="17" />
          </button>
        </article>

        <section v-if="!theaters.length" class="theater-empty">
          <Clapperboard :size="28" />
          <h2>还没有生成卡片</h2>
          <p>点击生成后，会得到一个独立 HTML 番外页面。</p>
        </section>
      </section>
      </section>
    </main>

    <nav class="theater-bottom-tabs" aria-label="小剧场页面切换">
      <button type="button" :class="{ active: activeTab === 'topics' }" @click="activeTab = 'topics'">
        <ListChecks :size="20" />
        <span>题材管理</span>
      </button>
      <button type="button" :class="{ active: activeTab === 'cards' }" @click="activeTab = 'cards'">
        <PanelsTopLeft :size="20" />
        <span>生成卡片</span>
      </button>
    </nav>

    <AppModal v-model="showTopicEditor" :title="editingTopicId ? '编辑题材' : '新增题材'" variant="ins">
      <form class="topic-editor" @submit.prevent="saveTopicDraft">
        <label>
          <span>题材名称</span>
          <input v-model="topicDraft.title" maxlength="36" placeholder="例如：论坛、群聊、深夜电台" />
        </label>
        <label>
          <span>扩展提示词</span>
          <textarea v-model="topicDraft.prompt" maxlength="8000" rows="6" placeholder="写清楚希望小剧场呈现的形式、语气和互动点。"></textarea>
        </label>
        <label class="topic-editor-switch">
          <input v-model="topicDraft.enabled" type="checkbox" />
          <span>启用这个题材</span>
        </label>
        <div class="topic-editor-actions" :class="{ editing: editingTopicId }">
          <button v-if="editingTopicId" class="danger" type="button" @click="deleteEditingTopic">删除</button>
          <button class="secondary" type="button" @click="showTopicEditor = false">取消</button>
          <button class="primary" type="submit">{{ editingTopicId ? '保存编辑' : '保存' }}</button>
        </div>
      </form>
    </AppModal>
  </section>

  <section v-else class="screen no-tabs small-theater-page missing-theater">
    <header class="top-bar theater-topbar">
      <button class="theater-title-button" type="button" aria-label="返回" @click="goBack">
        <h1 class="top-title">Small Theater</h1>
      </button>
    </header>
    <section class="theater-empty">
      <Clapperboard :size="28" />
      <h2>没有找到这个小剧场入口</h2>
      <button type="button" @click="router.replace({ name: 'chats' })">回到聊天列表</button>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Clapperboard, ListChecks, LoaderCircle, PanelsTopLeft, Plus, Sparkles, Trash2 } from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';
import { useAppStore } from '@/stores/appStore';
import type { SmallTheaterTopic } from '@/types/domain';

const props = defineProps<{ id: string }>();

const router = useRouter();
const store = useAppStore();

const activeTab = ref<'topics' | 'cards'>('topics');
const showTopicEditor = ref(false);
const editingTopicId = ref<string | null>(null);
const selectedTopicId = ref('');
const generatingTheater = ref(false);
const topicDraft = reactive({ title: '', prompt: '', enabled: true });

const conversation = computed(() => store.conversationById(props.id));
const character = computed(() => conversation.value ? store.characterById(conversation.value.charId) : null);
const topics = computed(() => character.value ? store.smallTheaterTopicsForCharacter(character.value.id) : []);
const theaters = computed(() => character.value ? store.smallTheatersForCharacter(character.value.id) : []);
const enabledTopics = computed(() => topics.value.filter((topic) => topic.enabled));

onMounted(async () => {
  await store.hydrate();
  if (character.value) await store.ensureSmallTheaterTopicsForCharacter(character.value.id);
});

watch(() => character.value?.id, async (characterId) => {
  if (characterId) await store.ensureSmallTheaterTopicsForCharacter(characterId);
}, { immediate: true });

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.replace({ name: 'chat-room', params: { id: props.id } });
}

function openCreateTopic() {
  editingTopicId.value = null;
  topicDraft.title = '';
  topicDraft.prompt = '';
  topicDraft.enabled = true;
  showTopicEditor.value = true;
}

function openEditTopic(topic: SmallTheaterTopic) {
  editingTopicId.value = topic.id;
  topicDraft.title = topic.title;
  topicDraft.prompt = topic.prompt;
  topicDraft.enabled = topic.enabled;
  showTopicEditor.value = true;
}

async function saveTopicDraft() {
  const currentCharacter = character.value;
  if (!currentCharacter) return;
  const title = topicDraft.title.trim();
  const prompt = topicDraft.prompt.trim();
  if (!title) {
    store.showConfigAlert('请填写题材名称。', '无法保存题材');
    return;
  }

  const existingTopic = editingTopicId.value ? topics.value.find((topic) => topic.id === editingTopicId.value) : null;
  if (existingTopic) {
    await store.saveSmallTheaterTopic({ ...existingTopic, title, prompt, enabled: topicDraft.enabled });
  } else {
    await store.createSmallTheaterTopic({ charId: currentCharacter.id, title, prompt, enabled: topicDraft.enabled });
  }
  showTopicEditor.value = false;
}

async function toggleTopic(topic: SmallTheaterTopic) {
  await store.saveSmallTheaterTopic({ ...topic, enabled: !topic.enabled });
}

async function deleteTopic(topic: SmallTheaterTopic) {
  if (!window.confirm(`删除题材“${topic.title}”？已生成的小剧场卡片会保留。`)) return false;
  await store.deleteSmallTheaterTopic(topic.id);
  return true;
}

async function deleteEditingTopic() {
  const topic = editingTopicId.value ? topics.value.find((item) => item.id === editingTopicId.value) : null;
  if (!topic) return;
  const deleted = await deleteTopic(topic);
  if (!deleted) return;
  editingTopicId.value = null;
  showTopicEditor.value = false;
}

async function generateTheater() {
  if (generatingTheater.value) return;
  generatingTheater.value = true;
  try {
    const theater = await store.createSmallTheaterFromConversation(props.id, selectedTopicId.value || undefined);
    if (theater) await router.push({ name: 'small-theater-detail', params: { theaterId: theater.id } });
  } catch (error) {
    store.showConfigAlert(error instanceof Error ? error.message : '小剧场生成失败。', '无法生成小剧场');
  } finally {
    generatingTheater.value = false;
  }
}

function openTheater(theaterId: string) {
  void router.push({ name: 'small-theater-detail', params: { theaterId } });
}

async function deleteTheater(theaterId: string) {
  if (!window.confirm('删除这个小剧场卡片？')) return;
  await store.deleteSmallTheater(theaterId);
}

</script>

<style scoped>
.small-theater-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 0;
  background:
    radial-gradient(circle at 8% 0%, rgba(255, 218, 227, 0.58), transparent 30%),
    radial-gradient(circle at 96% 8%, rgba(6, 199, 85, 0.16), transparent 28%),
    linear-gradient(180deg, #fbfcfb 0%, #f5f7f6 54%, #edf3f1 100%);
  color: #151719;
}

.theater-topbar {
  align-items: center;
  justify-content: space-between;
  background: rgba(251, 252, 251, 0.9);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
}

.theater-title-button {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  margin-right: auto;
  padding: 0;
  color: inherit;
}

.theater-title-button .top-title {
  margin: 0;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theater-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.header-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  width: 34px;
  min-height: 34px;
  padding: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
  color: #111111;
}

.theater-main {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 10px calc(16px + var(--safe-right)) 16px calc(16px + var(--safe-left));
}

.theater-panel {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-size: 12px;
}

.theater-section {
  display: grid;
  gap: 0;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 14px 36px rgba(21, 30, 26, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.92);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}

.theater-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 8px;
}

.theater-section-head p,
.theater-section-head h2 {
  margin: 0;
}

.section-kicker {
  color: #8b928c;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.theater-section-head h2 {
  margin-top: 2px;
  color: #111111;
  font-size: 17px;
  line-height: 1.25;
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f6f7f7;
  color: #171717;
  font-size: 11px;
  font-weight: 900;
}

.topic-card,
.generate-panel,
.theater-card,
.theater-empty {
  min-width: 0;
  border: 1px solid rgba(20, 24, 22, 0.05);
  border-radius: 16px;
  background: #f6f7f7;
  box-shadow: none;
}

.topic-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 8px 2px;
  border: 0;
  border-bottom: 1px solid rgba(20, 24, 22, 0.06);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
}

.topic-card:last-of-type {
  border-bottom: 0;
}

.topic-card.disabled {
  opacity: 0.58;
}

.topic-title {
  display: block;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: #111111;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-switch {
  width: 38px;
  height: 22px;
  padding: 0;
  border-radius: 999px;
  background: #dedad7;
  transition: background 0.18s ease;
}

.topic-switch span {
  display: block;
  width: 18px;
  height: 18px;
  margin: 2px 0 0 2px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 3px 8px rgba(42, 35, 31, 0.18);
  transition: transform 0.18s ease;
}

.topic-switch.active {
  background: #171717;
}

.topic-switch.active span {
  transform: translateX(16px);
}

.theater-card-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: rgba(239, 68, 90, 0.08);
  color: #ef445a;
}

.generate-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(116px, auto);
  align-items: end;
  gap: 10px;
  padding: 12px;
}

.generate-panel label,
.topic-editor label {
  display: grid;
  gap: 7px;
  color: #5f6761;
  font-size: 12px;
  font-weight: 900;
}

.generate-panel select,
.topic-editor input,
.topic-editor textarea {
  width: 100%;
  border: 1px solid rgba(42, 75, 60, 0.08);
  border-radius: 14px;
  background: #ffffff;
  color: #151719;
  font: inherit;
  box-shadow: none;
}

.generate-panel select,
.topic-editor input {
  height: 44px;
  padding: 0 12px;
}

.topic-editor textarea {
  min-height: 130px;
  padding: 10px 12px;
  resize: vertical;
}

.generate-button,
.theater-empty button,
.topic-editor-actions .primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  background: #171717;
  color: #ffffff;
  font-weight: 900;
  white-space: nowrap;
}

.generate-button:disabled {
  opacity: 0.5;
}

.spin {
  animation: theater-spin 0.8s linear infinite;
}

.theater-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 28px;
  gap: 10px;
  width: 100%;
  padding: 10px;
  text-align: left;
  cursor: pointer;
}

.theater-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  color: #171717;
}

.theater-card-content {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.theater-card-content strong,
.theater-card-content em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theater-card-content strong {
  color: #111111;
  font-size: 14px;
  font-weight: 900;
}

.theater-card-content em {
  color: #85898e;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
}

.theater-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 210px;
  padding: 22px;
  color: #69706a;
  text-align: center;
}

.theater-empty h2,
.theater-empty p {
  margin: 0;
}

.theater-empty h2 {
  color: #111111;
  font-size: 16px;
  font-weight: 900;
}

.theater-empty p {
  max-width: 260px;
  font-size: 13px;
  line-height: 1.55;
}

.theater-bottom-tabs {
  position: relative;
  z-index: 20;
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 8px calc(12px + var(--safe-right)) calc(10px + var(--safe-bottom)) calc(12px + var(--safe-left));
  border-top: 1px solid rgba(17, 17, 17, 0.05);
  background: rgba(255, 255, 255, 0.96);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
}

.theater-bottom-tabs button {
  display: grid;
  justify-items: center;
  gap: 3px;
  min-width: 0;
  min-height: 48px;
  padding: 6px 4px;
  border-radius: 14px;
  color: #69706a;
  font-size: 10px;
  font-weight: 800;
}

.theater-bottom-tabs button span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theater-bottom-tabs button.active {
  background: #eef8f1;
  color: #111111;
}

.topic-editor {
  display: grid;
  gap: 14px;
}

.topic-editor-switch {
  display: flex !important;
  align-items: center;
  gap: 9px !important;
}

.topic-editor-switch input {
  width: 18px;
  height: 18px;
}

.topic-editor-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.topic-editor-actions.editing {
  grid-template-columns: 0.9fr 0.9fr 1.2fr;
}

.topic-editor-actions .secondary,
.topic-editor-actions .danger {
  min-height: 42px;
  border-radius: 14px;
  background: rgba(17, 17, 17, 0.06);
  color: #111111;
  font-weight: 900;
}

.topic-editor-actions .danger {
  background: rgba(239, 68, 90, 0.1);
  color: #ef445a;
}

.missing-theater {
  min-height: var(--app-height);
}

@keyframes theater-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 360px) {
  .theater-topbar {
    gap: 8px;
  }

  .theater-main {
    padding-inline: 12px;
  }

  .generate-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .theater-bottom-tabs {
    gap: 3px;
    padding-inline: calc(8px + var(--safe-left));
    padding-right: calc(8px + var(--safe-right));
  }

  .theater-bottom-tabs button {
    min-height: 46px;
    border-radius: 12px;
    font-size: 9px;
  }
}
</style>