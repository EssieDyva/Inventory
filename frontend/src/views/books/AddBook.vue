<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { useBooksStore } from "../../stores";

const booksStore = useBooksStore();
const router = useRouter();

const title = ref("");
const titleInput = ref<HTMLInputElement | null>(null);
const author = ref("");
const volume = ref("");
const status = ref<"available" | "reading" | "lent">("available");
const coverImage = ref("");
const titleSuggestions = computed(() =>
  booksStore.getTitleSuggestions(title.value)
);
const authorSuggestions = computed(() =>
  booksStore.getAuthorSuggestions(author.value)
);
const showTitleSuggestions = ref(false);
const showAuthorSuggestions = ref(false);

const selectTitle = (val: string) => {
  title.value = val;
  showTitleSuggestions.value = false;

  const associatedAuthor = booksStore.getAuthorByTitle(val);
  if (associatedAuthor) {
    author.value = associatedAuthor;
    showAuthorSuggestions.value = false;
  }
};

const selectAuthor = (val: string) => {
  author.value = val;
  showAuthorSuggestions.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const isTitleInput =
    target.closest(".form-group")?.querySelector("input") === titleInput.value;
  if (!isTitleInput) showTitleSuggestions.value = false;
  if (!target.closest(".form-group")?.querySelector("input")) {
    showAuthorSuggestions.value = false;
  }
};

const errors = ref<string[]>([]);

const handleSubmit = async () => {
  errors.value = [];

  if (!title.value.trim()) errors.value.push("Il titolo è obbligatorio");
  if (!author.value.trim()) errors.value.push("L'autore è obbligatorio");
  if (!volume.value) errors.value.push("Il volume è obbligatorio");

  if (errors.value.length > 0) return;

  await booksStore.createBook({
    title: title.value,
    author: author.value,
    volume: Number(volume.value),
    status: status.value,
    coverImage: coverImage.value || undefined,
  });

  // Reset campi temporaneo finchè non aggiungo tutti i manga
  // title.value = "";
  // author.value = "";
  volume.value = "";
  status.value = "available";
  coverImage.value = "";

  // router.push("/books");
};

onMounted(() => {
  titleInput.value?.focus();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="book-form">
    <div class="title-bar">
      <h2>Aggiungi Libro</h2>
    </div>

    <div class="form-container">
      <div class="form-layout">
        <div class="image-input">
          <label>Incolla URL immagine</label>
          <input v-model="coverImage" type="text" placeholder="http://..." />
        </div>

        <div class="fields">
          <div class="form-group" style="position: relative">
            <label>Titolo *</label>
            <input
              v-model="title"
              type="text"
              placeholder="Inserisci titolo"
              @focus="showTitleSuggestions = true"
              @input="showTitleSuggestions = true"
            />

            <ul
              v-if="title && titleSuggestions.length && showTitleSuggestions"
              class="suggestions"
            >
              <li
                v-for="(s, i) in titleSuggestions"
                :key="i"
                @click="selectTitle(s)"
              >
                {{ s }}
              </li>
            </ul>
          </div>

          <div class="form-group" style="position: relative">
            <label>Autore *</label>
            <input
              v-model="author"
              type="text"
              placeholder="Inserisci autore"
              @focus="showAuthorSuggestions = true"
              @input="showAuthorSuggestions = true"
            />

            <ul
              v-if="author && authorSuggestions.length && showAuthorSuggestions"
              class="suggestions"
            >
              <li
                v-for="(s, i) in authorSuggestions"
                :key="i"
                @click="selectAuthor(s)"
              >
                {{ s }}
              </li>
            </ul>
          </div>

          <div class="form-row">
            <div class="form-group small">
              <label>Volume *</label>
              <input v-model="volume" type="number" placeholder="1" />
            </div>

            <div class="form-group small">
              <label>Stato</label>
              <select v-model="status">
                <option value="available">Disponibile</option>
                <option value="reading">In lettura</option>
                <option value="lent">Prestato</option>
              </select>
            </div>
          </div>
          <div class="actions">
            <button class="primary" @click="handleSubmit">Aggiungi</button>
            <button class="secondary" @click="router.back">Indietro</button>
          </div>
        </div>
      </div>
      <ul v-if="errors.length" class="errors">
        <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.book-form {
  background: var(--card-bg);
  border-radius: 8px;
  width: 100%;
}

.form-container {
  padding: 24px;
}

.form-layout {
  display: flex;
  gap: 24px;
}

.title-bar {
  flex-shrink: 0;
  padding: 16px 24px;
  background: var(--header-bg);
  z-index: 1;
}

.title-bar h2 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.image-input {
  background: var(--input-border);
  border-radius: 8px;
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 400px;
  max-width: 300px;
}

.fields {
  flex: 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.small {
  flex: 1;
  max-width: 465px;
}

input,
select {
  padding: 10px;
  border-radius: 24px;
  border: 3px solid var(--primary-color);
  font-size: 18px;
  margin-top: 6px;
  background: var(--input-bg);
  color: var(--text);
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 20;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  margin-top: 4px;
  padding: 0;
  border-radius: 12px;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--input-border);
  transition: all 0.2s ease-in-out;
}

.suggestions li {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 16px;
  color: var(--text);
  transition: background-color 0.15s, color 0.15s;
}

.suggestions li:hover {
  background-color: var(--primary-color);
  color: white;
}

.suggestions li:active {
  background-color: var(--primary-dark);
}

.suggestions::-webkit-scrollbar {
  width: 8px;
}

.suggestions::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.suggestions::-webkit-scrollbar-track {
  background: transparent;
}

.errors {
  color: red;
  margin: 12px 0;
}

.actions {
  display: flex;
  gap: 16px;
  margin-top: 30px;
  justify-content: start;
}

button.primary {
  background: var(--primary-dark);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
}

button.secondary {
  background: var(--card-bg);
  color: var(--text);
  border: 3px solid var(--primary-color);
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;
}

button.primary,
button.secondary {
  width: 250px;
  font-size: 24px;
}
</style>
