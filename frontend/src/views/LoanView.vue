<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useLoansStore, useBooksStore } from "../stores";
import { CreateLoanModal, EditLoanModal } from "../components";
import DeleteConfirmModal from "../components/DeleteConfirmModal.vue";

const loansStore = useLoansStore();
const booksStore = useBooksStore();

const createModalOpen = computed({
  get: () => loansStore.createModalOpen,
  set: (value) => loansStore.createModalOpen = value
});
const editModalOpen = ref(false);
const deleteModalOpen = ref(false);
const selectedLoan = ref<any>(null);

onMounted(async () => {
  await Promise.all([
    loansStore.fetchLoans(),
    loansStore.fetchLoanStats(),
    booksStore.loadBooks()
  ]);
});

const openCreateModal = () => {
  createModalOpen.value = true;
};

const openEditModal = (loan: any) => {
  selectedLoan.value = loan;
  editModalOpen.value = true;
};

const openDeleteModal = (loan: any) => {
  selectedLoan.value = loan;
  deleteModalOpen.value = true;
};

const handleReturn = async (loanId: string) => {
  try {
    await loansStore.returnLoan(loanId);
    await booksStore.loadBooks();
  } catch (error) {
    console.error(error);
  }
};

const handleDelete = async () => {
  try {
    await loansStore.deleteLoan(selectedLoan.value._id);
    await booksStore.loadBooks();
    deleteModalOpen.value = false;
    selectedLoan.value = null;
  } catch (error) {
    console.error(error);
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("it-IT");
};

const getDueDateClass = (loan: any) => {
  if (loan.status === "overdue") return "overdue";
  if (loan.status === "returned") return "returned";
  if (loansStore.isDueSoon(loan.dueDate)) return "due-soon";
  return "";
};

const getDaysInfo = (loan: any) => {
  if (loan.status === "returned") return "Restituito";
  if (loan.status === "overdue") {
    const days = Math.abs(loansStore.getDaysUntilDue(loan.dueDate));
    return `In ritardo di ${days} ${days === 1 ? "giorno" : "giorni"}`;
  }
  const days = loansStore.getDaysUntilDue(loan.dueDate);
  if (days === 0) return "Scade oggi!";
  if (days === 1) return "Scade domani";
  return `${days} giorni rimanenti`;
};
</script>

<template>
  <div class="loans-view">
    <div class="title-bar">
      <h2>Gestione Prestiti</h2>
    </div>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-number">{{ loansStore.loanStats.total }}</span>
        <span class="stat-label">Totali</span>
      </div>
      <div class="stat active">
        <span class="stat-number">{{ loansStore.loanStats.active }}</span>
        <span class="stat-label">Attivi</span>
      </div>
      <div class="stat overdue">
        <span class="stat-number">{{ loansStore.loanStats.overdue }}</span>
        <span class="stat-label">In ritardo</span>
      </div>
      <div class="stat due-soon">
        <span class="stat-number">{{ loansStore.loanStats.dueSoon }}</span>
        <span class="stat-label">In scadenza</span>
      </div>
      <div class="stat returned">
        <span class="stat-number">{{ loansStore.loanStats.returned }}</span>
        <span class="stat-label">Restituiti</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <button
        @click="loansStore.statusFilter = 'all'; loansStore.fetchLoans()"
        :class="{ active: loansStore.statusFilter === 'all' }"
        class="filter-btn"
      >
        Tutti
      </button>
      <button
        @click="loansStore.statusFilter = 'active'; loansStore.fetchLoans('active')"
        :class="{ active: loansStore.statusFilter === 'active' }"
        class="filter-btn"
      >
        Attivi
      </button>
      <button
        @click="loansStore.statusFilter = 'overdue'; loansStore.fetchLoans('overdue')"
        :class="{ active: loansStore.statusFilter === 'overdue' }"
        class="filter-btn"
      >
        In ritardo
      </button>
      <button
        @click="loansStore.statusFilter = 'returned'; loansStore.fetchLoans('returned')"
        :class="{ active: loansStore.statusFilter === 'returned' }"
        class="filter-btn"
      >
        Restituiti
      </button>
    </div>

    <!-- Loans List -->
    <div class="loans-container">
      <div v-if="loansStore.loading" class="loading">
        <div class="spinner"></div>
        <p>Caricamento...</p>
      </div>

      <div v-else-if="loansStore.filteredLoans.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Nessun prestito trovato</h3>
        <p>Inizia a registrare i prestiti dei tuoi libri</p>
        <button @click="openCreateModal" class="cta-button">
          + Crea il primo prestito
        </button>
      </div>

      <div v-else class="loans-list">
        <div
          v-for="loan in loansStore.filteredLoans"
          :key="loan._id"
          class="loan-card"
          :class="getDueDateClass(loan)"
        >
          <div class="loan-book">
            <img
              v-if="loan.bookId?.coverImage"
              :src="loan.bookId.coverImage"
              :alt="loan.bookId.title"
              class="book-cover"
              @error="(e: any) => e.target.src = 'https://img.freepik.com/free-vector/red-text-book-closed-icon_18591-82397.jpg'"
            />
            <div v-else class="book-cover placeholder">📚</div>
            <div class="book-info">
              <h3>{{ loan.bookId?.title }}</h3>
              <p>{{ loan.bookId?.author }} - Vol. {{ loan.bookId?.volume }}</p>
            </div>
          </div>

          <div class="loan-info">
            <div class="borrower">
              <strong>👤 {{ loan.borrowerName }}</strong>
              <span v-if="loan.borrowerContact">📞 {{ loan.borrowerContact }}</span>
              <span v-if="loan.borrowerEmail">✉️ {{ loan.borrowerEmail }}</span>
            </div>

            <div class="dates">
              <div class="date-item">
                <span class="label">Prestato il:</span>
                <span class="value">{{ formatDate(loan.loanDate) }}</span>
              </div>
              <div class="date-item" :class="getDueDateClass(loan)">
                <span class="label">Scadenza:</span>
                <span class="value">{{ formatDate(loan.dueDate) }}</span>
                <span class="badge">{{ getDaysInfo(loan) }}</span>
              </div>
              <div v-if="loan.returnDate" class="date-item returned">
                <span class="label">Restituito il:</span>
                <span class="value">{{ formatDate(loan.returnDate) }}</span>
              </div>
            </div>

            <p v-if="loan.notes" class="notes">
              <strong>Note:</strong> {{ loan.notes }}
            </p>
          </div>

          <div class="loan-actions">
            <button
              v-if="loan.status !== 'returned'"
              class="btn-return"
              @click="handleReturn(loan._id)"
              title="Segna come restituito"
            >
              ✓ Restituisci
            </button>
            <button
              class="btn-edit"
              @click="openEditModal(loan)"
              title="Modifica"
            >
              ✏️
            </button>
            <button
              class="btn-delete"
              @click="openDeleteModal(loan)"
              title="Elimina"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateLoanModal
      :isOpen="createModalOpen"
      @close="loansStore.createModalOpen = false"
      @created="loansStore.fetchLoans(); booksStore.loadBooks()"
    />

    <EditLoanModal
      v-if="selectedLoan"
      :isOpen="editModalOpen"
      :loan="selectedLoan"
      @close="editModalOpen = false; selectedLoan = null"
      @updated="loansStore.fetchLoans()"
    />

    <DeleteConfirmModal
      :isOpen="deleteModalOpen"
      title="Elimina Prestito"
      :message="`Sei sicuro di voler eliminare questo prestito? Il libro tornerà disponibile.`"
      @confirm="handleDelete"
      @cancel="deleteModalOpen = false; selectedLoan = null"
    />
  </div>
</template>

<style scoped>
.loans-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--header-bg);
}

.title-bar h2 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.btn-add {
  background: #5a52f2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #4a42e2;
  transform: translateY(-2px);
}

.stats-bar {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  background: var(--bg);
  border-bottom: 1px solid var(--input-border);
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

.stat:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow);
  border-color: var(--primary-color);
}

.stat.active {
  border-color: #28a745;
}

.stat.overdue {
  border-color: #dc3545;
}

.stat.due-soon {
  border-color: #ffc107;
}

.stat.returned {
  border-color: #6c757d;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #5a52f2;
}

.stat.active .stat-number {
  color: #28a745;
}

.stat.overdue .stat-number {
  color: #dc3545;
}

.stat.due-soon .stat-number {
  color: #ffc107;
}

.stat.returned .stat-number {
  color: #6c757d;
}

.stat-label {
  font-size: 12px;
  color: var(--text);
  text-transform: uppercase;
  margin-top: 4px;
  opacity: 0.7;
}

.filters-bar {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: var(--bg);
  border-bottom: 1px solid var(--input-border);
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

.loans-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #5a52f2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
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
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #666;
}

.cta-button {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cta-button:hover {
  background: #4a42e2;
  transform: translateY(-2px);
}

.loans-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loan-card {
  background: var(--card-bg);
  border: 3px solid var(--input-border);
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: 300px 1fr auto;
  gap: 24px;
  align-items: start;
  transition: all 0.3s;
}

.loan-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.loan-card.overdue {
  border-color: #dc3545;
  background: #fff5f5;
}

.loan-card.due-soon {
  border-color: #ffc107;
  background: #fff9e6;
}

.loan-card.returned {
  opacity: 0.7;
  border-color: #6c757d;
}

.loan-book {
  display: flex;
  gap: 16px;
  align-items: center;
}

.book-cover {
  width: 80px;
  height: 110px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.book-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--input-bg);
  border: 2px solid var(--input-border);
  font-size: 32px;
}

.book-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: var(--text);
}

.book-info p {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  opacity: 0.7;
}

.loan-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.borrower {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
}

.borrower strong {
  font-size: 16px;
  color: var(--text);
}

.borrower span {
  font-size: 13px;
  color: var(--text);
  opacity: 0.7;
}

.dates {
  display: flex;
  gap: 24px;
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-item .label {
  font-size: 12px;
  color: var(--text);
  text-transform: uppercase;
  opacity: 0.7;
}

.date-item .value {
  font-weight: 600;
  font-size: 14px;
}

.date-item .badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 4px;
  background: #e9ecef;
  color: #495057;
}

.date-item.overdue .badge {
  background: #dc3545;
  color: white;
}

.date-item.due-soon .badge {
  background: #ffc107;
  color: #000;
}

.date-item.returned .badge {
  background: #28a745;
  color: white;
}

.notes {
  margin: 0;
  padding: 12px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text);
  opacity: 0.8;
}

.notes strong {
  color: var(--text);
}

.loan-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-return,
.btn-edit,
.btn-delete {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-return {
  background: #28a745;
  color: white;
}

.btn-return:hover {
  background: #218838;
}

.btn-edit {
  background: var(--primary-color);
  color: #000;
  opacity: 0.8;
}

.btn-edit:hover {
  background: var(--primary-dark)
}

.btn-delete {
  background: #dc2626;
  color: #000;
  opacity: 0.8;
}

.btn-delete:hover {
  background: #b91c1c;
}
</style>