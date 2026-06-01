const fs = require('fs');
const path = require('path');

// Step 1: Copy logo.png to logo.jpg (keep original JPEG data, proper extension)
const src = path.join(__dirname, 'src', 'assets', 'logo.png');
const dst = path.join(__dirname, 'src', 'assets', 'logo.jpg');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dst);
  fs.unlinkSync(src);
  console.log('✅ Renamed logo.png → logo.jpg');
} else if (fs.existsSync(dst)) {
  console.log('✅ logo.jpg already exists');
} else {
  console.log('❌ No logo found!');
}

// Step 2: Verify
const check = fs.readFileSync(dst);
console.log('Header:', check[0] === 0xFF ? 'JPEG' : 'PNG', '| Size:', check.length);
