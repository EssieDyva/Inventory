<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { router } from "../router";
import { useModalStore, useLibrariesStore, useBooksStore, useAuthStore, useLoansStore } from "../stores";
import AddLibrary from "./AddLibrary.vue";
const route = useRoute();
const modalStore = useModalStore();
const librariesStore = useLibrariesStore();
const booksStore = useBooksStore();
const authStore = useAuthStore();
const loansStore = useLoansStore();

const buttonText = computed(() => {
  if (route.name === "libraries") return "+ Nuova Libreria";
  if (route.name === "loans") return "+ Nuovo Prestito";
  return "+ Nuovo Libro";
});

const openModal = () => {
  if (route.name === "libraries") modalStore.openModal();
  else if (route.name === "loans") {
    loansStore.createModalOpen = true;
  } else {
    router.push("/books/add");
  }
};

const searchQuery = computed({
  get: () =>
    route.name === "libraries" ? librariesStore.searchQuery : booksStore.searchQuery,
  set: (val: string) => {
    route.name === "libraries"
      ? (librariesStore.searchQuery = val)
      : (booksStore.searchQuery = val);
  },
});

watch(
  () => route.name,
  () => {
    librariesStore.searchQuery = "";
    booksStore.searchQuery = "";
  }
);
</script>

<template>
  <header class="header" v-show="authStore.user">
    <h1 class="logo">Invento.ry</h1>

    <div class="search-container">
      <input
        type="text"
        placeholder="Cerca..."
        class="search-input"
        v-model="searchQuery"
      />
      <span class="search-icon">🔍</span>
    </div>

    <button class="action-btn" @click="openModal">
      {{ buttonText }}
    </button>

    <AddLibrary />
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--header-bg);
}

.logo {
  font-family: "Kdam Thmor Pro", sans-serif;
  font-size: 30px;
  color: var(--primary-color);
  margin: 0;
  cursor: default;
}

.search-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 50%;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 12px;
  border: 3px solid var(--search-border);
  border-radius: 40px;
  font-size: 14px;
  height: 40px;
  outline: none;
  background-color: var(--search-bg);
  box-shadow: var(--search-shadow);
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--text);
}

.search-input::placeholder {
  color: var(--search-border);
}

.search-icon {
  position: absolute;
  right: 12px;
  font-size: 16px;
  color: var(--search-border);
  cursor: default;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 24px;
  background-color: var(--button-bg);
  color: var(--button-text);
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  width: 20%;
  margin-top: -2px;
  margin-right: 1%;
  height: 40px;
  border: none;
}
</style>
