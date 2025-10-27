// frontend/src/stores/books.store.ts
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getAllBooks,
  getBookStats,
  insertBook,
  updateBook,
  deleteBook,
} from "../helpers/api";
import { useToastStore } from "./toast.store";

export const useBooksStore = defineStore("books", () => {
  const books = ref<any[]>([]);
  const searchQuery = ref("");
  const debouncedQuery = ref("");
  const loading = ref(false);
  const error = ref<string | null>(null);
  const viewMode = ref<"grid" | "list">("grid");
  const statusFilter = ref<"all" | "available" | "reading" | "lent">("all");
  const sortBy = ref<"title" | "author" | "volume" | "date">("title");
  const currentPage = ref(1);
  const perPage = 30;
  const total = ref(0);
  const bookStats = ref({ total: 0, available: 0, reading: 0, lent: 0 });

  const toastStore = useToastStore();

  let debounceTimer: number | undefined;

  watch(searchQuery, (newVal) => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debouncedQuery.value = newVal;
    }, 100);
  });

  watch([debouncedQuery, statusFilter, sortBy], () => {
    currentPage.value = 1;
    loadBooks();
  });

  const pageCount = computed(() => Math.ceil(total.value / perPage));

  const loadBooks = async () => {
    loading.value = true;
    error.value = null;
    try {
      const params = {
        page: currentPage.value,
        limit: perPage,
        search: debouncedQuery.value || undefined,
        status: statusFilter.value !== "all" ? statusFilter.value : undefined,
        sort: sortBy.value,
      };
      const response = await getAllBooks(params);
      books.value = response.data.data;
      total.value = response.data.total;
    } catch (err: any) {
      books.value = [];
      error.value = err.message || "Errore nel recupero dei libri";
      toastStore.error("Impossibile caricare i libri");
    } finally {
      loading.value = false;
    }
  };

  const loadUnassignedBooks = async () => {
    loading.value = true;
    error.value = null;
    try {
      // Load all books without pagination, then filter for unassigned ones
      const response = await getAllBooks({
        limit: 500, // Load a large number to get all books
        sort: "title",
      });
      books.value = response.data.data.filter(
        (book: any) => !book.libraryId && !book.shelfId
      );
      total.value = books.value.length;
    } catch (err: any) {
      books.value = [];
      error.value =
        err.message || "Errore nel recupero dei libri non assegnati";
      toastStore.error("Impossibile caricare i libri non assegnati");
    } finally {
      loading.value = false;
    }
  };

  const setPage = (page: number) => {
    if (page < 1 || page > pageCount.value) return;
    currentPage.value = page;
    loadBooks();
  };

  const fetchStats = async () => {
    try {
      const response = await getBookStats();
      bookStats.value = response.data.data;
    } catch (err: any) {
      toastStore.error("Impossibile caricare le statistiche");
    }
  };

  // Funzioni CRUD con reload dopo cambiamenti
  const createBook = async (bookData: {
    title: string;
    author: string;
    volume: number;
    status?: "available" | "reading" | "lent";
    coverImage?: string;
    shelfId?: string | null;
    libraryId?: string | null;
  }) => {
    try {
      loading.value = true;
      const response = await insertBook(bookData);
      loadBooks(); // Ricarica pagina corrente
      fetchStats(); // Aggiorna stats
      toastStore.success(`Libro "${bookData.title}" aggiunto con successo`);
      return response.data;
    } catch (err: any) {
      error.value = err.message || "Errore nella creazione del libro";
      toastStore.error(
        err.response?.data?.message || "Errore nella creazione del libro"
      );
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const editBook = async (
    id: string,
    bookData: {
      title?: string;
      author?: string;
      volume?: number;
      status?: "available" | "reading" | "lent";
      coverImage?: string;
      shelfId?: string | null;
      libraryId?: string | null;
    },
    showToast: boolean = true
  ) => {
    try {
      loading.value = true;
      const response = await updateBook(id, bookData);
      loadBooks();
      fetchStats();
      if (showToast) {
        toastStore.success("Libro modificato con successo");
      }
      return response;
    } catch (err: any) {
      error.value = err.message || "Errore nella modifica del libro";
      toastStore.error(
        err.response?.data?.message || "Errore nella modifica del libro"
      );
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeBook = async (id: string, showUndo: boolean = true) => {
    const bookToDelete = books.value.find((b) => b._id === id);
    if (!bookToDelete) return;

    const bookCopy = { ...bookToDelete };

    try {
      loading.value = true;
      await deleteBook(id);
      loadBooks();
      fetchStats();
      if (showUndo) {
        toastStore.success(`Libro "${bookToDelete.title}" eliminato`, {
          label: "Annulla",
          onClick: async () => {
            await restoreBook(bookCopy);
          },
        });
      } else {
        toastStore.success(`Libro "${bookToDelete.title}" eliminato`);
      }
    } catch (err: any) {
      error.value = err.message || "Errore nell'eliminazione del libro";
      toastStore.error(
        err.response?.data?.message || "Errore nell'eliminazione del libro"
      );
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const restoreBook = async (bookData: any) => {
    try {
      const { _id, ...bookWithoutId } = bookData;
      await createBook(bookWithoutId);
      toastStore.success("Libro ripristinato con successo");
    } catch (err) {
      toastStore.error("Errore nel ripristino del libro");
    }
  };

  const getTitleSuggestions = (input: string) => {
    if (!input) return [];
    const uniqueTitles = Array.from(new Set(books.value.map((b) => b.title)));
    return uniqueTitles
      .filter((t) => t.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5);
  };

  const getAuthorSuggestions = (input: string) => {
    if (!input) return [];
    const uniqueAuthors = Array.from(new Set(books.value.map((b) => b.author)));
    return uniqueAuthors
      .filter((a) => a.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5);
  };

  const getAuthorByTitle = (title: string) => {
    const book = books.value.find((b) => b.title === title);
    return book ? book.author : "";
  };

  const getBookCountByAuthor = (author: string) => {
    return books.value.filter((b) => b.author === author).length;
  };

  return {
    books,
    loading,
    error,
    searchQuery,
    viewMode,
    statusFilter,
    sortBy,
    currentPage,
    pageCount,
    total,
    bookStats,
    loadBooks,
    loadUnassignedBooks,
    setPage,
    fetchStats,
    createBook,
    editBook,
    removeBook,
    getTitleSuggestions,
    getAuthorSuggestions,
    getAuthorByTitle,
    getBookCountByAuthor,
  };
});
