# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A static single-page GitHub Pages site for interactively learning PCA. No build step, no package manager, no framework — just two files served directly (`index.html`, `pca.js`). `tests/pca.test.js` is a dependency-free Node test for `pca.js`.

**Live site:** https://kuod.github.io/pca-intro/

## Running locally and tests

Open `index.html` directly in a browser, or serve it with any static server:

```sh
python3 -m http.server
```

Run the math tests with `node tests/pca.test.js`.

The `.nojekyll` file disables Jekyll processing on GitHub Pages.

## Architecture

All code lives in two files:

- **`pca.js`** — exports a single global `window.PCA` object with pure math functions: `generateCorrelated`, `compute2D`, `generate3D`, `compute3D`, `projectOntoPC1`, `generateScree`, `computeND`, `reconstructND`. No DOM access. Uses Box-Muller for normal samples and Jacobi iteration for 3D eigendecomposition (2D uses the closed-form quadratic formula).

- **`index.html`** — all CSS (CSS custom properties for the dark theme), HTML structure, and self-contained JS blocks at the bottom (Section 5 is a static code listing; Section 4 is filled live from Section 1):
  - **Section 1** (2D Interactive Lab): D3 scatter plot with draggable points, sliders for N/ρ/noise, covariance ellipse, PC arrows, scree plot, and live math reference. Exposes `window._getPoints()`, `window._getPCA2D()`, and `window._regenPoints()` for the walkthrough to consume.
  - **Section 2** (Walkthrough): Stepwise animation of the PCA algorithm (raw data → center → ellipse → eigenvectors → projection). Uses the same data points from Section 1 via the globals above.
  - **Section 3** (3D scene): Three.js point cloud with PCA plane and PC arrows. OrbitControls for rotate/zoom, animated camera flatten to view the PCA plane face-on.
  - **Section 4** (The Math Behind It): live math reference; fills `#math-cov` and `#math-eig` from the 2D lab's current PCA.
  - **Section 5** (PCA in Python & MATLAB): static Python/MATLAB code tabs, highlighted by highlight.js.
  - **Section 6** (Elbow method): scree plot over 5D data from `generateScree`/`computeND`, with live reconstruction via `reconstructND`.

Libraries are loaded from jsDelivr (no local copies). The stylesheet is in `<head>`; the scripts are at the bottom of `index.html`, before `pca.js`:
- highlight.js 11.9.0 theme: `highlight.js@11.9.0/styles/github-dark.min.css`
- highlight.js 11.9.0 core: `@highlightjs/cdn-assets@11.9.0/highlight.min.js`
- highlight.js MATLAB grammar: `@highlightjs/cdn-assets@11.9.0/languages/matlab.min.js` (MATLAB is not in the default bundle, so it is loaded separately)
- D3.js v7: `d3@7.9.0/dist/d3.min.js`
- Three.js r145: `three@0.145.0/build/three.min.js` + `three@0.145.0/examples/js/controls/OrbitControls.js`

highlight.js highlights the Python and MATLAB code blocks in Section 5 via `hljs.highlightAll()` (wrapped in try/catch so a CDN failure cannot break the tabs).

### CDN integrity (SRI)

Every CDN `<script>` and `<link rel="stylesheet">` tag is version-pinned (exact version in the URL, never `@latest`/`@7`) and carries `integrity="sha384-..."` plus `crossorigin="anonymous"`. When bumping a version, update the URL and recompute the hash for that exact URL:

```sh
curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
```

Prefix the output with `sha384-` in the `integrity` attribute. Keep core and language scripts on the same highlight.js version.

## Key design constraints

- No bundler or build tooling — keep it zero-dependency from a tooling perspective.
- The 2D PCA math is intentionally self-contained in `pca.js` (no linear algebra library) to keep the site lightweight.
- Section 2 re-uses the exact point set from Section 1 at walkthrough-start time; it does not stay in sync after that.
