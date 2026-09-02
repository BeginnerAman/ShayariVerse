/* ============================================================
   shayari-loader.js - Shayari Data Engine
   ShayariVerse - "Read, Listen, Feel"

   ES6 Module - loaded via: import { ... } from './shayari-loader.js'

   Responsibilities:
   1. Fetch & cache shayaris.json
   2. Filter by category
   3. Search in both Hindi & Hinglish text
   4. Get featured shayaris
   5. Render shayari cards to a DOM container
   ============================================================ */


/* ---- Private State ---- */
let allShayaris = [];
let isLoaded = false;


/* ============================
   1. DATA LOADING
   ============================ */

/**
 * Fetch shayaris.json and cache in memory.
 * @returns {Promise<Array>} Array of shayari objects
 */
export async function loadShayaris() {
  if (isLoaded) return allShayaris;

  try {
    const response = await fetch('data/shayaris.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allShayaris = data.shayaris || [];
    isLoaded = true;
    return allShayaris;
  } catch (error) {
    console.error('[ShayariLoader] Failed to load shayaris:', error);
    allShayaris = [];
    return allShayaris;
  }
}

/**
 * Get all loaded shayaris.
 * @returns {Array} All shayari objects
 */
export function getAllShayaris() {
  return allShayaris;
}


/* ============================
   2. FILTERING
   ============================ */

/**
 * Filter shayaris by category.
 * @param {string} category - Category slug (e.g., 'love', 'sad'). 'all' returns everything.
 * @returns {Array} Filtered shayari objects
 */
export function filterByCategory(category) {
  if (!category || category === 'all') return allShayaris;
  return allShayaris.filter((s) => s.category === category);
}

/**
 * Get featured shayaris only.
 * @returns {Array} Shayaris marked as featured
 */
export function getFeatured() {
  return allShayaris.filter((s) => s.featured);
}

/**
 * Search shayaris by query text (matches words across Hinglish, Hindi, category, and mood).
 * @param {string} query - Search query string
 * @returns {Array} Matching shayari objects
 */
export function searchShayaris(query) {
  if (!query || !query.trim()) return allShayaris;

  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);

  return allShayaris.filter((s) => {
    const hinglish = (s.textHinglish || '').toLowerCase();
    const hindi = (s.textHindi || '').toLowerCase();
    const category = (s.category || '').toLowerCase();
    const mood = (s.mood || '').toLowerCase();
    const fullText = `${hinglish} ${hindi} ${category} ${mood}`;

    return words.every((word) => fullText.includes(word));
  });
}


/* ============================
   3. CARD RENDERING
   ============================ */

/**
 * Category to badge CSS class mapping.
 */
const BADGE_MAP = {
  love: 'badge--love',
  romantic: 'badge--love',
  sad: 'badge--sad',
  motivational: 'badge--motivational',
  funny: 'badge--funny',
  zindagi: 'badge--zindagi',
  dosti: 'badge--dosti',
};

/**
 * Category display labels.
 */
const CATEGORY_LABELS = {
  love: 'Love',
  romantic: 'Romantic',
  sad: 'Dard',
  motivational: 'Motivational',
  funny: 'Funny',
  zindagi: 'Zindagi',
  dosti: 'Dosti',
};

const CATEGORY_ICONS = {
  love: 'heart',
  romantic: 'flower-2',
  sad: 'heart-crack',
  motivational: 'zap',
  funny: 'smile',
  zindagi: 'compass',
  dosti: 'users',
};

/**
 * Generate HTML for a single shayari card.
 * @param {Object} shayari - Shayari data object
 * @param {number} index - Index for stagger delay
 * @returns {string} HTML string
 */
function createCardHTML(shayari, index) {
  const badgeClass = BADGE_MAP[shayari.category] || 'badge--default';
  const categoryLabel = CATEGORY_LABELS[shayari.category] || shayari.category;
  const iconName = CATEGORY_ICONS[shayari.category] || 'sparkles';
  const staggerClass = index < 12 ? `stagger-${index + 1}` : '';

  return `
    <article class="shayari-card reveal visible ${staggerClass}"
             role="article"
             lang="hi"
             data-id="${shayari.id}"
             data-category="${shayari.category}"
             tabindex="0"
             aria-label="Poetry Card">

      <span class="badge ${badgeClass} shayari-card__category">
        <i data-lucide="${iconName}" style="width:12px; height:12px; vertical-align: middle; margin-right:3px;"></i>
        ${categoryLabel}
      </span>

      <div class="shayari-card__body">
        <p class="shayari-card__text">
          ${shayari.textHinglish}
        </p>
      </div>

      <div class="shayari-card__actions">
        <button class="btn btn--icon action-favorite"
                aria-label="Add to Favorites"
                title="Add to Favorites"
                data-id="${shayari.id}">
          <i data-lucide="heart" class="btn__icon"></i>
        </button>

        <button class="btn btn--icon action-copy"
                aria-label="Copy Shayari"
                title="Copy Shayari"
                data-text="${encodeURIComponent(shayari.textHinglish)}">
          <i data-lucide="copy" class="btn__icon"></i>
        </button>

        <button class="btn btn--icon action-share"
                aria-label="Share Shayari Card"
                title="Share Shayari Card"
                data-id="${shayari.id}"
                data-text="${encodeURIComponent(shayari.textHinglish)}">
          <i data-lucide="share-2" class="btn__icon"></i>
        </button>
      </div>
    </article>
  `;
}

/**
 * Render an array of shayaris into a container element.
 * Uses innerHTML for bulk insertion (per code-standards.md).
 * @param {HTMLElement} container - DOM element to render into
 * @param {Array} shayaris - Array of shayari objects to render
 */
export function renderShayariCards(container, shayaris) {
  if (!container) return;

  if (!shayaris.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">📝</span>
        <h3 class="empty-state__title">Koi shayari nahi mili</h3>
        <p class="empty-state__description">Is category mein abhi koi shayari nahi hai. Doosri category try karo!</p>
      </div>
    `;
    return;
  }

  const html = shayaris.map((s, i) => createCardHTML(s, i)).join('');
  container.innerHTML = html;

  /* Ensure all cards are visible immediately */
  container.querySelectorAll('.reveal').forEach((el) => {
    el.classList.add('visible');
  });

  /* Initialize Lucide Icons for rendered cards */
  if (typeof window !== 'undefined' && window.lucide) {
    window.lucide.createIcons();
  }
}
