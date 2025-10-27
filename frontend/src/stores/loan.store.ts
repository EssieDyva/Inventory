import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../helpers/api";
import { useToastStore } from "./toast.store";

export interface Loan {
  _id: string;
  bookId: any;
  borrowerName: string;
  borrowerContact?: string;
  borrowerEmail?: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  notes?: string;
  status: "active" | "returned" | "overdue";
  reminderSent: boolean;
}

export const useLoansStore = defineStore("loans", () => {
  const loans = ref<Loan[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const statusFilter = ref<"all" | "active" | "returned" | "overdue">("all");
  const loanStats = ref({
    total: 0,
    active: 0,
    overdue: 0,
    returned: 0,
    dueSoon: 0,
  });
  const createModalOpen = ref(false);

  const toastStore = useToastStore();

  const filteredLoans = computed(() => {
    if (statusFilter.value === "all") return loans.value;
    return loans.value.filter((loan) => loan.status === statusFilter.value);
  });

  const overdueLoans = computed(() =>
    loans.value.filter((loan) => loan.status === "overdue")
  );

  const activeLoans = computed(() =>
    loans.value.filter((loan) => loan.status === "active")
  );

  const fetchLoans = async (status?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const params = status && status !== "all" ? { status } : {};
      const response = await api.get("/api/loans", { params });
      loans.value = response.data.data;
    } catch (err: any) {
      error.value = err.message || "Errore nel recupero dei prestiti";
      toastStore.error("Impossibile caricare i prestiti");
    } finally {
      loading.value = false;
    }
  };

  const fetchLoanStats = async () => {
    try {
      const response = await api.get("/api/loans/stats");
      loanStats.value = response.data.data;
    } catch (err: any) {
      toastStore.error("Impossibile caricare le statistiche prestiti");
    }
  };

  const fetchLoansByBook = async (bookId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/api/loans/book/${bookId}`);
      return response.data.data;
    } catch (err: any) {
      error.value = err.message || "Errore nel recupero dei prestiti del libro";
      toastStore.error("Impossibile caricare i prestiti del libro");
      return [];
    } finally {
      loading.value = false;
    }
  };

  const createLoan = async (loanData: {
    bookId: string;
    borrowerName: string;
    borrowerContact?: string;
    borrowerEmail?: string;
    loanDate?: string;
    dueDate: string;
    notes?: string;
  }) => {
    try {
      loading.value = true;
      const response = await api.post("/api/loans", loanData);
      await Promise.all([fetchLoans(), fetchLoanStats()]);
      toastStore.success(
        `Prestito a ${loanData.borrowerName} creato con successo`
      );
      return response.data;
    } catch (err: any) {
      error.value = err.message || "Errore nella creazione del prestito";
      toastStore.error(
        err.response?.data?.message || "Errore nella creazione del prestito"
      );
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateLoan = async (
    id: string,
    loanData: Partial<{
      borrowerName: string;
      borrowerContact: string;
      borrowerEmail: string;
      dueDate: string;
      returnDate: string;
      notes: string;
    }>
  ) => {
    try {
      loading.value = true;
      const response = await api.put(`/api/loans/${id}`, loanData);
      await Promise.all([fetchLoans(), fetchLoanStats()]);
      toastStore.success("Prestito aggiornato con successo");
      return response.data;
    } catch (err: any) {
      error.value = err.message || "Errore nell'aggiornamento del prestito";
      toastStore.error(
        err.response?.data?.message || "Errore nell'aggiornamento del prestito"
      );
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const returnLoan = async (id: string) => {
    try {
      loading.value = true;
      const response = await api.put(`/api/loans/${id}/return`);
      await Promise.all([fetchLoans(), fetchLoanStats()]);
      toastStore.success("Libro restituito con successo");
      return response.data;
    } catch (err: any) {
      error.value = err.message || "Errore nella restituzione del libro";
      toastStore.error(
        err.response?.data?.message || "Errore nella restituzione del libro"
      );
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteLoan = async (id: string) => {
    try {
      loading.value = true;
      await api.delete(`/api/loans/${id}`);
      await Promise.all([fetchLoans(), fetchLoanStats()]);
      toastStore.success("Prestito eliminato con successo");
    } catch (err: any) {
      error.value = err.message || "Errore nell'eliminazione del prestito";
      toastStore.error(
        err.response?.data?.message || "Errore nell'eliminazione del prestito"
      );
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isDueSoon = (dueDate: string): boolean => {
    const days = getDaysUntilDue(dueDate);
    return days > 0 && days <= 7;
  };

  return {
    loans,
    loading,
    error,
    statusFilter,
    loanStats,
    createModalOpen,
    filteredLoans,
    overdueLoans,
    activeLoans,
    fetchLoans,
    fetchLoanStats,
    fetchLoansByBook,
    createLoan,
    updateLoan,
    returnLoan,
    deleteLoan,
    getDaysUntilDue,
    isDueSoon,
  };
});
