# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

QR-GENETATOR is a static, client-side-only QR code generator. There is no build step, no package manager, and no server — `index.html` is opened directly in a browser (including with no internet connection at all).

## Running / testing changes

There is no build or test tooling. To verify a change, open `index.html` directly in a browser (double-click, or `start index.html` on Windows) and exercise the form manually: enter a URL, optionally attach a logo, switch error-correction levels, and use the PNG/SVG download buttons.

## Architecture

- `index.html` — markup only. Loads local CSS/JS/fonts/vendor assets, no CDN references.
- `assets/css/style.css` — all styling.
- `assets/js/script.js` — all behavior, as a single IIFE. Key flow:
  - Reads the URL input and an optional logo file (via drag-drop or file picker, read with `FileReader`).
  - Renders the QR code onto `#qr-canvas` (500×500) using the vendored `QRCode` global (`QRCode.toCanvas` / `QRCode.toString`).
  - If a logo is present, error correction is force-locked to `H` (30%) and the radio inputs are disabled, since a center logo needs the highest error tolerance to remain scannable — see `updateEcLock()` and `currentEc()`.
  - The logo is composited onto the canvas after the QR draw, clipped into a rounded square sized at 30% of the QR (`drawLogo()`), with a white rounded-rect padding behind it so the logo doesn't touch QR modules directly.
  - SVG export (`QRCode.toString`) does not support the raster logo overlay, so the SVG download button is disabled whenever a logo is attached.
  - PNG download reads directly from the canvas via `toDataURL`.
- `assets/vendor/qrcode.min.js` — vendored copy of the `qrcode` npm package (UMD build, version 1.4.4 specifically). **Do not upgrade to 1.5.x** — that release dropped the UMD/global-window build and ships only a CommonJS bundle (`require`-based) that does not work from a plain `<script>` tag, which breaks QR generation silently (no console error, `QRCode` is just undefined). If re-vendoring, confirm the fetched file assigns `window.QRCode` before using it.
- `assets/fonts/` — vendored Google Fonts (Space Grotesk, IBM Plex Mono, Sarabun) as woff2 files plus `fonts.css`, downloaded so the page renders correctly fully offline. If fonts are ever re-fetched, `fonts.css` `src: url(...)` paths must stay relative to local filenames, not `fonts.gstatic.com` URLs.

## Constraints to preserve

- **No network calls at runtime.** Everything (QR library, fonts) must stay vendored locally — this is a deliberate requirement, not an oversight. Don't reintroduce CDN `<script>`/`<link>` tags.
- **500×500px output** and **30%-sized, rounded-corner center logo** are fixed product requirements, not arbitrary defaults — see `SIZE` and the `logoSize = SIZE * 0.30` calculation in `script.js`.
- UI copy is in Thai; keep new user-facing strings consistent with that.

## License

MIT (see `LICENSE`) — commercial use, modification, and redistribution are all permitted.
