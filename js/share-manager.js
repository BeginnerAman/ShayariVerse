/* ============================================================
   share-manager.js - Copy, Share & Canvas Card Generator
   ShayariVerse - "Read, Listen, Feel"

   ES6 Module - handles text copy, Web Share API,
   and Instagram-ready image card generation via Canvas API.
   ============================================================ */


/* ============================
   1. TEXT COPY
   ============================ */

/**
 * Copy text to clipboard.
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} true if successful
 */
export async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text + '\n\n- ShayariVerse ✨');
    return true;
  } catch {
    /* Fallback: textarea method for older browsers */
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text + '\n\n- ShayariVerse ✨';
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}


/* ============================
   2. WEB SHARE API
   ============================ */

/**
 * Share text using the Web Share API, fallback to copy.
 * @param {string} text - Shayari text
 * @param {Blob} [imageBlob] - Optional image blob to share
 * @returns {Promise<boolean>} true if shared or copied
 */
export async function shareText(text, imageBlob) {
  const shareData = {
    title: 'ShayariVerse ✨',
    text: text + '\n\n- ShayariVerse ✨',
  };

  /* Share with image if available and supported */
  if (imageBlob && navigator.canShare) {
    const file = new File([imageBlob], 'shayari-card.png', { type: 'image/png' });
    const withFile = { ...shareData, files: [file] };
    if (navigator.canShare(withFile)) {
      try {
        await navigator.share(withFile);
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
      }
    }
  }

  /* Share text only */
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
    }
  }

  /* Fallback: copy to clipboard */
  return copyText(text);
}


/* ============================
   3. CANVAS SHARE CARD GENERATOR
   Instagram-ready image (1080x1350, 4:5 ratio)
   ============================ */

/* Card design constants */
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const PADDING = 80;
const LINE_HEIGHT_FACTOR = 2.2;

/**
 * Generate a beautiful share card image from a shayari.
 * @param {Object} shayari - Shayari object with textHinglish, poet, category
 * @returns {Promise<Blob>} PNG image blob
 */
export async function generateCard(shayari) {
  /* Wait for fonts to load */
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');

  /* ---- Background Gradient ---- */
  const moodColors = {
    love:         ['#1a0510', '#2d0a1e', '#06060a'],
    romantic:     ['#1a0510', '#2d0a1e', '#06060a'],
    sad:          ['#050a1a', '#0a1a2d', '#06060a'],
    motivational: ['#1a1205', '#2d1a08', '#06060a'],
    funny:        ['#1a1505', '#2d2008', '#06060a'],
    zindagi:      ['#0a0518', '#15082d', '#06060a'],
    dosti:        ['#051a12', '#082d1a', '#06060a'],
  };
  const colors = moodColors[shayari.category] || moodColors.zindagi;
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  /* ---- Subtle Glow Overlay ---- */
  const glow = ctx.createRadialGradient(
    CARD_WIDTH / 2, CARD_HEIGHT / 2, 0,
    CARD_WIDTH / 2, CARD_HEIGHT / 2, CARD_WIDTH * 0.6
  );
  glow.addColorStop(0, 'rgba(192, 132, 252, 0.06)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  /* ---- Decorative Border ---- */
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.15)';
  ctx.lineWidth = 2;
  ctx.roundRect(30, 30, CARD_WIDTH - 60, CARD_HEIGHT - 60, 20);
  ctx.stroke();

  /* ---- Top Branding ---- */
  ctx.font = '600 32px Poppins, sans-serif';
  ctx.fillStyle = 'rgba(192, 132, 252, 0.8)';
  ctx.textAlign = 'center';
  ctx.fillText('✨ ShayariVerse', CARD_WIDTH / 2, 100);

  /* ---- Category Badge ---- */
  const categoryEmojis = {
    love: '❤️', romantic: '🌹', sad: '💔', motivational: '💪',
    funny: '😄', zindagi: '🌍', dosti: '🤝',
  };
  const emoji = categoryEmojis[shayari.category] || '✨';
  ctx.font = '500 28px Poppins, sans-serif';
  ctx.fillStyle = 'rgba(240, 230, 211, 0.5)';
  ctx.fillText(`${emoji} ${shayari.category || ''}`, CARD_WIDTH / 2, 150);

  /* ---- Shayari Text (Word-Wrapped) ---- */
  const text = shayari.textHinglish || shayari.textHindi || '';
  const fontSize = text.length > 150 ? 38 : text.length > 80 ? 44 : 52;
  ctx.font = `400 ${fontSize}px Kalam, cursive, sans-serif`;
  ctx.fillStyle = '#f0e6d3';
  ctx.textAlign = 'center';

  /* Split by newlines and word-wrap */
  const lines = [];
  const rawLines = text.split('\n');
  const maxWidth = CARD_WIDTH - PADDING * 2;

  rawLines.forEach((rawLine) => {
    const words = rawLine.split(' ');
    let currentLine = '';
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
  });

  /* Center text block vertically */
  const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
  const textBlockHeight = lines.length * lineHeight;
  const startY = (CARD_HEIGHT - textBlockHeight) / 2 + fontSize;

  /* Draw text shadow */
  ctx.shadowColor = 'rgba(168, 85, 247, 0.2)';
  ctx.shadowBlur = 40;
  lines.forEach((line, i) => {
    ctx.fillText(line, CARD_WIDTH / 2, startY + i * lineHeight);
  });
  ctx.shadowBlur = 0;

  /* ---- Bottom Branding ---- */
  ctx.font = '400 24px Poppins, sans-serif';
  ctx.fillStyle = 'rgba(168, 159, 145, 0.4)';
  ctx.fillText('shayariverse ✨', CARD_WIDTH / 2, CARD_HEIGHT - 80);

  /* ---- Decorative Dots ---- */
  ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(CARD_WIDTH / 2 - 20 + i * 20, CARD_HEIGHT - 120, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Convert to blob */
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}


/**
 * Generate a share card and trigger download.
 * @param {Object} shayari - Shayari object
 */
export async function downloadCard(shayari) {
  try {
    const blob = await generateCard(shayari);
    if (!blob) throw new Error('Card generation failed');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shayariverse-${shayari.id || 'card'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[ShareManager] Download failed:', err);
    return false;
  }
}


/**
 * Generate a card and share it (with image if supported).
 * @param {Object} shayari - Shayari object
 * @returns {Promise<boolean>}
 */
export async function shareWithCard(shayari) {
  try {
    const blob = await generateCard(shayari);
    return shareText(shayari.textHinglish || shayari.textHindi, blob);
  } catch {
    return shareText(shayari.textHinglish || shayari.textHindi);
  }
}
