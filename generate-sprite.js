const fs = require('fs');
const path = require('path');

const srcIconsDir = path.join(__dirname, 'backend', 'resources', 'icons');
const destIconsDir = path.join(__dirname, 'backend', 'public', 'assets', 'icons');
const outputFile = path.join(destIconsDir, 'sprite.svg');

// Ensure source directory exists
if (!fs.existsSync(srcIconsDir)) {
    fs.mkdirSync(srcIconsDir, { recursive: true });
}

// Ensure destination directory exists
if (!fs.existsSync(destIconsDir)) {
    fs.mkdirSync(destIconsDir, { recursive: true });
}

const files = fs.readdirSync(srcIconsDir).filter(f => f.endsWith('.svg'));

let spriteContent = '<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n';

files.forEach(file => {
    const id = file.replace('.svg', '');
    const content = fs.readFileSync(path.join(srcIconsDir, file), 'utf8');
    
    // Extract viewBox
    const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
    
    // Extract inner content (everything inside <svg ...> ... </svg>)
    let innerContent = content.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').trim();
    
    spriteContent += `  <symbol id="${id}" viewBox="${viewBox}">\n    ${innerContent}\n  </symbol>\n`;
});

spriteContent += '</svg>';

fs.writeFileSync(outputFile, spriteContent);
console.log('Sprite generated successfully at', outputFile);

