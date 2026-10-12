'use strict';
// Generador de niveles Suguru: regiones, solución, eliminación de pistas por lógica y clasificación.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POP = new Int8Array(64);
for (let m = 0; m < 64; m++) { let c = 0, x = m; while (x) { c += x & 1; x >>= 1; } POP[m] = c; }
const LOWBIT_DIGIT = (m) => 31 - Math.clz32(m & -m); // bit index (digit)

function geometry(R, C) {
  const N = R * C, orth = [], king = [];
  for (let i = 0; i < N; i++) {
    const r = (i / C) | 0, c = i % C;
    orth[i] = []; king[i] = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= R || cc >= C) continue;
      const j = rr * C + cc;
      king[i].push(j);
      if (!dr || !dc) orth[i].push(j);
    }
  }
  const kingSet = king.map((a) => new Set(a));
  return { R, C, N, orth, king, kingSet };
}

function shuffle(a, rand) {
  for (let i = a.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function pickWeighted(weights, rand) {
  let tot = 0; for (const k in weights) tot += weights[k];
  let x = rand() * tot;
  for (const k in weights) { x -= weights[k]; if (x <= 0) return +k; }
  return +Object.keys(weights).pop();
}

// ---------- Partición en regiones ----------
function partition(geo, rand, opt) {
  const { N, orth } = geo;
  const reg = new Int16Array(N).fill(-1);
  let nreg = 0;
  const unassignedDeg = (i) => { let d = 0; for (const j of orth[i]) if (reg[j] < 0) d++; return d; };
  for (;;) {
    let cands = [], best = 9;
    for (let i = 0; i < N; i++) if (reg[i] < 0) {
      const d = unassignedDeg(i);
      if (d < best) { best = d; cands = [i]; } else if (d === best) cands.push(i);
    }
    if (!cands.length) break;
    const start = cands[(rand() * cands.length) | 0];
    const target = pickWeighted(opt.sizeWeights, rand);
    const id = nreg++;
    reg[start] = id;
    const cells = [start];
    while (cells.length < target) {
      const front = [];
      for (const c of cells) for (const j of orth[c]) if (reg[j] < 0 && !front.includes(j)) front.push(j);
      if (!front.length) break;
      // preferir celdas que quedarían aisladas
      let fb = 9, fc = [];
      for (const j of front) { const d = unassignedDeg(j); const w = d <= 1 ? 0 : 1; if (w < fb) { fb = w; fc = [j]; } else if (w === fb) fc.push(j); }
      const pick = (rand() < 0.7 ? fc : front);
      const j = pick[(rand() * pick.length) | 0];
      reg[j] = id; cells.push(j);
    }
  }
  // fusionar regiones pequeñas
  let changed = true;
  while (changed) {
    changed = false;
    const sizes = new Array(nreg).fill(0);
    for (let i = 0; i < N; i++) sizes[reg[i]]++;
    for (let id = 0; id < nreg; id++) {
      if (sizes[id] === 0 || sizes[id] > 2) continue;
      if (sizes[id] === 2 && rand() < opt.keepPairs) continue;
      if (sizes[id] === 1 && rand() < opt.keepSingles) continue;
      const nb = new Set();
      for (let i = 0; i < N; i++) if (reg[i] === id) for (const j of orth[i]) if (reg[j] !== id) nb.add(reg[j]);
      const ok = [...nb].filter((o) => sizes[o] + sizes[id] <= opt.maxSize);
      if (!ok.length) continue;
      ok.sort((a, b) => sizes[a] - sizes[b]);
      const into = ok[0];
      for (let i = 0; i < N; i++) if (reg[i] === id) reg[i] = into;
      changed = true; break;
    }
  }
  // renumerar
  const map = new Map(); let k = 0;
  const out = new Int16Array(N);
  for (let i = 0; i < N; i++) { if (!map.has(reg[i])) map.set(reg[i], k++); out[i] = map.get(reg[i]); }
  return out;
}

function regionInfo(geo, reg) {
  const nreg = Math.max(...reg) + 1;
  const cells = Array.from({ length: nreg }, () => []);
  for (let i = 0; i < geo.N; i++) cells[reg[i]].push(i);
  const size = cells.map((c) => c.length);
  return { nreg, cells, size, reg };
}

// ---------- Solución aleatoria por backtracking ----------
function fillSolution(geo, ri, rand, nodeLimit) {
  const { N, king } = geo;
  const val = new Int8Array(N);
  const regUsed = new Int32Array(ri.nreg);
  let nodes = 0;
  function cand(i) {
    const s = ri.size[ri.reg[i]];
    let m = ((1 << (s + 1)) - 2) & ~regUsed[ri.reg[i]];
    for (const j of king[i]) if (val[j]) m &= ~(1 << val[j]);
    return m;
  }
  function rec(filled) {
    if (filled === N) return true;
    if (++nodes > nodeLimit) return false;
    let bi = -1, bm = 0, bc = 99;
    for (let i = 0; i < N; i++) if (!val[i]) {
      const m = cand(i), c = POP[m];
      if (c === 0) return false;
      if (c < bc) { bc = c; bi = i; bm = m; if (c === 1) break; }
    }
    const ds = [];
    for (let d = 1; d <= 5; d++) if (bm & (1 << d)) ds.push(d);
    shuffle(ds, rand);
    const r = ri.reg[bi];
    for (const d of ds) {
      val[bi] = d; regUsed[r] |= 1 << d;
      if (rec(filled + 1)) return true;
      val[bi] = 0; regUsed[r] &= ~(1 << d);
      if (nodes > nodeLimit) return false;
    }
    return false;
  }
  return rec(0) ? val : null;
}

// ---------- Resolutor lógico por niveles ----------
// tier 1: único candidato / único lugar en región
// tier 2: eliminación por vecindad (todas las posiciones de d en una región tocan la celda) + subconjuntos desnudos en región
// tier 3: subconjuntos desnudos en grupos de celdas mutuamente vecinas (2x2, pares, tríos)
// tier 4: contradicción a un nivel (probar un candidato y propagar con tiers 1-3)
function makeSolver(geo, ri) {
  const { N, king, kingSet } = geo;
  // cliques: pares adyacentes, tríos y bloques 2x2
  const cliques = [];
  {
    const { R, C } = geo;
    for (let r = 0; r < R - 1; r++) for (let c = 0; c < C - 1; c++) {
      const a = r * C + c, b = a + 1, d = a + C, e = d + 1;
      cliques.push([a, b, d, e]);
      cliques.push([a, b, d], [a, b, e], [a, d, e], [b, d, e]);
    }
    for (let i = 0; i < N; i++) for (const j of king[i]) if (j > i) cliques.push([i, j]);
  }
  // celdas vecinas a todas las de un grupo
  const commonNb = (arr) => {
    const res = [];
    for (const x of king[arr[0]]) {
      if (arr.includes(x)) continue;
      let ok = true;
      for (let k = 1; k < arr.length; k++) if (!kingSet[arr[k]].has(x)) { ok = false; break; }
      if (ok) res.push(x);
    }
    return res;
  };
  const cliqueNb = cliques.map(commonNb);

  function init(puz) {
    const val = new Int8Array(N), cand = new Int8Array(N);
    for (let i = 0; i < N; i++) cand[i] = (1 << (ri.size[ri.reg[i]] + 1)) - 2;
    const st = { val, cand, ok: true, placed: 0 };
    for (let i = 0; i < N; i++) if (puz[i]) {
      if (!(st.cand[i] & (1 << puz[i]))) { st.ok = false; return st; }
      place(st, i, puz[i]);
    }
    return st;
  }
  function place(st, i, d) {
    st.val[i] = d; st.cand[i] = 0; st.placed++;
    const b = ~(1 << d);
    for (const j of ri.cells[ri.reg[i]]) st.cand[j] &= b;
    for (const j of king[i]) st.cand[j] &= b;
  }
  function clone(st) { return { val: st.val.slice(), cand: st.cand.slice(), ok: st.ok, placed: st.placed }; }

  // devuelve true si hubo progreso; st.ok=false en contradicción
  function tier1(st) {
    let prog = false;
    for (let i = 0; i < N; i++) if (!st.val[i]) {
      const m = st.cand[i];
      if (!m) { st.ok = false; return true; }
      if (POP[m] === 1) { place(st, i, LOWBIT_DIGIT(m)); prog = true; }
    }
    for (let r = 0; r < ri.nreg; r++) {
      const cs = ri.cells[r], s = ri.size[r];
      for (let d = 1; d <= s; d++) {
        let cnt = 0, at = -1, done = false;
        for (const j of cs) { if (st.val[j] === d) { done = true; break; } if (st.cand[j] & (1 << d)) { cnt++; at = j; } }
        if (done) continue;
        if (cnt === 0) { st.ok = false; return true; }
        if (cnt === 1) {
          if (st.val[at]) { st.ok = false; return true; }
          place(st, at, d); prog = true;
        }
      }
    }
    return prog;
  }
  function tier2(st) {
    let prog = false;
    for (let r = 0; r < ri.nreg; r++) {
      const cs = ri.cells[r], s = ri.size[r];
      for (let d = 1; d <= s; d++) {
        const S = [];
        let done = false;
        for (const j of cs) { if (st.val[j] === d) { done = true; break; } if (st.cand[j] & (1 << d)) S.push(j); }
        if (done || !S.length) continue;
        for (const x of commonNb(S)) {
          if (ri.reg[x] === r) continue;
          if (st.cand[x] & (1 << d)) { st.cand[x] &= ~(1 << d); prog = true; if (!st.val[x] && !st.cand[x]) { st.ok = false; return true; } }
        }
      }
      // subconjuntos desnudos dentro de la región
      const un = cs.filter((j) => !st.val[j]);
      const n = un.length;
      if (n >= 3) {
        for (let mask = 1; mask < (1 << n) - 1; mask++) {
          const k = POP[mask & 63] + (mask >> 6 ? POP[mask >> 6] : 0);
          if (k < 2 || k > n - 1) continue;
          let uni = 0;
          for (let t = 0; t < n; t++) if (mask & (1 << t)) uni |= st.cand[un[t]];
          if (POP[uni] < k) { st.ok = false; return true; }
          if (POP[uni] === k) {
            for (let t = 0; t < n; t++) if (!(mask & (1 << t))) {
              const j = un[t];
              if (st.cand[j] & uni) { st.cand[j] &= ~uni; prog = true; if (!st.cand[j]) { st.ok = false; return true; } }
            }
          }
        }
      }
    }
    return prog;
  }
  function tier3(st) {
    let prog = false;
    for (let q = 0; q < cliques.length; q++) {
      const cl = cliques[q];
      let uni = 0, k = 0, anySolved = false;
      for (const j of cl) { if (st.val[j]) { anySolved = true; break; } uni |= st.cand[j]; k++; }
      if (anySolved) continue;
      if (POP[uni] < k) { st.ok = false; return true; }
      if (POP[uni] === k) {
        for (const x of cliqueNb[q]) {
          if (!st.val[x] && (st.cand[x] & uni)) { st.cand[x] &= ~uni; prog = true; if (!st.cand[x]) { st.ok = false; return true; } }
        }
      }
    }
    return prog;
  }
  function propagate(st, maxTier, stats) {
    for (;;) {
      if (!st.ok) return st;
      if (st.placed === N) return st;
      if (tier1(st)) { if (stats) stats[1]++; continue; }
      if (maxTier >= 2 && tier2(st)) { if (stats) stats[2]++; continue; }
      if (maxTier >= 3 && tier3(st)) { if (stats) stats[3]++; continue; }
      if (maxTier >= 4 && tier4(st)) { if (stats) stats[4]++; continue; }
      return st;
    }
  }
  function tier4(st) {
    let prog = false;
    for (let i = 0; i < N; i++) if (!st.val[i] && POP[st.cand[i]] >= 2) {
      for (let d = 1; d <= 5; d++) if (st.cand[i] & (1 << d)) {
        const t = clone(st);
        place(t, i, d);
        propagate(t, 3, null);
        if (!t.ok) {
          st.cand[i] &= ~(1 << d); prog = true;
          if (!st.cand[i]) { st.ok = false; return true; }
          return true; // volver a lógica simple
        }
      }
    }
    return prog;
  }
  function solve(puz, maxTier) {
    const stats = [0, 0, 0, 0, 0];
    const st = init(puz);
    if (!st.ok) return { solved: false, stats };
    propagate(st, maxTier, stats);
    return { solved: st.ok && st.placed === N, stats, val: st.val };
  }
  return { solve };
}

// ---------- Construcción de un nivel ----------
function buildPuzzle(R, C, cfg, rand) {
  const geo = geometry(R, C);
  for (let attempt = 0; attempt < 200; attempt++) {
    const reg = partition(geo, rand, cfg.part);
    const ri = regionInfo(geo, reg);
    const singles = ri.size.filter((s) => s === 1).length;
    if (singles > cfg.maxSingles) continue;
    if (ri.size.filter((s) => s === 5).length < cfg.minFives) continue;
    const sol = fillSolution(geo, ri, rand, 20000);
    if (!sol) continue;
    const solver = makeSolver(geo, ri);
    const puz = Array.from(sol);
    const order = shuffle([...Array(geo.N).keys()], rand);
    for (const i of order) {
      const keep = puz[i];
      puz[i] = 0;
      const res = solver.solve(puz, cfg.tier);
      if (!res.solved) puz[i] = keep;
    }
    // nivel requerido
    let need = 0;
    for (let t = 1; t <= 4; t++) if (solver.solve(puz, t).solved) { need = t; break; }
    if (need === 0) continue;
    if (need < cfg.minTier) continue;
    if (cfg.extraGivens) {
      const empties = order.filter((i) => !puz[i]);
      const add = Math.round(empties.length * cfg.extraGivens);
      for (let k = 0; k < add; k++) puz[empties[k]] = sol[empties[k]];
    }
    const fin = solver.solve(puz, cfg.tier);
    const s = fin.stats;
    const givens = puz.filter((x) => x).length;
    const score = s[1] + 4 * s[2] + 10 * s[3] + 30 * s[4] + (geo.N - givens) * 0.5;
    return { R, C, reg: Array.from(reg), sol: Array.from(sol), puz, need, givens, score, stats: s };
  }
  return null;
}

const enc = (n) => '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[n];

const LEVELS = [
  { key: 'principiante', R: 5, C: 5, tier: 1, minTier: 1, maxSingles: 2, minFives: 1, extraGivens: 0.18,
    part: { sizeWeights: { 2: 0.1, 3: 0.3, 4: 0.35, 5: 0.25 }, keepPairs: 0.5, keepSingles: 0.2, maxSize: 5 } },
  { key: 'facil', R: 6, C: 6, tier: 1, minTier: 1, maxSingles: 2, minFives: 2, extraGivens: 0.05,
    part: { sizeWeights: { 2: 0.08, 3: 0.22, 4: 0.35, 5: 0.35 }, keepPairs: 0.4, keepSingles: 0.15, maxSize: 5 } },
  { key: 'medio', R: 7, C: 7, tier: 2, minTier: 2, maxSingles: 2, minFives: 3,
    part: { sizeWeights: { 2: 0.06, 3: 0.2, 4: 0.34, 5: 0.4 }, keepPairs: 0.3, keepSingles: 0.1, maxSize: 5 } },
  { key: 'dificil', R: 8, C: 8, tier: 3, minTier: 3, maxSingles: 2, minFives: 5,
    part: { sizeWeights: { 2: 0.05, 3: 0.15, 4: 0.35, 5: 0.45 }, keepPairs: 0.25, keepSingles: 0.05, maxSize: 5 } },
  { key: 'experto', R: 9, C: 9, tier: 4, minTier: 4, maxSingles: 2, minFives: 7,
    part: { sizeWeights: { 2: 0.04, 3: 0.14, 4: 0.34, 5: 0.48 }, keepPairs: 0.2, keepSingles: 0.05, maxSize: 5 } },
];

module.exports = { mulberry32, geometry, partition, regionInfo, fillSolution, makeSolver, buildPuzzle, LEVELS, enc };

if (require.main === module) {
  const which = process.argv[2] || 'medio';
  const count = +(process.argv[3] || 5);
  const seed = +(process.argv[4] || 1);
  const cfg = LEVELS.find((l) => l.key === which);
  const rand = mulberry32(seed);
  const t0 = Date.now();
  const out = [];
  let tries = 0;
  while (out.length < count && tries < count * 50) {
    tries++;
    const p = buildPuzzle(cfg.R, cfg.C, cfg, rand);
    if (p) out.push(p);
  }
  const ms = Date.now() - t0;
  console.log(which, 'generados', out.length, 'en', ms, 'ms, intentos', tries);
  for (const p of out.slice(0, 3)) {
    console.log('need', p.need, 'givens', p.givens, '/', p.R * p.C, 'score', p.score.toFixed(1), 'stats', p.stats.join(','));
    for (let r = 0; r < p.R; r++) {
      let line = '';
      for (let c = 0; c < p.C; c++) line += enc(p.reg[r * p.C + c]).padStart(2) + (p.puz[r * p.C + c] || '.') + ' ';
      console.log(line);
    }
  }
  if (process.argv[5]) require('fs').writeFileSync(process.argv[5], JSON.stringify(out));
}
