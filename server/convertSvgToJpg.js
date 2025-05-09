const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, 'assets', 'default-book-cover.svg');
const jpgPath = path.join(__dirname, 'assets', 'default-book-cover.jpg');

// Read the SVG file
const svgBuffer = fs.readFileSync(svgPath);

// Convert SVG to JPG
sharp(svgBuffer)
  .jpeg({
    quality: 90,
    chromaSubsampling: '4:4:4'
  })
  .toFile(jpgPath)
  .then(() => {
    console.log(`Successfully converted SVG to JPG: ${jpgPath}`);
  })
  .catch(err => {
    console.error('Error converting SVG to JPG:', err);
  });
