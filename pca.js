window.PCA = (function () {

  function randn() {
    let u, v;
    do { u = Math.random(); } while (u === 0);
    v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function generateCorrelated(n, rho, noise) {
    const L00 = 1, L10 = rho, L11 = Math.sqrt(Math.max(1 - rho * rho, 0));
    const pts = [];
    for (let i = 0; i < n; i++) {
      const z1 = randn(), z2 = randn();
      pts.push({
        id: i,
        x: L00 * z1 + noise * (Math.random() * 2 - 1),
        y: L10 * z1 + L11 * z2 + noise * (Math.random() * 2 - 1),
      });
    }
    return pts;
  }

  function compute2D(points) {
    const n = points.length;
    if (n < 2) return {
      mean: [0, 0], covMatrix: [[1, 0], [0, 1]],
      eigvals: [1, 1], eigvecs: [[1, 0], [0, 1]], varExplained: [0.5, 0.5],
    };

    let mx = 0, my = 0;
    for (const p of points) { mx += p.x; my += p.y; }
    mx /= n; my /= n;

    let cxx = 0, cyy = 0, cxy = 0;
    for (const p of points) {
      const dx = p.x - mx, dy = p.y - my;
      cxx += dx * dx; cyy += dy * dy; cxy += dx * dy;
    }
    cxx /= (n - 1); cyy /= (n - 1); cxy /= (n - 1);

    const trace = cxx + cyy;
    const det = cxx * cyy - cxy * cxy;
    const disc = Math.sqrt(Math.max((trace / 2) * (trace / 2) - det, 0));
    const eigval1 = trace / 2 + disc;
    let eigval2 = trace / 2 - disc;
    if (eigval2 < 1e-10) eigval2 = 1e-10;

    let ex, ey;
    if (Math.abs(cxy) < 1e-10) {
      ex = 1; ey = 0;
    } else {
      const vx = eigval1 - cyy, vy = cxy;
      const len = Math.sqrt(vx * vx + vy * vy);
      ex = vx / len; ey = vy / len;
    }
    const total = eigval1 + eigval2;
    const safeTotal = total > 1e-12 ? total : 1;

    return {
      mean: [mx, my],
      covMatrix: [[cxx, cxy], [cxy, cyy]],
      eigvals: [eigval1, eigval2],
      eigvecs: [[ex, ey], [-ey, ex]],
      varExplained: [eigval1 / safeTotal, eigval2 / safeTotal],
    };
  }

  function generate3D(n, rho_xz, rho_yz, noise) {
    // Cholesky of [[1,0,rho_xz],[0,1,rho_yz],[rho_xz,rho_yz,1]]
    const L = [
      [1, 0, 0],
      [0, 1, 0],
      [rho_xz, rho_yz, Math.sqrt(Math.max(1 - rho_xz * rho_xz - rho_yz * rho_yz, 0))],
    ];
    const pts = [];
    for (let i = 0; i < n; i++) {
      const z = [randn(), randn(), randn()];
      pts.push({
        id: i,
        x: L[0][0] * z[0] + noise * (Math.random() * 2 - 1),
        y: L[1][0] * z[0] + L[1][1] * z[1] + noise * (Math.random() * 2 - 1),
        z: L[2][0] * z[0] + L[2][1] * z[1] + L[2][2] * z[2] + noise * (Math.random() * 2 - 1),
      });
    }
    return pts;
  }

  function compute3D(points) {
    const n = points.length;
    let mx = 0, my = 0, mz = 0;
    for (const p of points) { mx += p.x; my += p.y; mz += p.z; }
    mx /= n; my /= n; mz /= n;

    let c = [[0,0,0],[0,0,0],[0,0,0]];
    for (const p of points) {
      const d = [p.x - mx, p.y - my, p.z - mz];
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          c[i][j] += d[i] * d[j];
    }
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        c[i][j] /= (n - 1);

    // Jacobi eigenvalue iteration
    let V = [[1,0,0],[0,1,0],[0,0,1]];
    for (let iter = 0; iter < 100; iter++) {
      let maxVal = 0, p = 0, q = 1;
      for (let i = 0; i < 3; i++)
        for (let j = i + 1; j < 3; j++)
          if (Math.abs(c[i][j]) > maxVal) { maxVal = Math.abs(c[i][j]); p = i; q = j; }
      if (maxVal < 1e-12) break;

      const theta = (c[q][q] - c[p][p]) / (2 * c[p][q]);
      const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const cs = 1 / Math.sqrt(t * t + 1), sn = t * cs;

      // Apply Givens rotation to c
      const newC = c.map(r => r.slice());
      for (let i = 0; i < 3; i++) {
        if (i !== p && i !== q) {
          newC[i][p] = newC[p][i] = cs * c[i][p] - sn * c[i][q];
          newC[i][q] = newC[q][i] = sn * c[i][p] + cs * c[i][q];
        }
      }
      newC[p][p] = cs * cs * c[p][p] - 2 * sn * cs * c[p][q] + sn * sn * c[q][q];
      newC[q][q] = sn * sn * c[p][p] + 2 * sn * cs * c[p][q] + cs * cs * c[q][q];
      newC[p][q] = newC[q][p] = 0;
      c = newC;

      // Accumulate eigenvectors
      const newV = V.map(r => r.slice());
      for (let i = 0; i < 3; i++) {
        newV[i][p] = cs * V[i][p] - sn * V[i][q];
        newV[i][q] = sn * V[i][p] + cs * V[i][q];
      }
      V = newV;
    }

    // Eigenvalues are diagonal of c, eigenvectors are columns of V
    const eigs = [0, 1, 2].map(i => ({ val: Math.max(c[i][i], 0), vec: [V[0][i], V[1][i], V[2][i]] }));
    eigs.sort((a, b) => b.val - a.val);
    const total = eigs.reduce((s, e) => s + e.val, 0);
    const safeTotal = total > 1e-12 ? total : 1;

    return {
      mean: [mx, my, mz],
      eigvals: eigs.map(e => e.val),
      eigvecs: eigs.map(e => e.vec),
      varExplained: eigs.map(e => e.val / safeTotal),
    };
  }

  function projectOntoPC1(points, eigvec1, mean) {
    return points.map(p => {
      const dx = p.x - mean[0], dy = p.y - mean[1];
      const scalar = dx * eigvec1[0] + dy * eigvec1[1];
      return {
        scalar,
        projPoint: [mean[0] + scalar * eigvec1[0], mean[1] + scalar * eigvec1[1]],
      };
    });
  }

  // ── N-dimensional PCA helpers ──────────────────────────────────────

  function generateScree(n) {
    // 5D data built from 2 dominant latent factors + noise
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = randn(), b = randn();
      pts.push({
        id: i,
        x: [
          2.0 * a + 0.15 * randn(),
          1.4 * a + 0.9 * b + 0.15 * randn(),
          0.6 * a + 1.3 * b + 0.15 * randn(),
                   0.5 * b + 0.40 * randn(),
          0.2 * a + 0.2 * b + 0.50 * randn(),
        ]
      });
    }
    return pts;
  }

  function computeND(points) {
    const n = points.length;
    const d = points[0].x.length;
    const mean = new Array(d).fill(0);
    for (const p of points) for (let i = 0; i < d; i++) mean[i] += p.x[i];
    for (let i = 0; i < d; i++) mean[i] /= n;

    let C = Array.from({ length: d }, () => new Array(d).fill(0));
    for (const p of points) {
      const dx = p.x.map((v, i) => v - mean[i]);
      for (let i = 0; i < d; i++)
        for (let j = 0; j < d; j++)
          C[i][j] += dx[i] * dx[j];
    }
    for (let i = 0; i < d; i++)
      for (let j = 0; j < d; j++)
        C[i][j] /= (n - 1);

    // Jacobi eigenvalue iteration (same algorithm as compute3D, generalized)
    let V = Array.from({ length: d }, (_, i) => { const r = new Array(d).fill(0); r[i] = 1; return r; });
    for (let iter = 0; iter < 200; iter++) {
      let maxVal = 0, p = 0, q = 1;
      for (let i = 0; i < d; i++)
        for (let j = i + 1; j < d; j++)
          if (Math.abs(C[i][j]) > maxVal) { maxVal = Math.abs(C[i][j]); p = i; q = j; }
      if (maxVal < 1e-12) break;
      const theta = (C[q][q] - C[p][p]) / (2 * C[p][q]);
      const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const cs = 1 / Math.sqrt(t * t + 1), sn = t * cs;
      const newC = C.map(r => r.slice());
      for (let i = 0; i < d; i++) {
        if (i !== p && i !== q) {
          newC[i][p] = newC[p][i] = cs * C[i][p] - sn * C[i][q];
          newC[i][q] = newC[q][i] = sn * C[i][p] + cs * C[i][q];
        }
      }
      newC[p][p] = cs*cs*C[p][p] - 2*sn*cs*C[p][q] + sn*sn*C[q][q];
      newC[q][q] = sn*sn*C[p][p] + 2*sn*cs*C[p][q] + cs*cs*C[q][q];
      newC[p][q] = newC[q][p] = 0;
      C = newC;
      const newV = V.map(r => r.slice());
      for (let i = 0; i < d; i++) {
        newV[i][p] = cs * V[i][p] - sn * V[i][q];
        newV[i][q] = sn * V[i][p] + cs * V[i][q];
      }
      V = newV;
    }
    const eigs = Array.from({ length: d }, (_, i) => ({ val: Math.max(C[i][i], 0), vec: V.map(r => r[i]) }));
    eigs.sort((a, b) => b.val - a.val);
    const total = eigs.reduce((s, e) => s + e.val, 0) || 1;
    return {
      mean,
      eigvals: eigs.map(e => e.val),
      eigvecs: eigs.map(e => e.vec),
      varExplained: eigs.map(e => e.val / total),
    };
  }

  function reconstructND(points, pca, k) {
    const { mean, eigvecs } = pca;
    const d = mean.length;
    return points.map(p => {
      const dx = p.x.map((v, i) => v - mean[i]);
      const scores = eigvecs.slice(0, k).map(v => dx.reduce((s, c, i) => s + c * v[i], 0));
      const recon = new Array(d).fill(0);
      for (let j = 0; j < k; j++)
        for (let i = 0; i < d; i++)
          recon[i] += scores[j] * eigvecs[j][i];
      return recon.map((v, i) => v + mean[i]);
    });
  }

  return { generateCorrelated, compute2D, generate3D, compute3D, projectOntoPC1, generateScree, computeND, reconstructND };
})();
