<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useLibrariesStore, useBooksStore } from "../stores";
import DeleteConfirmModal from "../components/DeleteConfirmModal.vue";

const librariesStore = useLibrariesStore();
const booksStore = useBooksStore();

const deleteModalOpen = ref(false);
const editModalOpen = ref(false);
const selectedLibrary = ref<any>(null);
const editedName = ref("");

const dashboardStats = computed(() => ({
  totalLibraries: librariesStore.libraries.length,
  totalBooks: booksStore.bookStats.total,
  booksReading: booksStore.bookStats.reading,
  booksLent: booksStore.bookStats.lent,
}));

onMounted(() => {
  librariesStore.fetchLibraries();
  booksStore.fetchStats();
});

const openEditModal = (library: any, event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  selectedLibrary.value = library;
  editedName.value = library.name;
  editModalOpen.value = true;
};

const openDeleteModal = (library: any, event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  selectedLibrary.value = library;
  deleteModalOpen.value = true;
};

const handleSaveEdit = async () => {
  if (!editedName.value.trim()) return;

  try {
    await librariesStore.editLibrary(
      selectedLibrary.value._id,
      editedName.value
    );
    editModalOpen.value = false;
    selectedLibrary.value = null;
  } catch (error) {
    console.error("Errore nel salvataggio:", error);
  }
};

const handleConfirmDelete = async () => {
  try {
    await librariesStore.removeLibrary(selectedLibrary.value._id);
    deleteModalOpen.value = false;
    selectedLibrary.value = null;
  } catch (error) {
    console.error("Errore nell'eliminazione:", error);
  }
};

const closeModals = () => {
  editModalOpen.value = false;
  deleteModalOpen.value = false;
  selectedLibrary.value = null;
};
</script>

<template>
  <div class="library-home">
    <div class="library-wrapper">
      <div class="title-bar">
        <h2>Le tue Librerie</h2>
      </div>

      <!-- Dashboard Stats -->
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-number">{{ dashboardStats.totalLibraries }}</div>
          <div class="stat-label">Librerie</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ dashboardStats.totalBooks }}</div>
          <div class="stat-label">Libri totali</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ dashboardStats.booksReading }}</div>
          <div class="stat-label">In lettura</div>
        </div>

        <div class="stat-card">
          <div class="stat-number">{{ dashboardStats.booksLent }}</div>
          <div class="stat-label">Prestati</div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="librariesStore.loading" class="skeleton-container">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>

      <!-- Cards Container -->
      <div v-else class="cards-container">
        <!-- Empty State -->
        <div
          v-if="librariesStore.filteredLibraries.length === 0"
          class="empty-state"
        >
          <div class="empty-icon">📚</div>
          <h3>Nessuna libreria ancora</h3>
          <p>Crea la tua prima libreria per organizzare i tuoi libri</p>
          <button @click="$router.push('/')" class="cta-button">
            + Crea la prima libreria
          </button>
        </div>

        <!-- Libraries with Animation -->
        <TransitionGroup name="list" tag="div" class="libraries-grid">
          <div
            v-for="library in librariesStore.filteredLibraries"
            :key="library._id"
            class="card"
          >
            <RouterLink
              :to="{ name: 'singleLibrary', params: { id: library._id } }"
              class="card-link"
            >
              <div class="card-image">
                <div class="library-icon">📚</div>
                <div class="book-count-badge">
                  {{ library.totalBooks || 0 }} libri
                </div>
              </div>

              <div class="card-content">
                <h3 class="library-name">{{ library.name }}</h3>
              </div>
            </RouterLink>

            <div class="card-actions">
              <button
                class="btn-edit"
                @click="(e) => openEditModal(library, e)"
                title="Modifica"
              >
                ✏️
              </button>
              <button
                class="btn-delete"
                @click="(e) => openDeleteModal(library, e)"
                title="Elimina"
              >
                🗑️
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Modal Modifica Nome -->
    <div v-if="editModalOpen" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <button class="close-btn" @click="closeModals">✕</button>
        <h2 style="color: var(--text); margin: 0 0 20px 0">
          Modifica Libreria
        </h2>
        <div class="form-group">
          <label>Nome Libreria</label>
          <input
            v-model="editedName"
            type="text"
            placeholder="Inserisci nome"
            @keyup.enter="handleSaveEdit"
            autofocus
          />
        </div>
        <div class="actions">
          <button class="primary" @click="handleSaveEdit">Salva</button>
          <button class="secondary" @click="closeModals">Annulla</button>
        </div>
      </div>
    </div>

    <!-- Modal Conferma Eliminazione -->
    <DeleteConfirmModal
      :isOpen="deleteModalOpen"
      title="Elimina Libreria"
      :message="`Sei sicuro di voler eliminare '${selectedLibrary?.name}'? Tutti gli scaffali verranno eliminati e i libri dovranno essere riassegnati!`"
      @confirm="handleConfirmDelete"
      @cancel="closeModals"
    />
  </div>
</template>

<style scoped>
.library-home {
  display: flex;
  flex-direction: column;
  height: 100vh;
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
  z-index: 1;
}

.title-bar h2 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: var(--text);
}

.dashboard-stats {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  background: var(--card-bg);
  border-bottom: 2px solid var(--input-border);
}

.stat-card {
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

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow);
  border-color: var(--primary-color);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 14px;
  color: var(--text);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
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
  padding-bottom: 110px;
}

.libraries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
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

.card {
  background: var(--card-bg);
  border: 2px solid var(--input-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  max-height: 450px;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow);
  border-color: var(--primary-color);
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-image {
  width: 100%;
  height: 280px;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.library-icon {
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  z-index: 1;
  transition: transform 0.3s ease;
}

.card:hover .library-icon {
  transform: scale(1.1) rotate(-5deg);
}

.book-count-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--card-bg);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--badge-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--input-border);
}

.card-content {
  padding: 16px;
  flex: 1;
  background: var(--card-bg);
}

.library-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
}

.library-info {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  opacity: 0.7;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--modal-overlay);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: var(--modal-bg);
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  position: relative;
  color: var(--text);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text);
}

input {
  padding: 8px 12px;
  border-radius: 24px;
  border: 3px solid var(--search-border);
  font-size: 14px;
  outline: none;
  background-color: var(--input-bg);
  box-shadow: var(--search-shadow);
  transition: border-color 0.2s, box-shadow 0.2s;
  color: var(--text);
}

input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.15);
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

button.primary {
  background: var(--button-bg);
  color: var(--button-text);
  border: none;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

button.primary:hover {
  background: var(--primary-dark);
}

button.secondary {
  background: var(--card-bg);
  color: var(--text);
  border: 2px solid var(--primary-color);
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

button.secondary:hover {
  background: var(--input-bg);
}

button.primary,
button.secondary {
  width: 165px;
}
</style>
