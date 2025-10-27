<script setup lang="ts">
import { Headbar, Sidebar, ToastNotification } from "./components";
</script>

<template>
  <div id="app">
    <Headbar class="header" />
    <div class="layout">
      <Sidebar class="sidebar" />
      <main class="content">
        <RouterView />
      </main>
    </div>
    <ToastNotification />
  </div>
</template>

<style>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  flex-shrink: 0;
}

.layout {
  flex: 1;
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.sidebar {
  flex-shrink: 0;
  height: 100%;
}

.content {
  flex: 1;
  height: 100%;
  overflow: hidden;
}
</style>
