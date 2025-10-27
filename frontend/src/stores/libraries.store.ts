import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  getAllLibraries,
  getLibraryById,
  insertLibrary,
  updateLibrary,
  deleteLibrary,
} from "../helpers/api";

export const useLibrariesStore = defineStore("libraries", () => {
  const libraries = ref<any[]>([]);
  const currentLibrary = ref<any | null>(null);
  const searchQuery = ref("");
  const debouncedQuery = ref("");
  const loading = ref(false);
  const error = ref<string | null>(null);

  let debounceTimer: number | undefined;

  watch(searchQuery, (newVal) => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debouncedQuery.value = newVal;
    }, 100);
  });

  const filteredLibraries = computed(() => {
    if (!debouncedQuery.value) return libraries.value;
    return libraries.value.filter((lib) =>
      lib.name.toLowerCase().includes(debouncedQuery.value.toLowerCase())
    );
  });

  const fetchLibraries = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getAllLibraries();
      libraries.value = response.data.data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err: any) {
      libraries.value = [];
      error.value = err.message || "Errore nel recupero delle librerie";
    } finally {
      loading.value = false;
    }
  };

  const fetchLibraryById = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getLibraryById(id);
      currentLibrary.value = response.data.data;
    } catch (err: any) {
      error.value = err.message || "Errore nel recupero della libreria";
      currentLibrary.value = null;
    } finally {
      loading.value = false;
    }
  };

  const createLibrary = async (name: string) => {
    try {
      const response = await insertLibrary({ name });
      libraries.value.unshift(response.data.data.library);
      return response.data;
    } catch (err: any) {
      console.error("Errore creazione libreria:", err);
      error.value = err.message || "Errore nella creazione della libreria";
      throw err;
    }
  };

  const editLibrary = async (id: string, name: string) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await updateLibrary(id, { name });

      // Aggiorna la libreria nella lista locale
      const index = libraries.value.findIndex((l) => l._id === id);
      if (index !== -1) {
        libraries.value[index] = response.data.data;
      }

      // Aggiorna anche currentLibrary se è quella modificata
      if (currentLibrary.value?._id === id) {
        currentLibrary.value.name = name;
      }

      return response.data;
    } catch (err: any) {
      console.error("Errore modifica libreria:", err);
      error.value = err.message || "Errore nella modifica della libreria";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeLibrary = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      await deleteLibrary(id);

      // Rimuovi la libreria dalla lista locale
      libraries.value = libraries.value.filter((l) => l._id !== id);

      // Resetta currentLibrary se è quella eliminata
      if (currentLibrary.value?._id === id) {
        currentLibrary.value = null;
      }
    } catch (err: any) {
      console.error("Errore eliminazione libreria:", err);
      error.value = err.message || "Errore nell'eliminazione della libreria";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    libraries,
    currentLibrary,
    loading,
    error,
    searchQuery,
    filteredLibraries,
    fetchLibraries,
    fetchLibraryById,
    createLibrary,
    editLibrary,
    removeLibrary,
  };
});
