// Copies the web build and makes its file paths work from any folder (share links, sub-paths).
// Why: Expo writes root paths like "/_expo/...", which break when the app is not at the domain root.

import fs from 'node:fs';
import path from 'node:path';

const FROM = 'dist-web';
const TO = 'dist-share';
const BASE = '(window.__ROAR_BASE__||"/")'; // JS expression: the page's folder URL

fs.rmSync(TO, { recursive: true, force: true });
fs.cpSync(FROM, TO, { recursive: true });
// Some hosts reserve folder names starting with "_", so "_expo/" becomes "expo/".
fs.renameSync(path.join(TO, '_expo'), path.join(TO, 'expo'));

// 1. In the JavaScript: "/_expo/x.js" → BASE+"expo/x.js", and "/assets/" → BASE+"assets/".
function fixScripts(folder) {
    for (const name of fs.readdirSync(folder)) {
        const file = path.join(folder, name);
        if (fs.statSync(file).isDirectory()) fixScripts(file);
        else if (name.endsWith('.js')) {
            const code = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(file, code.replaceAll('"/_expo/', `${BASE}+"expo/`).replaceAll('"/assets/', `${BASE}+"assets/`));
        }
    }
}
fixScripts(path.join(TO, 'expo'));

// 2. In index.html: remember the folder first, then load the scripts relative to it.
const htmlFile = path.join(TO, 'index.html');
const rememberBase = `<script>window.__ROAR_BASE__=location.href.replace(/[?#].*$/,"").replace(/[^/]*$/,"");</script>`;
const html = fs
    .readFileSync(htmlFile, 'utf8')
    .replace('<title>liveroom</title>', '<title>ROAR · IPL 2019 Final</title>')
    .replace('</head>', `${rememberBase}</head>`)
    .replaceAll('src="/_expo/', 'src="./expo/')
    .replaceAll('href="/favicon.ico"', 'href="./favicon.ico"');
fs.writeFileSync(htmlFile, html);

console.log(`Share build ready in ${TO}/ (open ${TO}/index.html from any folder)`);
