#!/usr/bin/env node

/* ============================================================
   clean-shayaris.js - OCR Text Cleanup Script
   
   Cleans garbage from OCR-extracted shayaris:
   - Removes first 15 dummy entries
   - Removes OCR noise (A�, random numbers, emoji artifacts, 
     TikTok/Snapchat metadata, "Original sound" text, etc.)
   - Formats text as proper poetry with line breaks
   - Removes poet attribution
   - Removes sourceImage field
   - Re-indexes IDs
   ============================================================ */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'data', 'shayaris.json');
const OUTPUT = INPUT; // overwrite

const raw = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

/* 1. Remove first 15 dummy entries */
let shayaris = raw.shayaris.slice(15);
console.log(`Removed 15 dummy entries. Remaining: ${shayaris.length}`);

/* 2. Clean each entry */
shayaris = shayaris.map((s) => {
  let text = s.textHinglish || '';
  
  /* Remove common OCR garbage patterns */
  text = text
    /* Unicode garbage */
    .replace(/[�?]+/g, '')
    .replace(/A\u0300/g, '')
    .replace(/[®©¢°]/g, '')
    /* TikTok / Snapchat / Instagram metadata */
    .replace(/\b\d+(\.\d+)?K?\b\s*(likes?|views?|comments?|shares?)?/gi, '')
    .replace(/Original\s+sound\s*[--]\s*\S+/gi, '')
    .replace(/Original\s+sound\s+\S+/gi, '')
    .replace(/@\S+/g, '')
    .replace(/\b(BLU|uee|Xl;?|JANN|Fo\)|Eo,?\s*ES|YX\))\b/gi, '')
    .replace(/L\.K\.G\.\.\.\d+/g, '')
    .replace(/cute\d+\s*Ni/gi, '')
    /* Random numbers / codes that aren't part of shayari */
    .replace(/^\d+\s*:\s*\d+s?\s*/gm, '')
    .replace(/\b\d+\)\s*\d*\s*[A-Z]?\b/g, '')
    .replace(/\(\s*\d+\s*\)/g, '')
    .replace(/\bof\s+\d/g, '')
    .replace(/\bod\s+of\b/gi, '')
    /* Common noise words from OCR */
    .replace(/\b(kaka|Hayee kyaa shaayaree hain\.\.\.?)\b/gi, '')
    .replace(/\bhee\s+i\b/gi, '')
    .replace(/\bAP$/gm, '')
    .replace(/\bVv\b/g, '')
    .replace(/\bhu\s+\d+\b/gi, '')
    .replace(/\bSE\b(?=\s+to\b)/gi, '')
    .replace(/\bFl\.\b/g, '')
    .replace(/\bSl\b/g, '')
    .replace(/\bRe[sl]\s+bi\s+Fh\b/gi, '')
    .replace(/\bhs\?\b/gi, '')
    .replace(/\b8\s+Mere\b/g, 'Mere')
    .replace(/\bke\s*\(e0\b/g, '')
    .replace(/\bmre\s+A\b/gi, '')
    .replace(/\baabhaamishi\b/gi, '')
    .replace(/siladi/gi, '')
    .replace(/\bmittarr\b/gi, 'mitr')
    .replace(/\bphata\b/gi, '')
    .replace(/\bnava\b/gi, '')
    .replace(/\bpie\b(?=\s+")/gi, '')
    .replace(/\bdai\s+li\s+nd\b/gi, '')
    .replace(/\bAc\s+Ac\b/gi, '')
    .replace(/\bEdy\b/gi, '')
    .replace(/\baukaata\s+5\b/gi, 'aukaat')
    .replace(/\bArAr\s+rel\b/gi, '')
    .replace(/\b(889)\b/g, '')
    .replace(/\btumhen\s+\(\s+\)/g, 'tumhen')
    .replace(/\b\(9\b/g, '')
    .replace(/\b76\s+2\b/g, '')
    .replace(/\bgha9\b/g, 'gaye')
    .replace(/\bShee\b/gi, '')
    .replace(/\bLg\b(?=\s+Bas)/g, '')
    .replace(/\bSa\s+Mai\b/g, 'Main')
    .replace(/\bYY\s*'\s*\|/g, '')
    .replace(/\bfihenA/gi, 'f hain')
    .replace(/\b30\s+February\b/g, '30 February')
    /* Clean up "I am not shayar but..." type headers */
    .replace(/^I am not shayar but\.\.\.?\s*/i, '')
    .replace(/^see,\s*/i, '')
    /* Clean stray single letters/noise at line boundaries */
    .replace(/\b[A-Z]\s*$/gm, '')
    .replace(/^\s*[A-Z]\s+/gm, '')
    .replace(/\bHe\b(?=\s+bhoola)/gi, '')
    .replace(/\bdel\b/g, '')
    /* Quoted wrapping artifacts */
    .replace(/^["'"'\s]+|["'"'\s]+$/g, '')
    /* Multiple spaces, pipes to newlines */
    .replace(/\s*\|\s*/g, '\n')
    .replace(/\.\.\.\s*/g, '...\n')
    .replace(/!!\s*/g, '!!\n')
    .replace(/\s{2,}/g, ' ')
    /* Clean up line breaks */
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2) /* Remove very short garbage lines */
    .join('\n')
    .trim();

  return {
    id: s.id,
    textHindi: '', /* Clear Hindi - OCR Hindi is too noisy */
    textHinglish: text,
    category: s.category,
    mood: s.category,
    poet: '', /* Remove poet attribution per user request */
    songId: null,
    songStart: 0,
    featured: false,
    dateAdded: s.dateAdded || '2026-08-31',
  };
});

/* 3. Remove entries that are too short or too garbled */
shayaris = shayaris.filter((s) => {
  const text = s.textHinglish;
  /* Must be at least 20 chars */
  if (text.length < 20) { console.log(`REMOVED (too short): ${text}`); return false; }
  /* Count readable words */
  const words = text.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 5) { console.log(`REMOVED (too few words): ${text.substring(0, 50)}`); return false; }
  return true;
});

/* 4. Re-index IDs */
shayaris.forEach((s, i) => {
  s.id = `shayari-${String(i + 1).padStart(3, '0')}`;
});

/* Mark some as featured (spread across categories) */
const categories = [...new Set(shayaris.map(s => s.category))];
categories.forEach(cat => {
  const catShayaris = shayaris.filter(s => s.category === cat);
  if (catShayaris.length > 0) {
    catShayaris[0].featured = true;
  }
});

/* 5. Write output */
const output = {
  shayaris: shayaris
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');

console.log(`\n✅ Cleaned! Final count: ${shayaris.length}`);
console.log('Category breakdown:');
const counts = {};
shayaris.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});
