#!/usr/bin/env node
/**
 * Issue 7: Generate launcher icons from the ORIGINAL logo.jpg asset.
 * Uses sharp (if available) or copies the source logo directly.
 * Run: npm install sharp --save-dev && node generate-icons.js
 *   OR: node generate-icons.js  (copies logo.jpg as-is if sharp not available)
 */
const fs = require('fs');
const path = require('path');

const SIZES = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

const logoPath = path.join(__dirname, 'src', 'assets', 'logo.jpg');
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(logoPath)) {
  console.error('❌ logo.jpg not found at', logoPath);
  process.exit(1);
}

async function generate() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('⚠️  sharp not installed — copying logo.jpg directly to all densities.');
    console.log('   For proper resizing, run: npm install sharp --save-dev');
    const logoData = fs.readFileSync(logoPath);
    for (const [folder] of Object.entries(SIZES)) {
      const dir = path.join(resDir, folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'ic_launcher.png'), logoData);
      fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), logoData);
      console.log(`✅ ${folder}: copied logo.jpg`);
    }
    console.log('\n🎉 All launcher icons set from original logo!');
    return;
  }

  // Use sharp to properly resize
  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(resDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const png = await sharp(logoPath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), png);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), png);
    console.log(`✅ ${folder}: ${size}x${size} (${png.length} bytes)`);
  }

  console.log('\n🎉 All launcher icons generated from original logo!');
}

generate().catch(e => { console.error('❌', e.message); process.exit(1); });
