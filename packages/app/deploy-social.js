const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'out');
const dest = path.join('C:', 'Users', 'Muttee Sheikh', 'clawd', 'Projects', 'TacitProtocol-Site', 'social');

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const item of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, item);
    const d = path.join(destDir, item);
    if (fs.statSync(s).isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// Clean old social dir
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}

copyRecursive(src, dest);
console.log('Deployed to', dest);
