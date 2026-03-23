<template>
  <div class="app">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <TabBar v-if="showTabBar" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'

const route = useRoute()
const showTabBar = computed(() => !route.meta.hideTabBar)
</script>

<style scoped>
.app {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 60px;
}
</style>