const fs = require('fs');
const path = require('path');

const base64RedDot = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAACpJREFUOE9jZGBgYGjAAgYxMDDw/xnFGDDYgFFyQGNgZWAaAjQYAgBh2x/7c5b6pAAAAABJRU5ErkJggg==";
const buffer = Buffer.from(base64RedDot, 'base64');

fs.writeFileSync(path.join(__dirname, 'assets', 'placeholder.png'), buffer);
console.log("Placeholder icon created at assets/placeholder.png");
