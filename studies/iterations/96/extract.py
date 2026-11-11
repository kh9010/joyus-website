# Cuts Study 96's pictures out of Divya's Gliitch brand guide (2019). Nothing is redrawn:
#  - vector crops (the logo, its colour variants) are the page's own SVG with the viewBox moved to the art;
#  - the wordmark alone is the same crop with the pink taken out (white on pink -> white with alpha), so it lies exactly over the circle;
#  - the photo and the loyalty card are the page rendered, cropped.
#   python -I extract.py <out dir>
import fitz, sys, os, re, io, json
from PIL import Image
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
d = fitz.open(r'C:\Users\divya\Work\Brand guides\Gliitch Brand guide final.pdf')
meta = {}

def tight(page, rough, pad=2, bg=(255, 255, 255), tol=6):
    """the art's own box inside a rough rectangle: everything that is not the page's white"""
    z = 2
    pm = page.get_pixmap(matrix=fitz.Matrix(z, z), clip=fitz.Rect(*rough))
    im = Image.frombytes('RGB', (pm.width, pm.height), pm.samples)
    px = im.load(); l, t, r, b = pm.width, pm.height, 0, 0
    for y in range(pm.height):
        for x in range(pm.width):
            p = px[x, y]
            if abs(p[0] - bg[0]) + abs(p[1] - bg[1]) + abs(p[2] - bg[2]) > tol * 3:
                l = min(l, x); r = max(r, x); t = min(t, y); b = max(b, y)
    return (rough[0] + l / z - pad, rough[1] + t / z - pad, rough[0] + (r + 1) / z + pad, rough[1] + (b + 1) / z + pad)

def svg_crop(pno, box, name):
    page = d[pno - 1]
    s = page.get_svg_image(text_as_path=True)
    w, h = box[2] - box[0], box[3] - box[1]
    s = re.sub(r'<svg([^>]*?)\swidth="[^"]*"\s+height="[^"]*"\s+viewBox="[^"]*"', lambda m: f'<svg{m.group(1)} width="{w:.2f}" height="{h:.2f}" viewBox="{box[0]:.2f} {box[1]:.2f} {w:.2f} {h:.2f}"', s, count=1)
    assert f'viewBox="{box[0]:.2f}' in s, 'viewBox not replaced: ' + s[:300]
    io.open(os.path.join(out, name + '.svg'), 'w', encoding='utf-8').write(s)
    meta[name] = {'page': pno, 'w': round(w, 2), 'h': round(h, 2), 'bytes': len(s)}

def png_crop(pno, box, name, zoom=3, fmt='jpg'):
    pm = d[pno - 1].get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=fitz.Rect(*box))
    im = Image.frombytes('RGB', (pm.width, pm.height), pm.samples)
    f = os.path.join(out, name + '.' + fmt)
    im.save(f, quality=88) if fmt == 'jpg' else im.save(f)
    meta[name] = {'page': pno, 'w': pm.width, 'h': pm.height}
    return im

# 1. the final logo (page 8): the circle with its two offset circles
logo = tight(d[7], (30, 30, 975, 925))   # stops above the guide's own 'Final Logo' tab
svg_crop(8, logo, 'logo')
# 2. the wordmark alone, same frame: inside the pink disc every pixel is white over pink, so alpha = how far it is from the pink
PINK = (0xE6, 0x1A, 0x6C)
z = 4
pm = d[7].get_pixmap(matrix=fitz.Matrix(z, z), clip=fitz.Rect(*logo))
im = Image.frombytes('RGB', (pm.width, pm.height), pm.samples).convert('RGBA'); px = im.load()
W, H = im.size
# the disc: the pink run on the middle row gives its centre and radius
row = [x for x in range(W) if sum(abs(px[x, H // 2][i] - PINK[i]) for i in range(3)) < 24 or px[x, H // 2][:3] == (255, 255, 255)]
pinkrow = [x for x in range(W) if sum(abs(px[x, H // 2][i] - PINK[i]) for i in range(3)) < 24]
col = [y for y in range(H) if sum(abs(px[W // 2, y][i] - PINK[i]) for i in range(3)) < 24]
cx, cy, rad = (pinkrow[0] + pinkrow[-1]) / 2, (col[0] + col[-1]) / 2, (col[-1] - col[0]) / 2
for y in range(H):
    for x in range(W):
        p = px[x, y]
        inside = (x - cx) ** 2 + (y - cy) ** 2 < (rad * .93) ** 2
        a = max(0, min(255, round(255 * (p[1] - PINK[1]) / (255 - PINK[1])))) if inside else 0
        px[x, y] = (255, 255, 255, a)
bb = im.getbbox(); im.save(os.path.join(out, 'wordmark.png'))
meta['wordmark'] = {'page': 8, 'w': W, 'h': H, 'ink': [bb[0] / W, bb[1] / H, bb[2] / W, bb[3] / H]}
# 3. the eight secondary colours (page 14)
def disc_of(pno, box):
    # centre and radius of the main disc in a crop, as shares of the crop's width: the disc's colour is read just under its top
    zz = 4
    pm = d[pno - 1].get_pixmap(matrix=fitz.Matrix(zz, zz), clip=fitz.Rect(*box))
    im = Image.frombytes('RGB', (pm.width, pm.height), pm.samples); px = im.load(); W, H = im.size
    main = px[W // 2, int(H * .2)]
    near = lambda p: sum(abs(p[i] - main[i]) for i in range(3)) < 24
    row = [x for x in range(W) if near(px[x, H // 2])]; col = [y for y in range(H) if near(px[W // 2, y])]
    return [round((row[0] + row[-1]) / 2 / W, 5), round((col[0] + col[-1]) / 2 / W, 5), round((col[-1] - col[0]) / 2 / W, 5)], '#%02x%02x%02x' % main
meta['logo']['disc'], meta['logo']['colour'] = disc_of(8, logo)
for i in range(8):
    c, r = i % 4, i // 4
    rough = (20 + c * 314, 50 + r * 320, 20 + (c + 1) * 314, 50 + (r + 1) * 320)
    box = tight(d[13], rough)
    svg_crop(14, box, f'colour-{i + 1}')
    meta[f'colour-{i + 1}']['disc'], meta[f'colour-{i + 1}']['colour'] = disc_of(14, box)
# 4. somebody else's picture (page 23, top): the photo as the guide shows it, with the logo where the guide puts it
page = d[22]
imgs = sorted(page.get_image_info(xrefs=True), key=lambda i: -(i['bbox'][2] - i['bbox'][0]) * (i['bbox'][3] - i['bbox'][1]))
ph = imgs[0]; pb = ph['bbox']
pix = fitz.Pixmap(d, ph['xref'])
if pix.n - pix.alpha > 3: pix = fitz.Pixmap(fitz.csRGB, pix)
pim = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
pim.thumbnail((2000, 2000)); pim.save(os.path.join(out, 'photo.jpg'), quality=86)
# where the guide puts the logo on it: the pink disc in the photo's bottom right, measured off the page
zz = 4; q = (pb[0] + (pb[2] - pb[0]) * .7, pb[1] + (pb[3] - pb[1]) * .6, pb[2], pb[3])
pm = page.get_pixmap(matrix=fitz.Matrix(zz, zz), clip=fitz.Rect(*q)); qi = Image.frombytes('RGB', (pm.width, pm.height), pm.samples); qp = qi.load()
xs = [x for x in range(qi.width) for y in range(0, qi.height, 2) if sum(abs(qp[x, y][i] - PINK[i]) for i in range(3)) < 24]
ys = [y for y in range(qi.height) for x in range(0, qi.width, 2) if sum(abs(qp[x, y][i] - PINK[i]) for i in range(3)) < 24]
pw = pb[2] - pb[0]
dx0, dx1, dy0, dy1 = q[0] + min(xs) / zz, q[0] + (max(xs) + 1) / zz, q[1] + min(ys) / zz, q[1] + (max(ys) + 1) / zz
meta['photo'] = {'page': 23, 'w': pim.width, 'h': pim.height, 'shown': [round(pw, 1), round(pb[3] - pb[1], 1)],
  'logo': [round(((dx0 + dx1) / 2 - pb[0]) / pw, 5), round(((dy0 + dy1) / 2 - pb[1]) / pw, 5), round((dy1 - dy0) / pw, 5)]}   # disc centre x, y and diameter, as shares of the photo's width
# 5. the loyalty card (page 27, left)
card = tight(d[26], (40, 40, 640, 1000))
png_crop(27, card, 'card', zoom=3, fmt='png')
io.open(os.path.join(out, 'meta.json'), 'w', encoding='utf-8').write(json.dumps(meta, indent=1))
print(json.dumps(meta, indent=1))
