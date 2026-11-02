# Study 53, step 2: Secret Senses in Blender. One unit is one centimetre; sizes come from the print files.
#   blender -b -P scene.py -- --shot one --src <prep out> --out x.png --w 900 --samples 48
# Shots, in story order: one (a flower) · set (the whole hand) · border (the hand becomes the label)
#                        bottle (the label on the bottle) · family (everything)
import bpy, bmesh, sys, os, json, math, random
from mathutils import Vector

a = sys.argv[sys.argv.index('--') + 1:]
arg = lambda k, d=None: a[a.index('--' + k) + 1] if '--' + k in a else d
SHOT, SRC, OUT = arg('shot', 'one'), arg('src'), arg('out')
WIDTH, SAMPLES = int(arg('w', 900)), int(arg('samples', 48))
ASPECT = float(arg('aspect', 1.5))
M = json.load(open(os.path.join(SRC, 'motifs.json')))
rng = random.Random(int(arg('seed', 7)))
hexc = lambda h, a=1: tuple(pow(int(h[i:i + 2], 16) / 255, 2.2) for i in (1, 3, 5)) + (a,)
TEAL, LEAF, LIME, SUN, CORAL = '#55c2b4', '#b4d88f', '#d8e37b', '#fed767', '#ef4d4d'  # the brand guide's five

bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene
S.render.engine = 'CYCLES'
pref = bpy.context.preferences.addons['cycles'].preferences
pref.compute_device_type = 'OPTIX'
pref.get_devices()
for d in pref.devices: d.use = d.type == 'OPTIX'
S.cycles.device = 'GPU'
S.cycles.samples = SAMPLES
S.cycles.use_denoising = True
S.cycles.denoiser = 'OPENIMAGEDENOISE'
S.cycles.max_bounces = 12
S.cycles.transmission_bounces = 12
S.cycles.transparent_max_bounces = 32
S.render.resolution_x, S.render.resolution_y = WIDTH, int(WIDTH / ASPECT)
S.view_settings.view_transform = 'Standard'  # the paint's own colours, not a film's
S.view_settings.look = 'None'
S.render.filepath = OUT
S.render.image_settings.file_format = 'PNG'

def mesh_obj(name, verts, faces, uvs=None, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    if uvs:
        lay = me.uv_layers.new()
        for l in me.loops: lay.data[l.index].uv = uvs[l.vertex_index]
    me.update()
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    if uvs is None: pass
    if smooth: me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    ob = bpy.data.objects.new(name, me)
    S.collection.objects.link(ob)
    return ob

_imgs = {}
def image(path):
    if path not in _imgs: _imgs[path] = bpy.data.images.load(path)
    return _imgs[path]

def principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree, next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')

def set_in(b, key, v):
    if key in b.inputs: b.inputs[key].default_value = v

def plain(name, color, rough=.5, metal=0, coat=0, transmit=0, ior=1.45):
    m, t, b = principled(name)
    set_in(b, 'Base Color', hexc(color) if isinstance(color, str) else color)
    set_in(b, 'Roughness', rough); set_in(b, 'Metallic', metal)
    set_in(b, 'Coat Weight', coat); set_in(b, 'Transmission Weight', transmit); set_in(b, 'IOR', ior)
    return m

def paper_bump(t, b, scale=9, strength=.22):
    """Cold-press grain: what makes paper read as paper up close."""
    tc = t.nodes.new('ShaderNodeTexCoord')
    n = t.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = 9; n.inputs['Roughness'].default_value = .62
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = .02
    t.links.new(tc.outputs['Object'], n.inputs['Vector']); t.links.new(n.outputs['Fac'], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])

def tex_mat(name, path, rough=.8, alpha=False, grain=0, coat=0):
    m, t, b = principled(name)
    n = t.nodes.new('ShaderNodeTexImage'); n.image = image(path); n.interpolation = 'Cubic'
    t.links.new(n.outputs['Color'], b.inputs['Base Color'])
    if alpha:
        t.links.new(n.outputs['Alpha'], b.inputs['Alpha']); m.blend_method = 'CLIP'
    set_in(b, 'Roughness', rough); set_in(b, 'Coat Weight', coat)
    if grain: paper_bump(t, b, strength=grain)
    return m

# ------- paper
def cutout(i, size, loc, rot=0, curl=.12, tilt=(0, 0), seed=None):
    """One painted motif on paper, hand cut, lifting at its edges as cut paper does."""
    d = M[i]
    r = random.Random(seed if seed is not None else i * 13 + 1)
    long_ = max(d['w'], d['h'])
    w, h = size * d['w'] / long_, size * d['h'] / long_
    N = 28
    px, py, bend = r.uniform(0, 6.28), r.uniform(0, 6.28), r.uniform(.6, 1.2)
    verts, uvs, faces = [], [], []
    for j in range(N + 1):
        for k in range(N + 1):
            u, v = k / N, j / N
            x, y = (u - .5) * w, (v - .5) * h
            rr = (x * x + y * y) ** .5 / (size * .5)
            z = curl * size * (rr * rr * .6 + .25 * math.sin(u * 3.1 * bend + px) * math.sin(v * 3.1 + py) * rr)
            verts.append((x, y, z)); uvs.append((u, v))
    for j in range(N):
        for k in range(N):
            a0 = j * (N + 1) + k
            faces.append((a0, a0 + 1, a0 + N + 2, a0 + N + 1))
    ob = mesh_obj('motif%d' % i, verts, faces, uvs)
    ob.data.materials.append(tex_mat('m%d' % i, os.path.join(SRC, 'motifs', d['file']), rough=.85, alpha=True, grain=.1))
    ob.location = loc
    ob.rotation_euler = (tilt[0], tilt[1], rot)
    return ob

def card(name, color, w, h, z=0, x=0, y=0, thick=.08, rough=.85, grain=.25):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z - thick / 2))
    ob = bpy.context.active_object; ob.name = name
    ob.scale = (w, h, thick)
    bpy.ops.object.transform_apply(scale=True)
    m, t, b = principled(name)
    set_in(b, 'Base Color', hexc(color)); set_in(b, 'Roughness', rough)
    if grain: paper_bump(t, b, strength=grain)
    ob.data.materials.append(m)
    return ob

def ground(color, grain=.3):
    return card('ground', color, 900, 900, z=0, thick=1, grain=grain)

def sweep(color, grain=.12, back=34, radius=30):
    """A sheet of coloured paper curving up behind the objects, so there is no horizon."""
    pts = [(-500, 0), (back, 0)]
    for i in range(1, 25):
        t = i / 24 * math.pi / 2
        pts.append((back + radius * math.sin(t), radius - radius * math.cos(t)))
    pts.append((back + radius, 600))
    verts, faces = [], []
    for j, (y, z) in enumerate(pts):
        verts += [(-900, y, z), (900, y, z)]
        if j: faces.append(((j - 1) * 2, (j - 1) * 2 + 1, j * 2 + 1, j * 2))
    ob = mesh_obj('sweep', verts, faces)
    m, t, b = principled('sweep')
    set_in(b, 'Base Color', hexc(color)); set_in(b, 'Roughness', .9)
    if grain: paper_bump(t, b, strength=grain)
    ob.data.materials.append(m)
    return ob

# ------- objects, by lathe, from profiles in cm
def lathe(name, profile, mat, segs=160, loc=(0, 0, 0)):
    verts, faces = [], []
    n = len(profile)
    for s in range(segs):
        ang = 2 * math.pi * s / segs
        for r, z in profile: verts.append((r * math.cos(ang), r * math.sin(ang), z))
    for s in range(segs):
        s2 = (s + 1) % segs
        for i in range(n - 1):
            faces.append((s * n + i, s2 * n + i, s2 * n + i + 1, s * n + i + 1))
    ob = mesh_obj(name, verts, faces)
    ob.data.materials.append(mat)
    ob.location = loc
    return ob

def round_profile(r, z0, z1, b=.25):
    """A cylinder's side with soft shoulders, closed at both ends."""
    p = [(0, z0), (r - b, z0)]
    for i in range(1, 7):
        t = i / 6 * math.pi / 2; p.append((r - b + b * math.sin(t), z0 + b - b * math.cos(t)))
    for i in range(0, 7):
        t = i / 6 * math.pi / 2; p.append((r - b + b * math.cos(t), z1 - b + b * math.sin(t)))
    p.append((0, z1))
    return p

def wrap(name, r, z0, z1, degrees, path, facing=-90, mat=None):
    """A label on a curve: its print size wrapped round the body, centred on `facing`."""
    N, M_ = 64, 2
    verts, uvs, faces = [], [], []
    for j in range(M_ + 1):
        for k in range(N + 1):
            u, v = k / N, j / M_
            ang = math.radians(facing + (u - .5) * degrees)
            verts.append((r * math.cos(ang), r * math.sin(ang), z0 + v * (z1 - z0))); uvs.append((u, v))
    for j in range(M_):
        for k in range(N):
            a0 = j * (N + 1) + k
            faces.append((a0, a0 + 1, a0 + N + 2, a0 + N + 1))
    ob = mesh_obj(name, verts, faces, uvs)
    ob.data.materials.append(mat or tex_mat(name, path, rough=.42, coat=.15))
    return ob

WHITE = lambda: plain('bottle white', (.86, .86, .84, 1), rough=.34, coat=.2)
SILVER = lambda: plain('collar', (.5, .5, .52, 1), rough=.2, metal=1)
PUMP = lambda: plain('pump', (.9, .9, .9, 1), rough=.3)
def CLEAR():
    m, t, b = principled('overcap')
    set_in(b, 'Base Color', (1, 1, 1, 1)); set_in(b, 'Roughness', .08); set_in(b, 'Alpha', .13); set_in(b, 'Coat Weight', 1)
    m.blend_method = 'BLEND'
    return m

def group(obs, loc, rot=0, parent_name='g'):
    e = bpy.data.objects.new(parent_name, None); S.collection.objects.link(e)
    for o in obs: o.parent = e
    e.location = loc; e.rotation_euler = (0, 0, rot)
    return e

def spray(label, h, r, deg, label_h, loc, rot=0, name='spray'):
    """As in Divya's mock: a white bottle, a silver collar, a pump, a clear overcap. Label centred on the body."""
    z0 = (h - label_h) / 2
    obs = [lathe(name + ' body', round_profile(r, 0, h, .35) , WHITE())]
    obs.append(wrap(name + ' label', r + .012, z0, z0 + label_h, deg, os.path.join(SRC, 'labels', label)))
    nr = r * .52
    obs.append(lathe(name + ' collar', round_profile(nr, h - .05, h + 1.55, .08), SILVER()))
    obs.append(lathe(name + ' stem', round_profile(nr * .5, h + 1.5, h + 2, .03), PUMP()))
    obs.append(lathe(name + ' pump', [(0, h + 2), (nr * .72, h + 2), (nr * .72, h + 3.5), (nr * .6, h + 3.72), (0, h + 3.78)], PUMP()))
    obs.append(lathe(name + ' overcap', [(nr * .84, h + 1.6), (nr * .9, h + 1.6), (nr * .9, h + 4.1), (nr * .8, h + 4.26), (0, h + 4.3), (0, h + 4.24), (nr * .74, h + 4.18), (nr * .84, h + 4.06), (nr * .84, h + 1.6)], CLEAR()))
    return group(obs, loc, rot, name)

def dropper(label, h, r, deg, label_h, loc, rot=0, name='dropper'):
    z0 = (h - label_h) / 2
    obs = [lathe(name + ' body', round_profile(r, 0, h, .4), WHITE())]
    obs.append(wrap(name + ' label', r + .012, z0, z0 + label_h, deg, os.path.join(SRC, 'labels', label)))
    nr = r * .55
    obs.append(lathe(name + ' collar', round_profile(nr, h - .05, h + 1.3, .08), SILVER()))
    bulb = [(0, h + 1.3)] + [(nr * .62, h + 1.3), (nr * .62, h + 2)] + [(nr * .62 * math.cos(t / 8 * 1.57), h + 2 + 1.1 * math.sin(t / 8 * 1.57)) for t in range(9)]
    obs.append(lathe(name + ' bulb', bulb, plain('bulb', (.92, .92, .9, 1), rough=.42)))
    return group(obs, loc, rot, name)

def jar(loc, rot=0):
    """190 x 43 mm label wraps exactly once: the print file gives a 60 mm jar."""
    r, h = 3.02, 5.2
    obs = [lathe('jar body', round_profile(r, 0, h, .25), WHITE())]
    obs.append(wrap('jar label', r + .012, .45, .45 + 4.3, 360, os.path.join(SRC, 'labels', 'jar.png'), facing=-90 - 96))
    obs.append(lathe('jar lid', round_profile(r + .08, h - .02, h + 1.65, .16), plain('jar lid', (.93, .93, .91, 1), rough=.3, coat=.3)))
    return group(obs, loc, rot, 'jar')

def tube(label, loc, rot=0, H=12.5, r=2.15):
    """A squeeze tube: round at the cap, pressed flat at the crimp, standing on its cap as in the mock."""
    cap_h = 2.6
    rings, segs = 40, 96
    wide = math.pi * r / 2
    verts, uvs, faces = [], [], []
    for j in range(rings + 1):
        t = j / rings
        a_ = r + (wide - r) * t ** 1.05
        b_ = r * (1 - t) ** .8 + .03
        for s in range(segs + 1):
            ang = 2 * math.pi * s / segs - math.pi / 2
            x, y = a_ * math.cos(ang), b_ * math.sin(ang)
            verts.append((x, y, cap_h + (H - cap_h) * t))
            uvs.append(((x / wide + 1) / 2 * .98 + .01, t * .985 + .01))
    for j in range(rings):
        for s in range(segs):
            a0 = j * (segs + 1) + s
            faces.append((a0, a0 + 1, a0 + segs + 2, a0 + segs + 1))
    body = mesh_obj('tube', verts, faces, uvs)
    body.data.materials.append(tex_mat('tube art', os.path.join(SRC, 'labels', label), rough=.36, coat=.25))
    crimp = card('crimp', '#f2f2ee', wide * 2 + .02, .09, z=H + .45, thick=.5, grain=0)
    cap = lathe('tube cap', [(0, 0), (r * .92, 0), (r * .98, .1), (r, 2.5), (r * .97, 2.62), (0, 2.65)], plain('cap', (.93, .93, .91, 1), rough=.25, coat=.3))
    return group([body, crimp, cap], loc, rot, 'tube')

def box(label, loc, rot=0, w=5.6, h=12.2, d=3.9, side=TEAL):
    """As in the mock: the front is the label, the sides the brand's teal."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, h / 2))
    b = bpy.context.active_object; b.name = 'box'; b.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    bev = b.modifiers.new('b', 'BEVEL'); bev.width = .025; bev.segments = 2
    b.data.materials.append(plain('box side', side, rough=.55))
    front = mesh_obj('box front', [(-w / 2, -d / 2 - .004, 0), (w / 2, -d / 2 - .004, 0), (w / 2, -d / 2 - .004, h), (-w / 2, -d / 2 - .004, h)], [(0, 1, 2, 3)], [(0, 0), (1, 0), (1, 1), (0, 1)], smooth=False)
    front.data.materials.append(tex_mat('box art', os.path.join(SRC, 'labels', label), rough=.55))
    return group([b, front], loc, rot, 'box')

# ------- light and camera
def world(strength=.55, col=(1, 1, 1)):
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (*col, 1); bg.inputs[1].default_value = strength

def sun(azim, elev, power=3, soft=2.5, col=(1, .965, .9)):
    d = bpy.data.lights.new('sun', 'SUN'); d.energy = power; d.angle = math.radians(soft); d.color = col
    o = bpy.data.objects.new('sun', d); S.collection.objects.link(o)
    az, el = math.radians(azim), math.radians(elev)
    v = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    o.rotation_euler = v.to_track_quat('Z', 'Y').to_euler()
    return v

def camera(loc, target, lens=70, dof=None, fstop=4):
    c = bpy.data.cameras.new('c'); c.lens = lens; c.clip_end = 3000; c.clip_start = .5
    o = bpy.data.objects.new('c', c); S.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    S.camera = o
    if dof:
        c.dof.use_dof = True; c.dof.focus_distance = dof; c.dof.aperture_fstop = fstop
    return o

def leaf_shade(v, target, picks, spread=26, height=70, size=26, clear=0):
    """Dappled light made of the brand's own leaves: her motifs, out of shot, between the sun and the table."""
    centre = Vector(target) + v * height
    x = v.cross(Vector((0, 0, 1))).normalized(); y = v.cross(x).normalized()
    for n, i in enumerate(picks):
        while True:
            a_, b_ = rng.uniform(-spread, spread), rng.uniform(-spread, spread)
            if (a_ * a_ + b_ * b_) ** .5 > clear: break
        p = centre + x * a_ + y * b_
        o = cutout(i, size * rng.uniform(.7, 1.3), tuple(p), rng.uniform(0, 6.28), curl=0, seed=900 + n)
        o.rotation_euler = v.to_track_quat('Z', 'Y').to_euler()
        o.visible_camera = False

# ------- shots: each is one step of the story
LEAVES = [int(x) for x in arg('leaves', '1,3,5,6,7,8').split(',')]

def shot_one():
    # One flower. Nothing else on the page but the paper it was painted on.
    world(.66)
    ground('#fbf7ee', grain=.5)
    v = sun(125, 22, power=2.5, soft=1.6)
    i = int(arg('hero', 23))
    cutout(i, 9, (0, 0, .1), rot=math.radians(-8), curl=.13)
    camera((0, -1.5, 34), (0, 0, 0), lens=70)

SET_ORDER = None
def shot_set():
    # The whole hand: every motif laid out like a herbarium sheet, sorted by colour.
    world(.66)
    ground('#fbf7ee', grain=.45)
    sun(128, 30, power=1.9, soft=2)
    keys = sorted(range(len(M)), key=lambda i: colour_sort(M[i]['rgb']))
    cols = int(arg('cols', 7))
    rows = math.ceil(len(keys) / cols)
    gx, gy = 5.2, 5.1
    for n, i in enumerate(keys):
        c, r_ = n % cols, n // cols
        x = (c - (cols - 1) / 2) * gx + rng.uniform(-.25, .25)
        y = ((rows - 1) / 2 - r_) * gy + rng.uniform(-.25, .25)
        cutout(i, 4.3, (x, y, .08), rot=rng.uniform(-.35, .35), curl=.14)
    camera((0, -.8, 84), (0, 0, 0), lens=70)

def colour_sort(rgb):
    import colorsys
    h, s, v = colorsys.rgb_to_hsv(*[c / 255 for c in rgb])
    return (h + .08) % 1

def shot_border():
    # The hand becomes the label: the same cut motifs, stacked in layers round the panel.
    world(.52)
    ground(TEAL, grain=.3)
    v = sun(125, 42, power=1.55, soft=2.2)
    W, H = 14, 26                # the label's proportion, doubled and more: 108 x 234 pt
    pw, ph = 9.8, 21.2           # the white panel, as in the print file
    # three depths; each ring is the same motifs dealt again, never a copy-paste of one ring
    placed = 0
    for layer, (z, count, sz) in enumerate([(.25, 46, 5.4), (.75, 38, 4.5), (1.25, 26, 3.8)]):
        idx = list(range(len(M))); rng.shuffle(idx)
        for n in range(count):
            t = n / count
            perim = 2 * (W + H)
            d = (t + rng.uniform(-.008, .008)) * perim
            if d < W: x, y = d - W / 2, H / 2
            elif d < W + H: x, y = W / 2, H / 2 - (d - W)
            elif d < 2 * W + H: x, y = W / 2 - (d - W - H), -H / 2
            else: x, y = -W / 2, -H / 2 + (d - 2 * W - H)
            # lean inward so the border stays a border, with the outer edge left loose
            k = rng.uniform(.82, 1.02)
            cutout(idx[n % len(idx)], sz * rng.uniform(.85, 1.15), (x * k, y * k, z + rng.uniform(0, .18)), rot=rng.uniform(0, 6.28), curl=.11, seed=layer * 100 + n)
            placed += 1
    # the panel floats above it all: the real print file's panel, so the words are the real words
    panel_z = 1.75
    art = label_panel()
    verts = [(-pw / 2, -ph / 2, panel_z), (pw / 2, -ph / 2, panel_z), (pw / 2, ph / 2, panel_z), (-pw / 2, ph / 2, panel_z)]
    p = mesh_obj('panel', verts, [(0, 1, 2, 3)], [(0, 0), (1, 0), (1, 1), (0, 1)], smooth=False)
    p.data.materials.append(tex_mat('panel', art, rough=.8, alpha=True, grain=.06))
    camera((0, -31, 66), (0, -.6, .6), lens=72, dof=73, fstop=11)
    S.render.resolution_y = int(WIDTH * 1.0)

def label_panel():
    """The white panel out of the real label, as a texture."""
    from_ = os.path.join(SRC, 'labels', 'conditioner-panel.png')
    return from_

def shot_bottle():
    world(.5)
    sweep('#f7e4d4')  # the peach from her old mock
    v = sun(-128, 42, power=1.62, soft=1.3, col=(1, .985, .96))
    leaf_shade(v, (0, 0, 8), LEAVES * 4, spread=46, size=16, clear=13)
    spray('shampoo.png', 12.4, 2.35, 118, 11.2, (0, 0, 0), name='shampoo')
    for n, (i, p) in enumerate([(23, (-8.2, -2.4)), (1, (7.2, -3.2)), (17, (8, 2.4)), (16, (-6.2, 3.2))]):
        cutout(i, 4.6, (p[0], p[1], .08), rot=rng.uniform(0, 6.28), curl=.14, seed=40 + n)
    camera((0, -74, 15), (0, 0, 7.6), lens=85, dof=74, fstop=11)

def shot_family():
    world(.5)
    sweep('#d9efe9')  # the brand's teal, let right down, so the whites stay white
    v = sun(-128, 42, power=1.62, soft=1.3, col=(1, .985, .96))
    leaf_shade(v, (2, 0, 7), LEAVES * 5, spread=62, size=16, clear=25)
    box('conditioner-new.png', (-13.2, 2.6, 0), rot=math.radians(16))
    spray('conditioner.png', 10.2, 2.05, 118, 8.8, (-5.8, -1, 0), name='conditioner')
    spray('shampoo.png', 12.4, 2.35, 118, 11.2, (.4, 2.2, 0), name='shampoo')
    tube('elixir.png', (6.8, -.6, 0), rot=math.radians(-6))
    dropper('oil.png', 8.6, 1.75, 110, 7.6, (12.3, 1.6, 0), name='oil')
    jar((17.6, -2.2, 0))
    for n, (i, p) in enumerate([(23, (-9.5, -7.5)), (16, (-1.5, -7.2)), (17, (4.2, -8.2)), (1, (10.2, -7.4)), (5, (21.8, -6.6)), (25, (-16.8, -5.2))]):
        cutout(i, 3.8, (p[0], p[1], .08), rot=rng.uniform(0, 6.28), curl=.14, seed=70 + n)
    camera((2.4, -92, 25), (2.4, 0, 6), lens=70, dof=94, fstop=14)

# ------- Study 55: glass, and light that costs money. Each variant changes one thing: what the bottle is made of, and the room it stands in.
S.cycles.max_bounces = 24
S.cycles.glossy_bounces = 12
S.cycles.transmission_bounces = 24
S.cycles.caustics_reflective = True
S.cycles.caustics_refractive = True
S.cycles.blur_glossy = .6
S.view_settings.view_transform = 'Standard'
S.view_settings.exposure = 0

def glass_mat(tint=(1, 1, 1, 1), rough=.0, name='glass'):
    m, t, b = principled(name)
    set_in(b, 'Base Color', tint); set_in(b, 'Roughness', rough); set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.5)
    return m

def liquid_mat(col, dens=.12):
    """Coloured by depth, as a real liquid is: the thick middle darker than the edges."""
    m = bpy.data.materials.new('liquid'); m.use_nodes = True
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    set_in(b, 'Base Color', (1, 1, 1, 1)); set_in(b, 'Roughness', 0); set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.38)
    v = t.nodes.new('ShaderNodeVolumeAbsorption'); v.inputs['Color'].default_value = hexc(col); v.inputs['Density'].default_value = dens
    out_ = next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL')
    t.links.new(v.outputs['Volume'], out_.inputs['Volume'])
    return m

def metal(col, rough=.12):
    return plain('metal', hexc(col), rough=rough, metal=1)
GOLD, CHAMPAGNE, STEEL = '#e8c98a', '#ecdcc0', '#d8dade'

def shell_profile(r, h, neck_r, neck_h, wall=.2, base=.75):
    """Heavy-based glass: an outer skin down to a thick foot, an inner skin back up, one closed form."""
    out_ = [(0, 0), (r - .28, 0)]
    for i in range(1, 8):
        t = i / 7 * math.pi / 2; out_.append((r - .28 + .28 * math.sin(t), .28 - .28 * math.cos(t)))
    sh = h - 1.0
    out_.append((r, sh))
    for i in range(1, 12):
        t = i / 11
        s_ = t * t * (3 - 2 * t)
        out_.append((r + (neck_r - r) * s_, sh + (h - sh) * t))
    out_ += [(neck_r, h + neck_h), (neck_r - wall * .8, h + neck_h)]
    ri = r - wall
    in_ = [(neck_r - wall * .8, h)]
    for i in range(1, 12):
        t = i / 11
        s_ = t * t * (3 - 2 * t)
        in_.append((neck_r - wall * .8 + (ri - (neck_r - wall * .8)) * s_, h - (h - sh) * t))
    in_.append((ri, base + .35))
    for i in range(1, 8):
        t = i / 7 * math.pi / 2; in_.append((ri - .35 + .35 * math.cos(t), base + .35 - .35 * math.sin(t)))
    in_.append((0, base))
    return out_ + in_, ri, sh, base

def glass_bottle(label, loc=(0, 0, 0), rot=0, r=2.45, h=11.4, neck_r=1.05, neck_h=.5, deg=78, label_h=7.2, label_z=1.7,
                 glass=None, liquid=None, fill=.9, top='pump', collar=None, cap=None, name='bottle'):
    prof, ri, sh, base = shell_profile(r, h, neck_r, neck_h)
    obs = [lathe(name + ' glass', prof, glass or glass_mat(), segs=220)]
    if liquid:
        z_top = base + (sh - base) * fill
        e = .006
        lp = [(0, base + e), (ri - .35, base + e)]
        for i in range(1, 8):
            t = i / 7 * math.pi / 2; lp.append((ri - .35 + (.35 - e) * math.sin(t), base + .35 - .35 * math.cos(t)))
        lp += [(ri - e, z_top), (0, z_top)]
        obs.append(lathe(name + ' liquid', lp, liquid, segs=200))
    obs.append(wrap(name + ' label', r + .012, label_z, label_z + label_h, deg, os.path.join(SRC, 'labels', label), mat=label_mat(name + ' label', os.path.join(SRC, 'labels', label))))
    obs[-1].visible_shadow = False
    obs[-1].visible_transmission = False
    top_z = h + neck_h
    c = collar or metal(STEEL)
    if top == 'pump':
        obs.append(lathe(name + ' collar', round_profile(neck_r + .22, h + .02, top_z + 1.15, .06), c))
        obs.append(lathe(name + ' stem', round_profile(.42, top_z + 1.1, top_z + 1.7, .02), c))
        obs.append(lathe(name + ' head', [(0, top_z + 1.7), (.95, top_z + 1.7), (1.02, top_z + 1.78), (1.02, top_z + 3.0), (.94, top_z + 3.12), (0, top_z + 3.16)], cap or c))
        noz = lathe(name + ' nozzle', round_profile(.17, 0, 1.2, .03), cap or c, segs=32)
        noz.rotation_euler = (math.radians(90), 0, 0); noz.location = (0, -.9, top_z + 2.5)
        obs.append(noz)
    else:
        obs.append(lathe(name + ' collar', round_profile(neck_r + .22, h + .02, top_z + 1.5, .06), c))
        bulb = [(0, top_z + 1.5), (.62, top_z + 1.5), (.62, top_z + 2.1)] + [(.62 * math.cos(t / 10 * 1.57), top_z + 2.1 + 1.35 * math.sin(t / 10 * 1.57)) for t in range(11)]
        obs.append(lathe(name + ' bulb', bulb, cap or plain('bulb', (.03, .03, .03, 1), rough=.35)))
    return group(obs, loc, rot, name)

def label_mat(name, path):
    m = tex_mat(name, path, rough=.5, grain=.03)
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    tex = next(n for n in t.nodes if n.type == 'TEX_IMAGE')
    geo = t.nodes.new('ShaderNodeNewGeometry'); mix = t.nodes.new('ShaderNodeMixRGB')
    mix.inputs[2].default_value = (.92, .92, .9, 1)
    t.links.new(geo.outputs['Backfacing'], mix.inputs[0]); t.links.new(tex.outputs['Color'], mix.inputs[1]); t.links.new(mix.outputs[0], b.inputs['Base Color'])
    set_in(b, 'Emission Color', (1, .96, .88, 1))
    t.links.new(geo.outputs['Backfacing'], b.inputs['Emission Strength'])
    return m

def softbox(loc, target, w, h, power, col=(1, 1, 1)):
    """A studio softbox. Out of shot, but the glass sees it: it is what draws the long highlights."""
    d = bpy.data.lights.new('box', 'AREA'); d.shape = 'RECTANGLE'; d.size = w; d.size_y = h; d.energy = power; d.color = col
    o = bpy.data.objects.new('box', d); S.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    o.visible_camera = False
    return o

def stage(color, floor_rough=.5, back=26, radius=22, wall=None):
    """Seamless: the floor polished as far as asked, curving up into the wall."""
    ob = sweep(color, grain=0, back=back, radius=radius)
    b = next(n for n in ob.data.materials[0].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    nt = ob.data.materials[0].node_tree
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 0; mr.inputs['From Max'].default_value = 7
    mr.inputs['To Min'].default_value = floor_rough; mr.inputs['To Max'].default_value = .92
    nt.links.new(geo.outputs['Position'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], b.inputs['Roughness'])
    return ob

def key(power, col=(1, 1, 1), loc=(5, -42, 15), target=(0, 0, 6), size=15):
    """A tight spot on the bottle, so the label is white and the room can stay dark."""
    d = bpy.data.lights.new('key', 'SPOT'); d.energy = power; d.spot_size = math.radians(size); d.spot_blend = .7; d.color = col; d.shadow_soft_size = 4
    o = bpy.data.objects.new('key', d); S.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    o.visible_camera = False

def backcard(z0, z1, w, col, strength, y=3.6):
    """The old trick: a lit card right behind the bottle, seen only through the glass. It is what makes liquid glow."""
    w = 40; z0, z1 = -6, 24
    ob = mesh_obj('backcard', [(-w / 2, y, z0), (w / 2, y, z0), (w / 2, y, z1), (-w / 2, y, z1)], [(0, 1, 2, 3)], smooth=False)
    m = bpy.data.materials.new('backcard'); m.use_nodes = True
    t = m.node_tree
    for n in list(t.nodes):
        if n.type == 'BSDF_PRINCIPLED': t.nodes.remove(n)
    e = t.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*col, 1); e.inputs['Strength'].default_value = strength
    t.links.new(e.outputs[0], next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL').inputs['Surface'])
    ob.data.materials.append(m)
    ob.visible_camera = False; ob.visible_shadow = False; ob.visible_glossy = False
    return ob

def glow(z, y, power, size, col):
    """A pool of light on the wall behind the bottle: where the eye goes, and what lights the liquid from behind."""
    d = bpy.data.lights.new('glow', 'SPOT'); d.energy = power; d.spot_size = math.radians(size); d.spot_blend = 1; d.color = col; d.shadow_soft_size = 2
    o = bpy.data.objects.new('glow', d); S.collection.objects.link(o)
    o.location = (0, y - 24, z - 6)
    o.rotation_euler = (Vector((0, y, z)) - Vector(o.location)).to_track_quat('-Z', 'Y').to_euler()
    o.visible_camera = False

def frame(z=7.9, dist=54, lens=105, x=0, high=8.8, fstop=4.5):
    S.render.resolution_x = WIDTH
    S.render.resolution_y = int(WIDTH * 1.25)
    camera((x, -dist, high), (x, 0, z), lens=lens, dof=dist, fstop=fstop)

LABEL = 'shampoo-clean.png'

def shot_noir():
    # Clear glass, golden oil, a dark polished room: the classic of the category, to measure the rest against.
    world(.05)
    stage('#123a38', floor_rough=.14)
    backcard(.3, 10, 4.2, (1, .84, .55), 1.15)
    softbox((-16, -8, 15), (0, 0, 7), 5, 30, 1500)
    key(26000)
    softbox((16, -6, 15), (0, 0, 7), 3, 30, 800)
    softbox((0, -24, 34), (0, 0, 7), 24, 14, 420)
    glow(9, 30, 60000, 50, (.72, 1, .94))
    glass_bottle(LABEL, fill=1.06, liquid=liquid_mat('#c9780c', .55), collar=metal(GOLD), cap=metal(GOLD, .18))
    frame()

def shot_atelier():
    # Frosted glass in bright daylight on pale stone: quiet luxury, nothing shining.
    world(.42, (1, .99, .97))
    stage('#efeae1', floor_rough=.42)
    v = sun(-125, 34, power=2.2, soft=4, col=(1, .97, .92))
    softbox((-20, -14, 18), (0, 0, 7), 22, 26, 500)
    backcard(.3, 10, 4, (1, 1, 1), .9)
    softbox((18, -4, 16), (0, 0, 7), 4, 26, 300)
    glass_bottle(LABEL, glass=glass_mat((1, 1, 1, 1), rough=.34), liquid=plain('cream', (.86, .83, .76, 1), rough=.5), collar=metal(CHAMPAGNE, .28), cap=metal(CHAMPAGNE, .28))
    frame(fstop=8)

def shot_teal():
    # The brand's teal, in the glass itself, gold on top, on warm plaster under her leaves' shadow (what worked in Study 53).
    world(.3, (1, .98, .95))
    stage('#e8dac6', floor_rough=.5)
    v = sun(-128, 40, power=2.35, soft=1.1, col=(1, .95, .87))
    leaf_shade(v, (0, 0, 8), LEAVES * 4, spread=46, size=16, clear=9)
    softbox((-18, -6, 14), (0, 0, 7), 3.5, 28, 520)
    softbox((5, -46, 13), (0, 0, 6), 22, 22, 420)
    softbox((18, -6, 14), (0, 0, 7), 3.5, 28, 520)
    glass_bottle(LABEL, glass=glass_mat(hexc(TEAL)), fill=.97, liquid=liquid_mat('#2c8f85', .05), collar=metal(GOLD), cap=metal(GOLD, .16))
    frame(fstop=8)

def shot_apothecary():
    # Amber glass and a dropper: the old pharmacy, which is where hair oil comes from in India.
    world(.1, (1, .92, .82))
    stage('#6d3a24', floor_rough=.2)
    backcard(.3, 8.6, 4, (1, .74, .44), 1.25)
    softbox((-16, -8, 15), (0, 0, 7), 4, 28, 900, (1, .9, .78))
    key(26000, (1, .96, .9), target=(0, 0, 5))
    softbox((16, -8, 13), (0, 0, 7), 3, 26, 520, (1, .86, .72))
    softbox((0, -22, 32), (0, 0, 7), 20, 14, 380, (1, .93, .84))
    glow(8, 26, 60000, 48, (1, .66, .36))
    glass_bottle('oil.png', r=2.3, h=9.8, neck_r=.92, deg=62, label_h=6.1, label_z=1.45, glass=glass_mat(hexc('#b5651d')), liquid=liquid_mat('#8a4a12', .1), top='dropper', collar=metal(GOLD), name='amber')
    frame(z=6.7, dist=48, high=7.6)

def shot_infused():
    # Her flowers inside the bottle: the painted motifs steeping in the oil, as herbs do. The most brand-like of the five.
    world(.32)
    stage('#dfe8cf', floor_rough=.3)
    softbox((-16, -8, 15), (0, 0, 7), 4, 30, 620)
    key(16000)
    softbox((16, -8, 15), (0, 0, 7), 4, 30, 620)
    softbox((0, -20, 32), (0, 0, 7), 24, 14, 300)
    glow(9, 34, 26000, 46, (1, .98, .86))
    backcard(.3, 10.4, 4.4, (1, .97, .86), .72)
    glass_bottle(LABEL, liquid=liquid_mat('#f0c95a', .035), collar=metal(GOLD), cap=metal(GOLD, .16), label_h=6.2, deg=68, label_z=1.6)
    rr = random.Random(5)
    spots = [(-.95, .7, 9.05, 23), (.9, .6, 8.85, 16), (0, .95, 9.15, 17), (-1.3, .9, 6.5, 1), (1.3, .9, 6.1, 25), (-1.25, 1, 3.7, 13), (1.25, 1, 3.1, 11)]
    for n, (x, y, z, i) in enumerate(spots):
        o = cutout(i, 1.15, (x, y, z), rot=rr.uniform(0, 6.28), curl=.1, seed=500 + n)
        o.rotation_euler = (math.radians(rr.uniform(60, 110)), math.radians(rr.uniform(-25, 25)), rr.uniform(-.7, .7))
    frame(fstop=8)

globals()['shot_' + SHOT]()
bpy.ops.render.render(write_still=True)
print('RENDERED', SHOT, OUT)
