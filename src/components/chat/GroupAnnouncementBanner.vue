<template>
  <section class="group-announcement">
    <button class="announcement-trigger" type="button" aria-label="查看群公告" @click="showDetails = true">
      <span class="announcement-copy">
        <strong>群公告</strong>
        <span>{{ announcement }}</span>
      </span>
      <ChevronRight class="announcement-chevron" :size="16" aria-hidden="true" />
    </button>

    <AppModal v-model="showDetails" title="群公告" variant="ins">
      <article class="announcement-details">
        <header>
          <div>
            <strong>群公告</strong>
            <span>{{ groupName }}</span>
          </div>
        </header>
        <p>{{ announcement }}</p>
        <small>由群主或管理员发布</small>
      </article>
    </AppModal>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import AppModal from '@/components/common/AppModal.vue';

defineProps<{
  announcement: string;
  groupName: string;
}>();

const showDetails = ref(false);
</script>

<style scoped>
.group-announcement {
  position: relative;
  z-index: 3;
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  padding: 7px calc(10px + var(--safe-right)) 7px calc(10px + var(--safe-left));
  border-bottom: 1px solid transparent;
  background: rgba(248, 250, 249, 0.94);
  backdrop-filter: blur(18px);
}

.announcement-trigger {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 6px 8px;
  border: 1px solid rgba(22, 36, 29, 0.055);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.88);
  color: #202522;
  text-align: left;
  box-shadow: 0 5px 18px rgba(19, 34, 27, 0.045);
}

.announcement-trigger:active {
  background: #f4f7f5;
  transform: scale(0.995);
}

.announcement-copy {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.announcement-copy strong {
  color: #202522;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.announcement-copy > span {
  min-width: 0;
  overflow: hidden;
  color: #818985;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-chevron {
  color: #a8aeab;
}

.announcement-details {
  display: grid;
  gap: 16px;
  padding: 4px 2px 8px;
}

.announcement-details header {
  display: flex;
  align-items: center;
  gap: 11px;
}

.announcement-details header div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.announcement-details header strong {
  font-size: 16px;
  font-weight: 900;
}

.announcement-details header span {
  overflow: hidden;
  color: #858c88;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-details p {
  margin: 0;
  padding: 15px;
  border-radius: 16px;
  background: #f5f7f6;
  color: #303632;
  font-size: 14px;
  line-height: 1.75;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.announcement-details small {
  color: #9a9f9c;
  font-size: 10px;
  text-align: right;
}
</style>
