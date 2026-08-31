# Content Folder - ShayariVerse

## कंटेंट कैसे डालें:

### 🖼️ Shayari Screenshots (`content/images/`)
- बस अपनी **सारी shayari screenshots** यहाँ डाल दो - **बस!**
- कोई भी फ़ाइल नाम चलेगा (`IMG_001.jpg`, `screenshot.png`, `WhatsApp Image.jpg` - कुछ भी)
- कोई naming convention नहीं, कोई numbering नहीं
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`
- AI script **automatically**:
  - ✅ हर image से shayari text extract करेगा (OCR)
  - ✅ Hindi (देवनागरी) को **Hinglish** में convert करेगा
  - ✅ Duplicate shayari detect करके skip करेगा
  - ✅ Unique ID assign करेगा
  - ✅ `data/shayaris.json` generate करेगा

---

### 🎵 Background Music (`content/audio/background/`)
- शायरी पढ़ते समय की ambient/soft music tracks (`.mp3`)
- लंबे ट्रैक्स (2-5 minutes) - ये लूप में चलेंगे।

### 🎶 Reel Songs (`content/audio/songs/`)
- छोटे song clips (15-30 seconds) - Instagram reels जैसे।
- फ़ाइल का नाम song के नाम पर: `tujhe-kitna-chahne-lage.mp3`
