<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useAuthStore, useThemeStore } from "../stores";
const $route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();

onMounted(() => {
  authStore.fetchUser();
});
</script>

<template>
  <aside class="sidebar" v-show="authStore.user">
    <nav class="menu">
      <RouterLink
        to="/libraries"
        class="menu-item"
        :class="{
          active:
            $route.name === 'libraries' || $route.path.startsWith('/libraries'),
        }"
      >
        LIBRERIE
      </RouterLink>

      <RouterLink
        to="/books"
        class="menu-item"
        :class="{
          active: $route.name === 'books' || $route.path.startsWith('/books'),
        }"
      >
        LIBRI
      </RouterLink>

      <RouterLink
        to="/loans"
        class="menu-item"
        :class="{
          active: $route.name === 'loans' || $route.path.startsWith('/loans'),
        }"
      >
        PRESTITI
      </RouterLink>
    </nav>

    <div class="sidebar-bottom">
      <button class="menu-item theme-toggle" @click="themeStore.toggleTheme" :title="`Switch to ${themeStore.currentTheme === 'light' ? 'dark' : 'light'} mode`">
        <span class="theme-text">{{ themeStore.currentTheme === 'light' ? 'DARK MODE:' : 'DARK MODE:' }}</span>
        <svg class="sun-and-moon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
          <mask class="moon" id="moon-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <circle cx="24" cy="10" r="6" fill="black" />
          </mask>
          <circle class="sun" cx="12" cy="12" r="6" mask="url(#moon-mask)" fill="currentColor" />
          <g class="sun-beams" stroke="currentColor">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </svg>
      </button>

      <button class="menu-item logout-button" @click="authStore.logout()">
        LOGOUT
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-family: "Kdam Thmor Pro", sans-serif;
  font-size: 22px;
  color: #fff;
  margin-bottom: 40px;
}

.menu {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.menu-item {
  padding: 16px 24px;
  font-size: 18px;
  font-weight: bold;
  color: var(--sidebar-text);
  text-decoration: none;
  margin-left: 5px;
  margin-right: 5px;
}

.menu-item:hover {
  background: var(--primary-dark);
  border-radius: 12px;
}

.menu-item.active {
  background: var(--primary-dark);
  border-radius: 12px;
}

.logout-button {
  margin-top: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  width: calc(100% - 10px);
  text-align: left;
  font-family: inherit;
}

.logout-button:hover {
  background: #c41e3a;
  border-radius: 12px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: auto;
}

.theme-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  width: calc(100% - 10px);
  text-align: left;
  font-family: inherit;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-toggle:hover {
  background: var(--primary-dark);
  border-radius: 12px;
}

.theme-text {
  flex: 1;
}

@import "https://unpkg.com/open-props/easings.min.css";

.sun-and-moon > :is(.moon, .sun, .sun-beams) {
  transform-origin: center;
}

.sun-and-moon > :is(.moon, .sun) {
  fill: var(--icon-fill);
}

.theme-toggle:is(:hover, :focus-visible) > .sun-and-moon > :is(.moon, .sun) {
  fill: var(--icon-fill-hover);
}

.sun-and-moon > .sun-beams {
  stroke: var(--icon-fill);
  stroke-width: 2px;
}

.theme-toggle:is(:hover, :focus-visible) .sun-and-moon > .sun-beams {
  stroke: var(--icon-fill-hover);
}

:root .sun-and-moon > .sun {
  transform: scale(1);
}

:root .sun-and-moon > .sun-beams {
  opacity: 1;
}

:root .sun-and-moon > .moon > circle {
  transform: translateX(0);
}

[data-theme="dark"] .sun-and-moon > .sun {
  transform: scale(1.75);
}

[data-theme="dark"] .sun-and-moon > .sun-beams {
  opacity: 0;
}

[data-theme="dark"] .sun-and-moon > .moon > circle {
  transform: translateX(-7px);
}

@supports (cx: 1) {
  [data-theme="dark"] .sun-and-moon > .moon > circle {
    cx: 17;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .sun-and-moon > .sun {
    transition: transform .5s var(--ease-elastic-3);
  }

  .sun-and-moon > .sun-beams {
    transition: transform .5s var(--ease-elastic-4), opacity .5s var(--ease-3);
  }

  .sun-and-moon .moon > circle {
    transition: transform .25s var(--ease-out-5);
  }

  @supports (cx: 1) {
    .sun-and-moon .moon > circle {
      transition: cx .25s var(--ease-out-5);
    }
  }

  /* Light mode animations (default state) */
  :root .sun-and-moon > .sun {
    transition-timing-function: var(--ease-3);
    transition-duration: .25s;
    transform: scale(1);
  }

  :root .sun-and-moon > .sun-beams {
    transition-duration: .15s;
    transform: rotateZ(0deg);
  }

  :root .sun-and-moon > .moon > circle {
    transition-duration: .5s;
    transition-delay: 0s;
  }

  /* Dark mode animations */
  [data-theme="dark"] .sun-and-moon > .sun {
    transition-timing-function: var(--ease-3);
    transition-duration: .25s;
    transform: scale(1.75);
  }

  [data-theme="dark"] .sun-and-moon > .sun-beams {
    transition-duration: .15s;
    transform: rotateZ(-25deg);
  }

  [data-theme="dark"] .sun-and-moon > .moon > circle {
    transition-duration: .5s;
    transition-delay: .25s;
  }
}
</style>
