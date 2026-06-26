<template>
  <section class="data-management-page">
    <section class="storage-hero">
      <div>
        <span class="panel-kicker">Storage</span>
        <h2>数据管理</h2>
        <p>查看本地数据构成，清理缓存或按分区释放空间。</p>
      </div>
      <strong>{{ totalDataSizeLabel }}</strong>
    </section>

    <p v-if="dataBusy" class="busy-notice" role="status" aria-live="polite">
      <span class="busy-spinner" aria-hidden="true"></span>
      <span>{{ dataBusyLabel }}</span>
    </p>

    <section class="storage-band">
      <header class="section-head">
        <div>
          <span class="panel-kicker">Overview</span>
          <h3>数据组成</h3>
        </div>
        <small>{{ dataSections.length }} 类</small>
      </header>

      <section class="data-summary-grid" aria-label="本地数据组成">
        <article v-for="section in dataSections" :key="section.id" class="data-summary-item" :class="{ protected: section.protected }">
          <div>
            <strong>{{ section.label }}</strong>
            <span>{{ section.count }} 项</span>
          </div>
          <small>{{ formatBytes(section.bytes) }}</small>
        </article>
      </section>
    </section>

    <section class="storage-band cleanup-band">
      <header class="section-head">
        <div>
          <span class="panel-kicker">Cleanup</span>
          <h3>缓存瘦身</h3>
        </div>
        <small>不删除核心资料</small>
      </header>

      <div class="cleanup-grid">
        <button v-for="action in cleanupActions" :key="action.id" class="cleanup-action" type="button" :disabled="Boolean(dataBusy)" @click="runCleanupAction(action.id)">
          <span v-if="dataBusy === action.id" class="button-spinner" aria-hidden="true"></span>
          <component v-else :is="action.icon" :size="15" />
          <span>{{ dataBusy === action.id ? '清理中' : action.label }}</span>
          <small>{{ formatBytes(store.estimateCleanupFreedBytes(action.id)) }}</small>
        </button>
      </div>
    </section>

    <section class="storage-band clear-band">
      <header class="section-head">
        <div>
          <span class="panel-kicker">Danger Zone</span>
          <h3>分区清理</h3>
        </div>
        <small>高风险</small>
      </header>

      <label v-for="section in clearableSections" :key="section.id" class="data-check-row">
        <input type="checkbox" :checked="selectedClearSections.includes(section.id)" :disabled="Boolean(dataBusy)" @change="toggleClearSection(section.id, $event)" />
        <span>{{ section.label }}</span>
        <small>{{ section.count }} 项 · {{ formatBytes(section.bytes) }}</small>
      </label>

      <button class="danger-action" type="button" :disabled="Boolean(dataBusy) || !selectedClearSections.length" @click="clearSelectedDataSections">
        <span v-if="dataBusy === 'clear'" class="button-spinner light" aria-hidden="true"></span>
        <Trash2 v-else :size="15" />
        <span>{{ dataBusy === 'clear' ? '清理中' : '清理所选数据' }}</span>
      </button>
    </section>

    <p v-if="dataFeedback" class="feedback" :class="dataFeedbackKind">{{ dataFeedback }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { ImageOff, MessageSquareX, MicOff, Sparkles, Trash2, WandSparkles } from 'lucide-vue-next';
import { useAppStore, type ClearableDataSection, type DataCleanupAction } from '@/stores/appStore';

const store = useAppStore();
const dataBusy = ref<DataCleanupAction | 'clear' | ''>('');
const dataFeedback = ref('');
const dataFeedbackKind = ref<'success' | 'error'>('success');
const selectedClearSections = ref<ClearableDataSection[]>([]);

const dataInventory = computed(() => store.getDataInventory());
const dataSections = computed(() => dataInventory.value.sections);
const clearableSections = computed(() => dataSections.value.filter((section): section is typeof section & { id: ClearableDataSection } => Boolean(section.clearable)));
const totalDataSizeLabel = computed(() => formatBytes(dataInventory.value.totalBytes));
const cleanupActions: Array<{ id: DataCleanupAction; label: string; icon: typeof Sparkles }> = [
  { id: 'generated-images', label: '生成图历史', icon: Sparkles },
  { id: 'message-media', label: '消息媒体缓存', icon: MessageSquareX },
  { id: 'sticker-local-cache', label: '贴纸本地缓存', icon: ImageOff },
  { id: 'image-candidates', label: '图片候选记录', icon: WandSparkles },
  { id: 'voice-audio', label: '语音音频缓存', icon: MicOff },
  { id: 'memory-vectors', label: '记忆向量缓存', icon: Trash2 }
];
const dataBusyLabel = computed(() => {
  if (dataBusy.value === 'clear') return '正在清理所选分区，数据较多时可能需要一点时间，请稍候。';
  const action = cleanupActions.find((item) => item.id === dataBusy.value);
  return action ? `正在清理${action.label}，请稍候。` : '正在处理本地数据，请稍候。';
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

function toggleClearSection(sectionId: ClearableDataSection, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  selectedClearSections.value = checked
    ? [...new Set([...selectedClearSections.value, sectionId])]
    : selectedClearSections.value.filter((id) => id !== sectionId);
}

async function runCleanupAction(action: DataCleanupAction) {
  const cleanup = cleanupActions.find((item) => item.id === action);
  const freedBytes = store.estimateCleanupFreedBytes(action);
  const freedLabel = formatBytes(freedBytes);
  const actionLabel = cleanup?.label ?? '缓存';
  const confirmMessage = freedBytes > 0
    ? `即将清理「${actionLabel}」，预计释放 ${freedLabel}。这不会删除核心资料，继续吗？`
    : `「${actionLabel}」当前预计可释放 0 B。仍要执行清理吗？`;
  if (!window.confirm(confirmMessage)) return;

  dataBusy.value = action;
  dataFeedback.value = '';
  await waitForBusyPaint();

  try {
    const changed = await store.cleanupData(action);
    setDataFeedback(changed ? `已清理 ${changed} 项缓存。` : '没有需要清理的缓存。');
  } catch (error) {
    setDataFeedback(error instanceof Error ? error.message : '清理失败。', 'error');
  } finally {
    dataBusy.value = '';
  }
}

async function clearSelectedDataSections() {
  if (!selectedClearSections.value.length) return;
  const names = clearableSections.value
    .filter((section) => selectedClearSections.value.includes(section.id))
    .map((section) => section.label)
    .join('、');
  if (!window.confirm(`这会永久清理：${names}。建议先导出备份，继续吗？`)) return;

  dataBusy.value = 'clear';
  dataFeedback.value = '';
  await waitForBusyPaint();
  try {
    const changed = await store.clearDataSections(selectedClearSections.value);
    selectedClearSections.value = [];
    setDataFeedback(changed ? `已清理 ${changed} 项数据。` : '没有可清理的数据。');
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
  gap: 14px;
  min-width: 0;
}

.storage-hero,
.storage-band {
  min-width: 0;
  border-radius: 16px;
}

.storage-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #111111, #2f6150 58%, #74c69d);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(32, 80, 61, 0.16);
}

.storage-hero h2,
.storage-hero p,
.section-head h3 {
  margin: 0;
}

.storage-hero h2 {
  font-size: 20px;
  line-height: 1.15;
}

.storage-hero p {
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.storage-hero strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 74px;
  min-height: 42px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #136c36;
  font-size: 15px;
  font-weight: 950;
  white-space: nowrap;
}

.storage-band {
  display: grid;
  gap: 12px;
  padding: 14px;
  background: #f5f7f6;
}

.cleanup-band {
  background: linear-gradient(180deg, #f8faf9, #edf4f1);
}

.busy-notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #ecf8f1;
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
  animation: data-spin 0.72s linear infinite;
}

.button-spinner.light {
  border-color: rgba(255, 255, 255, 0.38);
  border-top-color: #ffffff;
}

@keyframes data-spin {
  to {
    transform: rotate(360deg);
  }
}

.clear-band {
  background: linear-gradient(180deg, #fbf8f8, #f4eeee);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-kicker {
  display: block;
  margin-bottom: 3px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.storage-hero .panel-kicker {
  color: rgba(255, 255, 255, 0.68);
}

.section-head h3 {
  font-size: 16px;
  line-height: 1.15;
}

.section-head small {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.data-summary-grid,
.cleanup-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.data-summary-item,
.cleanup-action,
.data-check-row {
  min-width: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
}

.data-summary-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  min-height: 68px;
  padding: 9px;
}

.data-summary-item.protected {
  background: rgba(255, 255, 255, 0.56);
}

.data-summary-item div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.data-summary-item strong,
.data-check-row span {
  color: #161917;
  font-size: clamp(10px, 3.2vw, 12px);
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-summary-item span,
.data-summary-item small,
.data-check-row small,
.cleanup-action small {
  color: var(--muted);
  font-size: 10px;
  font-weight: 850;
  white-space: nowrap;
}

.data-summary-item small {
  justify-self: end;
  min-width: 38px;
  text-align: right;
}

.cleanup-action,
.danger-action {
  display: inline-grid;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: 950;
}

.cleanup-action {
  grid-template-columns: auto minmax(0, auto) auto;
  gap: 5px;
  min-height: 38px;
  padding: 0 6px;
  color: #202321;
  font-size: clamp(10px, 3.1vw, 12px);
}

.cleanup-action span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cleanup-action small {
  padding-left: 1px;
}

.cleanup-action:disabled,
.danger-action:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.data-check-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.68);
}

.data-check-row input {
  width: 16px;
  height: 16px;
}

.danger-action {
  grid-template-columns: auto minmax(0, auto);
  gap: 6px;
  min-height: 40px;
  padding: 0 12px;
  background: #9f2d2d;
  color: #ffffff;
  font-size: 13px;
}

.feedback {
  margin: 0;
  color: #136c36;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.feedback.error {
  color: #a82424;
}

@media (max-width: 360px) {
  .data-management-page {
    gap: 12px;
  }

  .storage-hero,
  .storage-band {
    border-radius: 14px;
  }

  .storage-hero,
  .storage-band {
    padding: 12px;
  }

  .data-summary-grid,
  .cleanup-grid {
    gap: 6px;
  }

  .data-summary-item {
    min-height: 62px;
    padding: 8px;
  }

  .cleanup-action {
    min-height: 34px;
    padding: 0 5px;
  }

  .cleanup-action svg {
    width: 14px;
    height: 14px;
  }
}
</style>
