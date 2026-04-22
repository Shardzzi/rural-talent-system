<template>
  <el-container class="app-layout">
    <sidebar-nav :collapsed="sidebarCollapsed" @toggle="toggleSidebar" @update:collapsed="val => sidebarCollapsed = val" />
    <el-container class="app-main-container">
      <header-bar @toggle-sidebar="toggleSidebar" />
      <el-main id="main-content" role="main" class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SidebarNav from './SidebarNav.vue'
import HeaderBar from './HeaderBar.vue'

const sidebarCollapsed = ref(false)

const checkMobile = () => {
  if (window.innerWidth < 768) {
    sidebarCollapsed.value = true
  } else {
    // If we transition from mobile to desktop, make sure sidebar is expanded
    sidebarCollapsed.value = false
  }
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-bg-page);
}

.app-main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-page);
}

@media screen and (max-width: 768px) {
  .app-main {
    padding: var(--spacing-sm);
  }
}

/* Route transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>