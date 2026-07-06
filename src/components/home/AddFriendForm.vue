<template>
  <section class="add-friend-sheet">
    <form v-if="activeTab === 'add'" id="add-friend-form" class="form-grid" @submit.prevent="submitAdd">
      <section class="profile-section wide-field" aria-label="角色基础资料">
        <div class="avatar-card">
          <img class="avatar-preview" :src="avatarPreview" :alt="draft.nickname || draft.name || 'new friend'" />
          <label class="avatar-upload">
            <input type="file" accept="image/*" @change="readAvatar($event, 'add')" />
            <span>导入头像</span>
          </label>
        </div>
        <div class="profile-fields">
          <label class="field avatar-url-field">
            <span>头像 URL</span>
            <input v-model="draft.avatar" placeholder="https://..." />
          </label>

          <section class="identity-row" aria-label="角色名称资料">
            <label class="field compact-field">
              <span>名字</span>
              <input v-model="draft.name" required placeholder="真名" />
            </label>

            <label class="field compact-field">
              <span>网名</span>
              <input v-model="draft.nickname" placeholder="" />
            </label>

            <label class="field compact-field note-field">
              <span>备注</span>
              <input v-model="draft.userNote" placeholder="备注名" />
            </label>
          </section>
        </div>
      </section>

      <label class="field wide-field">
        <span>个性签名</span>
        <input v-model="draft.signature" placeholder="角色在 Link 上的个性签名" />
      </label>

      <label class="field wide-field">
        <span>角色资料</span>
        <textarea v-model="draft.description" rows="7" />
      </label>

      <label class="field wide-field">
        <span>绑定用户账号</span>
        <select v-model="draft.boundUserId">
          <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.nickname }} · ID {{ account.id }}</option>
        </select>
      </label>

      <label class="field wide-field">
        <span>绑定局部世界书</span>
        <select :value="localBookSelectValue" :disabled="!localBooks.length" @change="toggleLocalWorldBookFromSelect">
          <option :value="localBookSelectValue" disabled>{{ localBookSummary }}</option>
          <option v-for="book in localBooks" :key="book.id" :value="book.id">
            {{ draft.localWorldBookIds.includes(book.id) ? '✓ ' : '' }}{{ book.title }}
          </option>
        </select>
      </label>

    </form>

    <section v-else-if="activeTab === 'scan'" class="scan-panel">
      <p class="panel-copy">导入 PNG 角色卡图片或 JSON 文件，会自动创建角色并把绑定世界书一起导入成局部世界书。</p>
      <label class="upload-card">
        <input type="file" accept=".json,image/png" @change="importCard($event)" />
        <ImagePlus class="upload-icon" :size="22" stroke-width="2.2" aria-hidden="true" />
        <strong>导入角色卡</strong>
        <span>支持 PNG / JSON</span>
      </label>

      <form v-if="importPreview" id="import-character-form" class="form-grid import-edit-form" @submit.prevent="submitImportedCharacter">
        <section class="profile-section wide-field" aria-label="导入角色基础资料">
          <div class="avatar-card">
            <img class="avatar-preview" :src="scanAvatarPreview" :alt="scanDraft.nickname || scanDraft.name || 'imported friend'" />
            <label class="avatar-upload">
              <input type="file" accept="image/*" @change="readAvatar($event, 'scan')" />
              <span>导入头像</span>
            </label>
          </div>
          <div class="profile-fields">
            <label class="field avatar-url-field">
              <span>头像 URL</span>
              <input v-model="scanDraft.avatar" placeholder="https://..." />
            </label>

            <section class="identity-row" aria-label="导入角色名称资料">
              <label class="field compact-field">
                <span>名字</span>
                <input v-model="scanDraft.name" required placeholder="真名" />
              </label>

              <label class="field compact-field">
                <span>网名</span>
                <input v-model="scanDraft.nickname" placeholder="" />
              </label>

              <label class="field compact-field note-field">
                <span>备注</span>
                <input v-model="scanDraft.userNote" placeholder="备注名" />
              </label>
            </section>
          </div>
        </section>

        <label class="field wide-field">
          <span>个性签名</span>
          <input v-model="scanDraft.signature" placeholder="角色在 Link 上的个性签名" />
        </label>

        <label class="field wide-field">
          <span>角色资料</span>
          <textarea v-model="scanDraft.description" rows="7" />
        </label>

        <label class="field wide-field">
          <span>绑定用户账号</span>
          <select v-model="scanDraft.boundUserId">
            <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.nickname }} · ID {{ account.id }}</option>
          </select>
        </label>

        <section v-if="scanDraft.importedWorldBooks.length" class="import-book-summary wide-field" aria-label="随角色卡导入的世界书">
          <div class="local-book-header">
            <strong>随卡导入局部世界书</strong>
            <span>{{ scanDraft.importedWorldBooks.length }} 本 / {{ importedLoreEntryCount }} 条条目</span>
          </div>
          <div class="import-book-list">
            <span v-for="book in scanDraft.importedWorldBooks" :key="book.id">{{ book.title }}</span>
          </div>
        </section>

      </form>
    </section>

    <section v-else class="placeholder-panel">
      <strong>{{ activeTab === 'create-group' ? '创建群组' : '加入群组' }}</strong>
      <p>这里先保留占位，后续会接群资料、邀请口令和群聊会话流。</p>
    </section>

    <AvatarCropperModal v-model="showAvatarEditor" :src="avatarEditorSource" @confirm="applyEditedAvatar" />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ImagePlus } from 'lucide-vue-next';
import AvatarCropperModal from '@/components/image/AvatarCropperModal.vue';
import type { UserProfile, WorldBookEntry } from '@/types/domain';
import { importSillyTavernCharacterCard, type ImportedCharacterCard } from '@/utils/characterCard';
import { readImageFileFromInput } from '@/utils/imageFile';

const defaultAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="默认角色头像">
    <defs>
      <linearGradient id="friendCardBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffd8e3"/>
        <stop offset="100%" stop-color="#dff7e8"/>
      </linearGradient>
    </defs>
    <rect width="96" height="96" rx="28" fill="url(#friendCardBg)"/>
    <circle cx="48" cy="35" r="15" fill="#ffffff" fill-opacity="0.96"/>
    <path d="M24 79c3-14 14-22 24-22s21 8 24 22" fill="#ffffff" fill-opacity="0.96"/>
  </svg>
`)}`;

interface AddFriendPayload {
  nickname: string;
  name: string;
  userNote: string;
  avatar: string;
  signature: string;
  description: string;
  boundUserId: string;
  localWorldBookIds?: string[];
  importedWorldBooks?: WorldBookEntry[];
}

type TabId = 'add' | 'scan' | 'create-group' | 'join-group';

const props = withDefaults(defineProps<{
  accounts: UserProfile[];
  activeUserId: string;
  activeTab?: TabId;
  localBooks?: WorldBookEntry[];
}>(), {
  activeTab: 'add',
  localBooks: () => []
});

const emit = defineEmits<{
  add: [payload: AddFriendPayload];
  'update:activeTab': [value: TabId];
  'scan-import-ready': [value: boolean];
}>();

const activeTab = computed({
  get: () => props.activeTab,
  set: (value: TabId) => emit('update:activeTab', value)
});
const importPreview = ref<ImportedCharacterCard | null>(null);
const showAvatarEditor = ref(false);
const avatarEditorSource = ref('');
const avatarEditTarget = ref<'add' | 'scan'>('add');
const localBookSelectValue = '__local_world_book_summary__';
const localBooks = computed(() => props.localBooks.filter((book) => book.scope === 'local'));

const draft = reactive({
  nickname: '',
  name: '',
  userNote: '',
  avatar: '',
  signature: '',
  description: '',
  boundUserId: props.activeUserId || props.accounts[0]?.id || '',
  localWorldBookIds: [] as string[]
});
const scanDraft = reactive({
  nickname: '',
  name: '',
  userNote: '',
  avatar: '',
  signature: '',
  description: '',
  boundUserId: props.activeUserId || props.accounts[0]?.id || '',
  localWorldBookIds: [] as string[],
  importedWorldBooks: [] as WorldBookEntry[]
});
const avatarPreview = computed(() => draft.avatar.trim() || defaultAvatar);
const scanAvatarPreview = computed(() => scanDraft.avatar.trim() || defaultAvatar);
const importedLoreEntryCount = computed(() => scanDraft.importedWorldBooks.reduce((total, book) => total + book.entries.length, 0));
const selectedLocalBooks = computed(() => localBooks.value.filter((book) => draft.localWorldBookIds.includes(book.id)));
const localBookSummary = computed(() => {
  if (!localBooks.value.length) return '暂无局部世界书';
  if (!selectedLocalBooks.value.length) return '请选择局部世界书';
  if (selectedLocalBooks.value.length === 1) return selectedLocalBooks.value[0]?.title ?? '已绑定 1 本局部世界书';
  return `已绑定 ${selectedLocalBooks.value.length} 本局部世界书`;
});

const accounts = props.accounts;

function resetDraft() {
  draft.nickname = '';
  draft.name = '';
  draft.userNote = '';
  draft.avatar = '';
  draft.signature = '';
  draft.description = '';
  draft.boundUserId = props.activeUserId || props.accounts[0]?.id || '';
  draft.localWorldBookIds = [];
}

function resetScanDraft() {
  scanDraft.nickname = '';
  scanDraft.name = '';
  scanDraft.userNote = '';
  scanDraft.avatar = '';
  scanDraft.signature = '';
  scanDraft.description = '';
  scanDraft.boundUserId = props.activeUserId || props.accounts[0]?.id || '';
  scanDraft.localWorldBookIds = [];
  scanDraft.importedWorldBooks = [];
}

async function readAvatar(event: Event, target: 'add' | 'scan') {
  const image = await readImageFileFromInput(event);
  if (!image) return;
  avatarEditTarget.value = target;
  avatarEditorSource.value = image;
  showAvatarEditor.value = true;
}

function applyEditedAvatar(value: string) {
  if (avatarEditTarget.value === 'scan') scanDraft.avatar = value;
  else draft.avatar = value;
}

function submitAdd() {
  emit('add', {
    nickname: draft.nickname,
    name: draft.name,
    userNote: draft.userNote,
    avatar: avatarPreview.value,
    signature: draft.signature.trim(),
    description: draft.description,
    boundUserId: draft.boundUserId,
    localWorldBookIds: [...draft.localWorldBookIds]
  });
  resetDraft();
}

function toggleLocalWorldBookFromSelect(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) return;
  const bookId = event.target.value;
  if (!bookId || bookId === localBookSelectValue) return;
  const ids = new Set(draft.localWorldBookIds);
  if (ids.has(bookId)) ids.delete(bookId);
  else ids.add(bookId);
  draft.localWorldBookIds = [...ids];
  event.target.value = localBookSelectValue;
}

async function importCard(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const imported = await importSillyTavernCharacterCard(file);
  importPreview.value = imported;
  scanDraft.nickname = '';
  scanDraft.name = imported.name;
  scanDraft.userNote = '';
  scanDraft.avatar = imported.avatar;
  scanDraft.signature = '';
  scanDraft.description = imported.description;
  scanDraft.boundUserId = props.activeUserId || props.accounts[0]?.id || '';
  scanDraft.localWorldBookIds = [];
  scanDraft.importedWorldBooks = imported.worldBooks;
  emit('scan-import-ready', true);
  input.value = '';
}

function submitImportedCharacter() {
  if (!importPreview.value) return;
  emit('add', {
    nickname: scanDraft.nickname,
    name: scanDraft.name,
    userNote: scanDraft.userNote,
    avatar: scanAvatarPreview.value,
    signature: scanDraft.signature.trim(),
    description: scanDraft.description,
    boundUserId: scanDraft.boundUserId,
    localWorldBookIds: [...scanDraft.localWorldBookIds],
    importedWorldBooks: [...scanDraft.importedWorldBooks]
  });
  importPreview.value = null;
  resetScanDraft();
  emit('scan-import-ready', false);
}
</script>

<style scoped>
.add-friend-sheet {
  display: grid;
  gap: 0;
  min-width: 0;
  color: #151719;
  font-size: 12px;
}

.form-grid,
.scan-panel,
.placeholder-panel {
  display: grid;
  gap: 14px;
}

.wide-field {
  min-width: 0;
}

.profile-section,
.import-book-summary,
.scan-panel,
.placeholder-panel {
  border: 1px solid rgba(17, 17, 17, 0.04);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 14px 36px rgba(21, 30, 26, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.92);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}

.profile-section {
  display: grid;
  grid-template-columns: clamp(82px, 25vw, 104px) minmax(0, 1fr);
  gap: clamp(10px, 3vw, 14px);
  align-items: center;
  padding: clamp(12px, 3.5vw, 14px);
  border-radius: 24px;
}

.avatar-card {
  align-self: center;
  display: grid;
  justify-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar-preview,
.import-preview img {
  width: clamp(70px, 21vw, 88px);
  height: clamp(70px, 21vw, 88px);
  border-radius: clamp(20px, 6vw, 26px);
  background: #eef3f1;
  object-fit: cover;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.05), 0 12px 26px rgba(26, 33, 30, 0.08);
}

.avatar-upload,
.upload-card,
.primary-action {
  touch-action: manipulation;
}

.avatar-upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  max-width: 100%;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(17, 17, 17, 0.07);
  background: rgba(255, 255, 255, 0.82);
  color: #50585c;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.avatar-upload input,
.upload-card input {
  display: none;
}

.profile-fields {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.identity-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(8px, 2.5vw, 10px);
  min-width: 0;
}

.note-field {
  grid-column: 1 / -1;
}

.field {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.field > span {
  color: #4c5357;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  min-height: 44px;
  padding: 11px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #151719;
  font-size: 12px;
  line-height: 1.4;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.06);
}

.field textarea {
  min-height: 168px;
  resize: vertical;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #a3a9ad;
}

.field:focus-within > span {
  color: #17191b;
}

.field:focus-within input,
.field:focus-within textarea,
.field:focus-within select {
  box-shadow: inset 0 0 0 1px rgba(6, 199, 85, 0.35), 0 0 0 3px rgba(6, 199, 85, 0.1);
}

.import-book-summary {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 22px;
}

.local-book-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.local-book-header strong {
  color: #30363a;
  font-size: 13px;
}

.local-book-header span,
.panel-copy,
.placeholder-panel p,
.import-preview p,
.import-preview span {
  color: #69736f;
  line-height: 1.55;
}

.local-book-header span {
  font-size: 11px;
  font-weight: 800;
}

.panel-copy,
.placeholder-panel p {
  margin: 0;
}

.import-book-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.import-book-list span {
  max-width: 100%;
  min-height: 32px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(250, 252, 250, 0.96);
  color: #33393d;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
  box-shadow: inset 0 0 0 1px rgba(42, 75, 60, 0.08);
}

.primary-action {
  border: 1px solid rgba(6, 199, 85, 0.18);
  background: linear-gradient(135deg, rgba(224, 249, 233, 0.98), rgba(255, 242, 247, 0.96));
  color: #16643e;
  box-shadow: 0 14px 28px rgba(31, 120, 74, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.scan-panel,
.placeholder-panel {
  padding: 14px;
  border-radius: 24px;
}

.panel-copy {
  font-size: 12px;
}

.upload-card {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 8px;
  min-height: 136px;
  padding: 18px;
  border: 1px dashed rgba(21, 23, 25, 0.14);
  border-radius: 22px;
  background: rgba(248, 251, 249, 0.94);
  color: #202426;
  text-align: center;
}

.upload-icon {
  color: var(--link-green);
}

.upload-card strong,
.placeholder-panel strong,
.import-preview strong {
  font-size: 13px;
}

.upload-card span,
.import-preview span {
  color: #78807c;
  font-size: 11px;
  font-weight: 800;
}

.import-preview {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 22px;
  background: rgba(248, 251, 249, 0.94);
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.05);
}

.import-preview p,
.import-preview span {
  display: block;
  margin: 6px 0 0;
  font-size: 11px;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  border-radius: 17px;
  font-size: 12px;
  font-weight: 800;
}

.placeholder-panel {
  min-height: 220px;
  align-content: center;
  justify-items: center;
  text-align: center;
}

</style>