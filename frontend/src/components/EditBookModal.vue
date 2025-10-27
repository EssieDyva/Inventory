<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  isOpen: boolean;
  book: any;
}>();

const emit = defineEmits<{
  close: [];
  save: [book: any];
}>();

const form = ref({
  title: "",
  author: "",
  volume: 1,
  status: "available" as "available" | "reading" | "lent",
  coverImage: "",
});

watch(
  () => props.book,
  (newBook) => {
    if (newBook) {
      form.value = {
        title: newBook.title || "",
        author: newBook.author || "",
        volume: newBook.volume || 1,
        status: newBook.status || "available",
        coverImage: newBook.coverImage || "",
      };
    }
  },
  { immediate: true }
);

const handleSave = () => {
  emit("save", { ...form.value });
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="close-btn" @click="$emit('close')">✕</button>

      <h2>Modifica Libro</h2>

      <div class="form-group">
        <label>Titolo</label>
        <input
          v-model="form.title"
          type="text"
          placeholder="Inserisci titolo"
        />
      </div>

      <div class="form-group">
        <label>Autore</label>
        <input
          v-model="form.author"
          type="text"
          placeholder="Inserisci autore"
        />
      </div>

      <div class="form-row">
        <div class="form-group small">
          <label>Volume</label>
          <input v-model.number="form.volume" type="number" />
        </div>

        <div class="form-group small">
          <label>Stato</label>
          <select v-model="form.status">
            <option value="available">Disponibile</option>
            <option value="reading">In lettura</option>
            <option value="lent">Prestato</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>URL Immagine</label>
        <input v-model="form.coverImage" type="text" placeholder="http://..." />
      </div>

      <div class="actions">
        <button class="primary" @click="handleSave">Salva</button>
        <button class="secondary" @click="$emit('close')">Annulla</button>
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
  width: 500px;
  max-width: 90%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
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
  margin: 16px 0;
}

.form-row {
  display: flex;
  gap: 16px;
}

.small {
  flex: 1;
}

label {
  font-weight: 600;
  margin-bottom: 4px;
}

input,
select {
  padding: 8px 12px;
  border-radius: 24px;
  border: 3px solid var(--primary-color);
  font-size: 14px;
  outline: none;
  background-color: var(--input-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 255, 0.08);
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
  width: 48%;
}
</style>
