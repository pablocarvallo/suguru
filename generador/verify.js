// Verificación independiente: reglas de la solución y unicidad por fuerza bruta.
const bank = require(require('path').join(__dirname, 'bank.json'));
const dims = { principiante: 5, facil: 6, medio: 7, dificil: 8, experto: 9 };
const dec = (ch) => '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(ch);
let bad = 0, total = 0;
for (const [k, list] of Object.entries(bank)) {
  const n = dims[k];
  for (const [li, s] of list.entries()) {
    total++;
    const [rg, pz, so] = s.split('|');
    const reg = [...rg].map(dec), puz = [...pz].map((c) => (c === '.' ? 0 : +c)), sol = [...so].map(Number);
    const N = n * n, size = {};
    reg.forEach((r) => (size[r] = (size[r] || 0) + 1));
    const nb = (i) => { const r = (i / n) | 0, c = i % n, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const a = r + dr, b = c + dc; if (a >= 0 && b >= 0 && a < n && b < n) o.push(a * n + b); } return o; };
    // regiones conexas y tamaño <= 5
    let ok = Object.values(size).every((x) => x <= 5);
    // solución válida
    for (let i = 0; i < N && ok; i++) {
      if (sol[i] < 1 || sol[i] > size[reg[i]]) ok = false;
      for (const j of nb(i)) if (sol[j] === sol[i]) ok = false;
      for (let j = 0; j < N; j++) if (j !== i && reg[j] === reg[i] && sol[j] === sol[i]) ok = false;
      if (puz[i] && puz[i] !== sol[i]) ok = false;
    }
    // unicidad
    const val = puz.slice(); let count = 0;
    const cand = (i) => { let m = 0; for (let d = 1; d <= size[reg[i]]; d++) m |= 1 << d; for (let j = 0; j < N; j++) if (reg[j] === reg[i] && val[j]) m &= ~(1 << val[j]); for (const j of nb(i)) if (val[j]) m &= ~(1 << val[j]); return m; };
    const rec = () => { if (count > 1) return; let bi = -1, bm = 0, bc = 9; for (let i = 0; i < N; i++) if (!val[i]) { const m = cand(i); let c = 0; for (let d = 1; d <= 5; d++) if (m & (1 << d)) c++; if (!c) return; if (c < bc) { bc = c; bi = i; bm = m; } } if (bi < 0) { count++; return; } for (let d = 1; d <= 5; d++) if (bm & (1 << d)) { val[bi] = d; rec(); val[bi] = 0; } };
    rec();
    if (!ok || count !== 1) { bad++; console.log('PROBLEMA', k, li + 1, ok, count); }
  }
}
console.log('verificados', total, 'con problemas', bad);
