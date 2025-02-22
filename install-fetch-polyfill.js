const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'compat/sectionjs-compat.js');
const fileContent = fs.readFileSync(filePath, 'utf8');
const importStatement = "import 'whatwg-fetch';\n";
if (!fileContent.includes(importStatement)) {
    fs.writeFileSync(filePath, importStatement + fileContent);
    console.log("whatwg-fetch polyfill added to sectionjs-compat.js");
} else {
    console.log("whatwg-fetch polyfill already present in sectionjs-compat.js");
}