import { createRouter, createWebHistory } from "vue-router";
import { Login } from "../views";
import bookRoutes from "./books.routes";
import librariesRoutes from "./libraries.routes";
import loansRoutes from "./loans.routes";
import { useAuthStore } from "../stores/auth.store";

export const router = createRouter({
  history: createWebHistory(),
  linkActiveClass: "active",
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", name: "login", component: Login, meta: { requiresGuest: true } },
    ...bookRoutes,
    ...librariesRoutes,
    ...loansRoutes,
    { path: "/:pathMatch(.*)*", redirect: "/login" },
  ],
});

// Navigation guard per proteggere le routes
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Se la route richiede l'autenticazione (tutte tranne /login)
  if (to.path !== "/login") {
    // Se non c'è token, redirect al login
    if (!authStore.token) {
      return next("/login");
    }
    
    // Se c'è il token ma non l'utente, verifica il token
    if (!authStore.user) {
      const isValid = await authStore.checkAuth();
      if (!isValid) {
        return next("/login");
      }
    }
  } else {
    // Se si sta cercando di accedere al login ma si è già autenticati
    if (authStore.token) {
      // Verifica che il token sia ancora valido
      const isValid = await authStore.checkAuth();
      if (isValid) {
        return next("/libraries");
      }
    }
  }
  
  next();
});
