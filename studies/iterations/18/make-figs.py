# Makes the study's figures (img/fig-*.png) from the full-resolution lab
# shots, then halves the lab shots (1800 → 900) to keep the repo light.
# Run once after shoot.mjs:  python studies/iterations/18/make-figs.py
import os
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__)); img = lambda n: os.path.join(here, 'img', n)
def crop(src, box, out, size=500, nearest=False):
    im = Image.open(img(src + '.png')).crop(box)
    im.resize((size, size), Image.NEAREST if nearest else Image.LANCZOS).save(img('fig-' + out + '.png'))
ZOOM = (900, 250, 1400, 750)            # top of the stem, 2x
crop('plain--a16', ZOOM, 'smooth-1-study16')
crop('plain--a-nrm', ZOOM, 'smooth-2-normals')
crop('normals--a-nrm', ZOOM, 'smooth-3-edge')
crop('plain--p100', (0, 0, 1800, 1800), 'smooth-4-pillow')
crop('gummy-try1--p100', (0, 0, 1800, 1800), 'wrong-gummy-1')
crop('gummy-try2--p100', (0, 0, 1800, 1800), 'wrong-gummy-2')
crop('painted-try1--p100', (0, 0, 1800, 1800), 'wrong-painted')
crop('frosted-try1--p100', (0, 0, 1800, 1800), 'wrong-frosted')
crop('toon-try1--p100', (1000, 400, 1200, 600), 'wrong-toon', nearest=True)
crop('toon--p100', (1000, 400, 1200, 600), 'fixed-toon', nearest=True)
crop('sugared--p100-ao', (900, 450, 1500, 1050), 'sugar-close')
crop('candy--p100-ao', (800, 500, 1400, 1100), 'candy-close')
crop('print--p100', (900, 500, 1500, 1100), 'print-close')
for f in os.listdir(os.path.join(here, 'img')):
    if f.startswith(('fig-', 'page-')): continue
    im = Image.open(img(f))
    if im.width > 900: im.resize((900, 900), Image.LANCZOS).save(img(f), optimize=True)
