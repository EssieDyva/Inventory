import { defineStore } from "pinia";
import { ref } from "vue";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  action?: ToastAction;
}

export const useToastStore = defineStore("toast", () => {
  const toasts = ref<Toast[]>([]);

  const addToast = (
    message: string,
    type: Toast["type"] = "info",
    duration = 3000,
    action?: ToastAction
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration, action };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const success = (message: string, action?: ToastAction) => 
    addToast(message, "success", 3000, action);
  const error = (message: string) => addToast(message, "error", 5000);
  const warning = (message: string) => addToast(message, "warning");
  const info = (message: string) => addToast(message, "info");

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
});