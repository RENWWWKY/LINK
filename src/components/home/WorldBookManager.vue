<template>
  <div class="world-book-manager">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="hero-kicker">World Book</p>
        <h2>Private Lore</h2>

        <section class="hero-summary" aria-label="藏书摘要">
          <article class="summary-card hero-summary-card">
            <span class="summary-label">总藏书</span>
            <strong>{{ books.length }}</strong>
          </article>
          <article class="summary-card warm hero-summary-card">
            <span class="summary-label">局部设定</span>
            <strong>{{ scopeCounts.local }}</strong>
          </article>
        </section>
      </div>

      <div class="hero-stack" aria-hidden="true">
        <span class="stack-card stack-card-back"></span>
        <span class="stack-card stack-card-middle"></span>
        <span class="stack-card stack-card-front">
          <strong>{{ enabledCount }}</strong>
          <small>active</small>
        </span>
      </div>
    </section>

    <section class="filter-row" aria-label="世界书作用域">
      <button
        v-for="filter in filters"
        :key="filter.id"
        class="filter-pill"
        :class="{ active: activeScope === filter.id }"
        type="button"
        @click="selectFilter(filter.id)"
      >
        <span>{{ filter.label }}</span>
        <small>{{ scopeCount(filter.id) }}</small>
      </button>
    </section>

    <section class="bookshelf-card">
      <div class="section-head">
        <div>
          <p class="section-kicker">Book Covers</p>
          <h3>书架陈列</h3>
        </div>
        <button class="new-book-button" type="button" @click="openCreateModal">新建书页</button>
      </div>

      <div v-if="filteredBooks.length" class="bookshelf-grid">
        <article
          v-for="entry in filteredBooks"
          :key="entry.id"
          class="book-card"
          :class="[scopeClass(entry.scope), { active: selectedBookId === entry.id }]"
        >
          <button class="book-cover-button" type="button" @click="openEditModal(entry)">
            <span class="book-spine"></span>
            <div class="book-card-body">
              <small>{{ scopeLabel(entry.scope) }}</small>
              <strong>{{ entry.title }}</strong>
              <p>{{ excerpt(entry.content) }}</p>
            </div>
            <i class="book-status" :class="{ enabled: entry.enabled }"></i>
          </button>

          <div class="book-actions">
            <button class="book-action" type="button" @click="openEditModal(entry)">编辑</button>
            <button class="book-action danger" type="button" @click="remove(entry)">删除</button>
          </div>
        </article>
      </div>
      <div v-else class="empty-bookshelf">
        <p>这一层书架还没有内容，先写下一条世界规则或角色记忆。</p>
      </div>
    </section>

    <AppModal v-model="showEditor" :title="editorTitle" :show-header="false" variant="ins">
      <section class="editor-card editor-modal-card">
        <div class="section-head compact">
          <div>
            <p class="section-kicker">Edit Sheet</p>
            <h3>{{ selectedBookId ? '修订当前书页' : '新写一页世界书' }}</h3>
          </div>
          <span class="draft-badge">{{ draft.enabled ? '已启用' : '暂存中' }}</span>
        </div>

        <form class="editor-form" @submit.prevent="saveDraft">
          <label class="field">
            <span>标题</span>
            <input v-model="draft.title" placeholder="例如：春日学园守则" required />
          </label>

          <div class="field-grid">
            <label class="field">
              <span>作用域</span>
              <select v-model="draft.scope">
                <option value="global-online">线上全局世界书</option>
                <option value="global-offline">线下全局世界书</option>
                <option value="local">局部世界书</option>
              </select>
            </label>

            <label class="switch-field" :class="{ checked: draft.enabled }">
              <span>状态</span>
              <button class="switch-button" type="button" @click="draft.enabled = !draft.enabled">
                <i></i>
              </button>
              <strong>{{ draft.enabled ? '已启动' : '已关闭' }}</strong>
            </label>
          </div>

          <label class="field">
            <span>内容</span>
            <textarea
              v-model="draft.content"
              placeholder="记录人物关系、地点气味、禁止触碰的话题，或任何能稳定语气与世界观的细节。"
              required
            />
          </label>

          <div class="editor-footer">
            <button class="secondary-ghost" type="button" @click="resetDraft">清空重写</button>
            <button v-if="selectedBookId" class="danger-ghost" type="button" @click="removeCurrent">删除书页</button>
            <button class="save-button" type="submit">保存到书架</button>
          </div>
        </form>
      </section>
    </AppModal>

    <AppModal v-model="showDeleteConfirm" title="确认删除世界书" :show-header="false" variant="ins">
      <section class="confirm-card">
        <p class="section-kicker">Delete Check</p>
        <h3>确认删除这本世界书？</h3>
        <p class="confirm-copy">
          <strong>{{ pendingDeleteTitle || '当前书页' }}</strong>
          删除后会从书架移除，绑定到角色的局部引用也会一并清掉。
        </p>
        <div class="confirm-actions">
          <button class="secondary-ghost" type="button" @click="cancelDelete">再想想</button>
          <button class="danger-ghost confirm-delete-button" type="button" @click="confirmDelete">确认删除</button>
        </div>
      </section>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import type { WorldBookEntry } from '@/types/domain';
import { createId } from '@/utils/id';
import { createWorldBookLoreEntry } from '@/utils/worldBook';

const props = defineProps<{
  books: WorldBookEntry[];
}>();

const emit = defineEmits<{
  save: [entry: WorldBookEntry];
  delete: [worldBookId: string];
}>();

type ScopeFilter = 'all' | WorldBookEntry['scope'];

const filters: Array<{ id: ScopeFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'global-online', label: '线上' },
  { id: 'global-offline', label: '线下' },
  { id: 'local', label: '局部' }
];

const activeScope = ref<ScopeFilter>('all');
const selectedBookId = ref<string | null>(null);
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const pendingDeleteId = ref<string | null>(null);
const pendingDeleteTitle = ref('');
const draft = reactive(createDraft());

const editorTitle = computed(() => (selectedBookId.value ? '编辑世界书' : '新建世界书'));

const scopeCounts = computed(() => ({
  'global-online': props.books.filter((book) => book.scope === 'global-online').length,
  'global-offline': props.books.filter((book) => book.scope === 'global-offline').length,
  local: props.books.filter((book) => book.scope === 'local').length
}));

const enabledCount = computed(() => props.books.filter((book) => book.enabled).length);

const filteredBooks = computed(() => {
  if (activeScope.value === 'all') return props.books;
  return props.books.filter((book) => book.scope === activeScope.value);
});

function createDraft(scope: WorldBookEntry['scope'] = 'local'): WorldBookEntry {
  return {
    id: createId('wb'),
    title: '',
    content: '',
    entries: [createWorldBookLoreEntry({ title: '默认条目', activation: 'constant' })],
    scope,
    enabled: true,
    coverImage: ''
  };
}

function selectFilter(scope: ScopeFilter) {
  activeScope.value = scope;
}

function scopeCount(scope: ScopeFilter) {
  if (scope === 'all') return props.books.length;
  return scopeCounts.value[scope];
}

function resetDraft() {
  selectedBookId.value = null;
  Object.assign(draft, createDraft(activeScope.value === 'all' ? 'local' : activeScope.value));
}

function openCreateModal() {
  resetDraft();
  showEditor.value = true;
}

function openEditModal(entry: WorldBookEntry) {
  selectedBookId.value = entry.id;
  Object.assign(draft, { ...entry });
  showEditor.value = true;
}

function saveDraft() {
  emit('save', { ...draft });
  selectedBookId.value = draft.id;
  showEditor.value = false;
}

function remove(entry: WorldBookEntry) {
  pendingDeleteId.value = entry.id;
  pendingDeleteTitle.value = entry.title;
  showDeleteConfirm.value = true;
}

function removeCurrent() {
  if (!selectedBookId.value) return;
  showEditor.value = false;
  pendingDeleteId.value = selectedBookId.value;
  pendingDeleteTitle.value = draft.title;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  pendingDeleteId.value = null;
  pendingDeleteTitle.value = '';
  showDeleteConfirm.value = false;
}

function confirmDelete() {
  if (!pendingDeleteId.value) return;
  emit('delete', pendingDeleteId.value);
  if (selectedBookId.value === pendingDeleteId.value) {
    resetDraft();
  }
  cancelDelete();
}

function scopeLabel(scope: WorldBookEntry['scope']) {
  return {
    'global-online': '线上全局',
    'global-offline': '线下全局',
    local: '局部设定'
  }[scope];
}

function scopeClass(scope: WorldBookEntry['scope']) {
  return {
    'global-online': 'scope-online',
    'global-offline': 'scope-offline',
    local: 'scope-local'
  }[scope];
}

function excerpt(content: string) {
  return content.trim().slice(0, 52) || '点击继续补完这本设定。';
}
</script>

<style scoped>
.world-book-manager {
  display: grid;
  gap: clamp(14px, 4vw, 18px);
  padding-bottom: calc(16px + var(--safe-bottom));
}

.hero-card,
.bookshelf-card,
.editor-card,
.summary-card {
  position: relative;
  overflow: hidden;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  padding: clamp(18px, 5vw, 24px);
  border: 1px solid rgba(109, 78, 65, 0.08);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255, 253, 250, 0.94), rgba(248, 239, 230, 0.9)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 248, 240, 0.82));
  box-shadow: 0 22px 44px rgba(91, 67, 55, 0.09);
}

.hero-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent 48%);
  pointer-events: none;
}

.hero-copy h2,
.section-head h3 {
  margin: 0;
  font-family: var(--app-current-font-family);
  color: #34231b;
}

.hero-kicker,
.section-kicker,
.summary-label {
  margin: 0;
  color: #9a7b69;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-copy h2 {
  margin-top: 6px;
  font-size: clamp(28px, 8.4vw, 32px);
  line-height: 1.02;
  font-weight: 600;
}

.hero-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.hero-stack {
  justify-self: end;
  position: relative;
  min-height: 124px;
}

.stack-card {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 84px;
  border-radius: 16px 18px 18px 16px;
  box-shadow: 0 14px 28px rgba(66, 45, 38, 0.16);
}

.stack-card-back {
  height: 108px;
  transform: rotate(-8deg) translate(-12px, -12px);
  background: linear-gradient(180deg, #d6c0af, #c9aa91);
}

.stack-card-middle {
  height: 124px;
  transform: rotate(6deg) translate(-4px, -4px);
  background: linear-gradient(180deg, #f1e2d6, #e2c6b3);
}

.stack-card-front {
  display: grid;
  align-content: end;
  gap: 2px;
  height: 132px;
  padding: 16px 14px;
  background: linear-gradient(180deg, #fffdfa, #f5e8dd);
  color: #4b352d;
}

.stack-card-front strong {
  font-family: var(--app-current-font-family);
  font-size: 40px;
  font-weight: 600;
}

.stack-card-front small {
  color: #8e6c5d;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.summary-card {
  display: grid;
  gap: 10px;
  min-height: 92px;
  padding: 16px 14px;
  border: 1px solid rgba(115, 87, 73, 0.08);
  border-radius: 24px;
  background: rgba(255, 251, 246, 0.8);
  box-shadow: 0 10px 24px rgba(91, 67, 55, 0.05);
}

.summary-card strong {
  font-family: var(--app-current-font-family);
  color: #39261f;
  font-size: 30px;
  font-weight: 600;
}

.summary-card.warm {
  background: linear-gradient(180deg, rgba(245, 231, 219, 0.86), rgba(255, 250, 244, 0.86));
}

.hero-summary-card {
  min-height: 86px;
  padding: 14px 14px 12px;
  background: rgba(255, 251, 246, 0.72);
  box-shadow: 0 8px 18px rgba(91, 67, 55, 0.05);
}

.hero-summary-card strong {
  font-size: 28px;
}

.filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.filter-row::-webkit-scrollbar {
  display: none;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 15px;
  border: 1px solid rgba(121, 91, 77, 0.08);
  border-radius: 999px;
  background: rgba(255, 250, 245, 0.84);
  color: #73594d;
  white-space: nowrap;
  box-shadow: 0 8px 18px rgba(91, 67, 55, 0.04);
}

.filter-pill span,
.new-book-button,
.book-card strong,
.draft-badge,
.save-button,
.secondary-ghost,
.switch-field strong {
  font-weight: 800;
}

.filter-pill small {
  color: #ad8f7d;
  font-size: 11px;
}

.filter-pill.active {
  background: #6d4e41;
  color: #fff8f0;
}

.filter-pill.active small {
  color: rgba(255, 248, 240, 0.76);
}

.bookshelf-card,
.editor-card {
  padding: 20px;
  border: 1px solid rgba(111, 83, 69, 0.08);
  border-radius: 30px;
  background: rgba(255, 252, 248, 0.84);
  box-shadow: 0 18px 38px rgba(91, 67, 55, 0.08);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.section-head h3 {
  margin-top: 7px;
  font-size: 26px;
  font-weight: 600;
}

.new-book-button,
.draft-badge,
.secondary-ghost,
.save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
}

.new-book-button,
.secondary-ghost {
  border: 1px solid rgba(120, 91, 76, 0.14);
  background: rgba(255, 248, 240, 0.9);
  color: #6e5144;
}

.new-book-button {
  width: 100%;
}

.bookshelf-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.book-card {
  position: relative;
  display: grid;
  gap: 10px;
  min-height: 0;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 22px;
  color: #2f221c;
  text-align: left;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.58), 0 12px 22px rgba(73, 50, 42, 0.08);
}

.book-card.active {
  border-color: rgba(83, 59, 49, 0.18);
  transform: translateY(-1px);
}

.book-cover-button {
  display: flex;
  gap: 12px;
  min-height: 126px;
  padding: 4px;
  text-align: left;
}

.book-spine {
  width: 12px;
  border-radius: 999px;
  background: rgba(79, 57, 48, 0.16);
}

.book-card-body {
  display: grid;
  align-content: space-between;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.book-card-body small {
  color: rgba(55, 37, 30, 0.62);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.book-card strong {
  display: -webkit-box;
  overflow: hidden;
  font-size: 19px;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.book-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: rgba(62, 44, 37, 0.74);
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.book-status {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(108, 80, 67, 0.2);
}

.book-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.book-action {
  min-height: 34px;
  border: 1px solid rgba(110, 83, 69, 0.12);
  border-radius: 999px;
  background: rgba(255, 249, 243, 0.84);
  color: #654c40;
  font-size: 12px;
  font-weight: 800;
}

.book-action.danger,
.danger-ghost {
  color: #9a4c46;
}

.book-status.enabled {
  background: #7d9f74;
  box-shadow: 0 0 0 6px rgba(125, 159, 116, 0.13);
}

.scope-online {
  background: linear-gradient(180deg, #f1dfd2, #f8efe8);
}

.scope-offline {
  background: linear-gradient(180deg, #dfddd7, #f6f1ea);
}

.scope-local {
  background: linear-gradient(180deg, #ebdfd3, #fff8f2);
}

.empty-bookshelf {
  display: grid;
  place-items: center;
  min-height: 164px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(245, 234, 223, 0.68), rgba(255, 249, 243, 0.84));
  color: #7c6358;
  text-align: center;
  line-height: 1.7;
}

.draft-badge {
  background: rgba(246, 235, 226, 0.92);
  color: #785a4b;
  font-size: 12px;
}

.editor-modal-card {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.section-head.compact {
  margin-bottom: 14px;
}

.editor-form {
  display: grid;
  gap: 14px;
}

.field,
.switch-field {
  display: grid;
  gap: 8px;
}

.field span,
.switch-field span {
  color: #8d6f61;
  font-size: 12px;
  font-weight: 800;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.field input,
.field select,
.field textarea {
  border: 1px solid rgba(113, 86, 73, 0.1);
  border-radius: 18px;
  background: rgba(255, 251, 246, 0.92);
  color: #34261f;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.field input,
.field select {
  min-height: 48px;
  padding: 0 15px;
}

.field textarea {
  min-height: 200px;
  padding: 14px 15px;
  resize: vertical;
  line-height: 1.75;
}

.switch-field {
  align-content: start;
  padding: 13px 15px;
  border: 1px solid rgba(113, 86, 73, 0.1);
  border-radius: 18px;
  background: rgba(255, 251, 246, 0.92);
}

.switch-button {
  position: relative;
  width: 54px;
  height: 31px;
  border-radius: 999px;
  background: rgba(133, 110, 99, 0.18);
  transition: background 0.2s ease;
}

.switch-button i {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 23px;
  height: 23px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(62, 44, 37, 0.18);
  transition: transform 0.2s ease;
}

.switch-field.checked .switch-button {
  background: #6f8a62;
}

.switch-field.checked .switch-button i {
  transform: translateX(23px);
}

.editor-footer {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.editor-footer > * {
  width: 100%;
}

.save-button {
  background: #6d4e41;
  color: #fff9f3;
  box-shadow: 0 12px 24px rgba(78, 54, 44, 0.16);
}

.danger-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(154, 76, 70, 0.14);
  border-radius: 999px;
  background: rgba(255, 244, 242, 0.92);
  font-weight: 800;
}

.confirm-card {
  display: grid;
  gap: 14px;
  padding: 4px;
}

.confirm-card h3 {
  margin: 0;
  font-family: var(--app-current-font-family);
  color: #34231b;
  font-size: clamp(24px, 7.6vw, 28px);
  font-weight: 600;
  line-height: 1.1;
}

.confirm-copy {
  margin: 0;
  color: #735b50;
  line-height: 1.7;
}

.confirm-copy strong {
  display: block;
  margin-bottom: 4px;
  color: #34231b;
}

.confirm-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.confirm-actions .secondary-ghost,
.confirm-delete-button {
  width: 100%;
  white-space: nowrap;
}

.confirm-delete-button {
  min-width: 0;
}

@media (min-width: 480px) {
  .section-head {
    flex-wrap: nowrap;
  }

  .new-book-button {
    width: auto;
  }

  .field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .editor-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .editor-footer > * {
    width: auto;
  }

  .editor-footer .save-button {
    margin-left: auto;
  }
}

@media (min-width: 680px) {
  .hero-card {
    grid-template-columns: minmax(0, 1fr) 116px;
    gap: 14px;
  }

  .hero-stack {
    min-height: 132px;
  }

  .bookshelf-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>