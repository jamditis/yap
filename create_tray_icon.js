const fs = require('fs');
const path = require('path');

// A simple 16x16 red dot PNG
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBg+M+AB3Bxcf2f4e/v/4x4DGRjYwM1jI4GIBqG0TAgCcNoGFA0DAAA9w4W6r61f/kAAAAASUVORK5CYII=";
const buffer = Buffer.from(base64Png, 'base64');

fs.writeFileSync(path.join(__dirname, 'assets', 'tray.png'), buffer);
console.log("Tray icon created at assets/tray.png");
