# 3. Code Standards - Shayari Website

## 3.1 HTML Standards

### Semantic Structure:
- Use semantic tags: `<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`.
- Each shayari card is an `<article>` with `role="article"` and `lang="hi"` attribute.
- All images have descriptive `alt` text in Hindi.
- Use `<picture>` with WebP + JPEG fallback for all shayari images.

### Accessibility:
- All interactive elements must be keyboard navigable (`tabindex`, `aria-label`).
- Audio controls must have `aria-label` descriptions.
- Color contrast ratio ≥ 4.5:1 for all text.
- `prefers-reduced-motion` media query must disable animations for users who need it.

---

## 3.2 CSS Standards

### File Naming:
- CSS files: `kebab-case.css` (e.g., `global.css`, `animations.css`).
- CSS Custom Properties (variables) for ALL colors, spacing, fonts - no hardcoded values.

### Custom Properties Convention:
```css
:root {
  /* Colors */
  --clr-bg-primary: #0a0a0f;
  --clr-text-primary: #f0e6d3;
  --clr-accent: #c084fc;       /* Purple/Violet for poetry mood */
  --clr-accent-glow: #a855f7;

  /* Typography */
  --font-shayari: 'Kalam', 'Noto Nastaliq Urdu', cursive;
  --font-ui: 'Poppins', sans-serif;
  --font-size-base: clamp(1rem, 2.5vw, 1.125rem);

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --space-xl: 4rem;

  /* Animation */
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 200ms;
  --duration-normal: 400ms;
  --duration-slow: 800ms;
}
```

### Animation Rules:
- ✅ **ONLY animate:** `transform`, `opacity`, `filter`, `clip-path`.
- ❌ **NEVER animate:** `width`, `height`, `top`, `left`, `margin`, `padding`, `border`.
- Always use `will-change` sparingly - only on elements currently animating.
- Use `@media (prefers-reduced-motion: reduce)` to disable all motion.

### Responsive Approach:
- **Mobile-first** - Base styles are for mobile (< 640px).
- Breakpoints: `640px` (tablet), `1024px` (desktop), `1440px` (large desktop).
- Use `clamp()` for fluid typography and spacing.
- Never use fixed pixel widths on containers - use `max-width` + `margin: auto`.

---

## 3.3 JavaScript Standards

### File Naming:
- JS files: `kebab-case.js` (e.g., `audio-controller.js`, `shayari-loader.js`).
- Use ES6 modules (`type="module"` in script tags).

### Code Style:
- `const` by default, `let` only when reassignment is needed. Never `var`.
- Arrow functions for callbacks. Regular functions for top-level declarations.
- Template literals for string interpolation - no string concatenation with `+`.
- Destructuring for objects and arrays.
- Always use strict equality (`===`).

### DOM Manipulation Rules:
- ✅ **Event delegation** on parent containers - never attach listeners to individual cards.
- ✅ **`documentFragment`** or `innerHTML` for bulk DOM insertions.
- ✅ **`requestAnimationFrame`** for any visual updates.
- ❌ **Never** use `document.write()`.
- ❌ **Never** query the DOM inside loops - cache references.
- ❌ **Never** force synchronous layout (read then write in same frame).

### Performance Patterns:
- **Debounce** search input (300ms).
- **Throttle** scroll handlers (16ms = 60fps).
- **IntersectionObserver** for lazy loading - never use scroll position math.
- **`requestIdleCallback`** for non-critical work (pre-loading next batch of shayaris).

---

## 3.4 Banned Patterns
- ❌ No jQuery - we use vanilla JS.
- ❌ No Bootstrap - we write custom CSS.
- ❌ No `!important` in CSS (except for accessibility overrides).
- ❌ No inline `style` attributes in HTML.
- ❌ No inline `onclick` handlers - use `addEventListener`.
- ❌ No `setTimeout` for animations - use CSS transitions or `requestAnimationFrame`.
- ❌ No synchronous `XMLHttpRequest` - use `fetch` with `async/await`.
- ❌ No `alert()`, `confirm()`, or `prompt()` - use custom modals.
