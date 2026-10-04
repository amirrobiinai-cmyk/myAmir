# Pampena promo (1080x1920, 9:16, 30 fps, 10.0 s)

- `index.html` – canvas scene; `window.render(t)` draws any time `t`.
- `audio.mjs` – synthesises the soundtrack (808 beat, whooshes, data clicks @4.5s, gold hit @8.8s) → `out/audio.wav`.
- `render.mjs` – renders 300 frames in headless Chromium and encodes with ffmpeg → `out/pampena_promo_1080x1920.mp4`.

```
npm i playwright   # or link a global install as node_modules
node audio.mjs && node render.mjs          # full video
node render.mjs --stills                   # preview PNGs in out/stills
```

Footage: the presenter is cut out of the source clip with `cutout.py`
(rembg `u2net_human_seg`, `pip install "rembg[cpu]"`), which writes `footage/cut_####.png`
(git-ignored, ~450 MB). Edit map (output ← source): 0.0–2.0 ← 0.0, 2.0–4.5 ← 4.0,
4.5–7.0 ← 8.5, 7.0–8.8 ← 14.9 (Nate walks in from the left), 8.8–9.4 ← 24.15 (fist pump).

```
python3 cutout.py path/to/source.mp4   # once, before render.mjs
```
