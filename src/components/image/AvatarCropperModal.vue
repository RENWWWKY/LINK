<template>
  <Teleport to="body">
    <div v-if="modelValue && src" class="avatar-editor-backdrop" @click.self="closeEditor">
      <section class="avatar-editor-panel" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title">
        <header class="avatar-editor-head">
          <div>
            <span>{{ eyebrow }}</span>
            <strong id="avatar-editor-title">{{ title }}</strong>
          </div>
          <button class="icon-action" type="button" aria-label="关闭头像编辑" @click="closeEditor">
            <X :size="18" />
          </button>
        </header>

        <div
          ref="cropFrameRef"
          class="crop-frame"
          :class="{ dragging: isDragging, loading: !imageReady }"
          :style="cropFrameStyle"
          @pointerdown="startDrag"
          @pointermove="dragImage"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <img ref="imageRef" class="crop-image" :src="src" alt="" :style="imageStyle" @load="handleImageLoad" />
          <span class="crop-grid" aria-hidden="true"></span>
        </div>

        <label class="zoom-control">
          <span>缩放</span>
          <input v-model.number="zoom" type="range" min="1" max="3" step="0.01" />
        </label>

        <div class="avatar-editor-actions">
          <button class="secondary-action" type="button" @click="resetCrop">
            <span>重置</span>
          </button>
          <button class="primary-action" type="button" :disabled="!imageReady" @click="confirmCrop">
            <span>{{ confirmLabel }}</span>
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  src: string;
  title?: string;
  eyebrow?: string;
  confirmLabel?: string;
  aspectRatio?: number;
  outputWidth?: number;
  outputHeight?: number;
  outputType?: 'image/png' | 'image/jpeg' | 'image/webp';
  outputQuality?: number;
}>(), {
  title: '编辑头像',
  eyebrow: 'Avatar editor',
  confirmLabel: '使用头像',
  aspectRatio: 1,
  outputWidth: 512,
  outputHeight: 512,
  outputType: 'image/png',
  outputQuality: 0.92
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [value: string];
}>();

const cropFrameRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const cropWidth = ref(268);
const cropHeight = ref(268);
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const zoom = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const imageReady = ref(false);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartOffsetX = ref(0);
const dragStartOffsetY = ref(0);
let resizeObserver: ResizeObserver | null = null;

const baseScale = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value || !cropWidth.value || !cropHeight.value) return 1;
  return Math.max(cropWidth.value / naturalWidth.value, cropHeight.value / naturalHeight.value);
});

const displayWidth = computed(() => naturalWidth.value * baseScale.value * zoom.value);
const displayHeight = computed(() => naturalHeight.value * baseScale.value * zoom.value);

const imageStyle = computed(() => ({
  width: `${displayWidth.value}px`,
  height: `${displayHeight.value}px`,
  transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px))`
}));
const cropFrameStyle = computed(() => ({
  width: props.aspectRatio > 1 ? 'min(100%, 340px)' : 'min(100%, 268px)',
  aspectRatio: String(props.aspectRatio)
}));

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return;
    await nextTick();
    updateCropSize();
    resetCrop();
  }
);

watch(() => props.src, () => {
  imageReady.value = false;
  resetCrop();
});

watch([zoom, cropWidth, cropHeight, naturalWidth, naturalHeight], () => clampOffset());

onMounted(() => {
  resizeObserver = new ResizeObserver(updateCropSize);
  if (cropFrameRef.value) resizeObserver.observe(cropFrameRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

function updateCropSize() {
  const frame = cropFrameRef.value;
  if (!frame) return;
  const rect = frame.getBoundingClientRect();
  if (rect.width > 0) cropWidth.value = rect.width;
  if (rect.height > 0) cropHeight.value = rect.height;
}

function handleImageLoad() {
  const image = imageRef.value;
  if (!image) return;
  naturalWidth.value = image.naturalWidth;
  naturalHeight.value = image.naturalHeight;
  imageReady.value = Boolean(image.naturalWidth && image.naturalHeight);
  resetCrop();
}

function resetCrop() {
  zoom.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
  clampOffset();
}

function clampOffset(nextX = offsetX.value, nextY = offsetY.value) {
  const maxOffsetX = Math.max(0, (displayWidth.value - cropWidth.value) / 2);
  const maxOffsetY = Math.max(0, (displayHeight.value - cropHeight.value) / 2);
  offsetX.value = Math.min(maxOffsetX, Math.max(-maxOffsetX, nextX));
  offsetY.value = Math.min(maxOffsetY, Math.max(-maxOffsetY, nextY));
}

function startDrag(event: PointerEvent) {
  if (!imageReady.value) return;
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  dragStartOffsetX.value = offsetX.value;
  dragStartOffsetY.value = offsetY.value;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function dragImage(event: PointerEvent) {
  if (!isDragging.value) return;
  event.preventDefault();
  clampOffset(
    dragStartOffsetX.value + event.clientX - dragStartX.value,
    dragStartOffsetY.value + event.clientY - dragStartY.value
  );
}

function endDrag(event: PointerEvent) {
  if (!isDragging.value) return;
  isDragging.value = false;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
}

function confirmCrop() {
  const image = imageRef.value;
  if (!image || !imageReady.value) return;

  const canvas = document.createElement('canvas');
  canvas.width = props.outputWidth;
  canvas.height = props.outputHeight;
  const context = canvas.getContext('2d');
  if (!context) return;

  const scaleX = props.outputWidth / cropWidth.value;
  const scaleY = props.outputHeight / cropHeight.value;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    (cropWidth.value / 2 - displayWidth.value / 2 + offsetX.value) * scaleX,
    (cropHeight.value / 2 - displayHeight.value / 2 + offsetY.value) * scaleY,
    displayWidth.value * scaleX,
    displayHeight.value * scaleY
  );

  emit('confirm', canvas.toDataURL(props.outputType, props.outputQuality));
  closeEditor();
}

function closeEditor() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.avatar-editor-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: var(--app-height);
  padding: max(10px, var(--safe-top)) calc(10px + var(--safe-right)) calc(10px + var(--safe-bottom)) calc(10px + var(--safe-left));
  background: rgba(18, 20, 24, 0.38);
  backdrop-filter: blur(12px);
}

.avatar-editor-panel {
  width: min(100%, 386px);
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 24px 24px 0 0;
  background:
    radial-gradient(circle at top right, rgba(255, 220, 231, 0.72), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 252, 0.98));
  color: #17191d;
  box-shadow: 0 -28px 82px rgba(17, 20, 24, 0.2);
}

.avatar-editor-head,
.avatar-editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.avatar-editor-head div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.avatar-editor-head span {
  color: #9b7581;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.avatar-editor-head strong {
  font-size: 16px;
  font-weight: 900;
}

.icon-action {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #22252b;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.crop-frame {
  position: relative;
  width: min(100%, 268px);
  justify-self: center;
  overflow: hidden;
  border-radius: 28px;
  background:
    linear-gradient(45deg, #e8ebef 25%, transparent 25%),
    linear-gradient(-45deg, #e8ebef 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e8ebef 75%),
    linear-gradient(-45deg, transparent 75%, #e8ebef 75%);
  background-color: #f6f7f9;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  background-size: 20px 20px;
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.06), 0 18px 38px rgba(23, 28, 34, 0.14);
  touch-action: none;
  user-select: none;
}

.crop-frame.dragging {
  cursor: grabbing;
}

.crop-image {
  position: absolute;
  left: 50%;
  top: 50%;
  max-width: none;
  object-fit: fill;
  will-change: transform;
  pointer-events: none;
}

.crop-grid {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: inherit;
  background:
    linear-gradient(rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.48)) 33.333% 0 / 1px 100% no-repeat,
    linear-gradient(rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.48)) 66.666% 0 / 1px 100% no-repeat,
    linear-gradient(90deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.48)) 0 33.333% / 100% 1px no-repeat,
    linear-gradient(90deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.48)) 0 66.666% / 100% 1px no-repeat;
  box-shadow: inset 0 0 0 999px rgba(0, 0, 0, 0.02);
  pointer-events: none;
}

.zoom-control {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
}

.zoom-control span {
  color: #565d66;
  font-size: 12px;
  font-weight: 900;
}

.zoom-control input {
  accent-color: var(--link-green);
}

.avatar-editor-actions {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1fr);
}

.secondary-action,
.primary-action {
  width: 100%;
  min-height: 42px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 900;
}

.primary-action {
  background: #eef0f2;
  color: #17191d;
}

.primary-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 640px) {
  .avatar-editor-backdrop {
    align-items: center;
  }

  .avatar-editor-panel {
    border-radius: 24px;
  }
}
</style>