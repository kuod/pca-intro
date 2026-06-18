# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A static single-page GitHub Pages site for interactively learning PCA. No build step, no package manager, no framework — just two files served directly.

**Live site:** https://dvkuo.github.io/pca-intro/

## Running locally

Open `index.html` directly in a browser, or serve it with any static server:

```sh
python3 -m http.server
```

The `.nojekyll` file disables Jekyll processing on GitHub Pages.

## Architecture

All code lives in two files:

- **`pca.js`** — exports a single global `window.PCA` object with pure math functions: `generateCorrelated`, `compute2D`, `generate3D`, `compute3D`, `projectOntoPC1`. No DOM access. Uses Box-Muller for normal samples and Jacobi iteration for 3D eigendecomposition (2D uses the closed-form quadratic formula).

- **`index.html`** — all CSS (CSS custom properties for the dark theme), HTML structure, and three self-contained JS IIFEs at the bottom:
  - **Section 1** (2D Interactive Lab): D3 scatter plot with draggable points, sliders for N/ρ/noise, covariance ellipse, PC arrows, scree plot, and live math reference. Exposes `window._getPoints()`, `window._getPCA2D()`, and `window._regenPoints()` for the walkthrough to consume.
  - **Section 2** (Walkthrough): Stepwise animation of the PCA algorithm (raw data → center → ellipse → eigenvectors → projection). Uses the same data points from Section 1 via the globals above.
  - **Section 3** (3D scene): Three.js point cloud with PCA plane and PC arrows. OrbitControls for rotate/zoom, animated camera flatten to view the PCA plane face-on.

Libraries are loaded from CDN (no local copies):
- D3.js v7 (`d3@7.9.0`)
- Three.js r145 (`three@0.145.0`) + OrbitControls

## Key design constraints

- No bundler or build tooling — keep it zero-dependency from a tooling perspective.
- The 2D PCA math is intentionally self-contained in `pca.js` (no linear algebra library) to keep the site lightweight.
- Section 2 re-uses the exact point set from Section 1 at walkthrough-start time; it does not stay in sync after that.
