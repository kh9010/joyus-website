# Is every look its own idea, or a variation of another? For each look:
# the mean per-pixel colour difference (0-255, on the J only, 128x128) to
# its nearest other look. Writes distinct.json for check.cjs.
#   python studies/iterations/18/distinct.py
import json, os, itertools
from PIL import Image, ImageChops, ImageStat
here = os.path.dirname(os.path.abspath(__file__))
LOOKS = ['plain--p100', 'studio--p100', 'gummy--p100', 'toon--p100', 'candy--p100-ao', 'print--p100', 'painted--p100', 'sugared--p100-ao', 'frosted--p100']
EXTRA = ['gummy-try2--p100', 'frosted-try1--p100']   # wrong turns, to show what "too close" looks like
def load(n): return Image.open(os.path.join(here, 'img', n + '.png')).convert('RGB').resize((128, 128), Image.LANCZOS)
imgs = {n: load(n) for n in LOOKS + EXTRA}
def dist(a, b):
    # only where either image has the J (not white), so the shared white page doesn't dilute it
    A, B = imgs[a], imgs[b]
    mask = Image.eval(ImageChops.darker(A, B).convert('L'), lambda v: 255 if v < 245 else 0)
    d = ImageChops.difference(A, B).convert('L')
    return round(ImageStat.Stat(d, mask).mean[0], 1)
out = {}
for n in LOOKS + EXTRA:
    others = [(dist(n, m), m) for m in LOOKS if m != n]
    d, m = min(others)
    out[n] = {'nearest': m, 'distance': d}
    print(f'{n:22s} nearest {m:20s} {d:5.1f}')
json.dump(out, open(os.path.join(here, 'distinct.json'), 'w'), indent=1)

# The grouping the numbers above suggest: Studio, Gummy, Candy and Sugared
# are one idea (lit physical material) in different finishes; Candy stands
# for it. Are the ideas then distinct from each other and from Study 16's?
IDEAS = ['plain--p100', 'candy--p100-ao', 'toon--p100', 'print--p100', 'painted--p100', 'frosted--p100']
print('\nideas only')
ideas = {}
for n in IDEAS:
    d, m = min((dist(n, x), x) for x in IDEAS if x != n)
    ideas[n] = {'nearest': m, 'distance': d}
    print(f'{n:22s} nearest {m:20s} {d:5.1f}')
json.dump({'looks': out, 'ideas': ideas}, open(os.path.join(here, 'distinct.json'), 'w'), indent=1)
