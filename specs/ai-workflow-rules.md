# 4. AI Workflow Rules - Shayari Website

## 4.1 Operating Discipline

### Rule 1: One Page / One Feature at a Time
- Build ONE complete HTML page or ONE JS module per task cycle.
- Do not jump between files. Finish, verify, then move to the next.
- Order: `global.css` → `index.html` → `browse.html` → `reels.html` → JS modules.

### Rule 2: Always Verify After Changes
After creating or modifying any file:
- Open the HTML file directly in a browser - does it render correctly?
- Check the browser DevTools Console - are there any errors?
- Test on mobile viewport (375px width) - does it look good?
- Test audio playback - does it start/stop/fade correctly?

### Rule 3: No Hallucinated Dependencies
- Only use libraries listed in `architecture.md` (Howler.js via CDN is the only external JS library).
- Do NOT add any npm packages, build tools, or bundlers.
- Do NOT import from CDNs not approved in the architecture spec.

### Rule 4: Content Pipeline Discipline
When processing the `content/images/` folder:
1. Scan ALL images (`.jpg`, `.png`, `.jpeg`, `.webp`) - **any filename accepted**, no naming convention needed.
2. Run OCR (Tesseract.js) on each image to extract shayari text.
3. **Hinglish conversion:** If extracted text is in Devanagari (Hindi), transliterate to Hinglish (Roman script). Store BOTH versions.
4. **Preserve original text exactly** - no spelling corrections, no grammar fixes. जैसी लिखी है वैसी ही रखनी है।
5. Run duplicate check (Levenshtein distance > 85% similarity = duplicate → skip).
6. Auto-assign unique IDs: `shayari-001`, `shayari-002`, etc.
7. Auto-detect category/mood from keywords if possible (love, sad, motivational, etc.).
8. Generate `data/shayaris.json` with this schema:

```json
{
  "shayaris": [
    {
      "id": "shayari-001",
      "textHindi": "मोहब्बत में ज़रूरी थोड़ी है\nकि हर बात कही जाए...",
      "textHinglish": "mohabbat mein zaroori thodi hai\nki har baat kahi jaaye...",
      "category": "love",
      "mood": "romantic",
      "poet": "Unknown",
      "sourceImage": "IMG_20260831_001.jpg",
      "songId": null,
      "songStart": 0,
      "featured": false,
      "dateAdded": "2026-08-31"
    }
  ]
}
```

**Note:** `textHinglish` is the PRIMARY display text on the website. `textHindi` is kept for search and fallback.

### Rule 5: Audio Pairing Logic
- Each shayari in reels mode CAN be paired with a song from `data/songs.json`.
- The `songStart` field (in seconds) defines WHERE in the song to start playing - this enables perfect sync.
- If no song is paired, use the ambient background track.
- Songs schema:

```json
{
  "songs": [
    {
      "id": "tujhe-kitna-chahne-lage",
      "title": "Tujhe Kitna Chahne Lage",
      "file": "content/audio/songs/tujhe-kitna-chahne-lage.mp3",
      "duration": 28,
      "mood": "romantic"
    }
  ]
}
```

---

## 4.2 Performance Verification Checklist
Before marking any phase complete, verify:
- [ ] Lighthouse Performance Score > 90 (mobile).
- [ ] No Cumulative Layout Shift (CLS = 0).
- [ ] First Contentful Paint < 1.5s on 4G throttled.
- [ ] All animations run at 60fps (check DevTools Performance tab).
- [ ] No console errors or warnings.
- [ ] Works offline after first visit (Service Worker caching).

---

## 4.3 Clarification Protocol
If a design/feature decision is unclear:
- **DO NOT invent business logic** - flag it as a question.
- **DO NOT add extra features** not mentioned in `project-overview.md`.
- **DO provide 2-3 options** with pros/cons for the user to choose from.
