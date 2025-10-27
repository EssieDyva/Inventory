<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useBooksStore } from "../../stores";
import EditBookModal from "../../components/EditBookModal.vue";
import DeleteConfirmModal from "../../components/DeleteConfirmModal.vue";

const booksStore = useBooksStore();

const editModalOpen = ref(false);
const deleteModalOpen = ref(false);
const selectedBook = ref<any>(null);

onMounted(() => {
  booksStore.fetchStats();
  booksStore.loadBooks();
});

const openEditModal = (book: any) => {
  selectedBook.value = book;
  editModalOpen.value = true;
};

const openDeleteModal = (book: any) => {
  selectedBook.value = book;
  deleteModalOpen.value = true;
};

const handleSaveEdit = async (updatedBook: any) => {
  try {
    await booksStore.editBook(selectedBook.value._id, updatedBook);
    editModalOpen.value = false;
    selectedBook.value = null;
  } catch (error) {
    console.error("Errore nel salvataggio:", error);
  }
};

const handleConfirmDelete = async () => {
  try {
    await booksStore.removeBook(selectedBook.value._id, true);
    deleteModalOpen.value = false;
    selectedBook.value = null;
  } catch (error) {
    console.error("Errore nell'eliminazione:", error);
  }
};

const closeModals = () => {
  editModalOpen.value = false;
  deleteModalOpen.value = false;
  selectedBook.value = null;
};
</script>

<template>
  <div class="book-home">
    <div class="title-bar">
      <h2>I tuoi Libri</h2>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-number">{{ booksStore.bookStats.total }}</span>
        <span class="stat-label">Totali</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ booksStore.bookStats.available }}</span>
        <span class="stat-label">Disponibili</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ booksStore.bookStats.reading }}</span>
        <span class="stat-label">In lettura</span>
      </div>
      <div class="stat">
        <span class="stat-number">{{ booksStore.bookStats.lent }}</span>
        <span class="stat-label">Prestati</span>
      </div>
    </div>

    <!-- Filters and Controls -->
    <div class="controls-bar">
      <div class="filters">
        <button
          @click="booksStore.statusFilter = 'all'"
          :class="{ active: booksStore.statusFilter === 'all' }"
          class="filter-btn"
        >
          Tutti ({{ booksStore.bookStats.total }})
        </button>
        <button
          @click="booksStore.statusFilter = 'available'"
          :class="{ active: booksStore.statusFilter === 'available' }"
          class="filter-btn"
        >
          Disponibili ({{ booksStore.bookStats.available }})
        </button>
        <button
          @click="booksStore.statusFilter = 'reading'"
          :class="{ active: booksStore.statusFilter === 'reading' }"
          class="filter-btn"
        >
          In lettura ({{ booksStore.bookStats.reading }})
        </button>
        <button
          @click="booksStore.statusFilter = 'lent'"
          :class="{ active: booksStore.statusFilter === 'lent' }"
          class="filter-btn"
        >
          Prestati ({{ booksStore.bookStats.lent }})
        </button>
      </div>

      <div class="view-controls">
        <select v-model="booksStore.sortBy" class="sort-select">
          <option value="title">Ordina per Titolo (alfabetico)</option>
          <option value="author">Ordina per Autore</option>
          <option value="volume">Ordina per Volume</option>
          <option value="date">Ordina per Data</option>
        </select>

        <div class="view-toggle">
          <button
            @click="booksStore.viewMode = 'grid'"
            :class="{ active: booksStore.viewMode === 'grid' }"
            title="Vista Griglia"
          >
            ⊞
          </button>
          <button
            @click="booksStore.viewMode = 'list'"
            :class="{ active: booksStore.viewMode === 'list' }"
            title="Vista Lista"
          >
            ☰
          </button>
        </div>
      </div>
    </div>

    <!-- Search Results Info -->
    <div v-if="booksStore.searchQuery" class="search-info">
      Trovati {{ booksStore.total }} risultati per "{{
        booksStore.searchQuery
      }}"
      <button @click="booksStore.searchQuery = ''" class="clear-search">
        ✕ Cancella
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="booksStore.loading" class="skeleton-container">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line shorter"></div>
      </div>
    </div>

    <!-- Books Container -->
    <div v-else :class="['cards-container', booksStore.viewMode]">
      <!-- Empty State -->
      <div v-if="booksStore.books.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>
          {{
            booksStore.searchQuery || booksStore.statusFilter !== "all"
              ? "Nessun libro trovato"
              : "Nessun libro ancora"
          }}
        </h3>
        <p v-if="!booksStore.searchQuery && booksStore.statusFilter === 'all'">
          Inizia ad aggiungere i tuoi primi libri alla collezione
        </p>
        <button
          v-if="!booksStore.searchQuery && booksStore.statusFilter === 'all'"
          @click="$router.push('/books/add')"
          class="cta-button"
        >
          + Aggiungi il primo libro
        </button>
      </div>

      <!-- Books List with Animations -->
      <TransitionGroup
        name="list"
        tag="div"
        :class="['books-list', booksStore.viewMode]"
      >
        <div
          v-for="book in booksStore.books"
          :key="book._id"
          :class="['card', booksStore.viewMode]"
        >
          <div class="card-image">
            <img
              v-if="book.coverImage"
              :src="book.coverImage"
              :alt="book.title"
              @error="
                (e) =>
                  (e.target as HTMLImageElement).src =
                    'https://img.freepik.com/free-vector/red-text-book-closed-icon_18591-82397.jpg'
              "
            />
            <div v-else class="placeholder-image">📚</div>
          </div>

          <div class="card-content">
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-author">{{ book.author }}</p>
            <p class="book-volume">Volume {{ book.volume }}</p>
            <span class="book-status" :class="book.status">
              {{
                book.status === "available"
                  ? "✓ Disponibile"
                  : book.status === "reading"
                  ? "📖 In lettura"
                  : "📤 Prestato"
              }}
            </span>
          </div>

          <div class="card-actions">
            <button
              class="btn-edit"
              @click="openEditModal(book)"
              title="Modifica"
            >
              ✏️
            </button>
            <button
              class="btn-delete"
              @click="openDeleteModal(book)"
              title="Elimina"
            >
              🗑️
            </button>
          </div>
        </div>
      </TransitionGroup>
      <!-- Pagination Controls -->
      <div
        v-if="booksStore.pageCount > 1 && !booksStore.loading"
        class="pagination"
      >
        <button
          @click="booksStore.setPage(booksStore.currentPage - 1)"
          :disabled="booksStore.currentPage === 1"
          class="page-btn"
        >
          Prev
        </button>
        <button
          v-for="page in booksStore.pageCount"
          :key="page"
          @click="booksStore.setPage(page)"
          :class="{ active: page === booksStore.currentPage }"
          class="page-btn"
        >
          {{ page }}
        </button>
        <button
          @click="booksStore.setPage(booksStore.currentPage + 1)"
          :disabled="booksStore.currentPage === booksStore.pageCount"
          class="page-btn"
        >
          Next
        </button>
      </div>
    </div>

    <EditBookModal
      :isOpen="editModalOpen"
      :book="selectedBook"
      @close="closeModals"
      @save="handleSaveEdit"
    />

    <DeleteConfirmModal
      :isOpen="deleteModalOpen"
      title="Elimina Libro"
      :message="`Sei sicuro di voler eliminare '${selectedBook?.title}'?`"
      @confirm="handleConfirmDelete"
      @cancel="closeModals"
    />
  </div>
</template>

<style scoped>
.book-home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  gap: 0;
}

.title-bar {
  flex-shrink: 0;
  padding: 16px 24px;
  background: var(--header-bg);
  z-index: 1;
}

.title-bar h2 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: var(--text);
}

.stats-bar {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  background: var(--card-bg);
  border-bottom: 2px solid var(--input-border);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 3px solid var(--input-border);
  min-width: 120px;
  transition: all 0.3s;
}

.stat:hover{
  transform: translateY(-4px);
  box-shadow: var(--card-shadow);
  border-color: var(--primary-color);
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 12px;
  color: var(--text);
  text-transform: uppercase;
  margin-top: 4px;
  opacity: 0.7;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--card-bg);
  border-bottom: 2px solid var(--input-border);
  flex-wrap: wrap;
  gap: 12px;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid var(--input-border);
  background: var(--card-bg);
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  font-weight: 500;
  color: var(--text);
}

.filter-btn:hover {
  border-color: var(--primary-color);
  background: var(--input-bg);
}

.filter-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.view-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sort-select {
  padding: 8px 16px;
  border: 2px solid var(--primary-color);
  border-radius: 20px;
  background: var(--input-bg);
  cursor: pointer;
  font-size: 14px;
  outline: none;
  color: var(--text);
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: var(--input-bg);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid var(--input-border);
}

.view-toggle button {
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  border-radius: 6px;
  transition: all 0.2s;
  color: var(--text);
}

.view-toggle button.active {
  background: var(--card-bg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-info {
  padding: 12px 24px;
  background: var(--header-bg);
  border-bottom: 2px solid var(--primary-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.clear-search {
  background: #ffc107;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.skeleton-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  padding: 24px;
}

.skeleton-card {
  background: var(--card-bg);
  border: 2px solid var(--input-border);
  border-radius: 12px;
  overflow: hidden;
}

.skeleton-image {
  width: 100%;
  height: 280px;
  background: linear-gradient(
    90deg,
    var(--card-bg) 25%,
    var(--input-border) 50%,
    var(--card-bg) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-line {
  height: 16px;
  margin: 12px 16px;
  background: linear-gradient(
    90deg,
    var(--card-bg) 25%,
    var(--input-border) 50%,
    var(--card-bg) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-line.shorter {
  width: 40%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.cards-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: 100px;
}

.books-list {
  display: grid;
  gap: 24px;
}

.books-list.grid {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.books-list.list {
  grid-template-columns: 1fr;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.3;
  color: var(--text);
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: var(--text);
}

.empty-state p {
  margin: 0 0 24px 0;
  color: var(--text);
  font-size: 16px;
  opacity: 0.7;
}

.cta-button {
  padding: 12px 24px;
  background: var(--button-bg);
  color: var(--button-text);
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cta-button:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.card.grid {
  background: var(--card-bg);
  border: 2px solid var(--input-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
}

.card.grid:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow);
  border-color: var(--primary-color);
}

.card.list {
  background: var(--card-bg);
  border: 2px solid var(--input-border);
  border-radius: 12px;
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 16px;
  padding: 16px;
  align-items: center;
  transition: all 0.3s ease;
}

.card.list:hover {
  box-shadow: var(--card-shadow);
  border-color: var(--primary-color);
}

.card.list .card-image {
  width: 120px;
  height: 160px;
  flex-shrink: 0;
}

.card.list .card-content {
  padding: 0;
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
}

.card.list .book-title {
  font-size: 18px;
  min-width: 200px;
}

.card.list .book-author {
  min-width: 150px;
}

.card.list .card-actions {
  border: none;
  background: transparent;
  padding: 0;
  flex-direction: row;
}

.card-image {
  width: 100%;
  height: 280px;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px 10px 0 0;
}

.card.list .card-image {
  border-radius: 8px;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.card:hover .card-image img {
  transform: scale(1.05);
}

.placeholder-image {
  font-size: 64px;
  color: var(--text);
  opacity: 0.3;
}

.card-content {
  padding: 16px;
  flex: 1;
}

.book-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  color: var(--text);
}

.book-author {
  margin: 0 0 4px 0;
  color: var(--text);
  font-size: 14px;
  opacity: 0.7;
}

.book-volume {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--text);
  opacity: 0.6;
}

.book-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.book-status.available {
  background: #d4edda;
  color: #155724;
}

.book-status.reading {
  background: #fff3cd;
  color: #856404;
}

.book-status.lent {
  background: #f8d7da;
  color: #721c24;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--input-border);
  background: var(--card-bg);
}

.btn-edit,
.btn-delete {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.btn-edit {
  background: var(--primary-color);
  opacity: 0.8;
}

.btn-edit:hover {
  background: var(--primary-dark);
  opacity: 1;
  transform: scale(1.05);
}

.btn-delete {
  background: #dc2626;
  opacity: 0.8;
}

.btn-delete:hover {
  background: #b91c1c;
  opacity: 1;
  transform: scale(1.05);
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.list-leave-active {
  position: absolute;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--card-bg);
  border-top: 1px solid var(--input-border);
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: var(--card-bg);
  border: 1px solid var(--input-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text);
}

.page-btn:hover {
  background: var(--input-bg);
}

.page-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: var(--text);
}
</style>
