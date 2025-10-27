<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="icon-warning">⚠️</div>

      <h2>{{ title }}</h2>
      <p>{{ message }}</p>

      <div class="actions">
        <button class="danger" @click="$emit('confirm')">Elimina</button>
        <button class="secondary" @click="$emit('cancel')">Annulla</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 32px 24px;
  width: 400px;
  max-width: 90%;
  text-align: center;
}

.icon-warning {
  font-size: 48px;
  margin-bottom: 16px;
}

h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
}

p {
  margin: 0 0 24px 0;
  color: var(--text);
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

button.danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
}

button.danger:hover {
  background: #c82333;
}

button.secondary {
  background: var(--card-bg);
  color: var(--text);
  border: 2px solid var(--primary-color);
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
}
</style>
