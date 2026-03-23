<template>
  <div class="tab-bar safe-bottom">
    <router-link
      v-for="route in tabRoutes"
      :key="route.path"
      :to="route.path"
      class="tab-item"
      :class="{ active: $route.path === route.path }"
    >
      <span class="tab-icon">{{ route.meta.icon }}</span>
      <span class="tab-text">{{ route.meta.title }}</span>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '../router'

const currentRoute = useRoute()
const tabRoutes = computed(() => 
  router.getRoutes().filter(r => r.meta.icon && !r.meta.hideTabBar)
)
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: white;
  border-top: 1px solid var(--border);
  padding-top: 8px;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 12px;
  text-decoration: none;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.tab-item.active {
  color: var(--primary);
}

.tab-icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.tab-text {
  font-size: 12px;
}
</style>