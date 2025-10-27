<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useModalStore } from "../stores";
import { useLibrariesStore } from "../stores";

const modalStore = useModalStore();
const { isOpen } = storeToRefs(modalStore);

const inputValue = ref("");

const librariesStore = useLibrariesStore();

const closeModal = () => {
  modalStore.closeModal();
  inputValue.value = "";
};

const handleSubmit = async () => {
  if (!inputValue.value.trim()) return;

  await librariesStore.createLibrary(inputValue.value);

  closeModal();
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <button class="close-btn" @click="closeModal">✕</button>

      <h2>Nuova Libreria</h2>

      <div class="form-group">
        <label>Nome Libreria</label>
        <input v-model="inputValue" placeholder="Inserisci nome libreria" />
      </div>

      <div class="actions">
        <button class="primary" @click="handleSubmit">Aggiungi</button>
        <button class="secondary" @click="closeModal">Indietro</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin: 20px 0;
}

input {
  padding: 8px 36px 8px 12px;
  border-radius: 24px;
  border: 3px solid var(--primary-color);
  font-size: 14px;
  margin-top: 8px;
  outline: none;
  background-color: var(--input-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 255, 0.08);
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--text);
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

button.primary {
  background: var(--primary-dark);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
}

button.secondary {
  background: var(--card-bg);
  color: var(--text);
  border: 2px solid var(--primary-color);
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
}

button.primary,
button.secondary {
  width: 165px;
}
</style>
