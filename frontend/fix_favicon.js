const sharp = require('sharp');
const path = require('path');

const iconPath = path.join(__dirname, 'src/app/icon.png');
const tempPath = path.join(__dirname, 'src/app/icon_square.png');

sharp(iconPath)
  .resize(584, 584, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 0 }
  })
  .toFile(tempPath)
  .then(() => {
    console.log("Successfully squared the favicon!");
    const fs = require('fs');
    fs.renameSync(tempPath, iconPath);
  })
  .catch(err => {
    console.error("Error squaring favicon:", err);
  });
