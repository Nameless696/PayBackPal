const fs = require('fs');
const path = require('path');

const sourceImg = 'C:/Users/shres/.gemini/antigravity/brain/ccfc4f60-d178-4484-b5ef-b1f0f5d012eb/media__1774811059345.png';
const resDir = path.join(__dirname, 'android/app/src/main/res');

const mipmaps = ['mipmap-hdpi', 'mipmap-mdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
const fnames = ['ic_launcher.png', 'ic_launcher_round.png'];

console.log('Injecting Brand New Nepali Rupee Logo into Native Android OS...');

mipmaps.forEach(dir => {
  const targetDir = path.join(resDir, dir);
  if (!fs.existsSync(targetDir)) return;
  
  fnames.forEach(fname => {
    const targetFile = path.join(targetDir, fname);
    if (fs.existsSync(sourceImg)) {
      try {
        fs.copyFileSync(sourceImg, targetFile);
        console.log(`Overwritten: ${dir}/${fname}`);
      } catch(e) {
        console.error(`Failed to overwrite ${targetFile}`);
      }
    } else {
      console.log('Source logo not found! Aborting.');
    }
  });
});

console.log('Done! Next time you run ./gradlew assembleRelease, the app icon will be officially upgraded.');
