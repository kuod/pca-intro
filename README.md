# PCA — An Interactive Introduction

An interactive GitHub Pages site introducing Principal Component Analysis with live 2D and 3D visualizations.

**Live site:** https://kuod.github.io/pca-intro/

Built with [D3.js v7](https://d3js.org), [Three.js r145](https://threejs.org), and [highlight.js 11.9.0](https://highlightjs.org) (syntax highlighting for the Python and MATLAB examples in Section 5; the MATLAB grammar is loaded as an extra script).

All libraries come from the jsDelivr CDN, version-pinned, with Subresource Integrity (`integrity="sha384-..."` + `crossorigin="anonymous"`) on every tag. After bumping a version, recompute the hash:

```sh
curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
```

## Sections

1. The 2D Interactive Lab
2. Walk Me Through It
3. From 3D to 2D
4. The Math Behind It
5. PCA in Python & MATLAB
6. How Many Components Do I Need?

The site is two files: `index.html` (CSS, markup, page scripts) and `pca.js` (pure math, exposed as `window.PCA`). The `.nojekyll` file disables Jekyll processing on GitHub Pages.

## Development

No build step. Serve with `python3 -m http.server`. Run the math tests with `node tests/pca.test.js`.
