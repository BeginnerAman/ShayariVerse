/* ============================================================
   reels-engine.js — Instagram-Style Vertical Reels Engine
   ShayariVerse — "Read, Listen, Feel"

   Features:
   - Fullscreen 100dvh vertical scroll snap
   - 100% Reliable Native HTML5 Audio (no Howler bugs)
   - Automatic gesture unlocking on any touch/click/scroll
   - Lucide Icons throughout
   - Smooth volume crossfading between reels
   - Favorite, Copy, Share micro-interactions
   ============================================================ */

let allShayaris = [];
let allSongs = [];
let reelsContainer = null;
let activeReelIndex = -1;
let reelObserver = null;
let counterEl = null;
let totalEl = null;

/* Audio State — Dual-Channel Crossfade Engine */
let audioChannelA = null;
let audioChannelB = null;
let activeChannel = 'A';
let isMuted = false;
let isAudioStarted = false;
let currentSongId = null;
const CROSSFADE_DURATION_MS = 450;
const TARGET_VOLUME = 0.7;


/* ============================
   1. INITIALIZATION
   ============================ */

export async function init() {
  reelsContainer = document.getElementById('reels-container');
  counterEl = document.getElementById('reel-counter-current');
  totalEl = document.getElementById('reel-counter-total');

  if (!reelsContainer) return;

  /* Initialize Dual-Channel Audio Elements */
  initAudioChannels();

  /* Load data in parallel */
  const [shayariData, songsData] = await Promise.all([
    fetchJSON('data/shayaris.json'),
    fetchJSON('data/songs.json'),
  ]);

  allShayaris = shayariData?.shayaris || [];
  allSongs = songsData?.reelSongs || songsData?.backgroundTracks || [
    { id: 'track-1', file: 'content/audio/songs/track-1.mp3', title: 'Soulful Melody' },
    { id: 'track-2', file: 'content/audio/songs/track-2.mp3', title: 'Rainy Nostalgia' },
    { id: 'track-3', file: 'content/audio/songs/track-3.mp3', title: 'Evening Breeze' }
  ];

  if (!allShayaris.length) {
    reelsContainer.innerHTML = `
      <div class="reel reel--empty">
        <p class="reel__empty-text">Koi shayari nahi mili</p>
        <a href="index.html" class="btn btn--primary">Home</a>
      </div>
    `;
    return;
  }

  /* Render reels */
  renderReels();

  /* Set up IntersectionObserver */
  setupObserver();

  /* Set up Action Buttons & Sound Controls */
  setupActions();
  setupSoundControls();

  /* Global Gesture Listener to guarantee audio start */
  setupGestureUnlock();

  /* Keyboard navigation */
  setupKeyboard();

  /* Update counter */
  if (totalEl) totalEl.textContent = allShayaris.length;

  /* Activate Lucide icons */
  if (window.lucide) {
    window.lucide.createIcons();
  }
}


/* ============================
   2. DATA LOADING
   ============================ */

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[ReelsEngine] Failed to load ${url}:`, err);
    return null;
  }
}


/* ============================
   3. DUAL-CHANNEL AUDIO ENGINE WITH CINEMATIC CROSSFADE
   ============================ */

function initAudioChannels() {
  let elA = document.getElementById('reel-native-audio-a');
  if (!elA) {
    elA = document.createElement('audio');
    elA.id = 'reel-native-audio-a';
    elA.loop = true;
    elA.preload = 'auto';
    document.body.appendChild(elA);
  }
  audioChannelA = elA;
  audioChannelA.volume = 0;

  let elB = document.getElementById('reel-native-audio-b');
  if (!elB) {
    elB = document.createElement('audio');
    elB.id = 'reel-native-audio-b';
    elB.loop = true;
    elB.preload = 'auto';
    document.body.appendChild(elB);
  }
  audioChannelB = elB;
  audioChannelB.volume = 0;
}

function fadeAudio(audioEl, fromVol, toVol, durationMs, onComplete) {
  if (!audioEl) return;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    // Studio-grade smooth S-curve interpolation
    const ease = 0.5 * (1 - Math.cos(Math.PI * progress));
    const currentVol = fromVol + (toVol - fromVol) * ease;

    try {
      audioEl.volume = Math.max(0, Math.min(1, currentVol));
    } catch (e) {}

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      try {
        audioEl.volume = toVol;
      } catch (e) {}
      if (typeof onComplete === 'function') onComplete();
    }
  }

  requestAnimationFrame(step);
}

function updateVisualizerState(isPlaying) {
  const toggleBtn = document.getElementById('reels-sound-toggle');
  if (toggleBtn) {
    if (isPlaying && !isMuted) {
      toggleBtn.classList.add('is-playing');
    } else {
      toggleBtn.classList.remove('is-playing');
    }
  }

  const musicTags = document.querySelectorAll('.reel__music-tag');
  musicTags.forEach((tag) => {
    if (isPlaying && !isMuted) {
      tag.classList.add('is-playing');
    } else {
      tag.classList.remove('is-playing');
    }
  });
}

function playSongNative(songId) {
  if (isMuted) return;
  if (!audioChannelA || !audioChannelB) initAudioChannels();

  const song = allSongs.find((s) => s.id === songId) || allSongs[0];
  if (!song) return;

  const currentAudio = activeChannel === 'A' ? audioChannelA : audioChannelB;
  const nextAudio = activeChannel === 'A' ? audioChannelB : audioChannelA;

  /* If same song already playing and not paused, keep playing seamlessly */
  if (currentSongId === song.id && !currentAudio.paused && currentAudio.currentTime > 0) {
    updateVisualizerState(true);
    return;
  }

  currentSongId = song.id;

  /* Crossfade: Smoothly fade out current active channel */
  if (!currentAudio.paused && currentAudio.volume > 0.05) {
    fadeAudio(currentAudio, currentAudio.volume, 0, CROSSFADE_DURATION_MS, () => {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    });
  } else {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  /* Switch active channel */
  activeChannel = activeChannel === 'A' ? 'B' : 'A';

  /* Prepare and smoothly fade in next channel */
  nextAudio.src = song.file;
  nextAudio.currentTime = 0;
  nextAudio.volume = 0;

  const playPromise = nextAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isAudioStarted = true;
        hideAudioPrompt();
        updateVisualizerState(true);
        fadeAudio(nextAudio, 0, TARGET_VOLUME, CROSSFADE_DURATION_MS);
      })
      .catch((err) => {
        console.log('[ReelsEngine] Autoplay waiting for user gesture:', err.message);
        updateVisualizerState(false);
      });
  }
}

function setupGestureUnlock() {
  const promptEl = document.getElementById('reels-audio-prompt');

  function onFirstUserGesture() {
    if (!isAudioStarted && !isMuted) {
      if (activeReelIndex >= 0) {
        const activeEl = reelsContainer.querySelector(`.reel[data-index="${activeReelIndex}"]`);
        const songId = activeEl?.dataset.songId || 'track-1';
        playSongNative(songId);
      } else {
        playSongNative('track-1');
      }
    }
    hideAudioPrompt();

    /* Remove gesture listeners once active */
    window.removeEventListener('pointerdown', onFirstUserGesture);
    window.removeEventListener('touchstart', onFirstUserGesture);
    window.removeEventListener('click', onFirstUserGesture);
    window.removeEventListener('scroll', onFirstUserGesture);
    window.removeEventListener('keydown', onFirstUserGesture);
  }

  if (promptEl) {
    promptEl.addEventListener('click', onFirstUserGesture);
  }

  window.addEventListener('pointerdown', onFirstUserGesture, { passive: true });
  window.addEventListener('touchstart', onFirstUserGesture, { passive: true });
  window.addEventListener('click', onFirstUserGesture, { passive: true });
  window.addEventListener('scroll', onFirstUserGesture, { passive: true });
  window.addEventListener('keydown', onFirstUserGesture, { passive: true });
}

function hideAudioPrompt() {
  const promptEl = document.getElementById('reels-audio-prompt');
  if (promptEl) {
    promptEl.classList.add('hidden');
    setTimeout(() => {
      if (promptEl.parentNode) promptEl.parentNode.removeChild(promptEl);
    }, 400);
  }
}


/* ============================
   4. RENDERING REELS
   ============================ */

const MOOD_GRADIENTS = {
  love:         'linear-gradient(180deg, #180612 0%, #2a0a1e 40%, #06060a 100%)',
  romantic:     'linear-gradient(180deg, #180612 0%, #2a0a1e 40%, #06060a 100%)',
  sad:          'linear-gradient(180deg, #050b18 0%, #0a182d 40%, #06060a 100%)',
  melancholic:  'linear-gradient(180deg, #050b18 0%, #0a182d 40%, #06060a 100%)',
  motivational: 'linear-gradient(180deg, #181105 0%, #2a1a08 40%, #06060a 100%)',
  inspiring:    'linear-gradient(180deg, #181105 0%, #2a1a08 40%, #06060a 100%)',
  zindagi:      'linear-gradient(180deg, #0b0518 0%, #17082e 40%, #06060a 100%)',
  philosophical:'linear-gradient(180deg, #0b0518 0%, #17082e 40%, #06060a 100%)',
  dosti:        'linear-gradient(180deg, #051810 0%, #082d1b 40%, #06060a 100%)',
  warm:         'linear-gradient(180deg, #051810 0%, #082d1b 40%, #06060a 100%)',
  funny:        'linear-gradient(180deg, #181505 0%, #2c2008 40%, #06060a 100%)',
  humorous:     'linear-gradient(180deg, #181505 0%, #2c2008 40%, #06060a 100%)',
  calm:         'linear-gradient(180deg, #090a16 0%, #10122c 40%, #06060a 100%)',
  spiritual:    'linear-gradient(180deg, #12050b 0%, #220a17 40%, #06060a 100%)',
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

function renderReels() {
  const html = allShayaris.map((shayari, index) => {
    const gradient = MOOD_GRADIENTS[shayari.mood] || MOOD_GRADIENTS[shayari.category] || MOOD_GRADIENTS.calm;
    const iconName = CATEGORY_ICONS[shayari.category] || 'sparkles';
    const song = shayari.songId ? allSongs.find((s) => s.id === shayari.songId) : allSongs[0];

    return `
      <div class="reel"
           data-index="${index}"
           data-id="${shayari.id}"
           data-song-id="${shayari.songId || 'track-1'}"
           style="background: ${gradient}">

        <!-- Glow overlay -->
        <div class="reel__glow" aria-hidden="true"></div>

        <!-- Content — poetry text -->
        <div class="reel__content">
          <p class="reel__text" lang="hi">${shayari.textHinglish}</p>
        </div>

        <!-- Category badge (top-left) with Lucide Icon -->
        <span class="reel__category">
          <i data-lucide="${iconName}" style="width:13px; height:13px; vertical-align: middle; margin-right:4px;"></i>
          ${shayari.category}
        </span>

        <!-- Action buttons (right side, vertical) with Lucide Icons -->
        <div class="reel__actions">
          <button class="reel__action-btn action-favorite"
                  data-id="${shayari.id}"
                  aria-label="Favorite">
            <i data-lucide="heart"></i>
          </button>

          <button class="reel__action-btn action-copy"
                  data-text="${encodeURIComponent(shayari.textHinglish)}"
                  aria-label="Copy">
            <i data-lucide="copy"></i>
          </button>

          <button class="reel__action-btn action-share"
                  data-text="${encodeURIComponent(shayari.textHinglish)}"
                  aria-label="Share">
            <i data-lucide="share-2"></i>
          </button>
        </div>

        <!-- Music tag (bottom) with Waveform Visualizer & Lucide Icon -->
        <div class="reel__music-tag action-music-tag" title="Click to toggle sound">
          <span class="waveform-visualizer" aria-hidden="true">
            <span class="waveform-bar"></span>
            <span class="waveform-bar"></span>
            <span class="waveform-bar"></span>
            <span class="waveform-bar"></span>
          </span>
          <i data-lucide="music-2" class="reel__music-icon"></i>
          <span class="reel__music-name">${song ? song.title : 'Soulful Melody'}</span>
        </div>
      </div>
    `;
  }).join('');

  reelsContainer.innerHTML = html;

  if (typeof window !== 'undefined' && window.lucide) {
    window.lucide.createIcons();
  }
}


/* ============================
   5. INTERSECTION OBSERVER
   ============================ */

function setupObserver() {
  if (reelObserver) reelObserver.disconnect();

  const reels = reelsContainer.querySelectorAll('.reel');

  reelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = parseInt(entry.target.dataset.index, 10);

        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          activateReel(index, entry.target);
        } else if (index === activeReelIndex && entry.intersectionRatio < 0.45) {
          deactivateReel(index, entry.target);
        }
      });
    },
    {
      root: reelsContainer,
      threshold: [0, 0.45, 0.5, 1],
    }
  );

  reels.forEach((reel) => reelObserver.observe(reel));
}

function activateReel(index, reelEl) {
  if (index === activeReelIndex) return;

  if (activeReelIndex >= 0) {
    const prevReel = reelsContainer.querySelector(`.reel[data-index="${activeReelIndex}"]`);
    if (prevReel) prevReel.classList.remove('reel--active');
  }

  activeReelIndex = index;
  reelEl.classList.add('reel--active');

  /* Update counter */
  if (counterEl) counterEl.textContent = index + 1;

  /* Play song */
  const songId = reelEl.dataset.songId || 'track-1';
  playSongNative(songId);
}

function deactivateReel(index, reelEl) {
  reelEl.classList.remove('reel--active');
  if (index === activeReelIndex) {
    activeReelIndex = -1;
  }
}


/* ============================
   6. SOUND CONTROLS & ACTIONS
   ============================ */

function setupSoundControls() {
  const toggleBtn = document.getElementById('reels-sound-toggle');
  const textEl = document.getElementById('sound-toggle-text');

  function toggleSound() {
    isMuted = !isMuted;

    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');

    if (iconOn && iconOff) {
      iconOn.style.display = isMuted ? 'none' : 'block';
      iconOff.style.display = isMuted ? 'block' : 'none';
    }

    if (textEl) {
      textEl.textContent = isMuted ? 'Muted' : 'Music';
    }

    if (isMuted) {
      if (audioChannelA) audioChannelA.pause();
      if (audioChannelB) audioChannelB.pause();
      updateVisualizerState(false);
      showReelToast('🔇 Sound Muted');
    } else {
      updateVisualizerState(true);
      if (activeReelIndex >= 0) {
        const activeEl = reelsContainer.querySelector(`.reel[data-index="${activeReelIndex}"]`);
        const songId = activeEl?.dataset.songId || 'track-1';
        playSongNative(songId);
      } else {
        playSongNative('track-1');
      }
      showReelToast('🔊 Sound On');
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSound();
    });
  }

  if (reelsContainer) {
    reelsContainer.addEventListener('click', (e) => {
      const musicTag = e.target.closest('.action-music-tag');
      if (musicTag) {
        e.stopPropagation();
        toggleSound();
      }
    });
  }
}

function setupActions() {
  if (!reelsContainer) return;

  const favorites = JSON.parse(localStorage.getItem('sv-favorites') || '[]');

  reelsContainer.querySelectorAll('.action-favorite').forEach((btn) => {
    if (favorites.includes(btn.dataset.id)) {
      btn.classList.add('active');
    }
  });

  reelsContainer.addEventListener('click', (e) => {
    /* Favorite */
    const favBtn = e.target.closest('.action-favorite');
    if (favBtn) {
      e.stopPropagation();
      const id = favBtn.dataset.id;
      const isActive = favBtn.classList.toggle('active');

      favBtn.classList.add('reel__action-pop');
      favBtn.addEventListener('animationend', () => favBtn.classList.remove('reel__action-pop'), { once: true });

      const favs = JSON.parse(localStorage.getItem('sv-favorites') || '[]');
      if (isActive && !favs.includes(id)) favs.push(id);
      if (!isActive) { const i = favs.indexOf(id); if (i > -1) favs.splice(i, 1); }
      localStorage.setItem('sv-favorites', JSON.stringify(favs));

      showReelToast(isActive ? '❤️ Added to Favorites' : '💔 Removed');
      return;
    }

    /* Copy */
    const copyBtn = e.target.closest('.action-copy');
    if (copyBtn) {
      e.stopPropagation();
      const text = decodeURIComponent(copyBtn.dataset.text || '');
      navigator.clipboard.writeText(text + '\n\n- ShayariVerse ✨')
        .then(() => showReelToast('📋 Copied!'))
        .catch(() => showReelToast('Copy failed'));

      copyBtn.classList.add('reel__action-pop');
      copyBtn.addEventListener('animationend', () => copyBtn.classList.remove('reel__action-pop'), { once: true });
      return;
    }

    /* Share */
    const shareBtn = e.target.closest('.action-share');
    if (shareBtn) {
      e.stopPropagation();
      const text = decodeURIComponent(shareBtn.dataset.text || '');
      const shareData = { title: 'ShayariVerse ✨', text: text + '\n\n- ShayariVerse', url: window.location.href };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareData.text)
          .then(() => showReelToast('📋 Share text copied!'))
          .catch(() => {});
      }

      shareBtn.classList.add('reel__action-pop');
      shareBtn.addEventListener('animationend', () => shareBtn.classList.remove('reel__action-pop'), { once: true });
      return;
    }
  });
}


/* ============================
   7. KEYBOARD NAVIGATION
   ============================ */

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    const reels = reelsContainer?.querySelectorAll('.reel');
    if (!reels || !reels.length) return;

    if (e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      const nextIndex = Math.min(activeReelIndex + 1, reels.length - 1);
      reels[nextIndex].scrollIntoView({ behavior: 'smooth' });
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(activeReelIndex - 1, 0);
      reels[prevIndex].scrollIntoView({ behavior: 'smooth' });
    }
  });
}


/* ============================
   8. TOAST
   ============================ */

function showReelToast(message) {
  const container = document.getElementById('reel-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'reel-toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('reel-toast--exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 2000);
}


/* ============================
   9. CLEANUP
   ============================ */

export function destroy() {
  if (reelObserver) reelObserver.disconnect();
  if (audioChannelA) audioChannelA.pause();
  if (audioChannelB) audioChannelB.pause();
}

window.addEventListener('beforeunload', destroy);

document.addEventListener('DOMContentLoaded', init);
