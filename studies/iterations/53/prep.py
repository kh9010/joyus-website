# Study 53, step 1: from Divya's originals on Z: to working textures (kept out of the repo).
# Cuts every painted motif out of the two scans as if with scissors: a soft white margin
# around the paint, a hand-cut edge. Pulls the labels at print resolution.
#   python prep.py "Z:/Divya backup/work may 24/Work/Design/Branding/Secret Senses" <out folder>
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage as ndi
import fitz
Image.MAX_IMAGE_PIXELS = None
root, out = sys.argv[1:3]
os.makedirs(os.path.join(out, 'motifs'), exist_ok=True)

motifs = []
for scan in ('Illustrations 1.jpg', 'Illustrations 2.jpg'):
    im = Image.open(os.path.join(root, 'Dump', scan)).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    # lift the scan's paper to pure white without touching the paint
    paper = np.percentile(a.reshape(-1, 3), 75, axis=0)
    a = np.clip(a * (255 / paper), 0, 255)
    # paint = how far from white, by the strongest channel; a pale wash in the scan stays out
    ink = 255 - a.min(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    mask = (ink > 34) & (sat > 16) | (ink > 90)
    mask = ndi.binary_closing(mask, iterations=7)
    # the second scan's flowers are painted in separate wet strokes with gaps: a petal, a leaf
    # beside its rose. Strokes this close belong to one flower, so they are cut as one.
    join = 34 if scan.endswith('2.jpg') else 0
    grouped = ndi.binary_dilation(mask, iterations=join) if join else mask
    lab, n = ndi.label(grouped)
    H, W = mask.shape
    for i, slc in enumerate(ndi.find_objects(lab)):
        area = ((lab[slc] == i + 1) & mask[slc]).sum()
        if area < 900:
            continue
        pad = 44 + join
        y0, y1 = max(slc[0].start - pad, 0), min(slc[0].stop + pad, H)
        x0, x1 = max(slc[1].start - pad, 0), min(slc[1].stop + pad, W)
        m = (lab[y0:y1, x0:x1] == i + 1) & mask[y0:y1, x0:x1]
        if join:
            m = ndi.binary_erosion(ndi.binary_dilation(m, iterations=join), iterations=join - 2, border_value=1)
        # the scissors: grow, then round, then a little wobble so no edge is a machine's
        d = ndi.distance_transform_edt(~m)
        rng = np.random.default_rng(int(area))
        wob = ndi.gaussian_filter(rng.normal(size=m.shape), 22)
        wob = wob / (np.abs(wob).max() + 1e-6) * 5
        cut = ndi.gaussian_filter(((d + wob) < 15).astype(np.float32), 3.5)
        alpha = np.clip((cut - .5) * 12 + .5, 0, 1)
        # one piece of paper: a speck the scissors went round is dropped
        pieces, np_ = ndi.label(alpha > .5)
        if np_ > 1:
            sizes = ndi.sum(np.ones_like(pieces), pieces, range(1, np_ + 1))
            alpha = alpha * ndi.binary_dilation(pieces == 1 + int(np.argmax(sizes)), iterations=3)
        rgba = np.dstack([a[y0:y1, x0:x1], alpha * 255]).astype(np.uint8)
        name = 'm%02d.png' % len(motifs)
        Image.fromarray(rgba, 'RGBA').save(os.path.join(out, 'motifs', name))
        crop = a[y0:y1, x0:x1][m]
        motifs.append({'file': name, 'w': int(x1 - x0), 'h': int(y1 - y0), 'area': int(area), 'scan': scan,
                       'rgb': [int(v) for v in crop.mean(axis=0)]})
json.dump(motifs, open(os.path.join(out, 'motifs.json'), 'w'), indent=0)
print(len(motifs), 'motifs')

# labels: the 9x exports where they exist, the .ai pages at print resolution otherwise
lab = os.path.join(out, 'labels')
os.makedirs(lab, exist_ok=True)
for src, name in [('Dump/9x/Conditioner@9x.png', 'conditioner'), ('Dump/9x/shampoo@9x.png', 'shampoo'), ('Dump/9x/elixir@9x.png', 'elixir'), ('Dump/9x/newConditioner.png', 'conditioner-new')]:
    Image.open(os.path.join(root, src)).convert('RGB').save(os.path.join(lab, name + '.png'))
vis = fitz.open(os.path.join(root, 'Secret Senses 100 ml new for visuals.ai'))
for page, name, dpi in [(2, 'jar', 500), (3, 'oil', 900), (7, 'oil-wide', 700)]:
    pix = vis[page].get_pixmap(dpi=dpi)
    Image.frombytes('RGB', (pix.width, pix.height), pix.samples).save(os.path.join(lab, name + '.png'))
# the mark, on transparent: teal for print, white for the box
logo = fitz.open(os.path.join(root, 'Secret Senses Logo design Final.ai'))
pix = logo[0].get_pixmap(dpi=300)
g = np.asarray(Image.frombytes('RGB', (pix.width, pix.height), pix.samples)).astype(np.float32)
alpha = np.clip((255 - g.min(axis=2)) * 2.2, 0, 255)
for name, col in [('logo-white', (255, 255, 255)), ('logo-teal', (85, 194, 180))]:
    rgba = np.dstack([np.full(alpha.shape, c) for c in col] + [alpha]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(os.path.join(lab, name + '.png'))

# a sheet to look at, on grey so the white margins show
sheet = Image.new('RGB', (1500, 900), (150, 160, 160))
d = ImageDraw.Draw(sheet)
cols, cell = 10, 150
for i, m in enumerate(motifs):
    t = Image.open(os.path.join(out, 'motifs', m['file']))
    t.thumbnail((cell - 10, cell - 10))
    x, y = (i % cols) * cell + 5, (i // cols) * cell + 5
    sheet.paste(t, (x, y), t)
    d.text((x, y), str(i), fill=(255, 255, 0))
sheet.save(os.path.join(out, 'motifs-sheet.jpg'), quality=85)
