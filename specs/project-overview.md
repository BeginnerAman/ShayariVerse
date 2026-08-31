# 1. Project Overview - Shayari Website

## 1.1 Executive Summary
**Project Name:** ✨ ShayariVerse - Premium Hindi/Urdu Poetry Experience  
**Tagline:** "पढ़ो, सुनो, महसूस करो"  
**Target Audience:** Hindi/Urdu poetry lovers (18-45 age group), social media poetry enthusiasts, people who share shayari on Instagram/WhatsApp.  
**Hosting:** GitHub Pages (Static Site - HTML, CSS, JavaScript only)  
**Content Source:** Owner-managed `content/` folder with text files and images of shayari.

---

## 1.2 Core Purpose & Problem Statement
There are thousands of shayari pages on social media, but no **single, dedicated, beautiful website** that:
- Presents shayari as an **art form** (not just plain text on a white background).
- Lets users **listen to background music** while reading poetry for an immersive experience.
- Provides **reel-style short song clips** paired with shayari (like Instagram reels but dedicated to poetry).
- Works **offline-smooth** on every device without any lag.

---

## 1.3 Core User Flows

### Flow 1: Browse & Read Shayari
1. User lands on a visually stunning homepage with featured shayari.
2. User scrolls through categories (Love / Sad / Motivational / Funny / Zindagi / Dosti, etc.).
3. Each shayari card appears with beautiful typography, subtle animations, and a matching mood background.
4. User taps a card to see the full shayari in an immersive full-screen reading view.

### Flow 2: Listen & Feel (Background Music Mode)
1. User enables "Mood Music" - a soft ambient track starts playing in the background.
2. As user scrolls through shayari, the music creates a poetic atmosphere.
3. User controls: Play/Pause, Volume, Skip Track, Mute.

### Flow 3: Reels-Style Experience (Short Songs + Shayari)
1. User enters "Reels Mode" - vertical swipe/scroll experience.
2. Each shayari is paired with a short song clip (15-30 seconds, like Instagram reels).
3. Song auto-plays when shayari comes into view, pauses when swiped away.
4. Smooth transitions, perfect audio sync, no buffering lag.

### Flow 4: User Controls & Personalization
- 🔤 **Font Size** - Increase/Decrease text size
- 🌙 **Theme** - Dark / Light / Sepia (reading mode)
- ❤️ **Favorites** - Save shayari to a local favorites list (localStorage)
- 📋 **Copy** - One-tap copy shayari text to clipboard
- 📤 **Share** - Share shayari as text or beautiful image card to WhatsApp/Instagram
- 🔍 **Search** - Search shayari by keyword, poet name, or mood
- 🔀 **Random** - "Surprise me" button for a random shayari

---

## 1.4 Content Pipeline (How Shayari Gets Added)

### IMPORTANT: सारी शायरी Screenshots से आएगी!
Owner बस **screenshots (images)** `content/images/` फ़ोल्डर में डालेगा - बस!
- ❌ कोई manual text file बनाने की ज़रूरत नहीं।
- ❌ कोई file naming convention follow करने की ज़रूरत नहीं (जो भी नाम हो चलेगा)।
- ✅ AI/OCR script हर image से shayari text **automatically extract** करेगा।
- ✅ Auto-generated unique ID और category assign करेगा।

```
content/
├── images/            ← बस screenshots डालो (कोई भी नाम, .jpg/.png/.jpeg/.webp)
│   ├── IMG_20260831_001.jpg
│   ├── screenshot_12.png
│   ├── WhatsApp Image 2026-08-31.jpg
│   └── ... (सैकड़ों screenshots)
├── audio/
│   ├── background/    ← Ambient/mood music tracks (.mp3)
│   │   ├── soft-piano.mp3
│   │   └── rainy-mood.mp3
│   └── songs/         ← Short reel-style song clips (.mp3)
│       ├── tujhe-kitna-chahne-lage.mp3
│       └── tera-ban-jaunga.mp3
└── shayaris.json      ← AUTO-GENERATED from images (never edit manually)
```

### Content Processing Rules:
1. **Screenshot → Text (OCR):** Build script हर image को read करेगा और shayari text extract करेगा।
2. **Hinglish Conversion:** अगर shayari **Hindi (देवनागरी)** में है, तो उसे **Hinglish (Roman script)** में convert करके store करना है। जैसे:
   - Image में: `मोहब्बत में ज़रूरी थोड़ी है`
   - Store होगा: `mohabbat mein zaroori thodi hai`
   - **BOTH versions रखनी हैं** - original Hindi + Hinglish transliteration (search दोनों में काम करे)
3. **Exactly As Written:** जो लिखा है वैसा ही रखना है - spelling, style, punctuation सब same।
4. **Auto-Naming:** File का नाम कुछ भी हो - script auto-generate करेगा unique ID (`shayari-001`, `shayari-002`, etc.)
5. **Duplicate Detection:** हर नई shayari को existing entries से compare करना (85%+ similarity = duplicate, skip करो)।
6. **Bulk Processing:** एक बार में 100+ screenshots process हो सकें - कोई manual intervention नहीं।

---

## 1.5 Strict Out-of-Scope (v1)
- ❌ **No backend / No database** - Everything is static JSON + localStorage.
- ❌ **No user accounts / login** - No authentication system.
- ❌ **No comments / social features** - No user-generated content.
- ❌ **No paid APIs** - No Google Cloud Vision, no OpenAI API calls at runtime.
- ❌ **No CMS** - Content is managed via file system, not a dashboard.
- ❌ **No ads** - Clean, distraction-free experience.

---

## 1.6 Success Criteria
- ✅ Loads in < 2 seconds on 4G mobile connection.
- ✅ 60 FPS animations with zero layout shift (CLS = 0).
- ✅ Looks magazine-quality beautiful on phone, tablet, and laptop.
- ✅ Audio plays smoothly with no clicks, pops, or buffering.
- ✅ 100+ shayari browsable with instant search.
- ✅ "Dekhte hi rehne ka mann kare" - The website should be so beautiful that users just keep scrolling.
