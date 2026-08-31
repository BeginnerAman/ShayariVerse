# 2. System Architecture - Shayari Website

## 2.1 Technology Stack (GitHub Pages Compatible)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Markup** | HTML5 (Semantic) | SEO-friendly, accessible, GitHub Pages native |
| **Styling** | CSS3 (Custom Properties + Advanced Animations) | Zero dependency, hardware-accelerated transforms |
| **JavaScript** | Vanilla ES6+ (Modules) | No framework overhead, fastest load time |
| **Animations** | CSS `@keyframes` + `IntersectionObserver` + `requestAnimationFrame` | Buttery smooth 60fps without GSAP dependency |
| **Audio Engine** | Howler.js (CDN) | Cross-browser audio, sprite support, volume fade |
| **OCR (Build-time)** | Tesseract.js (Node script, runs locally) | Extract shayari from images - runs BEFORE deployment, not on GitHub Pages |
| **Icons** | Lucide Icons (SVG inline) | Crisp at all sizes, zero HTTP requests |
| **Fonts** | Google Fonts: `Noto Nastaliq Urdu` + `Kalam` + `Poppins` | Beautiful Hindi/Urdu calligraphy + readable UI |
| **Data** | Static JSON (`shayaris.json`, `songs.json`) | Pre-built, no runtime API calls |
| **Storage** | `localStorage` | Favorites, theme preference, font size, last played |

---

## 2.2 Directory Structure

```text
ShayariVerse/
├── index.html                    # Homepage - Hero + Featured Shayari
├── browse.html                   # Browse all shayari by category/mood
├── reels.html                    # Vertical swipe reels experience
├── favorites.html                # User's saved favorites (localStorage)
│
├── css/
│   ├── global.css                # CSS reset, custom properties, base typography
│   ├── components.css            # Cards, buttons, modals, audio player
│   ├── animations.css            # All @keyframes, scroll reveals, transitions
│   ├── responsive.css            # Media queries: mobile → tablet → desktop
│   └── themes.css                # Dark / Light / Sepia theme variables
│
├── js/
│   ├── app.js                    # Main entry - router, init, event delegation
│   ├── shayari-loader.js         # Fetch & parse shayaris.json, search, filter
│   ├── audio-controller.js       # Howler.js wrapper - bg music + reel songs
│   ├── reels-engine.js           # Vertical scroll snap, auto-play/pause logic
│   ├── theme-manager.js          # Dark/Light/Sepia toggle + localStorage persist
│   ├── favorites-manager.js      # Save/load/remove favorites from localStorage
│   ├── share-manager.js          # Copy text, generate share card (Canvas API)
│   ├── lazy-loader.js            # IntersectionObserver for images & audio
│   └── utils.js                  # Debounce, throttle, slugify, duplicate checker
│
├── data/
│   ├── shayaris.json             # Master shayari database (pre-built)
│   └── songs.json                # Song metadata (name, file, duration, mood)
│
├── content/                      # RAW CONTENT (owner dumps screenshots here)
│   ├── images/                   # Screenshots of shayari (ANY filename ok)
│   └── audio/
│       ├── background/           # Long ambient music tracks
│       └── songs/                # Short reel-style clips (15-30s)
│
├── assets/
│   ├── images/                   # Optimized/compressed shayari images
│   ├── backgrounds/              # Mood background images/gradients
│   ├── icons/                    # SVG icons (inline-ready)
│   └── og/                       # OpenGraph preview images for sharing
│
├── fonts/                        # Self-hosted font files (WOFF2)
│
├── tools/                        # Build-time scripts (NOT deployed)
│   ├── build-shayaris.js         # Node: scans images → OCR → generates shayaris.json
│   ├── ocr-extract.js            # Node: Tesseract.js OCR on screenshots
│   ├── hinglish-convert.js       # Node: Devanagari → Hinglish transliteration
│   ├── duplicate-checker.js      # Node: Levenshtein similarity check
│   └── image-optimizer.js        # Node: compress images for web
│
├── sw.js                         # Service Worker for offline caching
├── manifest.json                 # PWA manifest (add to home screen)
├── robots.txt                    # SEO
├── sitemap.xml                   # SEO
└── README.md                     # Project documentation
```

---

## 2.3 System Invariants (NEVER BREAK THESE)

### Performance Invariants:
1. **No JavaScript framework / No React / No Vue** - Pure vanilla JS only. Every kilobyte matters on mobile.
2. **No layout shift** - All images must have explicit `width` and `height` attributes. Use `aspect-ratio` CSS.
3. **Hardware-accelerated animations only** - Only animate `transform` and `opacity`. NEVER animate `width`, `height`, `top`, `left`, `margin`, or `padding`.
4. **Lazy load everything below the fold** - Use `IntersectionObserver` for images, audio, and card reveals.

### Audio Invariants:
5. **Never autoplay audio on page load** - Always require user gesture first (browser policy). Show a "tap to enable music" prompt.
6. **Audio must not block rendering** - Load audio files asynchronously, never in the critical render path.
7. **Graceful audio degradation** - If audio fails to load, the website must still work perfectly without it.

### Content Invariants:
8. **No runtime API calls** - All data comes from static JSON files bundled in the repo.
9. **OCR runs at build time ONLY** - Tesseract.js runs in a local Node.js script, NOT in the browser.
10. **Content folder is source of truth** - `shayaris.json` is always regenerated from `content/` folder.

### Hosting Invariants:
11. **Must deploy to GitHub Pages without any build step** - The `index.html` in root must work directly. Build scripts in `tools/` are optional helpers.
12. **Total repo size < 500MB** - Compress audio to 128kbps MP3, images to WebP/JPEG quality 80.
