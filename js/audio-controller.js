/* ============================================================
   audio-controller.js — Audio Engine (Native HTML5 Audio)
   ShayariVerse — "Read, Listen, Feel"

   Features:
   - 100% Reliable Native HTML5 Audio
   - Background ambient music loops with smooth volume fading
   - Crossfade between tracks (track-1, track-2, track-3)
   - Browser autoplay gesture handling & instant unlock
   ============================================================ */

let bgTracks = [];
let currentTrackIndex = 0;
let audioElement = null;
let isPlaying = false;
let isMuted = false;
let volume = 0.45;
let isAudioUnlocked = false;
let isInitialized = false;
let onStateChangeCallback = null;
let fadeInterval = null;

const FADE_MS = 600;


/* ============================
   1. INITIALIZATION
   ============================ */

export async function init(onStateChange) {
  if (isInitialized) return;

  onStateChangeCallback = onStateChange || null;

  /* Initialize Audio element */
  initAudioElement();

  /* Load track metadata */
  try {
    const response = await fetch('data/songs.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    bgTracks = data.backgroundTracks || [
      { id: 'track-1', title: 'Soulful Melody', file: 'content/audio/background/track-1.mp3', artist: 'ShayariVerse' },
      { id: 'track-2', title: 'Rainy Nostalgia', file: 'content/audio/background/track-2.mp3', artist: 'ShayariVerse' },
      { id: 'track-3', title: 'Evening Breeze', file: 'content/audio/background/track-3.mp3', artist: 'ShayariVerse' }
    ];
  } catch (error) {
    console.warn('[AudioController] Failed to load songs.json, using fallback:', error);
    bgTracks = [
      { id: 'track-1', title: 'Soulful Melody', file: 'content/audio/background/track-1.mp3', artist: 'ShayariVerse' },
      { id: 'track-2', title: 'Rainy Nostalgia', file: 'content/audio/background/track-2.mp3', artist: 'ShayariVerse' },
      { id: 'track-3', title: 'Evening Breeze', file: 'content/audio/background/track-3.mp3', artist: 'ShayariVerse' }
    ];
  }

  /* Restore persisted state */
  const savedVolume = localStorage.getItem('sv-audio-volume');
  const savedMute = localStorage.getItem('sv-audio-muted');
  const savedTrack = localStorage.getItem('sv-audio-track');

  if (savedVolume !== null) volume = parseFloat(savedVolume);
  if (savedMute !== null) isMuted = savedMute === 'true';
  if (savedTrack !== null) {
    const idx = bgTracks.findIndex((t) => t.id === savedTrack);
    if (idx >= 0) currentTrackIndex = idx;
  }

  setupGestureUnlock();

  isInitialized = true;
  notifyStateChange();
}

function initAudioElement() {
  let el = document.getElementById('sv-bg-audio');
  if (!el) {
    el = document.createElement('audio');
    el.id = 'sv-bg-audio';
    el.loop = true;
    el.preload = 'auto';
    document.body.appendChild(el);
  }
  audioElement = el;
  audioElement.volume = volume;
}


/* ============================
   2. GESTURE UNLOCK
   ============================ */

function setupGestureUnlock() {
  function onGesture() {
    unlockAudio();
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('touchstart', onGesture);
    window.removeEventListener('click', onGesture);
    window.removeEventListener('scroll', onGesture);
    window.removeEventListener('keydown', onGesture);
  }

  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('touchstart', onGesture, { passive: true });
  window.addEventListener('click', onGesture, { passive: true });
  window.addEventListener('scroll', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture, { passive: true });
}

export function unlockAudio() {
  if (isAudioUnlocked) return;
  isAudioUnlocked = true;
  notifyStateChange();
}

export function isUnlocked() {
  return isAudioUnlocked;
}


/* ============================
   3. PLAYBACK CONTROLS
   ============================ */

export function playBackground() {
  if (!isInitialized || !bgTracks.length || !audioElement) return;

  unlockAudio();

  const track = bgTracks[currentTrackIndex] || bgTracks[0];

  /* If audio is already loaded on this track, just resume */
  if (audioElement.src && audioElement.src.includes(track.file) && !audioElement.paused) {
    return;
  }

  if (!audioElement.src || !audioElement.src.includes(track.file)) {
    audioElement.src = track.file;
    audioElement.currentTime = 0;
  }

  audioElement.volume = 0;
  const playPromise = audioElement.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isPlaying = true;
        /* Smooth volume fade-in */
        clearInterval(fadeInterval);
        let vol = 0;
        const targetVol = isMuted ? 0 : volume;
        fadeInterval = setInterval(() => {
          vol += 0.05;
          if (vol >= targetVol) {
            clearInterval(fadeInterval);
            audioElement.volume = targetVol;
          } else {
            audioElement.volume = Math.min(targetVol, vol);
          }
        }, 30);
        notifyStateChange();
      })
      .catch((err) => {
        console.log('[AudioController] Autoplay paused pending user gesture:', err.message);
        isPlaying = false;
        notifyStateChange();
      });
  }
}

export function pauseBackground() {
  if (!audioElement || !isPlaying) return;

  /* Smooth fade-out then pause */
  clearInterval(fadeInterval);
  let vol = audioElement.volume;
  fadeInterval = setInterval(() => {
    vol -= 0.08;
    if (vol <= 0.05) {
      clearInterval(fadeInterval);
      audioElement.pause();
      isPlaying = false;
      notifyStateChange();
    } else {
      audioElement.volume = Math.max(0, vol);
    }
  }, 25);
}

export function toggleBackground() {
  if (isPlaying) {
    pauseBackground();
  } else {
    playBackground();
  }
}

export function nextTrack() {
  if (!bgTracks.length) return;
  currentTrackIndex = (currentTrackIndex + 1) % bgTracks.length;
  localStorage.setItem('sv-audio-track', bgTracks[currentTrackIndex].id);

  if (isPlaying) {
    audioElement.src = bgTracks[currentTrackIndex].file;
    audioElement.currentTime = 0;
    audioElement.play().catch(() => {});
  }
  notifyStateChange();
}

export function prevTrack() {
  if (!bgTracks.length) return;
  currentTrackIndex = (currentTrackIndex - 1 + bgTracks.length) % bgTracks.length;
  localStorage.setItem('sv-audio-track', bgTracks[currentTrackIndex].id);

  if (isPlaying) {
    audioElement.src = bgTracks[currentTrackIndex].file;
    audioElement.currentTime = 0;
    audioElement.play().catch(() => {});
  }
  notifyStateChange();
}


/* ============================
   4. VOLUME & MUTE
   ============================ */

export function setVolume(vol) {
  volume = Math.max(0, Math.min(1, vol));
  localStorage.setItem('sv-audio-volume', volume.toString());

  if (audioElement && !isMuted) {
    audioElement.volume = volume;
  }

  if (isMuted && volume > 0) {
    isMuted = false;
    localStorage.setItem('sv-audio-muted', 'false');
  }

  notifyStateChange();
}

export function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('sv-audio-muted', isMuted.toString());

  if (audioElement) {
    audioElement.volume = isMuted ? 0 : volume;
  }

  notifyStateChange();
}

export function getVolume() {
  return volume;
}


/* ============================
   5. STATE
   ============================ */

export function getState() {
  return {
    isPlaying,
    isMuted,
    volume,
    isUnlocked: isAudioUnlocked,
    isInitialized,
    currentTrack: bgTracks[currentTrackIndex] || null,
    currentTrackIndex,
    totalTracks: bgTracks.length,
  };
}

function notifyStateChange() {
  if (typeof onStateChangeCallback === 'function') {
    onStateChangeCallback(getState());
  }
}

/* ============================
   6. PAGE VISIBILITY (Battery Saver)
   ============================ */

let wasAudioPlayingBeforeHidden = false;

document.addEventListener('visibilitychange', () => {
  if (!audioElement) return;
  if (document.hidden) {
    if (isPlaying && !audioElement.paused) {
      wasAudioPlayingBeforeHidden = true;
      audioElement.pause();
      isPlaying = false;
      notifyStateChange();
    } else {
      wasAudioPlayingBeforeHidden = false;
    }
  } else {
    if (wasAudioPlayingBeforeHidden && !isMuted) {
      wasAudioPlayingBeforeHidden = false;
      audioElement.play().then(() => {
        isPlaying = true;
        notifyStateChange();
      }).catch(() => {});
    }
  }
});
