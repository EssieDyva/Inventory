<script setup lang="ts">
import { ref, computed } from "vue";
import { useBooksStore, useLoansStore } from "../stores";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  created: [];
}>();

const booksStore = useBooksStore();
const loansStore = useLoansStore();

const form = ref({
  bookId: "",
  borrowerName: "",
  borrowerContact: "",
  borrowerEmail: "",
  dueDate: "",
  notes: "",
});

const errors = ref<string[]>([]);

// Libri disponibili (non in prestito)
const availableBooks = computed(() => {
  return booksStore.books.filter((book) => book.status !== "lent");
});

// Imposta data predefinita tra 30 giorni
const getDefaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
};

// Inizializza la data di scadenza
if (!form.value.dueDate) {
  form.value.dueDate = getDefaultDueDate();
}

const validate = () => {
  errors.value = [];

  if (!form.value.bookId) {
    errors.value.push("Seleziona un libro");
  }
  if (!form.value.borrowerName.trim()) {
    errors.value.push("Il nome del prestatore è obbligatorio");
  }
  if (!form.value.dueDate) {
    errors.value.push("La data di scadenza è obbligatoria");
  }
  if (form.value.borrowerEmail && !isValidEmail(form.value.borrowerEmail)) {
    errors.value.push("Email non valida");
  }

  return errors.value.length === 0;
};

const isValidEmail = (email: string) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

const handleSubmit = async () => {
  if (!validate()) return;

  try {
    await loansStore.createLoan({
      bookId: form.value.bookId,
      borrowerName: form.value.borrowerName,
      borrowerContact: form.value.borrowerContact || undefined,
      borrowerEmail: form.value.borrowerEmail || undefined,
      dueDate: form.value.dueDate,
      notes: form.value.notes || undefined,
    });

    // Reset form
    form.value = {
      bookId: "",
      borrowerName: "",
      borrowerContact: "",
      borrowerEmail: "",
      dueDate: getDefaultDueDate(),
      notes: "",
    };
    errors.value = [];

    emit("created");
    emit("close");
  } catch (error) {
    console.error(error);
  }
};

const handleClose = () => {
  form.value = {
    bookId: "",
    borrowerName: "",
    borrowerContact: "",
    borrowerEmail: "",
    dueDate: getDefaultDueDate(),
    notes: "",
  };
  errors.value = [];
  emit("close");
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
    <div class="modal">
      <button class="close-btn" @click="handleClose">✕</button>

      <h2>Nuovo Prestito</h2>

      <div v-if="errors.length > 0" class="errors">
        <p v-for="(error, i) in errors" :key="i">{{ error }}</p>
      </div>

      <div class="form-group">
        <label>Libro *</label>
        <select v-model="form.bookId" required>
          <option value="">Seleziona un libro</option>
          <option v-for="book in availableBooks" :key="book._id" :value="book._id">
            {{ book.title }} - {{ book.author }} (Vol. {{ book.volume }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Nome Prestatore *</label>
        <input
          v-model="form.borrowerName"
          type="text"
          placeholder="Mario Rossi"
          required
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Telefono</label>
          <input
            v-model="form.borrowerContact"
            type="tel"
            placeholder="+39 123 456 7890"
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input
            v-model="form.borrowerEmail"
            type="email"
            placeholder="mario@example.com"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Data Scadenza *</label>
        <input v-model="form.dueDate" type="date" required />
        <small>Predefinito: 30 giorni da oggi</small>
      </div>

      <div class="form-group">
        <label>Note</label>
        <textarea
          v-model="form.notes"
          placeholder="Note aggiuntive sul prestito..."
          rows="3"
        ></textarea>
      </div>

      <div class="actions">
        <button class="primary" @click="handleSubmit">Crea Prestito</button>
        <button class="secondary" @click="handleClose">Annulla</button>
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
  background: var(--modal-overlay);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: var(--modal-bg);
  border-radius: 12px;
  padding: 24px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid var(--input-border);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: bold;
  padding-right: 30px;
}

.errors {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid #dc3545;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.errors p {
  margin: 4px 0;
  color: #dc3545;
  font-size: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text);
}

input,
select,
textarea {
  padding: 10px 12px;
  border: 2px solid var(--input-border);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  background: var(--input-bg);
  color: var(--text);
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--primary-color);
}

select {
  cursor: pointer;
}

small {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text);
  opacity: 0.7;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

button.primary {
  flex: 1;
  background: var(--primary-color);
  color: var(--button-text);
  border: none;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}

button.primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

button.secondary {
  flex: 1;
  background: var(--card-bg);
  color: var(--text);
  border: 2px solid var(--input-border);
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
}

button.secondary:hover {
  background: var(--input-bg);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}
</style>
