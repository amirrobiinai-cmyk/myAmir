"""Extracts the edit's source segments from the uploaded clip and writes RGBA cutouts
(person segmentation with rembg u2net_human_seg) as footage/cut_####.png, one per output frame.
Usage: python3 cutout.py <source.mp4>"""
import sys, os, subprocess, numpy as np, cv2
from rembg import remove, new_session

SRC = sys.argv[1]
FPS = 30
# (output start s, source start s, duration s)
EDIT = [(0.0, 0.0, 2.0), (2.0, 4.0, 2.5), (4.5, 8.5, 2.5), (7.0, 14.9, 1.8), (8.8, 24.15, 0.6)]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "footage")
os.makedirs(OUT, exist_ok=True)
sess = new_session("u2net_human_seg")

def frames(start, dur):
    cmd = ["ffmpeg", "-loglevel", "error", "-ss", f"{start}", "-i", SRC, "-t", f"{dur}",
           "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = 1080 * 1080 * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield np.frombuffer(b, np.uint8).reshape(1080, 1080, 3)

prev = None
for o0, s0, d in EDIT:
    i0 = round(o0 * FPS)
    for k, bgr in enumerate(frames(s0, d)):
        if k >= round(d * FPS): break
        a = remove(bgr, session=sess, only_mask=True, post_process_mask=True).astype(np.float32) / 255
        # light temporal smoothing within a segment to reduce edge flicker
        if prev is not None and k > 0: a = 0.7 * a + 0.3 * prev
        prev = a
        a = cv2.GaussianBlur(a, (3, 3), 0)
        rgba = np.dstack([bgr, (a * 255).astype(np.uint8)])
        cv2.imwrite(os.path.join(OUT, f"cut_{i0 + k:04d}.png"), rgba)
    print("segment", o0, "done", flush=True)
