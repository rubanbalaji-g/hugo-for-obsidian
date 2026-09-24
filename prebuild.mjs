import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(__dirname, 'content');

if (!fs.existsSync(contentDir)) {
  console.log('[prebuild] No content directory found, skipping.');
  process.exit(0);
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function checkFrontmatter(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(2048);
    const bytesRead = fs.readSync(fd, buffer, 0, 2048, 0);
    fs.closeSync(fd);
    const text = buffer.toString('utf8', 0, bytesRead);
    const match = text.match(FRONTMATTER_RE);
    if (!match) return { isMain: false, isFolder: false };
    const fm = match[1];
    const isMain = /(?:^|\n)\s*main\.index:\s*true/i.test(fm);
    const isFolder = /(?:^|\n)\s*folder\.index:\s*true/i.test(fm);
    return { isMain, isFolder };
  } catch (err) {
    return { isMain: false, isFolder: false };
  }
}

function processDirectory(dir, isRoot = false) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // First recurse into subdirectories
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      processDirectory(path.join(dir, entry.name), false);
    }
  }

  // Read markdown files in this directory
  const files = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isFile() && e.name.endsWith('.md'));

  let mainCandidate = null;
  let folderCandidate = null;

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    const { isMain, isFolder } = checkFrontmatter(fullPath);
    const lowerName = file.name.toLowerCase();

    if (isRoot) {
      if (isMain) {
        mainCandidate = fullPath;
      } else if (lowerName === 'index.md' && file.name !== '_index.md') {
        if (!mainCandidate) mainCandidate = fullPath;
      }
    } else {
      if (isFolder) {
        folderCandidate = fullPath;
      } else if (lowerName === 'index.md' && file.name !== '_index.md') {
        if (!folderCandidate) folderCandidate = fullPath;
      }
    }
  }

  if (isRoot && mainCandidate) {
    const target = path.join(dir, '_index.md');
    if (mainCandidate !== target) {
      console.log(`[prebuild] Routing root home note "${path.basename(mainCandidate)}" -> "_index.md"`);
      if (fs.existsSync(target)) fs.unlinkSync(target);
      fs.renameSync(mainCandidate, target);
    }
    // Clean up any conflicting leaf bundle index.md / Index.md at root
    for (const name of ['Index.md', 'index.md']) {
      const stray = path.join(dir, name);
      if (fs.existsSync(stray) && stray !== target) {
        console.log(`[prebuild] Removing conflicting leaf bundle "${name}" at root`);
        fs.unlinkSync(stray);
      }
    }
  }

  if (!isRoot && folderCandidate) {
    const target = path.join(dir, '_index.md');
    if (folderCandidate !== target) {
      console.log(`[prebuild] Routing section note "${path.basename(folderCandidate)}" in "${path.basename(dir)}" -> "_index.md"`);
      if (fs.existsSync(target)) fs.unlinkSync(target);
      fs.renameSync(folderCandidate, target);
    }
    // Clean up any conflicting leaf bundle index.md / Index.md in section folder
    for (const name of ['Index.md', 'index.md']) {
      const stray = path.join(dir, name);
      if (fs.existsSync(stray) && stray !== target) {
        console.log(`[prebuild] Removing conflicting leaf bundle "${name}" in "${path.basename(dir)}"`);
        fs.unlinkSync(stray);
      }
    }
  }
}

const CODE_BLOCK_RE = /(```[\s\S]*?```)|(`[^`\n]+`)/g;
const INDENTED_SUBLIST_RE = /^(\s*(?:>\s*)*\s+)(?:[a-zA-Z]|[ivxIVX]{1,4})\.\s+(.*)$/gm;

function normalizeSublistsInFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let matchCount = 0;

  const codeBlocks = [];
  let sanitized = original.replace(CODE_BLOCK_RE, (match) => {
    codeBlocks.push(match);
    return `%%%CODE_BLOCK_PRESERVE_${codeBlocks.length - 1}%%%`;
  });

  sanitized = sanitized.replace(INDENTED_SUBLIST_RE, (match, prefix, text) => {
    matchCount++;
    return `${prefix}1. ${text}`;
  });

  if (matchCount > 0) {
    sanitized = sanitized.replace(/%%%CODE_BLOCK_PRESERVE_(\d+)%%%/g, (_, idx) => codeBlocks[Number(idx)]);
    fs.writeFileSync(filePath, sanitized, 'utf8');
    console.log(`[prebuild] Normalized ${matchCount} sublist item(s) in "${path.basename(filePath)}"`);
  }
}

function normalizeAllMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      normalizeAllMarkdownFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      normalizeSublistsInFile(fullPath);
    }
  }
}

console.log('[prebuild] Normalizing index notes in content/...');
processDirectory(contentDir, true);
console.log('[prebuild] Normalizing indented sublists in content/...');
normalizeAllMarkdownFiles(contentDir);
console.log('[prebuild] Normalization complete.');
