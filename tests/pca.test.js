// Run with: node tests/pca.test.js   (no dependencies)
const assert = require('node:assert/strict');
global.window = {};
require('../pca.js');
const P = window.PCA;
const close = (a, b, tol = 1e-9, msg) =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg || ''} ${a} vs ${b}`);
let failed = 0;
function test(name, fn) {
  try { fn(); console.log('ok   -', name); }
  catch (e) { failed++; console.log('FAIL -', name, '\n    ', e.message); }
}

test('compute2D: axis-aligned, y-variance larger -> PC1 is y', () => {
  const r = P.compute2D([{x:-1,y:-5},{x:1,y:-5},{x:-1,y:5},{x:1,y:5}]);
  assert.deepEqual(r.eigvecs[0], [0, 1]);
  assert.ok(r.eigvals[0] > r.eigvals[1]);
});
test('compute2D: axis-aligned, x-variance larger -> PC1 is x', () => {
  const r = P.compute2D([{x:-5,y:-1},{x:5,y:-1},{x:-5,y:1},{x:5,y:1}]);
  assert.deepEqual(r.eigvecs[0], [1, 0]);
});
test('compute2D: identical points keep eigval order and finite output', () => {
  const r = P.compute2D([{x:1,y:1},{x:1,y:1}]);
  assert.ok(r.eigvals[0] >= r.eigvals[1]);
  assert.ok(r.varExplained.every(Number.isFinite));
});
test('compute2D: rotated data, eigenpair satisfies C v = lambda v', () => {
  const r = P.compute2D([{x:0,y:0},{x:1,y:1.1},{x:2,y:1.9},{x:3,y:3.2}]);
  const [[a, b], [, d]] = r.covMatrix, [vx, vy] = r.eigvecs[0];
  close(a * vx + b * vy, r.eigvals[0] * vx, 1e-9);
  close(b * vx + d * vy, r.eigvals[0] * vy, 1e-9);
});
test('compute3D: n<2 and empty input are finite', () => {
  for (const pts of [[], [{x:1,y:2,z:3}]]) {
    const r = P.compute3D(pts);
    for (const a of [r.mean, r.eigvals, r.varExplained, ...r.eigvecs]) assert.ok(a.every(Number.isFinite));
  }
});
test('computeND: n<2 and empty input do not throw / give NaN', () => {
  assert.doesNotThrow(() => P.computeND([]));
  const r = P.computeND([{x:[1,2,3]}]);
  assert.ok(r.eigvals.every(Number.isFinite));
  assert.deepEqual(r.mean, [1, 2, 3]);
});
test('compute3D / computeND agree and eigenvalues sum to trace', () => {
  const pts = P.generate3D(300, 0.5, 0.4, 0.1);
  const a = P.compute3D(pts);
  const b = P.computeND(pts.map(p => ({ x: [p.x, p.y, p.z] })));
  a.eigvals.forEach((v, i) => close(v, b.eigvals[i], 1e-9));
  close(a.varExplained.reduce((s, v) => s + v, 0), 1);
});
test('Jacobi is scale invariant (tiny data, 3D and ND)', () => {
  const pts = P.generate3D(300, 0.6, 0.3, 0.1);
  const ref = P.compute3D(pts);
  const k = 1e-8;
  const small = pts.map(p => ({ x: p.x * k, y: p.y * k, z: p.z * k }));
  const s3 = P.compute3D(small);
  const sN = P.computeND(small.map(p => ({ x: [p.x, p.y, p.z] })));
  ref.eigvals.forEach((v, i) => {
    close(s3.eigvals[i], v * k * k, 1e-6, '3D');
    close(sN.eigvals[i], v * k * k, 1e-6, 'ND');
  });
  ref.varExplained.forEach((v, i) => close(s3.varExplained[i], v, 1e-6, 'varExplained'));
});
test('reconstructND with all components reproduces the data', () => {
  const pts = P.generateScree(50);
  const rec = P.reconstructND(pts, P.computeND(pts), 5);
  pts.forEach((p, i) => p.x.forEach((v, j) => close(rec[i][j], v, 1e-8)));
});

if (failed) { console.log(`\n${failed} test(s) failed`); process.exit(1); }
console.log('\nall tests passed');
