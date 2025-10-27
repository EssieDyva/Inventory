import axios, { AxiosHeaders } from "axios";

const baseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      const headers = new AxiosHeaders(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor per gestione errori centralizzata
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Timeout della richiesta");
      error.message = "La richiesta ha impiegato troppo tempo";
    } else if (!error.response) {
      console.error("Errore di rete");
      error.message = "Impossibile connettersi al server";
    } else {
      // Estrai messaggio di errore dal backend se disponibile
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        error.message = backendMessage;
      }
    }
    return Promise.reject(error);
  }
);

// ============= LIBRARIES =============

export const getAllLibraries = () => {
  return api.get("/api/libraries");
};

export const getLibraryById = (id: string) => {
  return api.get(`/api/libraries/${id}`);
};

export const insertLibrary = (libraryData: { name: string }) => {
  return api.post("/api/libraries", libraryData);
};

export const updateLibrary = (id: string, libraryData: { name: string }) => {
  return api.put(`/api/libraries/${id}`, libraryData);
};

export const deleteLibrary = (id: string) => {
  return api.delete(`/api/libraries/${id}`);
};

// ============= BOOKS =============

export const getAllBooks = (params: any = {}) => {
  return api.get("/api/books/", { params });
};

export const getBookStats = () => {
  return api.get("/api/books/stats");
};

export const getBookById = (id: string) => {
  return api.get(`/api/books/${id}`);
};

export const insertBook = (bookData: {
  title: string;
  author: string;
  volume: number;
  status?: string;
  coverImage?: string;
  shelfId?: string | null;
  libraryId?: string | null;
}) => {
  return api.post("/api/books", bookData);
};

export const updateBook = (
  id: string,
  bookData: {
    title?: string;
    author?: string;
    volume?: number;
    status?: string;
    coverImage?: string;
    shelfId?: string | null;
    libraryId?: string | null;
  }
) => {
  return api.put(`/api/books/${id}`, bookData);
};

export const deleteBook = (id: string) => {
  return api.delete(`/api/books/${id}`);
};

// ============= SHELVES =============

export const getShelvesByLibrary = (libraryId: string) => {
  return api.get(`/api/shelves/by-library/${libraryId}`);
};

export const updateShelf = (id: string, shelfData: { name: string }) => {
  return api.put(`/api/shelves/${id}`, shelfData);
};

// ============= USERS =============

export const apiRegister = (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  return api.post("/api/auth/register", userData);
};

export const apiLogin = async (userData: {
  email: string;
  password: string;
}) => {
  const response = await api.post("/api/auth/login", userData);
  if (response.data?.data?.token) {
    localStorage.setItem("token", response.data.data.token);
  }
  return response;
};

export const apiGetMe = () => {
  return api.get("/api/auth/me");
};
