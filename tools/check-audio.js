import fs from 'fs';

const files = [
  'content/audio/songs/track-1.mp3',
  'content/audio/songs/track-2.mp3',
  'content/audio/songs/track-3.mp3'
];

for (const file of files) {
  const buf = fs.readFileSync(file);
  console.log(`\nFile: ${file}`);
  console.log('Size:', buf.length);
  console.log('Hex:', buf.subarray(0, 32).toString('hex'));
  console.log('ASCII:', buf.subarray(0, 32).toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
}
