<template>
  <section class="screen no-tabs utility-page">
    <header class="top-bar">
      <button class="subpage-title-button" type="button" aria-label="返回主页" @click="goHome">
        <h1 class="top-title">Fanfic</h1>
      </button>
      <button class="icon-button" type="button" aria-label="新建">
        <Plus :size="24" />
      </button>
    </header>
    <main class="utility-content">
      <BookOpenText :size="42" />
      <h2>同人文</h2>
      <p>这里预留给同人文的小说集结地。</p>
    </main>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { BookOpenText, Plus } from 'lucide-vue-next';

const router = useRouter();

function goHome() {
  void router.push({ name: 'home' });
}
</script>

<style scoped>
.subpage-title-button {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 0;
  color: inherit;
}

.subpage-title-button .top-title {
  margin: 0;
  text-align: left;
}

.utility-content {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  min-height: 50vh;
  padding: 20px;
  color: #4d5157;
  text-align: center;
}

.utility-content svg {
  width: 36px;
  height: 36px;
}

h2,
p {
  margin: 0;
}

p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}
</style>