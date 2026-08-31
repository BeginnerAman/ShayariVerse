# 5. UI Context & Design System - Shayari Website

## 5.1 Visual Identity & Mood

### Design Philosophy:
> "हर शायरी एक अहसास है - वेबसाइट को भी अहसास बनना है।"

- **Mood:** Premium, poetic, emotional, immersive - like reading poetry by candlelight.
- **Feel:** Magazine-quality editorial layout meets Instagram's visual polish.
- **Motion:** Gentle, flowing, never jarring - like turning pages of a beautiful book.

---

## 5.2 Color Palette (CSS Custom Properties)

### Dark Theme (Default):
```css
:root[data-theme="dark"] {
  --clr-bg-primary:     #06060a;        /* Deep midnight black */
  --clr-bg-secondary:   #0f0f18;        /* Card backgrounds */
  --clr-bg-elevated:    #1a1a2e;        /* Modals, elevated surfaces */
  --clr-bg-glass:       rgba(15, 15, 24, 0.7); /* Glassmorphism panels */

  --clr-text-primary:   #f0e6d3;        /* Warm cream - soft on eyes */
  --clr-text-secondary: #a89f91;        /* Muted warm gray */
  --clr-text-faded:     #5c564e;        /* Metadata, timestamps */

  --clr-accent:         #c084fc;        /* Purple - poetry mood */
  --clr-accent-hover:   #a855f7;        /* Purple hover state */
  --clr-accent-glow:    rgba(168, 85, 247, 0.25); /* Glow effects */
  --clr-accent-warm:    #fb923c;        /* Orange - for highlights */

  --clr-border:         rgba(255, 255, 255, 0.06);
  --clr-divider:        rgba(255, 255, 255, 0.04);
}
```

### Light Theme:
```css
:root[data-theme="light"] {
  --clr-bg-primary:     #faf8f5;        /* Warm off-white */
  --clr-bg-secondary:   #ffffff;
  --clr-bg-elevated:    #f5f0eb;
  --clr-text-primary:   #1a1612;        /* Warm dark brown */
  --clr-text-secondary: #6b5e52;
  --clr-accent:         #7c3aed;        /* Deeper purple for contrast */
}
```

### Sepia Theme (Reading Mode):
```css
:root[data-theme="sepia"] {
  --clr-bg-primary:     #f4ecd8;        /* Old paper/parchment */
  --clr-bg-secondary:   #efe5cc;
  --clr-text-primary:   #3d2b1f;        /* Deep brown ink */
  --clr-accent:         #b45309;        /* Amber/burnt orange */
}
```

---

## 5.3 Typography System

### Font Stack:
```css
:root {
  --font-shayari:    'Kalam', 'Noto Nastaliq Urdu', 'Noto Sans Devanagari', cursive;
  --font-heading:    'Playfair Display', 'Noto Serif Devanagari', serif;
  --font-ui:         'Poppins', 'Inter', sans-serif;
  --font-mono:       'JetBrains Mono', monospace;
}
```

### Type Scale (Fluid with `clamp()`):
| Token | Mobile | Desktop | CSS |
|-------|--------|---------|-----|
| `--text-xs` | 11px | 12px | `clamp(0.6875rem, 0.6rem + 0.25vw, 0.75rem)` |
| `--text-sm` | 13px | 14px | `clamp(0.8125rem, 0.75rem + 0.25vw, 0.875rem)` |
| `--text-base` | 15px | 17px | `clamp(0.9375rem, 0.85rem + 0.35vw, 1.0625rem)` |
| `--text-lg` | 18px | 22px | `clamp(1.125rem, 0.95rem + 0.6vw, 1.375rem)` |
| `--text-xl` | 22px | 30px | `clamp(1.375rem, 1rem + 1.2vw, 1.875rem)` |
| `--text-2xl` | 28px | 42px | `clamp(1.75rem, 1.2rem + 1.8vw, 2.625rem)` |
| `--text-hero` | 36px | 64px | `clamp(2.25rem, 1.5rem + 3vw, 4rem)` |

### Shayari Text Styling:
```css
.shayari-text {
  font-family: var(--font-shayari);
  font-size: var(--text-xl);
  line-height: 2;                       /* Extra line height for poetry */
  letter-spacing: 0.02em;
  text-align: center;
  color: var(--clr-text-primary);
  text-shadow: 0 0 40px var(--clr-accent-glow);
}
```

---

## 5.4 Animation Library

### Scroll Reveal (Cards entering viewport):
```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity var(--duration-slow) var(--ease-smooth),
              transform var(--duration-slow) var(--ease-smooth);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Shayari Card Hover (Desktop):
```css
.shayari-card {
  transition: transform var(--duration-normal) var(--ease-smooth),
              box-shadow var(--duration-normal) var(--ease-smooth);
}
.shayari-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
              0 0 40px var(--clr-accent-glow);
}
```

### Page Transition (Fade + Slide):
```css
.page-enter {
  animation: pageIn var(--duration-slow) var(--ease-smooth) forwards;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Floating Particles (Background Decoration):
```css
.particle {
  position: fixed;
  border-radius: 50%;
  background: var(--clr-accent);
  opacity: 0.08;
  animation: float 20s infinite ease-in-out;
  pointer-events: none;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(100px, -150px) scale(1.1); }
  50%      { transform: translate(-50px, -300px) scale(0.9); }
  75%      { transform: translate(80px, -150px) scale(1.05); }
}
```

### Text Shimmer (Featured Shayari):
```css
.shimmer-text {
  background: linear-gradient(
    120deg,
    var(--clr-text-primary) 0%,
    var(--clr-accent) 50%,
    var(--clr-text-primary) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 5.5 Component Design Tokens

### Shayari Card:
```
Background:    var(--clr-bg-secondary)
Border:        1px solid var(--clr-border)
Border-radius: 16px
Padding:       24px 20px
Box-shadow:    0 4px 20px rgba(0,0,0,0.2)
Backdrop-blur: 12px (for glass variant)
```

### Audio Player Bar (Fixed Bottom):
```
Background:    var(--clr-bg-glass) + backdrop-blur(20px)
Height:        64px (mobile), 72px (desktop)
Border-top:    1px solid var(--clr-border)
Progress bar:  Height 3px, accent color, smooth transition
Controls:      Play/Pause (40px), Volume, Track name (marquee if long)
```

### Reels View:
```
Full viewport height:  100dvh (dynamic viewport height)
Scroll-snap:           scroll-snap-type: y mandatory
Each reel:             scroll-snap-align: start
Background:            Gradient based on shayari mood
Transition:            Smooth vertical slide with parallax text
```

---

## 5.6 Responsive Strategy

### Mobile (< 640px):
- Single column layout.
- Bottom navigation bar (Home, Browse, Reels, Favorites).
- Full-width shayari cards.
- Audio player docked at bottom above nav.
- Swipe gestures enabled.

### Tablet (640px - 1024px):
- 2-column masonry grid for shayari cards.
- Side panel for audio controls.
- Larger typography.

### Desktop (> 1024px):
- 3-column masonry grid.
- Sidebar navigation.
- Hover effects enabled.
- Keyboard shortcuts (← → for navigation, Space for play/pause).

---

## 5.7 Micro-interactions & Delight
- ❤️ **Favorite button:** Heart fills with a pop + particle burst animation.
- 📋 **Copy button:** Checkmark appears with a satisfying scale-bounce.
- 🔊 **Volume slider:** Smooth gradient fill as volume increases.
- 🌙 **Theme toggle:** Sun/Moon icon morphs with a rotation animation.
- ✨ **Loading state:** Gentle pulse animation on skeleton cards (not a spinner).
