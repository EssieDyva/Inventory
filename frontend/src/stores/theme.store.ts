import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('system')
  const systemPrefersDark = ref(false)

  const detectSystemPreference = () => {
    systemPrefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  detectSystemPreference()

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', detectSystemPreference)
  }

  const currentTheme = computed(() => {
    if (theme.value === 'system') {
      return systemPrefersDark.value ? 'dark' : 'light'
    }
    return theme.value
  })

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)

    if (typeof document !== 'undefined') {
      if (newTheme === 'system') {
        document.documentElement.removeAttribute('data-theme')
      } else {
        document.documentElement.setAttribute('data-theme', newTheme)
      }
    }
  }

  const loadSavedTheme = () => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      setTheme('system')
    }
  }

  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  if (typeof window !== 'undefined') {
    loadSavedTheme()
  }

  return {
    theme,
    currentTheme,
    systemPrefersDark,
    setTheme,
    toggleTheme,
    loadSavedTheme
  }
})