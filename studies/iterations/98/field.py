# The ending screen's pixel field, read off page 5 of Divya's Gliitch video assets guide (2019): every square's place, size and colour.
import fitz, sys, json, io, collections
d = fitz.open(r'Z:\Divya backup\work may 24\Work\Design\Branding\Gliitch branding\Gliitch video assets Final.pdf')
p = d[4]
sq = []
for g in p.get_drawings():
    f = g.get('fill'); r = g['rect']
    if f is None or r.width < 2 or r.height < 2: continue
    if abs(r.width - r.height) > .6 or r.width > 40: continue           # squares only, small ones
    sq.append([round(r.x0, 2), round(r.y0, 2), round(r.width, 2), '#%02x%02x%02x' % tuple(round(c * 255) for c in f), round(g.get('fill_opacity') or 1, 2)])
sq = [s for s in sq if s[3] != '#ffffff' and s[0] > 170 and 78 < s[1] < 720]          # the screen itself: not the page's tab, not white
x0, y0 = min(s[0] for s in sq), min(s[1] for s in sq); x1, y1 = max(s[0] + s[2] for s in sq), max(s[1] + s[2] for s in sq)
w = x1 - x0
disc = max((g for g in p.get_drawings() if g.get('fill') and g['rect'].width > 150 and abs(g['rect'].width - g['rect'].height) < 3 and '#%02x%02x%02x' % tuple(round(c * 255) for c in g['fill']) == '#e61a6c'), key=lambda g: g['rect'].width)['rect']
out = {'page': 5, 'w': round(w, 2), 'h': round(y1 - y0, 2),
       'logo': [round(((disc.x0 + disc.x1) / 2 - x0) / w, 5), round(((disc.y0 + disc.y1) / 2 - y0) / w, 5), round(disc.width / w, 5)],   # disc centre x, y and diameter, as shares of the field's width
       'squares': [[round((s[0] - x0) / w, 5), round((s[1] - y0) / w, 5), round(s[2] / w, 5), s[3]] for s in sq]}
print(len(sq), 'squares', out['w'], out['h'], out['logo'], collections.Counter(s[3] for s in sq))
io.open(sys.argv[1], 'w', encoding='utf-8').write(json.dumps(out))
