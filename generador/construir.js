'use strict';
// Arma ../index.html a partir de plantilla.html y los niveles de bank.json.
// Uso: node generador/construir.js
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const tpl = fs.readFileSync(path.join(dir, 'plantilla.html'), 'utf8');
const bank = JSON.parse(fs.readFileSync(path.join(dir, 'bank.json'), 'utf8'));
if (!tpl.includes('/*BANK*/null')) throw new Error('La plantilla no tiene el marcador /*BANK*/null');
const page = tpl.replace('/*BANK*/null', () => JSON.stringify(bank));

const cut = page.indexOf('<div class="app"');
const head = page.slice(0, cut).trim();
const body = page.slice(cut).trim();

const out = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="description" content="Juego de lógica Suguru: 500 niveles en cinco dificultades, con notas, pistas y modo nocturno.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Suguru">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#EDEFF5">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0C0F17">
<link rel="manifest" href="manifest.webmanifest?v=3">
<link rel="apple-touch-icon" href="icons/suguru-claro-180.png">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-claro-32.png">
<style>
:root { color-scheme: light; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body { margin: 0; font: 14px system-ui, -apple-system, sans-serif; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>
${head}
</head>
<body>
${body}
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function () {}); });
}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(dir, '..', 'index.html'), out);
console.log('index.html listo,', Math.round(out.length / 1024), 'KB,', Object.values(bank).reduce((a, l) => a + l.length, 0), 'niveles');
