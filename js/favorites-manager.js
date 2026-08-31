/* ============================================================
   favorites-manager.js - Favorites System (localStorage)
   ShayariVerse - "Read, Listen, Feel"

   ES6 Module - manages favorite shayaris in localStorage.
   ============================================================ */

const STORAGE_KEY = 'sv-favorites';

/**
 * Get all favorite shayari IDs.
 * @returns {string[]} Array of shayari IDs
 */
export function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Check if a shayari is favorited.
 * @param {string} id - Shayari ID
 * @returns {boolean}
 */
export function isFavorited(id) {
  return getAll().includes(id);
}

/**
 * Add a shayari to favorites.
 * @param {string} id - Shayari ID
 * @returns {boolean} true if added (wasn't already there)
 */
export function add(id) {
  const favs = getAll();
  if (favs.includes(id)) return false;
  favs.push(id);
  save(favs);
  return true;
}

/**
 * Remove a shayari from favorites.
 * @param {string} id - Shayari ID
 * @returns {boolean} true if removed
 */
export function remove(id) {
  const favs = getAll();
  const index = favs.indexOf(id);
  if (index === -1) return false;
  favs.splice(index, 1);
  save(favs);
  return true;
}

/**
 * Toggle a shayari's favorite state.
 * @param {string} id - Shayari ID
 * @returns {boolean} true if now favorited, false if removed
 */
export function toggle(id) {
  if (isFavorited(id)) {
    remove(id);
    return false;
  } else {
    add(id);
    return true;
  }
}

/**
 * Get the count of favorites.
 * @returns {number}
 */
export function count() {
  return getAll().length;
}

/**
 * Clear all favorites.
 */
export function clearAll() {
  save([]);
}

/**
 * Apply favorite state to all .action-favorite buttons on the page.
 * Adds .active class and fills SVG for favorited items.
 */
export function restoreUI() {
  const favs = getAll();
  document.querySelectorAll('.action-favorite').forEach((btn) => {
    const id = btn.dataset.id;
    const isActive = favs.includes(id);
    btn.classList.toggle('active', isActive);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isActive ? 'currentColor' : 'none');
  });
}

/** @private Save favorites array to localStorage */
function save(favs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  } catch (e) {
    console.warn('[FavoritesManager] localStorage save failed:', e);
  }
}
