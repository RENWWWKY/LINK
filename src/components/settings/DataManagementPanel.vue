<template>
  <section class="data-management-page">
    <article class="data-showcase">
      <div class="data-stage">
        <div class="stage-topline">
          <span class="stage-badge">Local</span>
          <button class="stage-refresh" type="button" :disabled="storageRefreshing || Boolean(dataBusy)" aria-label="刷新缓存统计" @click="refreshBrowserStorageEstimate">
            <RefreshCw :size="15" :class="{ spinning: storageRefreshing }" />
          </button>
        </div>

        <div class="data-core">
          <span>Browser Cache</span>
          <strong>{{ browserUsageLabel }}</strong>
        </div>

        <div class="storage-meter" role="meter" aria-label="浏览器缓存占用" :aria-valuenow="Math.round(storagePercent)" aria-valuemin="0" aria-valuemax="100">
          <span class="storage-meter-fill" :style="meterStyle"></span>
        </div>

        <div class="stage-breakdown" aria-label="缓存数据关系">
          <article>
            <span>可管理数据</span>
            <strong>{{ managedDataLabel }}</strong>
          </article>
          <article>
            <span>浏览器上限</span>
            <strong>{{ storageQuotaValueLabel }}</strong>
          </article>
          <article>
            <span>占浏览器</span>
            <strong>{{ managedStoragePercentLabel }}</strong>
          </article>
        </div>
      </div>

      <div class="showcase-copy">
        <div class="showcase-topline">
          <div>
            <p class="module-kicker">Data Storage</p>
            <h2>本地缓存管理</h2>
          </div>
        </div>

        <div class="inline-cleanup" aria-label="精准清理">
          <div class="inline-cleanup-top">
            <strong>精准清理</strong>
            <small>保留核心资料</small>
          </div>

          <div class="cleanup-list">
            <button
              v-for="action in cleanupActionStats"
              :key="action.id"
              class="cleanup-action"
              type="button"
              :disabled="Boolean(dataBusy)"
              :aria-label="`${action.label}：${action.description}，预计释放 ${action.freedLabel}`"
              @click="runCleanupAction(action.id)"
            >
              <span class="cleanup-icon" :class="action.tone">
                <span v-if="dataBusy === action.id" class="button-spinner" aria-hidden="true"></span>
                <component v-else :is="action.icon" :size="16" />
              </span>
              <span class="cleanup-copy">
                <strong>{{ action.label }}</strong>
              </span>
              <span class="cleanup-size">{{ action.freedLabel }}</span>
            </button>
          </div>
        </div>
      </div>
    </article>

    <p v-if="dataBusy" class="busy-notice" role="status" aria-live="polite">
      <span class="busy-spinner" aria-hidden="true"></span>
      <span>{{ dataBusyLabel }}</span>
    </p>

    <section class="module-card composition-card" aria-label="数据组成">
      <header class="module-copy-top">
        <div>
          <p class="module-kicker">Data Map</p>
          <strong>数据组成</strong>
        </div>
        <small>{{ dataSections.length }} 组</small>
      </header>

      <div class="composition-list">
        <article v-for="section in rankedSections" :key="section.id" class="composition-row" :class="{ protected: section.protected }">
          <span class="section-index">{{ section.rank }}</span>
          <div class="composition-main">
            <div class="composition-copy">
              <strong>{{ section.label }}</strong>
              <span>{{ section.description }}</span>
            </div>
            <div class="composition-track" aria-hidden="true">
              <span :style="{ width: `${section.share}%` }"></span>
            </div>
          </div>
          <small>{{ section.count }} 项 · {{ formatBytes(section.bytes) }}</small>
        </article>
      </div>
    </section>

    <p v-if="dataFeedback" class="feedback" :class="dataFeedbackKind">{{ dataFeedback }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, type Component } from 'vue';
import { Camera, ImageOff, Images, RefreshCw } from 'lucide-vue-next';
import { useAppStore, type DataCleanupAction } from '@/stores/appStore';

interface BrowserStorageSnapshot {
  usage: number;
  quota: number;
}

type CleanupTone = 'photo' | 'candidate' | 'sticker';

interface CleanupActionConfig {
  id: DataCleanupAction;
  label: string;
  description: string;
  icon: Component;
  tone: CleanupTone;
}

const store = useAppStore();
const dataBusy = ref<DataCleanupAction | ''>('');
const dataFeedback = ref('');
const dataFeedbackKind = ref<'success' | 'error'>('success');
const storageRefreshing = ref(false);
const browserStorage = ref<BrowserStorageSnapshot>({ usage: 0, quota: 0 });

const cleanupActions: CleanupActionConfig[] = [
  {
    id: 'user-sent-images',
    label: '用户发送图片',
    description: '清理拍照和照片按钮发出的图片数据',
    icon: Camera,
    tone: 'photo'
  },
  {
    id: 'image-candidates',
    label: '生成图候选记录',
    description: '清理历史候选，保留当前正在使用的图片',
    icon: Images,
    tone: 'candidate'
  },
  {
    id: 'sticker-local-cache',
    label: '贴纸本地缓存',
    description: '清理贴纸的本地副本和内联缓存',
    icon: ImageOff,
    tone: 'sticker'
  }
];

const dataInventory = computed(() => store.getDataInventory());
const dataSections = computed(() => dataInventory.value.sections);
const managedDataLabel = computed(() => formatBytes(dataInventory.value.totalBytes));
const browserUsageBytes = computed(() => browserStorage.value.usage || dataInventory.value.totalBytes);
const browserUsageLabel = computed(() => formatBytes(browserUsageBytes.value));
const storageQuotaValueLabel = computed(() => browserStorage.value.quota > 0 ? formatBytes(browserStorage.value.quota) : '未知');
const storagePercent = computed(() => browserStorage.value.quota > 0 ? Math.min(100, browserUsageBytes.value / browserStorage.value.quota * 100) : 0);
const storagePercentLabel = computed(() => browserStorage.value.quota > 0 ? `${storagePercent.value.toFixed(storagePercent.value >= 10 ? 0 : 1)}%` : '未返回');
const meterStyle = computed(() => ({ width: `${Math.max(1.5, storagePercent.value)}%` }));
const managedStoragePercent = computed(() => browserStorage.value.quota > 0 ? Math.min(100, dataInventory.value.totalBytes / browserStorage.value.quota * 100) : 0);
const managedStoragePercentLabel = computed(() => browserStorage.value.quota > 0 ? `${managedStoragePercent.value.toFixed(managedStoragePercent.value >= 10 ? 0 : 1)}%` : '未知');
const rankedSections = computed(() => {
  const totalBytes = Math.max(1, dataInventory.value.totalBytes);
  return [...dataSections.value]
    .sort((left, right) => right.bytes - left.bytes)
    .map((section, index) => ({
      ...section,
      rank: String(index + 1).padStart(2, '0'),
      share: Math.max(section.bytes > 0 ? 4 : 0, Math.min(100, section.bytes / totalBytes * 100))
    }));
});
const cleanupActionStats = computed(() => cleanupActions.map((action) => {
  const freedBytes = store.estimateCleanupFreedBytes(action.id);
  return {
    ...action,
    freedBytes,
    freedLabel: freedBytes > 0 ? formatBytes(freedBytes) : '0 B'
  };
}));
const dataBusyLabel = computed(() => {
  const action = cleanupActions.find((item) => item.id === dataBusy.value);
  return action ? `正在清理${action.label}，请稍候。` : '正在处理本地数据，请稍候。';
});

onMounted(() => {
  void refreshBrowserStorageEstimate();
});

function setDataFeedback(message: string, kind: 'success' | 'error' = 'success') {
  dataFeedback.value = message;
  dataFeedbackKind.value = kind;
}

async function waitForBusyPaint() {
  await nextTick();
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

async function refreshBrowserStorageEstimate() {
  storageRefreshing.value = true;
  try {
    const estimate = await navigator.storage?.estimate?.();
    browserStorage.value = {
      usage: Number(estimate?.usage ?? 0),
      quota: Number(estimate?.quota ?? 0)
    };
  } catch {
    browserStorage.value = { usage: 0, quota: 0 };
  } finally {
    storageRefreshing.value = false;
  }
}

async function runCleanupAction(action: DataCleanupAction) {
  const cleanup = cleanupActionStats.value.find((item) => item.id === action);
  const actionLabel = cleanup?.label ?? '缓存';
  const freedLabel = cleanup?.freedLabel ?? '0 B';
  const confirmMessage = cleanup?.freedBytes
    ? `即将清理「${actionLabel}」，预计释放 ${freedLabel}。继续吗？`
    : `「${actionLabel}」当前预计可释放 0 B。仍要执行清理吗？`;
  if (!window.confirm(confirmMessage)) return;

  dataBusy.value = action;
  dataFeedback.value = '';
  await waitForBusyPaint();

  try {
    const changed = await store.cleanupData(action);
    await refreshBrowserStorageEstimate();
    setDataFeedback(changed ? `已清理 ${changed} 项，浏览器缓存统计已刷新。` : '没有需要清理的缓存。');
  } catch (error) {
    setDataFeedback(error instanceof Error ? error.message : '清理失败。', 'error');
  } finally {
    dataBusy.value = '';
  }
}
</script>

<style scoped>
.data-management-page {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding-bottom: calc(10px + var(--safe-bottom));
  container-type: inline-size;
}

.data-showcase,
.module-card {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(17, 17, 17, 0.04);
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 249, 252, 0.96));
  box-shadow: 0 16px 34px rgba(26, 30, 38, 0.06);
  overflow: hidden;
}

.data-stage {
  display: grid;
  grid-template-rows: auto auto auto auto;
  gap: 14px;
  min-width: 0;
  min-height: 210px;
  padding: 14px;
  border-radius: 20px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(255, 221, 232, 0.88), transparent 28%),
    radial-gradient(circle at left bottom, rgba(201, 235, 218, 0.78), transparent 34%),
    linear-gradient(135deg, #fff8fb, #f1f6fb 56%, #eef8f1);
}

.stage-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.stage-badge,
.stage-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  border-radius: 999px;
  backdrop-filter: blur(12px);
}

.stage-badge {
  padding: 0 10px;
  background: rgba(231, 248, 236, 0.96);
  color: #138046;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
}

.stage-refresh {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.74);
  color: rgba(35, 31, 37, 0.72);
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.04);
}

.stage-refresh:disabled,
.cleanup-action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.spinning {
  animation: dataSpin 0.72s linear infinite;
}

.data-core {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.data-core span {
  color: rgba(35, 31, 37, 0.62);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  line-height: 1;
  text-transform: uppercase;
}

.data-core strong {
  color: rgba(35, 31, 37, 0.9);
  font-family: 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', 'Songti SC', serif;
  font-size: 38px;
  font-weight: 650;
  line-height: 1;
}

.storage-meter {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.1);
}

.storage-meter-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(17, 17, 17, 0.62), rgba(39, 118, 91, 0.78));
}

.stage-breakdown {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  min-width: 0;
}

.stage-breakdown article {
  display: grid;
  justify-items: center;
  gap: 4px;
  min-width: 0;
  padding: 9px 6px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.66);
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.035);
  text-align: center;
}

.stage-breakdown article span {
  color: rgba(35, 31, 37, 0.56);
  font-size: 10px;
  font-weight: 900;
  line-height: 1.2;
}

.stage-breakdown article strong {
  color: #231f25;
  font-size: 14px;
  font-weight: 950;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

@keyframes dataSpin {
  to {
    transform: rotate(360deg);
  }
}

.showcase-copy,
.cleanup-list,
.composition-list {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.showcase-topline,
.module-copy-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.showcase-topline > div,
.module-copy-top > div {
  min-width: 0;
}

.module-kicker {
  margin: 0;
  color: #9d7a86;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1;
  text-transform: uppercase;
}

.showcase-topline h2,
.module-copy-top strong {
  display: block;
  margin: 4px 0 0;
  color: #231f25;
  font-family: 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', 'Songti SC', serif;
  font-size: 24px;
  font-weight: 650;
  line-height: 1.12;
  overflow-wrap: anywhere;
}

.showcase-topline small,
.module-copy-top small {
  flex: 0 1 auto;
  min-width: 0;
  color: #76737b;
  font-size: 11px;
  font-weight: 800;
  text-align: right;
  overflow-wrap: anywhere;
}

.inline-cleanup {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding-top: 2px;
}

.inline-cleanup .cleanup-list {
  gap: 6px;
}

.inline-cleanup-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.inline-cleanup-top strong {
  color: #231f25;
  font-size: 13px;
  font-weight: 950;
  line-height: 1.2;
}

.inline-cleanup-top small {
  color: #76737b;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}

.composition-copy span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
}

.busy-notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 16px;
  background: #eef8f1;
  color: #116237;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.busy-spinner,
.button-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(17, 98, 55, 0.22);
  border-top-color: #116237;
  border-radius: 999px;
  animation: dataSpin 0.72s linear infinite;
}

.composition-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border-radius: 18px;
  background: #f6f8f8;
}

.composition-row.protected {
  background: #f1f4f5;
}

.section-index {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: #ffffff;
  color: #9d7a86;
  font-size: 11px;
  font-weight: 950;
}

.composition-main {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.composition-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.composition-copy strong {
  min-width: 0;
  color: #171d1b;
  font-size: 13px;
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composition-copy span {
  overflow-wrap: anywhere;
}

.composition-track {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5ebee;
}

.composition-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2c2f39, #7fbaa0);
}

.composition-row small,
.cleanup-size {
  color: #6d7478;
  font-size: 11px;
  font-weight: 950;
  white-space: nowrap;
}

.cleanup-action {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 42px;
  padding: 6px 8px;
  border-radius: 14px;
  background: #f5f6f8;
  color: #151a18;
  text-align: left;
}

.cleanup-icon {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 11px;
}

.cleanup-icon.photo {
  background: #e9f4ff;
  color: #1b67a7;
}

.cleanup-icon.candidate {
  background: #f1edf9;
  color: #6944a1;
}

.cleanup-icon.sticker {
  background: #eef7ed;
  color: #267147;
}

.cleanup-copy {
  min-width: 0;
}

.cleanup-copy strong {
  display: block;
  min-width: 0;
  color: #171d1b;
  font-size: 13px;
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cleanup-size {
  justify-self: end;
  padding: 4px 7px;
  border-radius: 999px;
  background: #ffffff;
}

.feedback {
  margin: 0;
  color: #136c36;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.feedback.error {
  color: #a82424;
}

@container (max-width: 360px) {
  .data-management-page {
    gap: 12px;
  }

  .data-showcase,
  .module-card {
    padding: 11px;
  }

  .data-stage {
    min-height: 186px;
  }

  .data-core strong {
    font-size: 32px;
  }

  .showcase-topline,
  .module-copy-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .showcase-topline small,
  .module-copy-top small {
    text-align: left;
  }

  .composition-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .composition-row small {
    grid-column: 2;
  }

  .inline-cleanup-top {
    align-items: flex-start;
  }
}
</style>