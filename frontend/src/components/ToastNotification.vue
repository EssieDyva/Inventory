<script setup lang="ts">
import { useToastStore } from "../stores/toast.store";

const toastStore = useToastStore();

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "✕";
    case "warning":
      return "⚠";
    default:
      return "ℹ";
  }
};
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="['toast', toast.type]"
        @click="toastStore.removeToast(toast.id)"
      >
        <span class="toast-icon">{{ getIcon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button
          v-if="toast.action"
          class="toast-action"
          @click.stop="
            toast.action.onClick();
            toastStore.removeToast(toast.id);
          "
        >
          {{ toast.action.label }}
        </button>
        <button
          class="toast-close"
          @click.stop="toastStore.removeToast(toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 500px;
  pointer-events: auto;
  cursor: pointer;
}

.toast-icon {
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 14px;
}

.toast-action {
  background: transparent;
  border: 2px solid currentColor;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toast-action:hover {
  background: currentColor;
  color: white;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
}

.toast.success {
  border-left: 4px solid #28a745;
}

.toast.success .toast-icon {
  color: #28a745;
}

.toast.success .toast-action {
  color: #28a745;
}

.toast.success .toast-action:hover {
  background: #28a745;
  color: white;
}

.toast.error {
  border-left: 4px solid #dc3545;
}

.toast.error .toast-icon {
  color: #dc3545;
}

.toast.warning {
  border-left: 4px solid #ffc107;
}

.toast.warning .toast-icon {
  color: #ffc107;
}

.toast.info {
  border-left: 4px solid #17a2b8;
}

.toast.info .toast-icon {
  color: #17a2b8;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
