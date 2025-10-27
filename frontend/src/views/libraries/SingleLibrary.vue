<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLibrariesStore, useToastStore, useBooksStore } from "../../stores";
import { deleteLibrary, updateShelf } from "../../helpers/api";
import DeleteConfirmModal from "../../components/DeleteConfirmModal.vue";
import AddBooksToShelfModal from "../../components/AddBooksToShelfModal.vue";
import EditBookModal from "../../components/EditBookModal.vue";

const route = useRoute();
const router = useRouter();
const librariesStore = useLibrariesStore();
const booksStore = useBooksStore();
const toastStore = useToastStore();

const deleteModalOpen = ref(false);
const editingShelfId = ref<string | null>(null);
const editShelfName = ref("");
const addBooksModalOpen = ref(false);
const selectedShelfForBooks = ref<{ id: string; name: string } | null>(null);
const openShelves = reactive<Record<string, boolean>>({});
const editBookModalOpen = ref(false);
const selectedBookForEdit = ref<any>(null);

onMounted(async () => {
  await librariesStore.fetchLibraryById(route.params.id as string);
});

const startEditShelf = (shelf: any) => {
  editingShelfId.value = shelf._id;
  editShelfName.value = shelf.name;
};

const handleEditBookSave = async (updatedBook: any) => {
  if (!selectedBookForEdit.value) return;

  try {
    await booksStore.editBook(
      selectedBookForEdit.value._id,
      updatedBook,
      false
    );
    toastStore.success("Libro aggiornato con successo");

    // Aggiorna libreria e libri
    const currentLibraryId = librariesStore.currentLibrary?._id;
    if (currentLibraryId) {
      await librariesStore.fetchLibraryById(currentLibraryId);
      await booksStore.loadBooks();
    }

    editBookModalOpen.value = false;
    selectedBookForEdit.value = null;
  } catch (err) {
    console.error(err);
    toastStore.error("Errore nell'aggiornamento del libro");
  }
};

const saveShelfName = async (shelfId: string) => {
  try {
    await updateShelf(shelfId, { name: editShelfName.value });
    toastStore.success("Nome scaffale aggiornato");
    await librariesStore.fetchLibraryById(route.params.id as string);
    editingShelfId.value = null;
  } catch (error) {
    toastStore.error("Errore nell'aggiornamento dello scaffale");
  }
};

const cancelEditShelf = () => {
  editingShelfId.value = null;
  editShelfName.value = "";
};

const toggleShelf = (shelfId: string) => {
  openShelves[shelfId] = !openShelves[shelfId];
};

const addBookToShelf = (shelfId: string, shelfName: string) => {
  selectedShelfForBooks.value = { id: shelfId, name: shelfName };
  addBooksModalOpen.value = true;
};

const handleAddBooks = async (bookIds: string[]) => {
  if (!selectedShelfForBooks.value) return;

  try {
    const promises = bookIds.map((bookId) =>
      booksStore.editBook(
        bookId,
        {
          shelfId: selectedShelfForBooks.value!.id,
          libraryId: route.params.id as string,
        },
        false
      )
    );

    await Promise.all(promises);

    toastStore.success(
      `${bookIds.length} ${
        bookIds.length === 1 ? "libro aggiunto" : "libri aggiunti"
      } con successo`
    );

    await Promise.all([
      librariesStore.fetchLibraryById(route.params.id as string),
      booksStore.loadBooks(),
    ]);

    addBooksModalOpen.value = false;
    selectedShelfForBooks.value = null;
  } catch (err) {
    console.error(err);
    toastStore.error("Errore nell'aggiungere i libri");
  }
};

const removeBookFromShelf = async (bookId: string) => {
  try {
    await booksStore.editBook(
      bookId,
      { shelfId: null, libraryId: null },
      false
    );

    toastStore.success("Libro rimosso con successo");

    const currentLibraryId = librariesStore.currentLibrary?._id;
    if (currentLibraryId) {
      await librariesStore.fetchLibraryById(currentLibraryId);
    }
  } catch (err) {
    console.error(err);
    toastStore.error("Errore nel rimuovere il libro");
  }
};

const handleDeleteLibrary = async () => {
  try {
    await deleteLibrary(route.params.id as string);
    toastStore.success("Libreria eliminata con successo");
    await librariesStore.fetchLibraries();
    router.push("/");
  } catch (error) {
    toastStore.error("Errore nell'eliminazione della libreria");
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    available: "Disponibile",
    reading: "In lettura",
    lent: "Prestato",
  };
  return labels[status] || status;
};

const getStatusClass = (status: string) => {
  return `status-${status}`;
};
</script>

<template>
  <div class="library-view">
    <div v-if="librariesStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Caricamento...</p>
    </div>

    <div v-else-if="librariesStore.error" class="error-message">
      {{ librariesStore.error }}
    </div>

    <div v-else-if="librariesStore.currentLibrary" class="library-wrapper">
      <div class="title-bar">
        <h2>{{ librariesStore.currentLibrary.name }}</h2>
        <div class="title-actions">
          <span class="book-count">
            📚 {{ librariesStore.currentLibrary.totalBooks }} libri
          </span>
        </div>
      </div>

      <div class="library-content">
        <div class="shelves-section">
          <div
            v-for="shelf in librariesStore.currentLibrary.shelves"
            :key="shelf._id"
            class="shelf"
          >
            <div class="shelf-header">
              <div class="shelf-title-area">
                <h3 v-if="editingShelfId !== shelf._id">
                  <button class="btn-toggle" @click="toggleShelf(shelf._id)">
                    {{ openShelves[shelf._id] ? "▼" : "▶" }}
                  </button>
                  {{ shelf.name }}
                  <button
                    class="btn-icon"
                    @click="startEditShelf(shelf)"
                    title="Modifica nome"
                  >
                    ✏️
                  </button>
                </h3>
                <div v-else class="edit-shelf-name">
                  <input
                    v-model="editShelfName"
                    @keyup.enter="saveShelfName(shelf._id)"
                    @keyup.esc="cancelEditShelf"
                    placeholder="Nome scaffale"
                    autofocus
                  />
                  <button class="btn-save" @click="saveShelfName(shelf._id)">
                    ✓
                  </button>
                  <button class="btn-cancel" @click="cancelEditShelf">✕</button>
                </div>
                <span class="shelf-info">{{ shelf.booksCount }} libri</span>
              </div>
              <button
                class="btn-add"
                @click="addBookToShelf(shelf._id, shelf.name)"
              >
                + Aggiungi Libro
              </button>
            </div>

            <!-- Empty shelf -->
            <div v-if="shelf.books.length === 0" class="empty-shelf">
              Nessun libro in questo scaffale
            </div>

            <!-- Collapsible list of books -->
            <transition name="collapse">
              <div
                v-show="openShelves[shelf._id] && shelf.books.length > 0"
                class="books-collapsible"
              >
                <table class="books-table">
                  <thead>
                    <tr>
                      <th style="width: 80px">Volume</th>
                      <th>Titolo</th>
                      <th>Autore</th>
                      <th style="width: 120px">Stato</th>
                      <th style="width: 120px">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="book in [...shelf.books].sort((a, b) => {
                        if (a.title === b.title) return a.volume - b.volume;
                        return a.title.localeCompare(b.title);
                      })"
                      :key="book._id"
                    >
                      <td class="volume-cell">#{{ book.volume }}</td>
                      <td class="title-cell">{{ book.title }}</td>
                      <td>{{ book.author }}</td>
                      <td>
                        <span
                          :class="['status-badge', getStatusClass(book.status)]"
                        >
                          {{ getStatusLabel(book.status) }}
                        </span>
                      </td>
                      <td>
                        <button
                          class="btn-edit"
                          @click="
                            selectedBookForEdit = book;
                            editBookModalOpen = true;
                          "
                          title="Modifica libro"
                        >
                          ✏️
                        </button>

                        <button
                          class="btn-remove"
                          v-if="book.shelfId || book.libraryId"
                          @click="removeBookFromShelf(book._id)"
                          title="Rimuovi dalla shelf"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </transition>
          </div>
        </div>

        <!-- Unassigned books -->
        <div
          v-if="librariesStore.currentLibrary.unassignedBooks?.length > 0"
          class="unassigned-section"
        >
          <h3>📦 Libri non assegnati</h3>
          <div class="unassigned-books">
            <div
              v-for="book in librariesStore.currentLibrary.unassignedBooks"
              :key="book._id"
              class="unassigned-book"
            >
              {{ book.title }} - {{ book.author }}
            </div>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="danger-zone">
          <h3>⚠️ Zona pericolosa</h3>
          <p>
            Eliminare questa libreria rimuoverà tutti gli scaffali e i libri
            verranno disassociati (non verranno cancellati).
          </p>
          <button class="btn-danger" @click="deleteModalOpen = true">
            Elimina Libreria
          </button>
        </div>
      </div>
    </div>

    <DeleteConfirmModal
      :isOpen="deleteModalOpen"
      title="Elimina Libreria"
      :message="`Sei sicuro di voler eliminare '${librariesStore.currentLibrary?.name}'? Questa azione eliminerà anche tutti gli scaffali e i libri contenuti.`"
      @confirm="handleDeleteLibrary"
      @cancel="deleteModalOpen = false"
    />

    <AddBooksToShelfModal
      v-if="selectedShelfForBooks"
      :isOpen="addBooksModalOpen"
      :shelfId="selectedShelfForBooks.id"
      :libraryId="route.params.id as string"
      :shelfName="selectedShelfForBooks.name"
      @close="
        addBooksModalOpen = false;
        selectedShelfForBooks = null;
      "
      @save="handleAddBooks"
    />

    <EditBookModal
      v-if="selectedBookForEdit"
      :isOpen="editBookModalOpen"
      :book="selectedBookForEdit"
      @close="
        editBookModalOpen = false;
        selectedBookForEdit = null;
      "
      @save="handleEditBookSave"
    />
  </div>
</template>

<style scoped>
.library-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading,
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--input-border);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.library-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.title-bar {
  flex-shrink: 0;
  padding: 16px 24px;
  background: var(--header-bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-bar h2 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.title-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.book-count {
  font-size: 14px;
  color: #666;
}

.library-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: 110px;
}

.shelves-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.shelf {
  background: var(--card-bg);
  border: 2px solid var(--input-border);
  border-radius: 12px;
  padding: 20px;
}

.shelf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--input-border);
}

.shelf-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shelf-title-area h3 {
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shelf-info {
  font-size: 14px;
  color: #666;
}

/* ===== Toggle Button ===== */
.btn-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 0.5rem;
  transition: transform 0.2s ease;
}

.btn-toggle:hover {
  color: var(--primary-color);
}

.edit-shelf-name {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-shelf-name input {
  padding: 6px 12px;
  border: 2px solid var(--primary-color);
  border-radius: 6px;
  font-size: 16px;
  background: var(--input-bg);
  color: var(--text);
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  opacity: 0.6;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-save,
.btn-cancel {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-save {
  background: #28a745;
  color: white;
}

.btn-cancel {
  background: #dc3545;
  color: white;
}

.btn-add {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

.btn-add:hover {
  background: var(--primary-dark);
}

.btn-remove,
.btn-edit {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  margin-left: 8px;
  opacity: 0.6;
}

.btn-remove:hover,
.btn-edit:hover {
  opacity: 1;
}

.empty-shelf {
  text-align: center;
  padding: 32px;
  color: #999;
  font-style: italic;
}

/* ===== Books Table ===== */
.books-table {
  width: 100%;
  border-collapse: collapse;
}

.books-table th {
  background: var(--header-bg);
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--input-border);
}

.books-table td {
  padding: 12px;
  border-bottom: 1px solid var(--input-border);
}

.books-table tbody tr:hover {
  background: var(--header-bg);
  transition: background 0.2s;
}

.volume-cell {
  font-weight: 600;
  color: var(--primary-color);
}

.title-cell {
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-available {
  background: #d4edda;
  color: #155724;
}

.status-reading {
  background: #fff3cd;
  color: #856404;
}

.status-lent {
  background: #f8d7da;
  color: #721c24;
}

/* ===== Collapsible transition ===== */
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

/* ===== Unassigned Books ===== */
.unassigned-section {
  margin-top: 32px;
  padding: 20px;
  background: var(--header-bg);
  border-radius: 8px;
  border: 2px dashed var(--primary-color);
}

.unassigned-books {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.unassigned-book {
  padding: 8px 12px;
  background: var(--card-bg);
  border-radius: 6px;
}

/* ===== Danger Zone ===== */
.danger-zone {
  margin-top: 48px;
  padding: 24px;
  background: #fff5f5;
  border: 2px solid #dc3545;
  border-radius: 8px;
}

.danger-zone h3 {
  margin: 0 0 8px 0;
  color: #dc3545;
}

.danger-zone p {
  margin: 0 0 16px 0;
  color: #666;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
}

.btn-danger:hover {
  background: #c82333;
}
</style>
