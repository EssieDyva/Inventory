<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBooksStore } from "../stores";

defineProps<{
  isOpen: boolean;
  shelfId: string;
  libraryId: string;
  shelfName: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [bookIds: string[]];
}>();

const booksStore = useBooksStore();
const selectedBooks = ref<Set<string>>(new Set());
const searchQuery = ref("");

const availableBooks = computed(() => {
  return booksStore.books.filter((book) => !book.libraryId && !book.shelfId);
});

const filteredBooks = computed(() => {
  if (!searchQuery.value) return availableBooks.value;

  const query = searchQuery.value.toLowerCase();
  return availableBooks.value.filter(
    (book) =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.volume.toString().includes(query)
  );
});

const sortedBooks = computed(() => {
  return [...filteredBooks.value].sort((a, b) => {
    const titleCompare = a.title.localeCompare(b.title);
    if (titleCompare !== 0) return titleCompare;
    return a.volume - b.volume;
  });
});

const toggleBook = (bookId: string) => {
  if (selectedBooks.value.has(bookId)) {
    selectedBooks.value.delete(bookId);
  } else {
    selectedBooks.value.add(bookId);
  }
};

const toggleAll = () => {
  if (selectedBooks.value.size === sortedBooks.value.length) {
    selectedBooks.value.clear();
  } else {
    sortedBooks.value.forEach((book) => selectedBooks.value.add(book._id));
  }
};

const isAllSelected = computed(() => {
  return (
    sortedBooks.value.length > 0 &&
    selectedBooks.value.size === sortedBooks.value.length
  );
});

const handleSave = () => {
  if (selectedBooks.value.size === 0) return;
  emit("save", Array.from(selectedBooks.value));
  handleClose();
};

const handleClose = () => {
  selectedBooks.value.clear();
  searchQuery.value = "";
  emit("close");
};

onMounted(async () => {
  await booksStore.loadUnassignedBooks();
});
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
    <div class="modal">
      <button class="close-btn" @click="handleClose">✕</button>

      <h2>Aggiungi Libri a {{ shelfName }}</h2>

      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cerca per titolo, autore o volume..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="selection-info">
        <label class="checkbox-container">
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="toggleAll"
            :disabled="sortedBooks.length === 0"
          />
          <span class="checkmark"></span>
          Seleziona tutti
        </label>
        <span class="count">
          {{ selectedBooks.size }} / {{ sortedBooks.length }} selezionati
        </span>
      </div>

      <div class="books-list">
        <div v-if="sortedBooks.length === 0" class="empty-message">
          {{
            availableBooks.length === 0
              ? "Nessun libro disponibile. Tutti i libri sono già assegnati a degli scaffali."
              : "Nessun libro trovato con i criteri di ricerca."
          }}
        </div>

        <div
          v-for="book in sortedBooks"
          :key="book._id"
          class="book-item"
          :class="{ selected: selectedBooks.has(book._id) }"
          @click="toggleBook(book._id)"
        >
          <label class="checkbox-container">
            <input
              type="checkbox"
              :checked="selectedBooks.has(book._id)"
              @change.stop="toggleBook(book._id)"
            />
            <span class="checkmark"></span>
          </label>

          <div class="book-info">
            <div class="book-volume">Vol. {{ book.volume }}</div>
            <div class="book-details">
              <div class="book-title">{{ book.title }}</div>
              <div class="book-author">{{ book.author }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button
          class="primary"
          @click="handleSave"
          :disabled="selectedBooks.size === 0"
        >
          Aggiungi {{ selectedBooks.size > 0 ? `(${selectedBooks.size})` : "" }}
        </button>
        <button class="secondary" @click="handleClose">Annulla</button>
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
  border-radius: 12px;
  padding: 24px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: bold;
  padding-right: 30px;
}

.search-container {
  position: relative;
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 16px;
  border: 2px solid var(--primary-color);
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: var(--input-bg);
  color: var(--text);
}

.search-input:focus {
  border-color: var(--primary-dark);
}

.search-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--primary-color);
}

.selection-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--header-bg);
  border-radius: 8px;
  margin-bottom: 12px;
}

.count {
  font-size: 14px;
  color: var(--text);
  font-weight: 600;
}

.books-list {
  flex: 1;
  overflow-y: auto;
  border: 2px solid var(--input-border);
  border-radius: 8px;
  margin-bottom: 16px;
  min-height: 300px;
  max-height: 400px;
}

.empty-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text);
  text-align: center;
  padding: 24px;
}

.book-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--input-border);
  cursor: pointer;
  transition: background 0.2s;
}

.book-item:last-child {
  border-bottom: none;
}

.book-item:hover {
  background: var(--header-bg);
}

.book-item.selected {
  background: var(--primary-color);
  color: white;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 20px;
  width: 20px;
  border: 2px solid var(--primary-color);
  border-radius: 4px;
  background-color: var(--card-bg);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-container:hover .checkmark {
  border-color: var(--primary-dark);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox-container input:checked ~ .checkmark::after {
  content: "✓";
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.book-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 12px;
  flex: 1;
}

.book-volume {
  font-weight: 700;
  color: var(--primary-color);
  font-size: 16px;
  min-width: 60px;
}

.book-details {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
}

.book-author {
  font-size: 13px;
  color: var(--text);
}

.actions {
  display: flex;
  gap: 12px;
}

button.primary {
  flex: 1;
  background: var(--primary-dark);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}

button.primary:hover:not(:disabled) {
  background: var(--primary-color);
}

button.primary:disabled {
  background: var(--input-border);
  cursor: not-allowed;
}

button.secondary {
  flex: 1;
  background: var(--card-bg);
  color: var(--text);
  border: 2px solid var(--primary-color);
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
}

button.secondary:hover {
  background: var(--header-bg);
}

.books-list::-webkit-scrollbar {
  width: 8px;
}

.books-list::-webkit-scrollbar-thumb {
  background-color: var(--primary-color);
  opacity: 0.3;
  border-radius: 4px;
}

.books-list::-webkit-scrollbar-thumb:hover {
  opacity: 0.5;
}

.books-list::-webkit-scrollbar-track {
  background: transparent;
}
</style>
