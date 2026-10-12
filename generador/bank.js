'use strict';
// Genera el banco de niveles: 100 por dificultad, ordenados de más fácil a más difícil.
const { mulberry32, buildPuzzle, LEVELS, enc } = require('./gen.js');
const fs = require('fs');

const PER = 100, POOL = 130;
const bank = {};
for (const cfg of LEVELS) {
  const rand = mulberry32(20261012 + cfg.R * 977);
  const seen = new Set();
  const pool = [];
  let tries = 0;
  const t0 = Date.now();
  while (pool.length < POOL && tries < POOL * 20) {
    tries++;
    const p = buildPuzzle(cfg.R, cfg.C, cfg, rand);
    if (!p) continue;
    const key = p.reg.map(enc).join('');
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(p);
  }
  pool.sort((a, b) => a.score - b.score);
  const pick = [];
  for (let k = 0; k < PER; k++) pick.push(pool[Math.round((k * (pool.length - 1)) / (PER - 1))]);
  bank[cfg.key] = pick.map((p) => p.reg.map(enc).join('') + '|' + p.puz.map((x) => x || '.').join('') + '|' + p.sol.join(''));
  const g = pick.map((p) => p.givens);
  console.log(cfg.key, `${cfg.R}x${cfg.C}`, 'pool', pool.length, 'en', Date.now() - t0, 'ms',
    'pistas', Math.min(...g), '-', Math.max(...g), 'score', pick[0].score.toFixed(0), '→', pick[PER - 1].score.toFixed(0));
}
fs.writeFileSync(require('path').join(__dirname, 'bank.json'), JSON.stringify(bank));
console.log('bytes', fs.statSync(require('path').join(__dirname, 'bank.json')).size);
