<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { useToastStore } from "../stores/toast.store";

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const isLogin = ref(true);
const email = ref("");
const password = ref("");
const username = ref("");
const rememberMe = ref(false);

onMounted(async () => {
  // Se già autenticato, reindirizza alla home
  if (authStore.isAuthenticated) {
    const isValid = await authStore.checkAuth();
    if (isValid) {
      router.push("/");
    }
  }
});

const handleSubmit = async () => {
  try {
    await authStore.login(email.value, password.value);
    toastStore.success(`Benvenuto ${authStore.user.username}!`);
    router.push("/libraries");
  } catch (err: any) {
    toastStore.error(authStore.error || "Errore durante l'autenticazione");
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="logo">Invento.ry</h1>
        <p class="subtitle">
          {{ isLogin ? "Accedi al tuo account" : "Crea un nuovo account" }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Inserisci username"
            required
            :disabled="authStore.loading"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Inserisci email"
            required
            :disabled="authStore.loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Inserisci password"
            required
            :disabled="authStore.loading"
          />
        </div>

        <div v-if="isLogin" class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="rememberMe" />
            <span>Ricordami</span>
          </label>
        </div>

        <button type="submit" class="submit-btn" :disabled="authStore.loading">
          <span v-if="!authStore.loading">
            {{ isLogin ? "Accedi" : "Registrati" }}
          </span>
          <span v-else class="loading-spinner">⏳</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #667eea;
  padding: 24px;
}

.auth-card {
  padding: clamp(24px, 4vw, 48px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: clamp(320px, 40vw, 720px);
  max-width: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92),
    rgba(250, 250, 255, 0.96)
  );
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(14, 14, 44, 0.16),
    0 6px 18px rgba(90, 82, 242, 0.08);
  border: 1px solid rgba(90, 82, 242, 0.06);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  margin: 0 16px;
}

@media (max-width: 800px) {
  .auth-card {
    width: 100%;
    max-width: 520px;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 12px 36px rgba(14, 14, 44, 0.12);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-card,
  .auth-card:hover {
    transition: none;
    transform: none;
  }
}

.auth-header {
  margin-bottom: 32px;
  text-align: center;
}

.logo {
  font-family: "Kdam Thmor Pro", sans-serif;
  font-size: 42px;
  color: var(--primary-color);
  margin: 0 0 8px 0;
}

.subtitle {
  color: var(--text);
  font-size: 16px;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #fcc;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}

.form-group input {
  padding: 14px 16px;
  border: 2px solid var(--input-border);
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.2s;
  outline: none;
  background: var(--input-bg);
  color: var(--text);
}

.form-group input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(90, 82, 242, 0.1);
}

.form-group input:disabled {
  background: var(--input-bg);
  cursor: not-allowed;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.submit-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(90, 82, 242, 0.3);
}

.submit-btn:disabled {
  background: var(--input-border);
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.auth-footer {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--input-border);
}

.auth-footer p {
  margin: 0;
  color: var(--text);
  font-size: 14px;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;
  margin-left: 4px;
}

.toggle-btn:hover:not(:disabled) {
  color: var(--primary-dark);
}

.toggle-btn:disabled {
  color: var(--input-border);
  cursor: not-allowed;
}
</style>
