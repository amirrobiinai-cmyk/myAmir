# Pampena promo (1080x1920, 9:16, 30 fps, 10.0 s)

- `index.html` – canvas scene; `window.render(t)` draws any time `t`.
- `audio.mjs` – synthesises the soundtrack (808 beat, whooshes, data clicks @4.5s, gold hit @8.8s) → `out/audio.wav`.
- `render.mjs` – renders 300 frames in headless Chromium and encodes with ffmpeg → `out/pampena_promo_1080x1920.mp4`.

```
npm i playwright   # or link a global install as node_modules
node audio.mjs && node render.mjs          # full video
node render.mjs --stills                   # preview PNGs in out/stills
```

Real footage: put transparent cutouts `presenter.png` and `nate.png` next to `index.html`
and they replace the stylised silhouettes (gold contour applied automatically).
