# ShayariVerse

Read, Listen, Feel - A modern web application for exploring Hindi and Urdu poetry with ambient music and vertical reels.

Hosted directly on GitHub Pages with zero server dependencies.

---

## Overview

ShayariVerse is a client-side web application designed for poetry lovers. It combines curated poetic couplets with ambient audio playback, dynamic search and filtering, and full-screen vertical reels.

The project is built entirely with standard web technologies (HTML5, CSS3, ES6 JavaScript) and static JSON data files. It requires no backend server, database, or build steps to run.

---

## Key Features

### 1. Curated Poetry Dataset
- 74 verified poetic couplets categorized by theme: Love, Dard, Romantic, Zindagi, Motivational, Dosti, and Funny.
- Romanized script (Hinglish) with authentic couplet stanza formatting.
- Balanced card layouts with uniform heights and responsive typography.

### 2. Full-Screen Poetry Reels (`reels.html`)
- Full viewport height vertical scroll-snap experience inspired by modern mobile apps.
- IntersectionObserver detection for active visible reel.
- Synchronized short audio playback with smooth volume crossfading between reels.
- On-screen controls for favorites, text copying, and social sharing.

### 3. Smart Search and Browse (`browse.html`)
- Instant debounced search matching keywords across couplets, moods, and categories.
- Trending keyword chips for fast one-tap discovery.
- Category filter pills with live item count badges.
- Multi-criteria sorting: Curated, Alphabetical (A to Z), Shortest First, and Longest First.
- One-click filter reset with active filter indicators.

### 4. Ambient Audio Controller (`index.html`)
- Native HTML5 Web Audio playback for continuous ambient melodies.
- Browser autoplay policy compliance with global user gesture unlocking.
- Fixed bottom player bar with play/pause, track skipping, volume slider, and mute toggles.

### 5. Social Sharing and Image Card Generation
- One-tap text copying to clipboard with toast notifications.
- HTML5 Canvas engine that renders customized 4:5 image cards ready for Instagram and social media sharing.
- Direct download and Web Share API support.

### 6. Personal Favorites (`favorites.html`)
- Client-side storage of favorite shayaris using localStorage.
- Dedicated favorites gallery with individual card management and batch clear options.

### 7. Themes and Typography
- Three distinct color themes: Dark, Light, and Sepia.
- Fluid font size controls (A- / A+) for accessibility across devices.
- Official Lucide vector icons integrated across all pages and components.

### 8. Progressive Web App (PWA)
- Service Worker (`sw.js`) for offline caching and reliable performance.
- Web app manifest (`manifest.json`) for mobile installation and home screen shortcut support.

---

## Tech Stack

- **Markup:** Semantic HTML5
- **Styling:** Modern CSS with CSS custom properties (variables), Grid, and Flexbox
- **Logic:** Vanilla JavaScript (ES6 Modules)
- **Icons:** Lucide Icons
- **Audio:** Native HTML5 Audio and Web Audio API
- **Data:** Static JSON files (`data/shayaris.json`, `data/songs.json`)
- **Hosting:** GitHub Pages (Static hosting)

---

## Directory Structure

```
ShayariVerse/
|-- index.html              # Homepage with hero, featured cards, audio player
|-- browse.html             # Search, category filtering, trending tags, sort
|-- reels.html              # Full-screen vertical swipeable reels
|-- favorites.html          # User saved favorites page
|-- manifest.json           # PWA web app manifest
|-- sw.js                   # Service worker for offline caching
|-- css/
|   |-- global.css          # CSS variables, reset, layout, base elements
|   |-- themes.css          # Dark, Light, Sepia color variables
|   |-- components.css      # Cards, buttons, navigation, modals, toasts
|   |-- animations.css      # Hardware-accelerated transitions and keyframes
|   `-- responsive.css      # Mobile, tablet, and desktop media queries
|-- js/
|   |-- app.js              # Homepage controller and UI initialization
|   |-- shayari-loader.js   # Dataset loader, card template renderer, search
|   |-- reels-engine.js     # Vertical reels engine and scroll-snap manager
|   |-- audio-controller.js # Ambient audio controller and gesture unlocker
|   |-- theme-manager.js    # Theme cycling and persistence
|   |-- favorites-manager.js# LocalStorage favorites state manager
|   `-- share-manager.js    # Canvas image generator and Web Share API
|-- data/
|   |-- shayaris.json       # 74 curated poetic couplets
|   `-- songs.json          # Background and reel soundtrack metadata
|-- content/
|   |-- audio/              # Ambient background tracks and reel audio clips
|   `-- images/             # Screenshot references
|-- icons/                  # PWA and app SVG icons
`-- tools/                  # Data maintenance and curation utility scripts
```

---

## Local Development

To run the project locally without any dependencies or build tools:

1. Clone the repository:
   ```bash
   git clone https://github.com/BeginnerAman/ShayariVerse.git
   cd ShayariVerse
   ```

2. Start a local HTTP server using Python or Node:
   ```bash
   # Using Python 3
   python -m http.server 8080

   # Or using Node http-server
   npx http-server -p 8080
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

---

## Deployment to GitHub Pages

1. Commit and push your changes to the `main` branch:
   ```bash
   git add .
   git commit -m "Deploy ShayariVerse static web app"
   git push origin main
   ```

2. Go to the repository settings on GitHub:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment**, set **Source** to `Deploy from a branch`.
   - Select the `main` branch and `/ (root)` folder.
   - Click **Save**.

3. Your website will be live at:
   ```
   https://beginneraman.github.io/ShayariVerse/
   ```

---

## License

This project is open-source under the MIT License.
