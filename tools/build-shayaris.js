#!/usr/bin/env node

/* ============================================================
   build-shayaris.js - Content Ingestion Pipeline
   ShayariVerse Build Tool

   Purpose:
   1. Scan 'content/images/' for screenshot images
   2. Run Tesseract.js OCR to extract Hindi/English text
   3. Transliterate Hindi (Devanagari) → Hinglish (Roman)
   4. Deduplicate using Levenshtein distance (85%+ = duplicate)
   5. Auto-assign unique IDs (shayari-001, shayari-002, ...)
   6. Write clean structured data to 'data/shayaris.json'

   Usage:
     cd tools
     npm install
     npm run build            # Normal mode
     npm run build:verbose    # With detailed logs

   NOTE: This is a BUILD-TIME tool. It runs on your local machine
         via Node.js - NOT in the browser.
   ============================================================ */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWorker } from 'tesseract.js';

/* ---- Resolve paths ---- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT_DIR, 'content', 'images');
const OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'shayaris.json');

/* ---- Config ---- */
const VERBOSE = process.argv.includes('--verbose');
const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const DUPLICATE_THRESHOLD = 0.85; /* 85%+ similarity = duplicate */
const MIN_TEXT_LENGTH = 10; /* Skip extractions shorter than this */


/* ============================================================
   MAIN PIPELINE
   ============================================================ */

async function main() {
  console.log('\n✨ ShayariVerse Content Ingestion Pipeline\n');
  console.log('='.repeat(50));

  /* 1. Ensure directories exist */
  ensureDir(IMAGES_DIR);
  ensureDir(path.dirname(OUTPUT_FILE));

  /* 2. Scan for images */
  const imageFiles = scanImages(IMAGES_DIR);
  if (imageFiles.length === 0) {
    console.log('\n⚠️  No images found in content/images/');
    console.log('   Place screenshot images (.jpg, .png, .jpeg, .webp) there and re-run.');
    process.exit(0);
  }
  console.log(`\n📁 Found ${imageFiles.length} image(s) in content/images/\n`);

  /* 3. Load existing shayaris (to merge & dedupe against) */
  const existing = loadExisting();
  console.log(`📋 Existing shayaris in data/shayaris.json: ${existing.length}\n`);

  /* 4. Initialize Tesseract OCR worker (Hindi + English) */
  console.log('🔧 Initializing Tesseract.js OCR engine (hin+eng)...');
  const worker = await createWorker('hin+eng');
  console.log('✅ OCR engine ready.\n');

  /* 5. Process each image */
  const newShayaris = [];
  let skipped = 0;
  let duplicates = 0;
  let errors = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const imgPath = imageFiles[i];
    const imgName = path.basename(imgPath);
    console.log(`[${i + 1}/${imageFiles.length}] 🖼️  Processing: ${imgName}`);

    try {
      /* OCR extract */
      const rawText = await extractText(worker, imgPath);
      if (VERBOSE) console.log(`   Raw OCR: "${rawText.substring(0, 80)}..."`);

      /* Clean text */
      const cleaned = cleanText(rawText);
      if (cleaned.length < MIN_TEXT_LENGTH) {
        console.log(`   ⏩ Skipped - too short (${cleaned.length} chars)`);
        skipped++;
        continue;
      }

      /* Transliterate Hindi → Hinglish */
      const hinglish = transliterateToHinglish(cleaned);
      if (VERBOSE) console.log(`   Hinglish: "${hinglish.substring(0, 80)}..."`);

      /* Check for duplicates */
      const allTexts = [
        ...existing.map((s) => s.textHinglish || s.textHindi || ''),
        ...newShayaris.map((s) => s.textHinglish),
      ];
      if (isDuplicate(hinglish, allTexts)) {
        console.log(`   ⏩ Duplicate detected - skipped`);
        duplicates++;
        continue;
      }

      /* Auto-categorize */
      const category = autoDetectCategory(hinglish + ' ' + cleaned);

      /* Create shayari entry */
      const newEntry = {
        id: '', /* Assigned after merge */
        textHindi: containsDevanagari(cleaned) ? cleaned : '',
        textHinglish: hinglish,
        category: category,
        mood: category, /* Default mood = category */
        poet: 'Unknown',
        sourceImage: `content/images/${imgName}`,
        songId: null,
        songStart: 0,
        featured: false,
        dateAdded: new Date().toISOString().split('T')[0],
      };

      newShayaris.push(newEntry);
      console.log(`   ✅ Extracted - category: ${category}`);

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      errors++;
    }
  }

  /* 6. Terminate OCR worker */
  await worker.terminate();

  /* 7. Merge with existing & assign IDs */
  const merged = mergeAndAssignIds(existing, newShayaris);

  /* 8. Write output */
  writeOutput(merged);

  /* 9. Summary */
  console.log('\n' + '='.repeat(50));
  console.log('📊 Pipeline Summary:');
  console.log(`   Images scanned:    ${imageFiles.length}`);
  console.log(`   New extracted:     ${newShayaris.length}`);
  console.log(`   Duplicates found:  ${duplicates}`);
  console.log(`   Skipped (short):   ${skipped}`);
  console.log(`   Errors:            ${errors}`);
  console.log(`   Total in JSON:     ${merged.length}`);
  console.log(`\n✅ Output written to: data/shayaris.json`);
  console.log('='.repeat(50) + '\n');
}


/* ============================================================
   FILE SYSTEM HELPERS
   ============================================================ */

/**
 * Ensure a directory exists, create if missing.
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${path.relative(ROOT_DIR, dir)}`);
  }
}

/**
 * Scan a directory for supported image files.
 * @returns {string[]} Array of absolute file paths
 */
function scanImages(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return SUPPORTED_EXTS.includes(ext);
    })
    .sort()
    .map((f) => path.join(dir, f));
}

/**
 * Load existing shayaris from data/shayaris.json.
 * @returns {Object[]} Array of existing shayari objects
 */
function loadExisting() {
  try {
    if (!fs.existsSync(OUTPUT_FILE)) return [];
    const raw = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return data.shayaris || [];
  } catch {
    return [];
  }
}


/* ============================================================
   OCR (Tesseract.js)
   ============================================================ */

/**
 * Extract text from an image using Tesseract.js.
 * Uses Hindi + English language pack.
 * @param {Object} worker - Tesseract worker
 * @param {string} imagePath - Path to image file
 * @returns {Promise<string>} Extracted text
 */
async function extractText(worker, imagePath) {
  const { data: { text } } = await worker.recognize(imagePath);
  return text;
}


/* ============================================================
   TEXT CLEANING
   ============================================================ */

/**
 * Clean raw OCR output.
 * - Remove special characters / OCR noise
 * - Normalize whitespace
 * - Trim lines
 * @param {string} raw - Raw OCR text
 * @returns {string} Cleaned text
 */
function cleanText(raw) {
  return raw
    /* Remove common OCR noise characters */
    .replace(/[|{}\[\]<>~`@#$%^&*_+=\\]/g, '')
    /* Normalize quotes */
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    /* Remove page numbers, watermarks, URLs */
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/\b(page|pg)\s*\d+\b/gi, '')
    .replace(/@\S+/g, '')
    /* Collapse multiple whitespace */
    .replace(/[ \t]+/g, ' ')
    /* Clean up line breaks (collapse 3+ into 2) */
    .replace(/\n{3,}/g, '\n\n')
    /* Trim each line */
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}


/* ============================================================
   HINDI → HINGLISH TRANSLITERATION
   ============================================================ */

/**
 * Check if text contains Devanagari characters.
 */
function containsDevanagari(text) {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Transliterate Hindi (Devanagari) text to Hinglish (Roman script).
 * If text is already in Roman, returns as-is.
 *
 * Uses a character-level Devanagari → Roman mapping
 * based on ITRANS-like conventions commonly used in Hinglish.
 *
 * @param {string} text - Input text (Hindi or mixed)
 * @returns {string} Hinglish text
 */
function transliterateToHinglish(text) {
  if (!containsDevanagari(text)) return text;

  let result = '';
  const chars = [...text]; /* Handle Unicode properly */

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const code = char.codePointAt(0);

    /* Non-Devanagari character - keep as-is */
    if (code < 0x0900 || code > 0x097F) {
      result += char;
      continue;
    }

    /* Halant (virama) - suppress inherent 'a' */
    if (char === '्') {
      /* Remove trailing 'a' from previous consonant if present */
      if (result.endsWith('a')) {
        result = result.slice(0, -1);
      }
      continue;
    }

    /* Dependent vowel signs (matras) */
    if (MATRA_MAP[char] !== undefined) {
      /* Replace inherent 'a' with this vowel */
      if (result.endsWith('a')) {
        result = result.slice(0, -1);
      }
      result += MATRA_MAP[char];
      continue;
    }

    /* Anusvara, Visarga, Chandrabindu */
    if (char === 'ं') { result += 'n'; continue; }
    if (char === 'ः') { result += 'h'; continue; }
    if (char === 'ँ') { result += 'n'; continue; }

    /* Nukta (dot below) - modify previous consonant */
    if (char === '़') {
      /* Already handled by CONSONANT_MAP for nukta variants */
      continue;
    }

    /* Independent vowels */
    if (VOWEL_MAP[char]) {
      result += VOWEL_MAP[char];
      continue;
    }

    /* Consonants (with inherent 'a') */
    if (CONSONANT_MAP[char]) {
      result += CONSONANT_MAP[char];
      continue;
    }

    /* Devanagari digits */
    if (DIGIT_MAP[char]) {
      result += DIGIT_MAP[char];
      continue;
    }

    /* Punctuation */
    if (char === '।') { result += '.'; continue; }
    if (char === '॥') { result += '.'; continue; }

    /* Unknown - keep original */
    result += char;
  }

  /* Post-processing cleanup */
  result = result
    /* Fix common transliteration artifacts */
    .replace(/aa/g, 'aa')
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}


/* ---- Devanagari Mapping Tables ---- */

const VOWEL_MAP = {
  'अ': 'a',   'आ': 'aa',  'इ': 'i',   'ई': 'ee',
  'उ': 'u',   'ऊ': 'oo',  'ऋ': 'ri',
  'ए': 'e',   'ऐ': 'ai',  'ओ': 'o',   'औ': 'au',
  'ऑ': 'o',
};

const MATRA_MAP = {
  'ा': 'aa',  'ि': 'i',   'ी': 'ee',
  'ु': 'u',   'ू': 'oo',  'ृ': 'ri',
  'े': 'e',   'ै': 'ai',  'ो': 'o',   'ौ': 'au',
  'ॉ': 'o',
};

const CONSONANT_MAP = {
  /* Velars */
  'क': 'ka',  'ख': 'kha', 'ग': 'ga',  'घ': 'gha', 'ङ': 'nga',
  /* Palatals */
  'च': 'cha', 'छ': 'chha','ज': 'ja',  'झ': 'jha', 'ञ': 'nya',
  /* Retroflex */
  'ट': 'ta',  'ठ': 'tha', 'ड': 'da',  'ढ': 'dha', 'ण': 'na',
  /* Dental */
  'त': 'ta',  'थ': 'tha', 'द': 'da',  'ध': 'dha', 'न': 'na',
  /* Labial */
  'प': 'pa',  'फ': 'pha', 'ब': 'ba',  'भ': 'bha', 'म': 'ma',
  /* Semi-vowels */
  'य': 'ya',  'र': 'ra',  'ल': 'la',  'व': 'va',
  /* Sibilants & Aspirate */
  'श': 'sha', 'ष': 'sha', 'स': 'sa',  'ह': 'ha',
  /* Nukta variants (Urdu/Persian sounds) */
  'क़': 'qa',  'ख़': 'kha', 'ग़': 'ga',  'ज़': 'za',  'फ़': 'fa',
  'ड़': 'da',  'ढ़': 'dha',
};

const DIGIT_MAP = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};


/* ============================================================
   DUPLICATE DETECTION (Levenshtein Distance)
   ============================================================ */

/**
 * Calculate Levenshtein distance between two strings.
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
function levenshtein(a, b) {
  const la = a.length;
  const lb = b.length;

  /* Optimization: early return for empty strings */
  if (la === 0) return lb;
  if (lb === 0) return la;

  /* Create matrix */
  const matrix = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       /* deletion */
        matrix[i][j - 1] + 1,       /* insertion */
        matrix[i - 1][j - 1] + cost /* substitution */
      );
    }
  }

  return matrix[la][lb];
}

/**
 * Calculate similarity ratio between two strings (0 to 1).
 * 1 = identical, 0 = completely different.
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity ratio
 */
function similarity(a, b) {
  const aNorm = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const bNorm = b.toLowerCase().replace(/\s+/g, ' ').trim();

  if (aNorm === bNorm) return 1;
  if (aNorm.length === 0 || bNorm.length === 0) return 0;

  const dist = levenshtein(aNorm, bNorm);
  const maxLen = Math.max(aNorm.length, bNorm.length);
  return 1 - dist / maxLen;
}

/**
 * Check if a text is a duplicate of any existing text.
 * Uses Levenshtein distance - 85%+ similarity = duplicate.
 * @param {string} newText - New shayari text
 * @param {string[]} existingTexts - Array of existing texts
 * @returns {boolean} true if duplicate found
 */
function isDuplicate(newText, existingTexts) {
  for (const existing of existingTexts) {
    if (!existing) continue;
    const sim = similarity(newText, existing);
    if (sim >= DUPLICATE_THRESHOLD) {
      if (VERBOSE) console.log(`   Duplicate match (${(sim * 100).toFixed(1)}%): "${existing.substring(0, 40)}..."`);
      return true;
    }
  }
  return false;
}


/* ============================================================
   AUTO-CATEGORIZATION
   ============================================================ */

/**
 * Auto-detect category from shayari text using keyword matching.
 * @param {string} text - Shayari text (Hinglish or Hindi)
 * @returns {string} Detected category
 */
function autoDetectCategory(text) {
  const lower = text.toLowerCase();

  const CATEGORY_KEYWORDS = {
    love: [
      'mohabbat', 'pyaar', 'pyar', 'ishq', 'chahat', 'प्यार', 'मोहब्बत',
      'इश्क़', 'इश्क', 'चाहत', 'dil', 'दिल', 'ashiq', 'humsafar', 'beloved',
    ],
    romantic: [
      'baahon', 'baahein', 'hothon', 'nazron', 'nazarein', 'chand', 'sanam',
      'jaaneman', 'jaan', 'kiss', 'बाहों', 'होंठों', 'नज़रें', 'चांद',
    ],
    sad: [
      'dard', 'dukh', 'aansu', 'aankhein', 'tanha', 'tanhai', 'judai',
      'alvida', 'bichad', 'toota', 'टूटा', 'दर्द', 'दुख', 'आंसू',
      'तन्हा', 'तनहाई', 'जुदाई', 'अलविदा', 'rona', 'रोना', 'gham', 'ग़म',
    ],
    motivational: [
      'himmat', 'hausla', 'sapna', 'sapne', 'udaan', 'jeet', 'hosla',
      'kamyabi', 'kamyaab', 'ummeed', 'umeed', 'हिम्मत', 'हौसला',
      'सपना', 'उड़ान', 'जीत', 'कामयाबी', 'उम्मीद', 'zid', 'मंज़िल', 'manzil',
    ],
    dosti: [
      'dost', 'dosti', 'yaar', 'yaari', 'saathi', 'दोस्त', 'दोस्ती',
      'यार', 'यारी', 'साथी', 'friend',
    ],
    funny: [
      'haha', 'joke', 'maza', 'mazak', 'mazaak', 'comedy', 'hasna',
      'hansi', 'मज़ाक', 'हंसी', 'funny', 'lol',
    ],
    zindagi: [
      'zindagi', 'zindgi', 'duniya', 'waqt', 'samay', 'pal',
      'ज़िन्दगी', 'ज़िंदगी', 'दुनिया', 'वक़्त', 'समय', 'पल',
      'safar', 'raaste', 'maut', 'life',
    ],
  };

  let bestCategory = 'zindagi'; /* Default fallback */
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}


/* ============================================================
   MERGE & ID ASSIGNMENT
   ============================================================ */

/**
 * Merge new shayaris with existing, assign sequential IDs.
 * Preserves existing entries and appends new ones.
 * @param {Object[]} existing - Existing shayari entries
 * @param {Object[]} newEntries - Newly extracted entries
 * @returns {Object[]} Merged array with updated IDs
 */
function mergeAndAssignIds(existing, newEntries) {
  const merged = [...existing, ...newEntries];

  /* Assign sequential IDs to ALL entries */
  merged.forEach((entry, index) => {
    entry.id = `shayari-${String(index + 1).padStart(3, '0')}`;
  });

  return merged;
}


/* ============================================================
   OUTPUT
   ============================================================ */

/**
 * Write the final shayaris.json.
 * @param {Object[]} shayaris - Complete shayari array
 */
function writeOutput(shayaris) {
  const output = {
    _meta: {
      generatedAt: new Date().toISOString(),
      totalCount: shayaris.length,
      tool: 'build-shayaris.js',
      note: 'Auto-generated by content ingestion pipeline. Manual edits welcome.',
    },
    shayaris: shayaris,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
}


/* ============================================================
   RUN
   ============================================================ */

main().catch((err) => {
  console.error('\n❌ Pipeline failed:', err);
  process.exit(1);
});
