/* ============================================================
   theme-manager.js - Dark / Light / Sepia Theme Controller
   ShayariVerse - "Read, Listen, Feel"

   ES6 Module - reusable across all pages.
   Theme is persisted in localStorage and applied on load.
   ============================================================ */

const THEMES = ['dark', 'light', 'sepia'];
const STORAGE_KEY = 'sv-theme';
let currentTheme = 'dark';
let onChangeCallback = null;

/**
 * Initialize theme - restores from localStorage and applies.
 * @param {Function} [onChange] - Callback when theme changes. Receives theme string.
 */
export function init(onChange) {
  onChangeCallback = onChange || null;
  const saved = localStorage.getItem(STORAGE_KEY);
  currentTheme = THEMES.includes(saved) ? saved : 'dark';
  apply(currentTheme);
}

/**
 * Apply a theme to the document.
 * @param {string} theme - 'dark', 'light', or 'sepia'
 */
export function apply(theme) {
  if (!THEMES.includes(theme)) return;
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);

  /* Update meta theme-color for mobile browser chrome */
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = { dark: '#06060a', light: '#faf8f5', sepia: '#f4ecd8' };
    meta.setAttribute('content', colors[theme]);
  }

  if (typeof onChangeCallback === 'function') onChangeCallback(theme);
}

/**
 * Cycle to the next theme: dark → light → sepia → dark.
 * @returns {string} The new active theme
 */
export function cycle() {
  const nextIndex = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
  apply(THEMES[nextIndex]);
  return currentTheme;
}

/**
 * Get the current active theme.
 * @returns {string}
 */
export function get() {
  return currentTheme;
}

/**
 * Get the next theme in the cycle (for UI label).
 * @returns {string}
 */
export function getNext() {
  const nextIndex = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
  return THEMES[nextIndex];
}

/** All available themes */
export const themes = THEMES;
