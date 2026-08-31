import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === "node_modules" || file === ".git" || file === ".gemini") return;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (/\.(html|js|json|css|md|txt)$/.test(file)) {
      results.push(full);
    }
  });
  return results;
}

const files = walk(ROOT);
let totalReplaced = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('\u2014') || content.includes('\u2013') || content.includes('-') || content.includes('-')) {
    const count = (content.match(/[\u2014\u2013]|-|-/g) || []).length;
    console.log(`Found ${count} dashes in ${path.relative(ROOT, file)}`);
    content = content.replace(/\u2014/g, '-');
    content = content.replace(/\u2013/g, '-');
    content = content.replace(/-/g, '-');
    content = content.replace(/-/g, '-');
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced += count;
  }
});
console.log(`\n✅ Total em/en-dashes replaced across all project files: ${totalReplaced}`);
