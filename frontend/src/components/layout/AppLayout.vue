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
  background: var(--color-bg-page);
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
  padding: 28px;
  background:
    radial-gradient(circle at 96% 2%, rgba(215, 161, 79, 0.08), transparent 23rem),
    linear-gradient(rgba(35, 98, 74, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(35, 98, 74, 0.018) 1px, transparent 1px),
    var(--color-bg-page);
  background-size: auto, 32px 32px, 32px 32px, auto;
}

@media screen and (max-width: 768px) {
  .app-main {
    padding: 12px;
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
