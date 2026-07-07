<template>
  <section class="user-profile-sheet">
    <header class="profile-topbar">
      <div class="account-title">
        <strong>{{ displayName }}</strong>
        <CheckCircle2 :size="16" />
      </div>
      <div class="top-actions">
        <button class="icon-button" type="button" aria-label="修改我的主页" @click="openEditor">
          <Pencil :size="18" />
        </button>
      </div>
    </header>

    <main class="profile-scroll">
      <section class="profile-overview">
        <div class="avatar-ring">
          <img :src="displayAvatar" :alt="displayName" />
        </div>
        <div class="profile-stats" aria-label="我的主页数据">
          <div v-for="stat in socialStats" :key="stat.label" class="profile-stat">
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
          </div>
        </div>
      </section>

      <section class="profile-bio">
        <span>@{{ displayHandle }}</span>
        <p>{{ signatureText }}</p>
      </section>

      <section class="highlight-row" aria-label="最新 Voom 图片">
        <article v-for="item in highlightItems" :key="item.id" class="highlight-item">
          <div class="highlight-cover">
            <img :src="item.image" :alt="item.title" />
          </div>
          <span>{{ item.title }}</span>
        </article>
      </section>
    </main>

    <div v-if="isEditing" class="editor-overlay">
      <form class="editor-card" @submit.prevent="saveEditor">
        <div class="panel-head">
          <div>
            <strong>编辑主页</strong>
            <p>更新网名、签名和头像。</p>
          </div>
          <button class="icon-button soft" type="button" aria-label="关闭编辑" @click="cancelEditor">
            <X :size="18" />
          </button>
        </div>

        <label class="editor-field">
          <span>我的网名</span>
          <input v-model="editorForm.nickname" type="text" />
        </label>

        <label class="editor-field">
          <span>个性签名</span>
          <textarea v-model="editorForm.signature" rows="3"></textarea>
        </label>

        <div class="editor-avatar-row">
          <img :src="editorForm.avatar || displayAvatar" alt="头像预览" />
          <div class="editor-avatar-actions">
            <label class="editor-field compact">
              <span>头像 URL</span>
              <input v-model="editorForm.avatar" type="text" placeholder="https://..." />
            </label>
            <label class="upload-button">
              <input type="file" accept="image/*" @change="readAvatar" />
              <span>本地选择</span>
            </label>
          </div>
        </div>

        <div class="editor-actions">
          <button type="button" class="secondary-action" @click="cancelEditor">取消</button>
          <button type="submit" class="primary-action">保存</button>
        </div>
      </form>
    </div>

    <AvatarCropperModal v-model="showAvatarEditor" :src="avatarEditorSource" @confirm="applyEditedAvatar" />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { CheckCircle2, Pencil, X } from 'lucide-vue-next';
import AvatarCropperModal from '@/components/image/AvatarCropperModal.vue';
import type { UserProfile, VisualProfile, VoomPost } from '@/types/domain';
import { readImageFileFromInput } from '@/utils/imageFile';
import { normalizeVisualProfile } from '@/utils/profile';

type LocalUserProfile = UserProfile & { profile: Partial<VisualProfile> };

const highlightLabels = ['MOOD', 'VOOM', 'NOTE'];

const props = defineProps<{
  user: LocalUserProfile;
  posts: VoomPost[];
}>();

const emit = defineEmits<{
  save: [user: UserProfile];
}>();

const isEditing = ref(false);
const showAvatarEditor = ref(false);
const avatarEditorSource = ref('');

const editorForm = reactive({
  nickname: '',
  signature: '',
  avatar: ''
});

const visualProfile = computed(() => normalizeVisualProfile(props.user.profile, props.user));
const displayName = computed(() => props.user.name || props.user.nickname || visualProfile.value.nickname);
const displayHandle = computed(() => (props.user.nickname || props.user.name || visualProfile.value.nickname || displayName.value).replace(/^@/, ''));
const displayAvatar = computed(() => props.user.avatar || visualProfile.value.avatar);
const signatureText = computed(() => props.user.signature || visualProfile.value.bio || '今天也在认真生活。');

const userPosts = computed(() => props.posts
  .filter((post) => post.userId === props.user.id && (post.authorType === 'user' || !post.charId))
  .slice()
  .sort((a, b) => b.createdAt - a.createdAt));

const socialStats = computed(() => {
  const stats = visualProfile.value.stats;
  return [
    { value: formatStatValue(userPosts.value.length), label: normalizeStatLabel(stats.postsLabel, 'posts') },
    { value: formatStatValue(stats.followers), label: normalizeStatLabel(stats.followersLabel, 'followers') },
    { value: formatStatValue(stats.following), label: normalizeStatLabel(stats.followingLabel, 'following') }
  ];
});

const highlightItems = computed(() => {
  const voomItems = userPosts.value
    .slice(0, 3)
    .map((post, index) => ({
      id: post.id,
      title: highlightLabels[index] ?? `VOOM ${index + 1}`,
      image: post.image || displayAvatar.value
    }));

  return highlightLabels.map((title, index) => voomItems[index] ?? {
    id: `fallback-highlight-${title.toLowerCase()}`,
    title,
    image: displayAvatar.value
  });
});

function formatStatValue(value: string | number) {
  if (typeof value === 'string') return value;
  if (value >= 10000) return `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`;
  return new Intl.NumberFormat('en-US').format(value);
}

function normalizeStatLabel(value: string | undefined, fallback: string) {
  return (value || fallback).toLowerCase();
}

function openEditor() {
  editorForm.nickname = props.user.nickname || props.user.name || '';
  editorForm.signature = props.user.signature || '';
  editorForm.avatar = props.user.avatar || '';
  isEditing.value = true;
}

function cancelEditor() {
  isEditing.value = false;
}

async function readAvatar(event: Event) {
  const image = await readImageFileFromInput(event);
  if (!image) return;
  avatarEditorSource.value = image;
  showAvatarEditor.value = true;
}

function applyEditedAvatar(value: string) {
  editorForm.avatar = value;
}

function saveEditor() {
  const profile = visualProfile.value;
  const nextNickname = editorForm.nickname.trim() || props.user.nickname || props.user.name;
  const nextSignature = editorForm.signature.trim();
  const nextAvatar = editorForm.avatar.trim() || props.user.avatar;

  emit('save', {
    ...props.user,
    nickname: nextNickname,
    avatar: nextAvatar,
    signature: nextSignature,
    profile: normalizeVisualProfile({
      ...profile,
      nickname: nextNickname,
      avatar: nextAvatar,
      bio: nextSignature,
      avatarBorderColor: '#ffffff',
      textColor: '#111111'
    }, {
      ...props.user,
      nickname: nextNickname,
      avatar: nextAvatar,
      signature: nextSignature
    })
  });

  isEditing.value = false;
}
</script>

<style scoped>
.user-profile-sheet {
  --profile-accent: #ff9db7;
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border-radius: 26px;
  background: #ffffff;
  color: #111111;
  container-type: inline-size;
}

.profile-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 12px 12px 8px;
}

.account-title {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.account-title strong {
  overflow: hidden;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-title svg {
  flex: 0 0 auto;
  color: #1e8fff;
}

.top-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 3px;
}

.icon-button,
.secondary-action,
.primary-action {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 34px !important;
  height: 34px !important;
  min-height: 34px !important;
  padding: 0 !important;
  border-radius: 999px !important;
  background: transparent;
  color: #111111;
}

.icon-button.soft {
  background: transparent;
}

.profile-scroll {
  display: grid;
  gap: 15px;
  padding: 4px 12px 16px;
}

.profile-overview {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.avatar-ring {
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  padding: 3px;
  border: 2px solid #dddddd;
  border-radius: 999px;
  background: #ffffff;
}

.avatar-ring img {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: inherit;
  object-fit: cover;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.profile-stat {
  min-width: 0;
  text-align: center;
}

.profile-stat strong,
.profile-stat span,
.profile-bio span,
.profile-bio p,
.highlight-item span,
.panel-head strong,
.panel-head p {
  margin: 0;
}

.profile-stat strong {
  display: block;
  overflow: hidden;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-stat span {
  display: block;
  margin-top: 3px;
  color: #111111;
  font-size: 12px;
  line-height: 1.05;
}

.profile-bio {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.profile-bio span {
  color: #111111;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

.profile-bio p {
  color: #444444;
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.highlight-row {
  display: flex;
  gap: 18px;
  min-width: 0;
  overflow-x: auto;
  padding: 2px 0 4px;
  scrollbar-width: none;
}

.highlight-row::-webkit-scrollbar {
  display: none;
}

.highlight-item {
  display: grid;
  flex: 0 0 62px;
  justify-items: center;
  gap: 6px;
  min-width: 0;
}

.highlight-cover {
  width: 62px;
  height: 62px;
  padding: 3px;
  border: 2px solid #dedede;
  border-radius: 999px;
  background: #ffffff;
}

.highlight-cover img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.highlight-item span {
  max-width: 70px;
  overflow: hidden;
  color: #8b8b8b;
  font-size: 12px;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow-y: auto;
  padding: 12px;
  background: rgba(255, 255, 255, 0.88);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}

.editor-card {
  display: grid;
  gap: 14px;
  width: 100%;
  padding: 14px;
  border: 1px solid #eeeeee;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.panel-head strong {
  display: block;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
}

.panel-head p {
  margin-top: 5px;
  color: #777777;
  font-size: 12px;
  line-height: 1.35;
}

.editor-field {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.editor-field span {
  color: #777777;
  font-size: 11px;
  font-weight: 800;
}

.editor-field input,
.editor-field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #dddddd;
  border-radius: 12px;
  background: #ffffff;
  color: #111111;
  font: inherit;
  font-size: var(--ios-control-font-size, 16px);
  outline: none;
}

.editor-field input {
  min-height: 40px;
  padding: 8px 10px;
}

.editor-field textarea {
  min-height: 78px;
  resize: vertical;
  padding: 10px;
  line-height: 1.5;
}

.editor-avatar-row {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.editor-avatar-row img {
  width: 74px;
  height: 74px;
  border-radius: 999px;
  object-fit: cover;
}

.editor-avatar-actions {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.upload-button {
  display: grid;
  place-items: center;
  min-height: 36px;
  border-radius: 12px;
  background: #f1f1f1;
  color: #111111;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.upload-button input {
  display: none;
}

.editor-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.secondary-action,
.primary-action {
  min-height: 40px !important;
  border-radius: 12px !important;
  font-size: 13px !important;
  font-weight: 900;
}

.secondary-action {
  background: #f1f1f1;
  color: #111111;
}

.primary-action {
  background: #111111;
  color: #ffffff;
}

@container (max-width: 300px) {
  .profile-overview {
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 12px;
  }

  .avatar-ring {
    width: 76px;
    height: 76px;
  }

  .profile-stat strong {
    font-size: 16px;
  }

  .profile-stat span {
    font-size: 11px;
  }
}
</style>