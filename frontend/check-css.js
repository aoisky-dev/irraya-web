const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const cssFile = path.join(srcDir, 'themes', 'atelier', 'theme.css');

const cssContent = fs.readFileSync(cssFile, 'utf8');

// Simple regex to find class names in CSS
const cssClassRegex = /\.([a-zA-Z0-9_-]+)/g;
const cssClasses = new Set();
let match;
while ((match = cssClassRegex.exec(cssContent)) !== null) {
  cssClasses.add(match[1]);
}

// Additional dynamic classes or pseudo-classes we can ignore
const ignoredClasses = new Set([
  'active', 'open', 'disabled', 'selected', 'out-of-stock',
  'fade-up-delay-1', 'fade-up-delay-2', 'fade-up-delay-3', 'fade-up-delay-4',
  'text-3xl', 'font-bold', 'mb-4', 'text-gray-600', 'mb-8' // Tailwind classes might be leftover somewhere? Let's see
]);

function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findTsxFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') && !filePath.includes('node_modules')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const tsxFiles = findTsxFiles(srcDir);
const missingClasses = new Map();
const tailwindLikeClasses = [];

const classNameRegex = /className=(?:\{`|["'])([^`"'}]+)(?:`\}|["'])/g;
// also handle clsx/classnames or arrays if any, but the above covers most hardcoded cases

for (const file of tsxFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = classNameRegex.exec(content)) !== null) {
    // split by space and handle dynamic parts very simply by ignoring them if they contain $
    const classes = match[1].split(/\s+/).filter(c => c && !c.includes('$'));
    for (const c of classes) {
      if (c.startsWith('text-') || c.startsWith('font-') || c.startsWith('mb-') || c.startsWith('mt-') || c.startsWith('p-') || c.startsWith('bg-')) {
        // Might be tailwind leftover, check if it's in our css
        if (!cssClasses.has(c) && !ignoredClasses.has(c) && !c.match(/text-(muted|primary|secondary|xs|sm|accent)/) && !c.match(/mt-(sm|md|lg)/)) {
           tailwindLikeClasses.push({ file, class: c });
        }
      }
      
      if (!cssClasses.has(c) && !ignoredClasses.has(c)) {
        if (!missingClasses.has(c)) {
          missingClasses.set(c, new Set());
        }
        missingClasses.get(c).add(path.relative(srcDir, file));
      }
    }
  }
}

console.log("=== Potentially Missing CSS Classes ===");
for (const [cls, files] of missingClasses.entries()) {
  if (cls.match(/^(text|font|mb|mt|p|bg)-/)) continue; // Handled below
  console.log(`Class '${cls}' used in: ${Array.from(files).join(', ')}`);
}

console.log("\n=== Tailwind-like left over classes ===");
for (const tc of tailwindLikeClasses) {
  console.log(`Class '${tc.class}' in ${path.relative(srcDir, tc.file)}`);
}
