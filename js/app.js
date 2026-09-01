/* ============================================================
   app.js - Main Application Entry Point
   ShayariVerse - "Read, Listen, Feel"

   ES6 Module - loaded via: <script type="module" src="js/app.js">

   Responsibilities:
   1. Initialize all modules on DOMContentLoaded
   2. Theme toggle (Dark → Light → Sepia cycle)
   3. Font size controls (A- / A+)
   4. Category filter click handling
   5. Scroll reveal via IntersectionObserver
   6. Floating particle generation
   7. Header auto-hide on scroll
   8. Search toggle & filtering
   9. Card action buttons (copy, favorite, share)
   10. Toast notification system
   ============================================================ */

import {
  loadShayaris,
  filterByCategory,
  searchShayaris,
  getFeatured,
  renderShayariCards,
} from './shayari-loader.js';

import * as AudioController from './audio-controller.js';


/* ============================
   UTILITIES
   ============================ */

/**
 * Debounce - delays function execution until after wait ms of inactivity.
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Throttle - limits function to execute at most once per limit ms.
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Milliseconds between executions
 * @returns {Function} Throttled function
 */
function throttle(fn, limit = 16) {
  let lastCall = 0;
  let rafId = null;
  return (...args) => {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    } else {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        lastCall = performance.now();
        fn(...args);
      });
    }
  };
}


/* ============================
   THEME MANAGEMENT
   ============================ */

const THEMES = ['dark', 'light', 'sepia'];
const THEME_ICONS = {
  dark: 'icon-moon',
  light: 'icon-sun',
  sepia: 'icon-book',
};

/**
 * Initialize theme from localStorage and set up toggle button.
 */
function initTheme() {
  const saved = localStorage.getItem('sv-theme');
  const theme = THEMES.includes(saved) ? saved : 'dark';
  applyTheme(theme);

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextIndex = (THEMES.indexOf(current) + 1) % THEMES.length;
      applyTheme(THEMES[nextIndex]);
    });
  }
}

/**
 * Apply a theme to the document and persist choice.
 * @param {string} theme - 'dark', 'light', or 'sepia'
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sv-theme', theme);

  /* Update toggle button icon visibility */
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.querySelectorAll('.theme-icon').forEach((icon) => {
      icon.style.display = 'none';
    });
    const activeIcon = toggleBtn.querySelector(`[data-theme-icon="${theme}"]`);
    if (activeIcon) {
      activeIcon.style.display = 'block';
      activeIcon.classList.add('theme-morph');
      /* Remove animation class after it completes so it can re-trigger */
      activeIcon.addEventListener('animationend', () => {
        activeIcon.classList.remove('theme-morph');
      }, { once: true });
    }

    /* Update aria-label */
    const nextTheme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    toggleBtn.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
  }
}


/* ============================
   FONT SIZE CONTROLS
   ============================ */

const FONT_SIZES = ['small', 'normal', 'large'];
let currentFontIndex = 1; /* default: normal */

/**
 * Initialize font size from localStorage and set up A-/A+ buttons.
 */
function initFontSize() {
  const saved = localStorage.getItem('sv-font-size');
  if (saved && FONT_SIZES.includes(saved)) {
    currentFontIndex = FONT_SIZES.indexOf(saved);
  }
  applyFontSize(FONT_SIZES[currentFontIndex]);

  const decreaseBtn = document.getElementById('font-decrease');
  const increaseBtn = document.getElementById('font-increase');

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      currentFontIndex = Math.max(0, currentFontIndex - 1);
      applyFontSize(FONT_SIZES[currentFontIndex]);
    });
  }

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      currentFontIndex = Math.min(FONT_SIZES.length - 1, currentFontIndex + 1);
      applyFontSize(FONT_SIZES[currentFontIndex]);
    });
  }
}

/**
 * Apply font size to the document root.
 * @param {string} size - 'small', 'normal', or 'large'
 */
function applyFontSize(size) {
  document.documentElement.setAttribute('data-font-size', size);
  localStorage.setItem('sv-font-size', size);

  /* Update button states */
  const decreaseBtn = document.getElementById('font-decrease');
  const increaseBtn = document.getElementById('font-increase');
  if (decreaseBtn) decreaseBtn.disabled = (currentFontIndex === 0);
  if (increaseBtn) increaseBtn.disabled = (currentFontIndex === FONT_SIZES.length - 1);
}


/* ============================
   CATEGORY FILTERS
   ============================ */

let activeCategory = 'all';

/**
 * Initialize category filter pills with event delegation.
 */
function initCategoryFilters() {
  const filtersContainer = document.getElementById('category-filters');
  const gridContainer = document.getElementById('shayari-grid');
  if (!filtersContainer || !gridContainer) return;

  filtersContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.category-filter');
    if (!pill) return;

    const category = pill.dataset.category;
    if (category === activeCategory) return;

    /* Update active state */
    activeCategory = category;
    filtersContainer.querySelectorAll('.category-filter').forEach((p) => {
      p.classList.toggle('active', p.dataset.category === category);
    });

    /* Filter and re-render */
    const filtered = filterByCategory(category);
    renderShayariCards(gridContainer, filtered);

    /* Re-initialize scroll reveal for new cards */
    requestAnimationFrame(() => {
      initScrollReveal();
    });
  });
}


/* ============================
   SEARCH
   ============================ */

/**
 * Initialize search bar toggle and input handling.
 */
function initSearch() {
  const searchToggle = document.getElementById('search-toggle');
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput = document.getElementById('search-input');
  const searchClose = document.getElementById('search-close');
  const gridContainer = document.getElementById('shayari-grid');

  if (!searchToggle || !searchOverlay) return;

  /* Toggle search overlay */
  searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
  });

  /* Close search */
  if (searchClose) {
    searchClose.addEventListener('click', closeSearch);
  }

  /* Close on Escape key */
  searchOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });

  /* Close when clicking overlay backdrop */
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearch();
  });

  /* Debounced search input */
  if (searchInput && gridContainer) {
    const debouncedSearch = debounce((query) => {
      /* If a category filter is active, reset to 'all' first */
      if (activeCategory !== 'all' && query) {
        activeCategory = 'all';
        document.querySelectorAll('.category-filter').forEach((p) => {
          p.classList.toggle('active', p.dataset.category === 'all');
        });
      }

      const results = searchShayaris(query);
      renderShayariCards(gridContainer, results);
      requestAnimationFrame(() => initScrollReveal());
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }

  function closeSearch() {
    searchOverlay.classList.remove('active');
    if (searchInput) searchInput.value = '';
    /* Restore category-filtered view */
    if (gridContainer) {
      const filtered = filterByCategory(activeCategory);
      renderShayariCards(gridContainer, filtered);
      requestAnimationFrame(() => initScrollReveal());
    }
  }
}


/* ============================
   SCROLL REVEAL (IntersectionObserver)
   ============================ */

let revealObserver = null;

/**
 * Initialize IntersectionObserver for .reveal elements.
 * Adds 'visible' class when element enters viewport.
 */
function initScrollReveal() {
  /* Disconnect previous observer if any */
  if (revealObserver) revealObserver.disconnect();

  const revealElements = document.querySelectorAll('.reveal:not(.visible)');
  if (!revealElements.length) return;

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
}


/* ============================
   FLOATING PARTICLES
   ============================ */

/**
 * Create ambient floating particles in the hero section.
 */
function initParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;

  const particleConfigs = [
    { className: 'particle particle--slow', size: 200, count: 3 },
    { className: 'particle particle--medium', size: 120, count: 3 },
    { className: 'particle particle--fast', size: 60, count: 4 },
    { className: 'particle particle--slow particle--warm', size: 150, count: 2 },
  ];

  const fragment = document.createDocumentFragment();

  particleConfigs.forEach(({ className, size, count }) => {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = className;

      /* Randomize position, size, and animation delay */
      const randomSize = size + Math.random() * (size * 0.4) - (size * 0.2);
      el.style.width = `${randomSize}px`;
      el.style.height = `${randomSize}px`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${50 + Math.random() * 60}%`;
      el.style.animationDelay = `${-Math.random() * 20}s`;
      el.setAttribute('aria-hidden', 'true');

      fragment.appendChild(el);
    }
  });

  container.appendChild(fragment);
}


/* ============================
   HEADER AUTO-HIDE ON SCROLL
   ============================ */

/**
 * Hide header when scrolling down, show when scrolling up.
 */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScrollY = 0;
  const scrollThreshold = 50;

  const handleScroll = throttle(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > scrollThreshold && currentScrollY > lastScrollY) {
      /* Scrolling DOWN - hide header */
      header.classList.add('header--hidden');
    } else {
      /* Scrolling UP or at top - show header */
      header.classList.remove('header--hidden');
    }

    lastScrollY = currentScrollY;
  }, 16);

  window.addEventListener('scroll', handleScroll, { passive: true });
}


/* ============================
   CARD ACTIONS (Event Delegation)
   ============================ */

/**
 * Handle card action button clicks via event delegation on the grid.
 */
function initCardActions() {
  const gridContainer = document.getElementById('shayari-grid');
  if (!gridContainer) return;

  gridContainer.addEventListener('click', (e) => {
    /* Favorite button */
    const favBtn = e.target.closest('.action-favorite');
    if (favBtn) {
      e.stopPropagation();
      handleFavorite(favBtn);
      return;
    }

    /* Copy button */
    const copyBtn = e.target.closest('.action-copy');
    if (copyBtn) {
      e.stopPropagation();
      handleCopy(copyBtn);
      return;
    }

    /* Share button */
    const shareBtn = e.target.closest('.action-share');
    if (shareBtn) {
      e.stopPropagation();
      handleShare(shareBtn);
      return;
    }
  });
}

/**
 * Toggle favorite state on a card.
 * @param {HTMLElement} btn - Favorite button element
 */
function handleFavorite(btn) {
  const id = btn.dataset.id;
  const isActive = btn.classList.toggle('active');

  /* Heart pop animation */
  const icon = btn.querySelector('.btn__icon');
  if (icon) {
    icon.classList.add('heart-pop');
    icon.addEventListener('animationend', () => {
      icon.classList.remove('heart-pop');
    }, { once: true });
  }

  /* Toggle fill on the SVG */
  const svg = btn.querySelector('svg');
  if (svg) {
    svg.setAttribute('fill', isActive ? 'currentColor' : 'none');
  }

  /* Update localStorage */
  const favorites = JSON.parse(localStorage.getItem('sv-favorites') || '[]');
  if (isActive) {
    if (!favorites.includes(id)) favorites.push(id);
  } else {
    const index = favorites.indexOf(id);
    if (index > -1) favorites.splice(index, 1);
  }
  localStorage.setItem('sv-favorites', JSON.stringify(favorites));

  showToast(isActive ? '❤️ Pasandida mein joda!' : '💔 Pasandida se hataya');
}

/**
 * Copy shayari text to clipboard.
 * @param {HTMLElement} btn - Copy button element
 */
async function handleCopy(btn) {
  const text = decodeURIComponent(btn.dataset.text || '');
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text + '\n\n- ShayariVerse ✨');
    showToast('📋 Shayari copy ho gayi!', 'success');

    /* Visual feedback - swap icon to checkmark briefly */
    const icon = btn.querySelector('.btn__icon');
    if (icon) {
      icon.classList.add('copy-success');
      icon.addEventListener('animationend', () => {
        icon.classList.remove('copy-success');
      }, { once: true });
    }
  } catch {
    showToast('Copy nahi ho payi 😕', 'error');
  }
}

/**
 * Share shayari using Web Share API or fallback to copy.
 * @param {HTMLElement} btn - Share button element
 */
async function handleShare(btn) {
  const text = decodeURIComponent(btn.dataset.text || '');
  if (!text) return;

  const shareData = {
    title: 'ShayariVerse ✨',
    text: text + '\n\n- ShayariVerse',
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      /* Fallback: copy to clipboard */
      await navigator.clipboard.writeText(shareData.text);
      showToast('📋 Share text copy ho gaya!', 'success');
    }
  } catch (err) {
    /* User cancelled share - not an error */
    if (err.name !== 'AbortError') {
      showToast('Share nahi ho paya 😕', 'error');
    }
  }
}


/* ============================
   TOAST NOTIFICATION SYSTEM
   ============================ */

/**
 * Show a temporary toast notification.
 * @param {string} message - Toast message text
 * @param {string} type - 'success', 'error', or '' (default)
 */
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type ? `toast--${type}` : ''} toast-enter`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  container.appendChild(toast);

  /* Auto-remove after 2.5 seconds */
  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
      toast.remove();
    }, { once: true });
  }, 2500);
}


/* ============================
   RESTORE FAVORITES STATE
   ============================ */

/**
 * Restore favorite button states from localStorage after rendering cards.
 */
function restoreFavorites() {
  const favorites = JSON.parse(localStorage.getItem('sv-favorites') || '[]');
  if (!favorites.length) return;

  favorites.forEach((id) => {
    const btn = document.querySelector(`.action-favorite[data-id="${id}"]`);
    if (btn) {
      btn.classList.add('active');
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', 'currentColor');
    }
  });
}


/* ============================
   BOTTOM NAV ACTIVE STATE
   ============================ */

/**
 * Set active state on bottom nav based on current page.
 */
function initBottomNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.bottom-nav__item');

  navItems.forEach((item) => {
    const href = item.getAttribute('href') || '';
    if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
      item.classList.add('active');
    }
  });
}


/* ============================
   MAIN INITIALIZATION
   ============================ */

async function initApp() {
  /* 1. Load shayari data */
  await loadShayaris();

  /* 2. Render featured shayaris on homepage */
  const gridContainer = document.getElementById('shayari-grid');
  if (gridContainer) {
    const featured = getFeatured();
    /* Show featured first, then all others */
    const allShayaris = filterByCategory('all');
    const ordered = [
      ...featured,
      ...allShayaris.filter((s) => !s.featured),
    ];
    renderShayariCards(gridContainer, ordered);
  }

  /* 3. Initialize all UI systems */
  initTheme();
  initFontSize();
  initCategoryFilters();
  initSearch();
  initScrollReveal();
  initParticles();
  initHeaderScroll();
  initCardActions();
  initBottomNav();
  restoreFavorites();

  /* 4. Initialize audio system (async, non-blocking) */
  initAudio();

  /* 5. Initialize Lucide Icons */
  if (typeof window !== 'undefined' && window.lucide) {
    window.lucide.createIcons();
  }

  /* 6. Page enter animation */
  const main = document.querySelector('.page-wrapper');
  if (main) {
    main.classList.add('page-enter');
  }
}


/* ============================
   AUDIO SYSTEM INTEGRATION
   ============================ */

/**
 * Initialize the audio system: music prompt, player bar, controls.
 * Audio never autoplays - requires explicit user gesture.
 */
async function initAudio() {
  /* DOM references */
  const musicPrompt = document.getElementById('music-prompt');
  const musicPromptBtn = document.getElementById('music-prompt-btn');
  const audioPlayer = document.getElementById('audio-player');
  const playPauseBtn = document.getElementById('audio-play-pause');
  const skipBtn = document.getElementById('audio-skip');
  const muteBtn = document.getElementById('audio-mute');
  const volumeSlider = document.getElementById('audio-volume-slider');
  const soundwave = document.getElementById('audio-soundwave');
  const trackTitle = document.getElementById('audio-track-title');
  const trackArtist = document.getElementById('audio-track-artist');

  if (!audioPlayer) return;

  /* Initialize audio controller with UI update callback */
  await AudioController.init(updateAudioUI);

  /**
   * Update the audio player UI based on state changes.
   * Called by AudioController whenever state changes.
   * @param {Object} state - { isPlaying, isMuted, volume, currentTrack, isUnlocked }
   */
  function updateAudioUI(state) {
    /* Play / Pause icon toggle */
    const playIcon = playPauseBtn?.querySelector('.audio-icon-play');
    const pauseIcon = playPauseBtn?.querySelector('.audio-icon-pause');
    if (playIcon && pauseIcon) {
      playIcon.style.display = state.isPlaying ? 'none' : 'block';
      pauseIcon.style.display = state.isPlaying ? 'block' : 'none';
    }

    /* Soundwave animation */
    if (soundwave) {
      soundwave.classList.toggle('playing', state.isPlaying);
    }

    /* Track info */
    if (state.currentTrack) {
      if (trackTitle) trackTitle.textContent = state.currentTrack.title;
      if (trackArtist) trackArtist.textContent = state.currentTrack.artist || 'Ambient';
    }

    /* Volume / Mute icon toggle */
    const volIcon = muteBtn?.querySelector('.audio-icon-vol');
    const mutedIcon = muteBtn?.querySelector('.audio-icon-muted');
    if (volIcon && mutedIcon) {
      volIcon.style.display = state.isMuted ? 'none' : 'block';
      mutedIcon.style.display = state.isMuted ? 'block' : 'none';
    }

    /* Volume slider sync */
    if (volumeSlider) {
      volumeSlider.value = Math.round(state.volume * 100);
    }

    /* Show/hide audio player bar */
    if (state.isUnlocked) {
      audioPlayer.classList.remove('audio-player--hidden');
    }
  }

  /* Music Prompt - user clicks to enable audio */
  if (musicPromptBtn) {
    musicPromptBtn.addEventListener('click', () => {
      AudioController.unlockAudio();
      AudioController.playBackground();

      /* Hide prompt with animation */
      if (musicPrompt) {
        musicPrompt.classList.add('hidden');
        /* Remove from DOM after transition */
        musicPrompt.addEventListener('transitionend', () => {
          musicPrompt.remove();
        }, { once: true });
      }

      showToast('Mood music chalu ho gayi!', 'success');
    });
  }

  /* Play / Pause button */
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      AudioController.toggleBackground();
    });
  }

  /* Skip to next track */
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      AudioController.nextTrack();
      const state = AudioController.getState();
      if (state.currentTrack) {
        showToast(`🎵 ${state.currentTrack.title}`, '');
      }
    });
  }

  /* Mute toggle */
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      AudioController.toggleMute();
    });
  }

  /* Volume slider */
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value, 10) / 100;
      AudioController.setVolume(vol);
    });
  }
}


/* Start the app when DOM is ready */
document.addEventListener('DOMContentLoaded', initApp);
