import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { router } from "../router";
import { apiLogin, apiGetMe } from "../helpers/api";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("token"));
  const user = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiLogin({ email, password });
      token.value = response.data.data.token;
      user.value = response.data.data.user;
      localStorage.setItem("token", response.data.data.token);
      router.push("/libraries");
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Errore durante il login";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    router.push("/login");
  };

  const checkAuth = async () => {
    if (!token.value) return false;

    try {
      const response = await apiGetMe();
      user.value = response.data.data;
      return true;
    } catch (err) {
      logout();
      return false;
    }
  };

  const fetchUser = async () => {
    if (!token.value)
      return;

    loading.value = true;
    error.value = null;
    try {
      const response = await apiGetMe();
      user.value = response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Errore durante il recupero dell'utente";
      logout();
    } finally {
      loading.value = false;
    }
  };

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    fetchUser,
  };
});