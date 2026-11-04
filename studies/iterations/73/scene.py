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

# ------- Studies 57 and 58: true sizes, the label's own proportions, and real light.
S.cycles.max_bounces = 16
S.cycles.glossy_bounces = 8
S.cycles.transmission_bounces = 16
S.view_settings.view_transform = 'Standard'

def exact_label(path, r, h, z0, facing=-90, name='label'):
    """The label's width comes from its own file. Nothing else may set it: this is what keeps it unsquished."""
    im = image(os.path.join(SRC, 'labels', path))
    aspect = im.size[0] / im.size[1]
    width = h * aspect
    deg = width / (2 * math.pi * r) * 360
    print('LABEL', path, 'file', round(aspect, 4), 'built', round((2 * math.pi * r * deg / 360) / h, 4))
    m = tex_mat(name, os.path.join(SRC, 'labels', path), rough=.46, grain=.035)
    return wrap(name, r + .012, z0, z0 + h, deg, None, facing=facing, mat=m)

def pose(g, loc, euler=(0, 0, 0)):
    e = bpy.data.objects.new('pose', None); S.collection.objects.link(e)
    g.parent = e; e.location = loc; e.rotation_euler = euler
    return e

def spout(pts, r, mat):
    c = bpy.data.curves.new('spout', 'CURVE'); c.dimensions = '3D'; c.bevel_depth = r; c.bevel_resolution = 6; c.resolution_u = 24
    sp = c.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for p, co in zip(sp.bezier_points, pts):
        p.co = co; p.handle_left_type = p.handle_right_type = 'AUTO'
    o = bpy.data.objects.new('spout', c); S.collection.objects.link(o)
    c.materials.append(mat)
    return o

BODY = lambda: plain('body', (.88, .88, .86, 1), rough=.27, coat=.3)
CHROME = lambda: plain('chrome', (.9, .9, .92, 1), rough=.12, metal=1)
BRUSHED = lambda: plain('brushed', (.82, .82, .84, 1), rough=.32, metal=1)

def spray2(label, label_h, h=12.4, r=2.35, name='spray', rot=0, frost=False):
    """Study 53's bottle, which was right: same height and width. Only the label's width changes, to its true one."""
    body = glass_frost() if frost else BODY()
    z0 = (h - label_h) / 2
    nr = r * .52
    obs = [lathe(name + ' body', round_profile(r, 0, h, .35), body), exact_label(label, r, label_h, z0, name=name + ' label')]
    obs.append(lathe(name + ' collar', round_profile(nr, h - .05, h + 1.55, .08), CHROME()))
    obs.append(lathe(name + ' stem', round_profile(nr * .5, h + 1.5, h + 2, .03), PUMP()))
    obs.append(lathe(name + ' pump', [(0, h + 2), (nr * .72, h + 2), (nr * .72, h + 3.5), (nr * .6, h + 3.72), (0, h + 3.78)], PUMP()))
    obs.append(lathe(name + ' overcap', [(nr * .84, h + 1.6), (nr * .9, h + 1.6), (nr * .9, h + 4.1), (nr * .8, h + 4.26), (0, h + 4.3), (0, h + 4.24), (nr * .74, h + 4.18), (nr * .84, h + 4.06), (nr * .84, h + 1.6)], CLEAR2()))
    return group(obs, (0, 0, 0), rot, name)

def CLEAR2():
    m, t, b = principled('overcap')
    set_in(b, 'Base Color', (1, 1, 1, 1)); set_in(b, 'Roughness', .06); set_in(b, 'Alpha', .16); set_in(b, 'Coat Weight', 1)
    m.blend_method = 'BLEND'
    return m

def glass_frost():
    return plain('frost', (1, 1, 1, 1), rough=.3, transmit=.85, ior=1.5)

def oil_pump(rot=0, name='oil', spin=30):
    """As in her mock (Deep nourishing hair oil.png): a round-shouldered pump bottle, the wide label, a swan-neck."""
    r, h = 3.25, 11.7
    prof = [(0, 0), (r - .5, 0)]
    for i in range(1, 8):
        t = i / 7 * math.pi / 2; prof.append((r - .5 + .5 * math.sin(t), .5 - .5 * math.cos(t)))
    sh = h - 2.1
    prof.append((r, sh))
    nr = 1.15
    for i in range(1, 15):
        t = i / 14 * math.pi / 2
        prof.append((nr + (r - nr) * math.cos(t) ** .75, sh + 2.1 * math.sin(t)))
    prof.append((0, h))
    obs = [lathe(name + ' body', prof, BODY()), exact_label('oil.png', r, 8.15, 1.15, name=name + ' label')]
    c = CHROME()
    # the ribbed collar, the pump shaft, the head and its long neck
    ribs = [(0, h - .05), (nr + .28, h - .05)]
    for i in range(9):
        z = h + i * .2
        ribs += [(nr + .28, z + .02), (nr + .22, z + .1), (nr + .28, z + .18)]
    ribs += [(nr + .28, h + 1.85), (nr * .7, h + 1.95), (0, h + 1.95)]
    obs.append(lathe(name + ' collar', ribs, c, segs=120))
    obs.append(lathe(name + ' shaft', round_profile(.42, h + 1.9, h + 3.2, .03), c))
    obs.append(lathe(name + ' head', [(0, h + 3.15), (.7, h + 3.15), (.76, h + 3.25), (.74, h + 4.05), (.62, h + 4.32), (0, h + 4.42)], c))
    z = h + 3.92
    a = math.radians(spin)
    d = (math.cos(a), math.sin(a))
    obs.append(spout([(0, 0, z), (d[0] * 1.8, d[1] * 1.8, z + .12), (d[0] * 3.25, d[1] * 3.25, z - .1), (d[0] * 3.75, d[1] * 3.75, z - .62)], .23, c))
    return group(obs, (0, 0, 0), rot, name)

def tube2(rot=0, H=12.5, r=2.15, name='tube'):
    """As in her mock (elixir.png): a ribbed crimp, a cream cap. Width from the label, height from the label."""
    cap_h = 2.6
    rings, segs = 40, 96
    wide = math.pi * r / 2
    im = image(os.path.join(SRC, 'labels', 'elixir.png'))
    art_h = (2 * wide) / (im.size[0] / im.size[1])
    H = cap_h + art_h
    print('LABEL elixir.png file', round(im.size[0] / im.size[1], 4), 'built', round(2 * wide / art_h, 4))
    verts, uvs, faces = [], [], []
    for j in range(rings + 1):
        t = j / rings
        a_ = r + (wide - r) * t ** 1.05
        b_ = r * (1 - t) ** .8 + .03
        for s in range(segs + 1):
            ang = 2 * math.pi * s / segs - math.pi / 2
            x, y = a_ * math.cos(ang), b_ * math.sin(ang)
            verts.append((x, y, cap_h + art_h * t)); uvs.append(((x / wide + 1) / 2, t))
    for j in range(rings):
        for s in range(segs):
            a0 = j * (segs + 1) + s
            faces.append((a0, a0 + 1, a0 + segs + 2, a0 + segs + 1))
    body = mesh_obj(name, verts, faces, uvs)
    body.data.materials.append(tex_mat('tube art', os.path.join(SRC, 'labels', 'elixir.png'), rough=.3, coat=.3))
    obs = [body]
    # the ribs of the crimp
    n = 46
    rib = plain('crimp', (.8, .8, .77, 1), rough=.4)
    for i in range(n):
        x = (i + .5) / n * 2 * wide - wide
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, H + .24))
        o = bpy.context.active_object; o.scale = (2 * wide / n * .62, .1, .48)
        o.data.materials.append(rib); obs.append(o)
    base = card('crimp base', '#efefea', 2 * wide + .02, .07, z=H + .48, thick=.5, grain=0)
    obs.append(base)
    obs.append(lathe(name + ' cap', [(0, 0), (r * .96, 0), (r * 1.02, .12), (r * 1.04, 2.5), (r * 1, 2.62), (0, 2.65)], plain('cap', hexc('#efe7d8'), rough=.3, coat=.25)))
    return group(obs, (0, 0, 0), rot, name)

def jar2(rot=0):
    r, h = 3.02, 5.2
    obs = [lathe('jar body', round_profile(r, 0, h, .25), BODY())]
    im = image(os.path.join(SRC, 'labels', 'jar.png'))
    aspect = im.size[0] / im.size[1]
    lab_h = 2 * math.pi * r / aspect
    print('LABEL jar.png file', round(aspect, 4), 'built', round(2 * math.pi * r / lab_h, 4))
    obs.append(wrap('jar label', r + .012, .45, .45 + lab_h, 360, None, facing=-90 - 96, mat=tex_mat('jar art', os.path.join(SRC, 'labels', 'jar.png'), rough=.46, grain=.03)))
    obs.append(lathe('jar lid', round_profile(r + .08, h - .02, h + 1.65, .16), plain('jar lid', hexc('#efe7d8'), rough=.28, coat=.3)))
    return group(obs, (0, 0, 0), rot, 'jar')

def box2(rot=0):
    im = image(os.path.join(SRC, 'labels', 'conditioner.png'))
    h = 12.2; w = h * im.size[0] / im.size[1]; d = 3.9
    print('LABEL box conditioner.png file', round(im.size[0] / im.size[1], 4), 'built', round(w / h, 4))
    return box('conditioner.png', (0, 0, 0), rot, w=w, h=h, d=d)

# ------- surfaces that have something for the light to catch
def plaster(color, y=14, strength=.34):
    verts = [(-400, y, -5), (400, y, -5), (400, y, 400), (-400, y, 400)]
    ob = mesh_obj('wall', verts, [(0, 1, 2, 3)], smooth=False)
    m, t, b = principled('plaster')
    set_in(b, 'Base Color', hexc(color)); set_in(b, 'Roughness', .92)
    tc = t.nodes.new('ShaderNodeTexCoord')
    n1 = t.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 1.5; n1.inputs['Detail'].default_value = 8; n1.inputs['Roughness'].default_value = .66
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = .5
    t.links.new(tc.outputs['Object'], n1.inputs['Vector']); t.links.new(n1.outputs['Fac'], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    ob.data.materials.append(m)
    return ob

def marble(color='#eeece6', vein='#b9b6ae', y0=-400, y1=14):
    verts = [(-400, y0, 0), (400, y0, 0), (400, y1, 0), (-400, y1, 0)]
    ob = mesh_obj('floor', verts, [(0, 1, 2, 3)], smooth=False)
    m, t, b = principled('marble')
    tc = t.nodes.new('ShaderNodeTexCoord')
    w = t.nodes.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = 'DIAGONAL'
    w.inputs['Scale'].default_value = .09; w.inputs['Distortion'].default_value = 9; w.inputs['Detail'].default_value = 9; w.inputs['Detail Roughness'].default_value = .62
    r_ = t.nodes.new('ShaderNodeValToRGB'); r_.color_ramp.elements[0].position = .9; r_.color_ramp.elements[1].position = 1
    r_.color_ramp.elements[0].color = (0, 0, 0, 1); r_.color_ramp.elements[1].color = (1, 1, 1, 1)
    mx = t.nodes.new('ShaderNodeMixRGB'); mx.inputs[1].default_value = hexc(color); mx.inputs[2].default_value = hexc(vein)
    t.links.new(tc.outputs['Object'], w.inputs['Vector']); t.links.new(w.outputs['Fac'], r_.inputs['Fac']); t.links.new(r_.outputs['Color'], mx.inputs[0]); t.links.new(mx.outputs[0], b.inputs['Base Color'])
    set_in(b, 'Roughness', .17); set_in(b, 'Coat Weight', .3)
    ob.data.materials.append(m)
    return ob

def stone(name, w, d, h, loc, color='#d9d3c7', rot=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(loc[0], loc[1], loc[2] + h / 2))
    o = bpy.context.active_object; o.name = name; o.scale = (w, d, h); o.rotation_euler = (0, 0, rot)
    bpy.ops.object.transform_apply(scale=True)
    b_ = o.modifiers.new('b', 'BEVEL'); b_.width = .08; b_.segments = 3
    m, t, b = principled(name)
    tc = t.nodes.new('ShaderNodeTexCoord'); n = t.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 2.2; n.inputs['Detail'].default_value = 14; n.inputs['Roughness'].default_value = .68
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .8; bp.inputs['Distance'].default_value = .2
    set_in(b, 'Base Color', hexc(color)); set_in(b, 'Roughness', .86)
    t.links.new(tc.outputs['Object'], n.inputs['Vector']); t.links.new(n.outputs['Fac'], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    o.data.materials.append(m)
    return o

def window_shadow(v, target, height=120, w=70, h=90, bars=((-18, 2.6), (19, 3.2)), rails=((-14, 3), (22, 2.2)), edge=True):
    """A window between the sun and the room: the long bars of shadow in her mock."""
    c = Vector(target) + v * height
    x = v.cross(Vector((0, 0, 1))).normalized(); y = v.cross(x).normalized()
    q = v.to_track_quat('Z', 'Y').to_euler()
    def bar(off_x, off_y, sx, sy):
        bpy.ops.mesh.primitive_cube_add(size=1, location=tuple(c + x * off_x + y * off_y))
        o = bpy.context.active_object; o.scale = (sx, sy, 1); o.rotation_euler = q; o.visible_camera = False
        # the cube's own axes follow the sun's frame; x and y above are that frame up to sign
        return o
    xq = Vector((1, 0, 0)); xq.rotate(q); yq = Vector((0, 1, 0)); yq.rotate(q)
    def b2(a, b_, sx, sy):
        bpy.ops.mesh.primitive_cube_add(size=1, location=tuple(c + xq * a + yq * b_))
        o = bpy.context.active_object; o.scale = (sx, sy, 1); o.rotation_euler = q; o.visible_camera = False
    for a, t_ in bars: b2(a, 0, t_, 400)
    for a, t_ in rails: b2(0, a, 400, t_)
    if edge:
        b2(-w / 2 - 80, 0, 160, 500); b2(w / 2 + 80, 0, 160, 500); b2(0, h / 2 + 80, 500, 160); b2(0, -h / 2 - 80, 500, 160)

def cam(loc, target, lens=85, fstop=8, wide=True, focus=None):
    if wide: S.render.resolution_y = int(WIDTH / 1.5)
    else: S.render.resolution_y = int(WIDTH * 1.25)
    d = (Vector(loc) - Vector(target)).length
    camera(loc, target, lens=lens, dof=focus or d, fstop=fstop)

# ------- Study 57: her motifs, at the sizes she painted them, the paper's grain in low sun
def true_size(i, k):
    d = M[i]
    return max(d['w'], d['h']) * k

def paper_ground(color='#f8f7f3', grain=.75):
    ob = card('sheet', color, 900, 900, thick=1, grain=0)
    t = ob.data.materials[0].node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    paper_bump(t, b, scale=6.5, strength=grain)
    return ob

def shot_flower():
    world(.62, (.95, .97, 1))
    paper_ground('#fbfaf6', grain=.42)
    sun(138, 15, power=4.6, soft=.8, col=(1, .975, .94))
    i = int(arg('hero', 23))
    cutout(i, 10.5, (0, -.4, .06), rot=math.radians(-6), curl=.1)
    S.render.resolution_y = int(WIDTH / 1.5)
    camera((0, -1.2, 36), (0, -.2, 0), lens=70)

def shot_hand():
    world(.62, (.95, .97, 1))
    paper_ground('#fbfaf6', grain=.36)
    sun(138, 19, power=3.9, soft=1, col=(1, .975, .94))
    k = 8.6 / max(max(m['w'], m['h']) for m in M)   # the largest painting becomes 6.6 cm; the rest keep their size against it
    keys = sorted(range(len(M)), key=lambda i: colour_sort(M[i]['rgb']))
    rows, row, x = [], [], 0
    limit = 45
    for i in keys:
        d = M[i]; w_, h_ = d['w'] * k + .7, d['h'] * k + .7
        if x + w_ > limit:
            rows.append((row, x)); row, x = [], 0
        row.append((i, w_, h_)); x += w_
    rows.append((row, x))
    total_h = sum(max(h for _, _, h in r) for r, _ in rows)
    y = total_h / 2
    for r, width in rows:
        rh = max(h for _, _, h in r)
        cx = -width / 2
        for i, w_, h_ in r:
            cutout(i, true_size(i, k), (cx + w_ / 2, y - rh / 2, .05), rot=rng.uniform(-.12, .12), curl=.09)
            cx += w_
        y -= rh
    print('HAND rows', len(rows), 'height', round(total_h, 1), 'k', round(k, 5))
    S.render.resolution_y = int(WIDTH / 1.5)
    camera((0, -.8, 88), (0, 0, 0), lens=70)

# ------- Study 58: light and pose. Every picture: hard sun through a window, on real surfaces.
def room(wall='#e6e6e2', floor=True, sun_az=-135, sun_el=34, power=2.75, fill=.42, col=(1, .97, .92)):
    power *= .66; fill *= .78
    world(fill, (.9, .94, 1))
    plaster(wall)
    if floor: marble()
    return sun(sun_az, sun_el, power=power, soft=.9, col=col)

def shot_window():
    # Her own mock's idea, turned: the elixir, a quarter turn, seen from just above the floor
    v = room(sun_az=-128, sun_el=30)
    window_shadow(v, (0, 4, 10))
    pose(tube2(rot=math.radians(-20)), (0, 0, 0))
    cam((-9, -52, 8), (0, 0, 7.6), lens=85, wide=False, fstop=9)

def shot_lean():
    # The shampoo at rest against a block of stone, not standing to attention
    v = room(wall='#ded9cf', sun_az=-115, sun_el=26, power=3)
    window_shadow(v, (0, 4, 8), w=60, h=70, bars=((-8, 2.4),), rails=((12, 2.4),))
    stone('block', 9, 7, 11, (5.6, 1.6, 0), rot=math.radians(14))
    g = spray2('shampoo.png', 10.2, rot=math.radians(-14), name='shampoo')
    pose(g, (-.55, 0, 0), (0, math.radians(13), 0))
    cam((-16, -50, 11), (.5, 0, 7.4), lens=85, wide=False, fstop=9)

def shot_lying():
    # The conditioner lying on paper, among what it is made of, seen from above in low sun
    world(.5, (.95, .97, 1))
    paper_ground('#f7f5ee', grain=.4)
    sun(150, 21, power=3.1, soft=.9, col=(1, .96, .9))
    g = spray2('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(-58), name='conditioner')
    pose(g, (-6.2, 0, 2.05), (0, math.radians(90), 0))
    k = 6.6 / max(max(m['w'], m['h']) for m in M)
    for n, (i, x, y, rot_) in enumerate([(23, -8.2, 6.2, -.4), (1, 3.8, 5.4, .8), (5, 8.6, 2, 2.2), (16, -11.4, -5.2, .3), (17, 3.2, -5.6, -.9), (3, 9.6, -3.4, 2.7), (11, -3, 7.6, 1), (8, 11.8, 5.4, .4)]):
        cutout(i, true_size(i, k) * 1.15, (x, y, .05), rot=rot_, curl=.11, seed=300 + n)
    S.render.resolution_y = int(WIDTH / 1.5)
    camera((3, -24, 40), (1, -.3, 1), lens=70, dof=47, fstop=11)

def shot_pair():
    # The oil, now as she drew it, with the conditioner in front and off to one side: a composition, not a line-up
    v = room(wall='#dfe9e4', sun_az=-140, sun_el=33, power=2.75)
    window_shadow(v, (0, 4, 9), w=62, h=78, bars=((-11, 2.8),), rails=((6, 2.8),))
    pose(oil_pump(rot=math.radians(14), spin=20), (2.9, 2.2, 0))
    pose(spray2('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(16), name='conditioner'), (-3.8, -3.3, 0))
    cam((-11, -52, 11.5), (0, 0, 7.8), lens=85, wide=False, fstop=9)

def shot_steps():
    # Three heights of stone on a diagonal: the eye climbs from the jar to the bottle
    v = room(wall='#e7ded0', sun_az=-120, sun_el=22, power=3.25, col=(1, .94, .84))
    window_shadow(v, (0, 4, 10), w=74, h=66, bars=((6, 2.6),), rails=((-4, 2.4),))
    stone('low', 13, 11, 2.5, (-7.5, -2.4, 0))
    stone('mid', 11, 11, 7, (2.6, 1.2, 0), rot=math.radians(-4))
    pose(jar2(rot=math.radians(-8)), (-8.4, -3.2, 2.5))
    pose(tube2(rot=math.radians(16)), (2.6, .4, 7))
    pose(spray2('shampoo.png', 10.2, rot=math.radians(14), name='shampoo'), (-3.2, 2.4, 0))
    cam((-14, -62, 12), (-2, 0, 9), lens=80, wide=False, fstop=11)

def shot_family2():
    # The family again, with the oil right, in the same hard window light
    v = room(wall='#e3ece8', sun_az=-132, sun_el=32, power=2.75)
    window_shadow(v, (2, 4, 9), w=96, h=86, bars=((-16, 3), (20, 3)), rails=((8, 3),), height=130)
    pose(box2(rot=math.radians(18)), (-15.8, 3, 0))
    pose(spray2('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(10), name='conditioner'), (-8.2, -.8, 0))
    pose(spray2('shampoo.png', 10.2, rot=math.radians(6), name='shampoo'), (-2.2, 2.6, 0))
    pose(tube2(rot=math.radians(-8)), (4.6, -.8, 0))
    pose(oil_pump(rot=math.radians(-4), spin=-25), (12, 2.8, 0))
    pose(jar2(rot=math.radians(-6)), (20.2, -2.6, 0))
    cam((3, -98, 17), (2.6, 0, 7.6), lens=70, wide=True, fstop=14)

# ------- Study 60: everything in thick glass. Same poses, same light, same labels as Study 58. Only the material changes.
S.cycles.max_bounces = 32
S.cycles.glossy_bounces = 12
S.cycles.transmission_bounces = 32
S.cycles.volume_bounces = 2
S.cycles.caustics_reflective = True
S.cycles.caustics_refractive = True
S.cycles.blur_glossy = .4

def heavy_glass(tint='#cfeee3', dens=.035):
    """Glass with weight: clear in the thin places, sea-green where it is thick, as real glass is."""
    m = bpy.data.materials.new('heavy glass'); m.use_nodes = True
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    set_in(b, 'Base Color', (1, 1, 1, 1)); set_in(b, 'Roughness', 0); set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.52)
    v = t.nodes.new('ShaderNodeVolumeAbsorption'); v.inputs['Color'].default_value = hexc(tint); v.inputs['Density'].default_value = dens
    t.links.new(v.outputs['Volume'], next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL').inputs['Volume'])
    return m

def filling(kind):
    if kind == 'cream':
        return plain('cream', hexc('#f4efe3'), rough=.42, coat=.2)
    m = bpy.data.materials.new(kind); m.use_nodes = True
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    set_in(b, 'Base Color', (1, 1, 1, 1)); set_in(b, 'Roughness', 0); set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.46)
    col, dens = {'oil': ('#ffe020', .3), 'elixir': ('#cfd98a', .2)}[kind]
    v = t.nodes.new('ShaderNodeVolumeAbsorption'); v.inputs['Color'].default_value = hexc(col); v.inputs['Density'].default_value = dens
    t.links.new(v.outputs['Volume'], next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL').inputs['Volume'])
    return m

GILT = lambda: plain('gilt', hexc('#e3c99a'), rough=.2, metal=1)
GILT_SOFT = lambda: plain('gilt soft', hexc('#e3c99a'), rough=.34, metal=1)

def shell(outer, wall, base, neck_r_in, name, kind, fill_to):
    """One closed form of thick glass, and what it holds. `outer` runs from the foot to the lip."""
    lip = outer[-1]
    inner = []
    corner = .55
    for r_, z in reversed(outer[1:]):
        if z < base + corner: continue
        inner.append((max(r_ - wall, neck_r_in), z))
    ri = max(p[0] for p in inner)
    for i in range(1, 9):
        t = i / 8 * math.pi / 2
        inner.append((ri - corner + corner * math.cos(t), base + corner - corner * math.sin(t)))
    inner.append((0, base))
    prof = outer + inner
    obs = [lathe(name + ' glass', prof, heavy_glass(), segs=220)]
    # what is inside follows the inner wall up to the fill line
    e = .012 if kind == 'cream' else -.004     # liquid wets the glass: it overlaps it a hair, so no air film shows
    cont = [(0, base + e)]
    for r_, z in reversed(inner[:-1]):
        if z > fill_to: break
        cont.append((max(r_ - e, 0), z + (e if z < base + corner else 0)))
    rr = cont[-1][0]
    cont += [(rr, fill_to), (0, fill_to)]
    obs.append(lathe(name + ' fill', cont, filling(kind), segs=180))
    return obs

def outer_bottle(r, h, neck_r, neck_h, foot=.38, shoulder=1.0):
    o = [(0, .14), (r * .62, .14), (r * .72, .02), (r - foot, 0)]
    for i in range(1, 8):
        t = i / 7 * math.pi / 2; o.append((r - foot + foot * math.sin(t), foot - foot * math.cos(t)))
    sh = h - shoulder
    o.append((r, sh))
    for i in range(1, 13):
        t = i / 12 * math.pi / 2
        o.append((neck_r + (r - neck_r) * math.cos(t) ** .8, sh + shoulder * math.sin(t)))
    o += [(neck_r, h + neck_h), (neck_r - .02, h + neck_h + .02)]
    return o

def label_on(g_obs, path, r, h_, z0, name):
    l = exact_label(path, r, h_, z0, name=name + ' label')
    l.visible_transmission = False; l.visible_shadow = False
    g_obs.append(l)

def spray3(label, label_h, h=12.4, r=2.35, name='spray', rot=0, kind='cream'):
    """Study 53's proportions, which were right. Thick walls, a heavy foot, a solid metal pump."""
    nr = r * .52
    z0 = (h - label_h) / 2
    obs = shell(outer_bottle(r, h, nr * .86, .3), .42, 1.25, nr * .55, name, kind, h - 1.1)
    label_on(obs, label, r, label_h, z0, name)
    c = GILT()
    obs.append(collar(name, nr, h - .02, h + 1.5))
    obs.append(lathe(name + ' stem', round_profile(nr * .5, h + 1.45, h + 2, .03), c))
    obs.append(lathe(name + ' head', [(0, h + 2), (nr * .72, h + 2), (nr * .76, h + 2.08), (nr * .76, h + 3.5), (nr * .66, h + 3.68), (0, h + 3.74)], c))
    noz = lathe(name + ' nozzle', round_profile(.13, 0, nr * .3, .02), plain('dark', hexc('#3a3026'), rough=.4), segs=24)
    noz.rotation_euler = (math.radians(90), 0, 0); noz.location = (0, -nr * .72, h + 3.05); obs.append(noz)
    return group(obs, (0, 0, 0), rot, name)

def oil3(rot=0, name='oil', spin=30):
    """As in her mock: round shoulders, the wide label, a swan neck. In glass the oil itself is the colour."""
    r, h = 3.25, 11.7
    nr = 1.15
    obs = shell(outer_bottle(r, h, nr, .3, foot=.5, shoulder=2.1), .45, 1.35, nr - .32, name, 'oil', h - 1.4)
    label_on(obs, 'oil.png', r, 8.15, 1.45, name)
    c = GILT()
    ribs = [(0, h + .1), (nr + .28, h + .1)]
    for i in range(8):
        z = h + .1 + i * .2
        ribs += [(nr + .28, z + .02), (nr + .22, z + .1), (nr + .28, z + .18)]
    ribs += [(nr + .28, h + 1.85), (nr * .7, h + 1.95), (0, h + 1.95)]
    obs.append(lathe(name + ' collar', ribs, c, segs=120))
    obs.append(lathe(name + ' shaft', round_profile(.42, h + 1.9, h + 3.2, .03), c))
    obs.append(lathe(name + ' head', [(0, h + 3.15), (.7, h + 3.15), (.76, h + 3.25), (.74, h + 4.05), (.62, h + 4.32), (0, h + 4.42)], c))
    z = h + 3.92
    a = math.radians(spin); d = (math.cos(a), math.sin(a))
    obs.append(spout([(0, 0, z), (d[0] * 1.8, d[1] * 1.8, z + .12), (d[0] * 3.25, d[1] * 3.25, z - .1), (d[0] * 3.75, d[1] * 3.75, z - .62)], .23, c))
    return group(obs, (0, 0, 0), rot, name)

def elixir3(rot=0, name='elixir'):
    """The tube cannot be glass: the elixir becomes a dropper bottle. Its label, its proportion, unchanged."""
    r, h = 2.95, 9.6
    nr = 1.05
    obs = shell(outer_bottle(r, h, nr, .3, foot=.42, shoulder=1.3), .42, 1.2, nr - .3, name, 'elixir', h - .9)
    label_on(obs, 'elixir.png', r, 6.5, 1.65, name)
    c = GILT()
    ribs = [(0, h + .12), (nr + .25, h + .12)]
    for i in range(7):
        z = h + .12 + i * .2
        ribs += [(nr + .25, z + .02), (nr + .2, z + .1), (nr + .25, z + .18)]
    ribs += [(nr + .25, h + 1.6), (nr * .72, h + 1.7), (0, h + 1.7)]
    obs.append(lathe(name + ' collar', ribs, c, segs=120))
    bulb = [(0, h + 1.68), (.72, h + 1.68), (.74, h + 2.2)] + [(.74 * math.cos(t / 10 * 1.57), h + 2.2 + 1.5 * math.sin(t / 10 * 1.57)) for t in range(11)]
    obs.append(lathe(name + ' bulb', bulb, plain('bulb', hexc('#efe7d8'), rough=.38)))
    return group(obs, (0, 0, 0), rot, name)

def jar3(rot=0):
    r, h = 3.02, 5.2
    obs = shell([(0, .1), (r * .7, .1), (r * .8, .01), (r - .3, 0)] + [(r - .3 + .3 * math.sin(i / 7 * 1.57), .3 - .3 * math.cos(i / 7 * 1.57)) for i in range(1, 8)] + [(r, h - .1), (r - .08, h)], .48, 1.05, r - .48, 'jar', 'cream', h - .35)
    im = image(os.path.join(SRC, 'labels', 'jar.png'))
    aspect = im.size[0] / im.size[1]
    lab_h = 2 * math.pi * r / aspect
    print('LABEL jar.png file', round(aspect, 4), 'built', round(2 * math.pi * r / lab_h, 4))
    l = wrap('jar label', r + .012, .45, .45 + lab_h, 360, None, facing=-90 - 96, mat=tex_mat('jar art', os.path.join(SRC, 'labels', 'jar.png'), rough=.46, grain=.03))
    l.visible_transmission = False; l.visible_shadow = False
    obs.append(l)
    obs.append(lathe('jar lid', round_profile(r + .1, h - .03, h + 1.55, .14), GILT_SOFT()))
    return group(obs, (0, 0, 0), rot, 'jar')

def flags(x=30, c=(0, 0, 0)):
    """The glass photographer's oldest trick: black cards just out of shot. The glass reflects and bends them into the dark lines that draw its edges."""
    m = plain('flag', (0, 0, 0, 1), rough=1)
    for sx in (-1, 1):
        o = mesh_obj('flag', [(sx * x, -30, -5), (sx * x, 14, -5), (sx * x, 14, 60), (sx * x, -30, 60)], [(0, 1, 2, 3)], smooth=False)
        o.data.materials.append(m)
        o.visible_camera = False; o.visible_shadow = False; o.visible_diffuse = False

def shot_window():
    v = room(sun_az=-128, sun_el=30); flags(26)
    window_shadow(v, (0, 4, 10))
    pose(elixir3(rot=math.radians(-20)), (0, 0, 0))
    cam((-9, -46, 8), (0, 0, 6.6), lens=85, wide=False, fstop=9)

def shot_lean():
    v = room(wall='#ded9cf', sun_az=-115, sun_el=26, power=3); flags(24)
    window_shadow(v, (0, 4, 8), w=60, h=70, bars=((-8, 2.4),), rails=((12, 2.4),))
    stone('block', 9, 7, 11, (5.6, 1.6, 0), rot=math.radians(14))
    pose(spray3('shampoo.png', 10.2, rot=math.radians(-14), name='shampoo'), (-.55, 0, 0), (0, math.radians(13), 0))
    cam((-16, -50, 11), (.5, 0, 7.4), lens=85, wide=False, fstop=9)

def shot_lying():
    world(.5, (.95, .97, 1)); flags(30)
    paper_ground('#f7f5ee', grain=.4)
    sun(150, 21, power=3.1, soft=.9, col=(1, .96, .9))
    pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(-58), name='conditioner'), (-6.2, 0, 2.05), (0, math.radians(90), 0))
    k = 6.6 / max(max(m['w'], m['h']) for m in M)
    for n, (i, x, y, rot_) in enumerate([(23, -8.2, 6.2, -.4), (1, 3.8, 5.4, .8), (5, 8.6, 2, 2.2), (16, -11.4, -5.2, .3), (17, 3.2, -5.6, -.9), (3, 9.6, -3.4, 2.7), (11, -3, 7.6, 1), (8, 11.8, 5.4, .4)]):
        cutout(i, true_size(i, k) * 1.15, (x, y, .05), rot=rot_, curl=.11, seed=300 + n)
    S.render.resolution_y = int(WIDTH / 1.5)
    camera((3, -24, 40), (1, -.3, 1), lens=70, dof=47, fstop=11)

def shot_pair():
    v = room(wall='#dfe9e4', sun_az=-140, sun_el=33, power=2.75); flags(26)
    window_shadow(v, (0, 4, 9), w=62, h=78, bars=((-11, 2.8),), rails=((6, 2.8),))
    pose(oil3(rot=math.radians(14), spin=20), (2.9, 2.2, 0))
    pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(16), name='conditioner'), (-3.8, -3.3, 0))
    cam((-11, -52, 11.5), (0, 0, 7.8), lens=85, wide=False, fstop=9)

def shot_steps():
    v = room(wall='#e7ded0', sun_az=-120, sun_el=22, power=3.25, col=(1, .94, .84)); flags(30)
    window_shadow(v, (0, 4, 10), w=74, h=66, bars=((6, 2.6),), rails=((-4, 2.4),))
    stone('low', 13, 11, 2.5, (-7.5, -2.4, 0))
    stone('mid', 11, 11, 7, (2.6, 1.2, 0), rot=math.radians(-4))
    pose(jar3(rot=math.radians(-8)), (-8.4, -3.2, 2.5))
    pose(elixir3(rot=math.radians(16)), (2.6, .4, 7))
    pose(spray3('shampoo.png', 10.2, rot=math.radians(14), name='shampoo'), (-3.2, 2.4, 0))
    cam((-14, -62, 12), (-2, 0, 9), lens=80, wide=False, fstop=11)

def shot_family2():
    v = room(wall='#e3ece8', sun_az=-132, sun_el=32, power=2.75); flags(40)
    window_shadow(v, (2, 4, 9), w=96, h=86, bars=((-16, 3), (20, 3)), rails=((8, 3),), height=130)
    pose(box2(rot=math.radians(18)), (-15.8, 3, 0))
    pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(10), name='conditioner'), (-8.2, -.8, 0))
    pose(spray3('shampoo.png', 10.2, rot=math.radians(6), name='shampoo'), (-2.2, 2.6, 0))
    pose(elixir3(rot=math.radians(-8)), (4.6, -.8, 0))
    pose(oil3(rot=math.radians(-4), spin=-25), (12, 2.8, 0))
    pose(jar3(rot=math.radians(-6)), (20.2, -2.6, 0))
    cam((3, -98, 17), (2.6, 0, 7.6), lens=70, wide=True, fstop=14)

# ------- Study 62: brighter, plainer, three-point light; metal that has something to reflect; a box made of card.
# What the research said (Fstoppers, The Slanted Lens, PetaPixel, Essential Photo, TalkPhotography):
#   metal shows what it reflects, not its own colour. Give it bright strips and dark cards, and a gradient between them,
#   so a curve reads as round. Remove all reflection and it looks painted. Brushed metal needs anisotropy (Cycles has it).

def noise_rough(t, b, lo, hi, scale=38):
    """No real metal is one roughness: a faint unevenness stops it looking like a computer's idea of metal."""
    tc = t.nodes.new('ShaderNodeTexCoord'); n = t.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = 6
    mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = .3; mr.inputs['From Max'].default_value = .7; mr.inputs['To Min'].default_value = lo; mr.inputs['To Max'].default_value = hi
    t.links.new(tc.outputs['Object'], n.inputs['Vector']); t.links.new(n.outputs['Fac'], mr.inputs['Value']); t.links.new(mr.outputs['Result'], b.inputs['Roughness'])

GOLD_F0 = (1.0, .766, .336, 1)   # gold's reflectance, the widely published figure, linear

def polished():
    m, t, b = principled('polished gold')
    set_in(b, 'Base Color', GOLD_F0); set_in(b, 'Metallic', 1)
    noise_rough(t, b, .07, .13)
    return m

def brushed():
    """Spun metal: the fine lines run round the collar, so the highlight stretches into a bright vertical fan."""
    m, t, b = principled('brushed gold')
    set_in(b, 'Base Color', GOLD_F0); set_in(b, 'Metallic', 1); set_in(b, 'Anisotropic', .78); set_in(b, 'Anisotropic Rotation', 0)
    noise_rough(t, b, .2, .28, scale=60)
    tan = t.nodes.new('ShaderNodeTangent'); tan.direction_type = 'RADIAL'; tan.axis = 'Z'
    t.links.new(tan.outputs['Tangent'], b.inputs['Tangent'])
    return m

GILT = polished
GILT_SOFT = brushed

def collar(name, nr, z0, z1):
    """A chamfered shoulder, a fine groove: small edges are where metal catches the light."""
    prof = [(0, z0), (nr - .05, z0), (nr, z0 + .05), (nr, z1 - .32), (nr - .035, z1 - .3), (nr - .035, z1 - .24), (nr, z1 - .22), (nr, z1 - .06), (nr - .06, z1), (0, z1)]
    return lathe(name + ' collar', prof, brushed())

def card_mat(name, color=None, path=None, grain=1.0, rough=.74):
    """Printed board: matte, with a tooth you can see under side light, and never one flat colour."""
    m, t, b = principled(name)
    tc = t.nodes.new('ShaderNodeTexCoord')
    fine = t.nodes.new('ShaderNodeTexNoise'); fine.inputs['Scale'].default_value = 26; fine.inputs['Detail'].default_value = 8; fine.inputs['Roughness'].default_value = .62
    broad = t.nodes.new('ShaderNodeTexNoise'); broad.inputs['Scale'].default_value = 1.1; broad.inputs['Detail'].default_value = 5
    t.links.new(tc.outputs['Object'], fine.inputs['Vector']); t.links.new(tc.outputs['Object'], broad.inputs['Vector'])
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = grain; bp.inputs['Distance'].default_value = .05
    t.links.new(fine.outputs['Fac'], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    # the mottling of ink on board
    mix = t.nodes.new('ShaderNodeMixRGB'); mix.blend_type = 'MULTIPLY'; mix.inputs[0].default_value = 1
    mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = .3; mr.inputs['From Max'].default_value = .7; mr.inputs['To Min'].default_value = .95; mr.inputs['To Max'].default_value = 1.0
    t.links.new(broad.outputs['Fac'], mr.inputs['Value'])
    comb = t.nodes.new('ShaderNodeCombineColor')
    for ch in ('Red', 'Green', 'Blue'): t.links.new(mr.outputs['Result'], comb.inputs[ch])
    t.links.new(comb.outputs['Color'], mix.inputs[2])
    if path:
        n = t.nodes.new('ShaderNodeTexImage'); n.image = image(path); n.interpolation = 'Cubic'
        t.links.new(n.outputs['Color'], mix.inputs[1])
    else:
        mix.inputs[1].default_value = hexc(color)
    t.links.new(mix.outputs[0], b.inputs['Base Color'])
    set_in(b, 'Roughness', rough)
    return m

def box3(rot=0):
    """A folding carton: card, not glass. The label is its front, at the label's own proportion; a tuck flap on top."""
    p = os.path.join(SRC, 'labels', 'conditioner.png')
    im = image(p)
    h = 12.2; w = h * im.size[0] / im.size[1]; d = 3.9
    print('LABEL box conditioner.png file', round(im.size[0] / im.size[1], 4), 'built', round(w / h, 4))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, h / 2))
    b = bpy.context.active_object; b.name = 'carton'; b.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    bev = b.modifiers.new('fold', 'BEVEL'); bev.width = .035; bev.segments = 3
    b.data.materials.append(card_mat('carton teal', color=TEAL))
    front = mesh_obj('carton front', [(-w / 2 + .012, -d / 2 - .006, .012), (w / 2 - .012, -d / 2 - .006, .012), (w / 2 - .012, -d / 2 - .006, h - .012), (-w / 2 + .012, -d / 2 - .006, h - .012)], [(0, 1, 2, 3)], [(0, 0), (1, 0), (1, 1), (0, 1)], smooth=False)
    front.data.materials.append(card_mat('carton art', path=p))
    # the tuck flap: a slightly proud panel on top, with a shadow line where it folds
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, .1, h + .012))
    flap = bpy.context.active_object; flap.name = 'flap'; flap.scale = (w - .16, d - .42, .024)
    bpy.ops.object.transform_apply(scale=True)
    flap.data.materials.append(card_mat('flap', color=TEAL))
    return group([b, front, flap], (0, 0, 0), rot, 'carton')

# ------- the studio: key, fill, rim, on a plain bright sweep
def studio(color='#f6f5f1', k=.56):
    # reflections see a studio; everything else sees a soft even room
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True
    t = w.node_tree; bg = t.nodes['Background']; out_ = t.nodes['World Output']
    lp = t.nodes.new('ShaderNodeLightPath'); tc = t.nodes.new('ShaderNodeTexCoord'); sep = t.nodes.new('ShaderNodeSeparateXYZ')
    t.links.new(tc.outputs['Generated'], sep.inputs[0])
    ab = t.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; t.links.new(sep.outputs['X'], ab.inputs[0])
    sides = t.nodes.new('ShaderNodeMapRange'); sides.interpolation_type = 'SMOOTHSTEP'; sides.inputs['From Min'].default_value = .52; sides.inputs['From Max'].default_value = .86; sides.inputs['To Min'].default_value = .05; sides.inputs['To Max'].default_value = 2.1
    t.links.new(ab.outputs[0], sides.inputs['Value'])
    top = t.nodes.new('ShaderNodeMapRange'); top.interpolation_type = 'SMOOTHSTEP'; top.inputs['From Min'].default_value = .35; top.inputs['From Max'].default_value = .95; top.inputs['To Min'].default_value = 0; top.inputs['To Max'].default_value = 1.7
    t.links.new(sep.outputs['Z'], top.inputs['Value'])
    add = t.nodes.new('ShaderNodeMath'); add.operation = 'MAXIMUM'; t.links.new(sides.outputs['Result'], add.inputs[0]); t.links.new(top.outputs['Result'], add.inputs[1])
    mix = t.nodes.new('ShaderNodeMix'); mix.data_type = 'FLOAT'
    mix.inputs['A'].default_value = .4
    t.links.new(lp.outputs['Is Glossy Ray'], mix.inputs['Factor']); t.links.new(add.outputs[0], mix.inputs['B'])
    t.links.new(mix.outputs['Result'], bg.inputs['Strength'])
    bg.inputs['Color'].default_value = (1, 1, 1, 1)
    ob = sweep(color, grain=.03, back=22, radius=26)
    b = next(n for n in ob.data.materials[0].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    nt = ob.data.materials[0].node_tree
    geo = nt.nodes.new('ShaderNodeNewGeometry'); s2 = nt.nodes.new('ShaderNodeSeparateXYZ'); mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 0; mr.inputs['From Max'].default_value = 5; mr.inputs['To Min'].default_value = .48; mr.inputs['To Max'].default_value = .92
    nt.links.new(geo.outputs['Position'], s2.inputs[0]); nt.links.new(s2.outputs['Z'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], b.inputs['Roughness'])
    softlight((-30, -40, 40), (0, 0, 6), 34, 34, 21000 * k)        # key: the primary source, high and to the left
    softlight((36, -34, 12), (0, 0, 6), 44, 34, 6500 * k)          # fill: about a third, low and opposite, so nothing goes black
    softlight((-20, 16, 26), (0, 0, 9), 5, 34, 2600 * k)           # rim left: the edge of the glass, from behind
    softlight((20, 16, 26), (0, 0, 9), 5, 34, 2600 * k)            # rim right
    softlight((0, 14, 44), (0, 50, 26), 90, 40, 15500 * k)         # background light: the backdrop's own, so it can be bright while the bottles keep their shape
    softlight((0, -6, 60), (0, -14, 0), 70, 50, 5500 * k)          # and the floor's

def softlight(loc, target, w_, h_, power):
    d = bpy.data.lights.new('box', 'AREA'); d.shape = 'RECTANGLE'; d.size = w_; d.size_y = h_; d.energy = power
    o = bpy.data.objects.new('box', d); S.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    o.visible_camera = False

def plinth(name, w, d_, h, loc, rot=0, color='#ecebe6'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(loc[0], loc[1], loc[2] + h / 2))
    o = bpy.context.active_object; o.name = name; o.scale = (w, d_, h); o.rotation_euler = (0, 0, rot)
    bpy.ops.object.transform_apply(scale=True)
    b_ = o.modifiers.new('b', 'BEVEL'); b_.width = .06; b_.segments = 3
    o.data.materials.append(card_mat(name, color=color, grain=.22, rough=.82))
    return o

def shot_window():
    studio(); flags(26)
    pose(elixir3(rot=math.radians(-20)), (0, 0, 0))
    cam((-9, -46, 8), (0, 0, 6.6), lens=85, wide=False, fstop=9)

def shot_lean():
    studio(); flags(24)
    plinth('block', 9, 7, 11, (5.6, 1.6, 0), rot=math.radians(14))
    pose(spray3('shampoo.png', 10.2, rot=math.radians(-14), name='shampoo'), (-.55, 0, 0), (0, math.radians(13), 0))
    cam((-16, -50, 11), (.5, 0, 7.4), lens=85, wide=False, fstop=9)

def shot_lying():
    world_ = studio(); flags(30)
    pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(-58), name='conditioner'), (-6.2, 0, 2.05), (0, math.radians(90), 0))
    k = 6.6 / max(max(m['w'], m['h']) for m in M)
    for n, (i, x, y, rot_) in enumerate([(23, -8.2, 6.2, -.4), (1, 3.8, 5.4, .8), (5, 8.6, 2, 2.2), (16, -11.4, -5.2, .3), (17, 3.2, -5.6, -.9), (3, 9.6, -3.4, 2.7), (11, -3, 7.6, 1), (8, 11.8, 5.4, .4)]):
        cutout(i, true_size(i, k) * 1.15, (x, y, .05), rot=rot_, curl=.11, seed=300 + n)
    S.render.resolution_y = int(WIDTH / 1.5)
    camera((3, -24, 40), (1, -.3, 1), lens=70, dof=47, fstop=11)

def shot_pair():
    studio(); flags(26)
    pose(oil3(rot=math.radians(14), spin=20), (2.9, 2.2, 0))
    pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(16), name='conditioner'), (-3.8, -3.3, 0))
    cam((-11, -52, 11.5), (0, 0, 7.8), lens=85, wide=False, fstop=9)

def shot_steps():
    studio(); flags(30)
    plinth('low', 13, 11, 2.5, (-7.5, -2.4, 0))
    plinth('mid', 11, 11, 7, (2.6, 1.2, 0), rot=math.radians(-4))
    pose(jar3(rot=math.radians(-8)), (-8.4, -3.2, 2.5))
    pose(elixir3(rot=math.radians(16)), (2.6, .4, 7))
    pose(spray3('shampoo.png', 10.2, rot=math.radians(14), name='shampoo'), (-3.2, 2.4, 0))
    cam((-14, -62, 12), (-2, 0, 9), lens=80, wide=False, fstop=11)

def shot_family2():
    studio(); flags(40)
    pose(box3(rot=math.radians(18)), (-15.8, 3, 0))
    pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(10), name='conditioner'), (-8.2, -.8, 0))
    pose(spray3('shampoo.png', 10.2, rot=math.radians(6), name='shampoo'), (-2.2, 2.6, 0))
    pose(elixir3(rot=math.radians(-8)), (4.6, -.8, 0))
    pose(oil3(rot=math.radians(-4), spin=-25), (12, 2.8, 0))
    pose(jar3(rot=math.radians(-6)), (20.2, -2.6, 0))
    cam((3, -98, 17), (2.6, 0, 7.6), lens=70, wide=True, fstop=14)

def shot_carton():
    # the box on its own: does it read as card?
    studio(); flags(26)
    pose(box3(rot=math.radians(24)), (0, 0, 0))
    cam((-8, -46, 12), (0, 0, 6.3), lens=85, wide=False, fstop=9)

def shot_metal():
    # the metal, close: does it read as metal?
    studio(); flags(14)
    pose(oil3(rot=math.radians(14), spin=20), (0, 0, 0))
    S.render.resolution_y = int(WIDTH * 1.25)
    camera((-3, -30, 17.5), (.8, 0, 14.2), lens=105, dof=30, fstop=8)

# ------- Study 64: materiality, one step at a time. --level N turns on everything up to N.
# 1 glass that was made, not computed: mould waviness, a meniscus, bubbles in the oil
# 2 label stock: thick paper with an edge, ink that sits in the tooth, ink and paper catching light differently
# 3 metal that has been touched: hairline scratches, dust
# 4 a world around it: paper backdrop with tooth, smudges on the glass
# 5 a camera: film response, highlight bloom, shallower focus (grain and vignette are added after the render)
LEVEL = int(arg('level', 5))

_heavy0 = heavy_glass
def heavy_glass(tint='#cfeee3', dens=.035):
    m = _heavy0(tint, dens)
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    if LEVEL >= 1:
        tc = t.nodes.new('ShaderNodeTexCoord')
        n = t.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = .55; n.inputs['Detail'].default_value = 3
        bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .3; bp.inputs['Distance'].default_value = .018
        t.links.new(tc.outputs['Object'], n.inputs['Vector']); t.links.new(n.outputs['Fac'], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    if LEVEL >= 4:
        tc2 = t.nodes.new('ShaderNodeTexCoord'); s = t.nodes.new('ShaderNodeTexNoise'); s.inputs['Scale'].default_value = 3.2; s.inputs['Detail'].default_value = 9; s.inputs['Roughness'].default_value = .7
        r = t.nodes.new('ShaderNodeMapRange'); r.inputs['From Min'].default_value = .52; r.inputs['From Max'].default_value = .68; r.inputs['To Min'].default_value = 0; r.inputs['To Max'].default_value = .09
        t.links.new(tc2.outputs['Object'], s.inputs['Vector']); t.links.new(s.outputs['Fac'], r.inputs['Value']); t.links.new(r.outputs['Result'], b.inputs['Roughness'])
    return m

_flags0 = flags
def flags(x=30, c=(0, 0, 0)):
    _flags0(13.5 if LEVEL >= 1 and x < 30 else (17 if LEVEL >= 1 else x), c)
    if LEVEL >= 1:
        # the cards darken the glass's edges only: seen by light passing through it, never by the metal
        for o in bpy.data.objects:
            if o.name.startswith('flag'): o.visible_glossy = False

_fill0 = filling
def filling(kind):
    if kind != 'cream' or LEVEL < 1: return _fill0(kind)
    # a pearly cream: it lets a little light into itself, as a real one does
    m, t, b = principled('pearl')
    set_in(b, 'Base Color', hexc('#fbf7ee')); set_in(b, 'Roughness', .3); set_in(b, 'Subsurface Weight', .7); set_in(b, 'Subsurface Radius', (.5, .4, .3)); set_in(b, 'Subsurface Scale', .4); set_in(b, 'Coat Weight', .4)
    return m

_shell0 = shell
def shell(outer, wall, base, neck_r_in, name, kind, fill_to):
    obs = _shell0(outer, wall, base, neck_r_in, name, kind, fill_to)
    if LEVEL >= 1 and kind != 'cream':
        # a meniscus: the liquid climbs the glass a little, and it is the line the eye believes
        fill = obs[-1]; me = fill.data
        vs = me.vertices
        zmax = max(v.co.z for v in vs); rmax = max((v.co.x ** 2 + v.co.y ** 2) ** .5 for v in vs if v.co.z > zmax - .01)
        for v in vs:
            if v.co.z > zmax - .001:
                rr = (v.co.x ** 2 + v.co.y ** 2) ** .5
                if rr > rmax * .5: v.co.z += .13
        # bubbles: air caught in the oil, near the shoulder
        rnd = random.Random(hash(name) % 1000)
        ri = rmax * .9
        air = plain('air', (1, 1, 1, 1), rough=0, transmit=1, ior=1.0)
        for i in range(34):
            a = rnd.uniform(0, 6.28); r_ = ri * rnd.uniform(.25, .98) ** .5
            z = fill_to - abs(rnd.gauss(0, 1.5)) - .1
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=rnd.uniform(.012, .06), location=(r_ * math.cos(a), r_ * math.sin(a), max(z, base + .3)))
            o = bpy.context.active_object; bpy.ops.object.shade_smooth(); o.data.materials.append(air); obs.append(o)
    return obs

_exact0 = exact_label
def exact_label(path, r, h, z0, facing=-90, name='label'):
    l = _exact0(path, r, h, z0, facing=facing, name=name)
    if LEVEL >= 2: stock(l)
    return l

def stock(l):
    """Uncoated paper with some weight. The ink sits in the tooth; paper and ink do not shine alike."""
    m = l.data.materials[0]; t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    tex = next(n for n in t.nodes if n.type == 'TEX_IMAGE')
    tc = t.nodes.new('ShaderNodeTexCoord'); tooth = t.nodes.new('ShaderNodeTexNoise'); tooth.inputs['Scale'].default_value = 42; tooth.inputs['Detail'].default_value = 9; tooth.inputs['Roughness'].default_value = .65
    t.links.new(tc.outputs['Object'], tooth.inputs['Vector'])
    lum = t.nodes.new('ShaderNodeRGBToBW'); t.links.new(tex.outputs['Color'], lum.inputs[0])
    add = t.nodes.new('ShaderNodeMath'); add.operation = 'MULTIPLY_ADD'; add.inputs[1].default_value = .022
    t.links.new(lum.outputs[0], add.inputs[0]); t.links.new(tooth.outputs['Fac'], add.inputs[2])
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .85; bp.inputs['Distance'].default_value = .012
    t.links.new(add.outputs[0], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    r_ = t.nodes.new('ShaderNodeMapRange'); r_.inputs['From Min'].default_value = .15; r_.inputs['From Max'].default_value = .95; r_.inputs['To Min'].default_value = .36; r_.inputs['To Max'].default_value = .78
    t.links.new(lum.outputs[0], r_.inputs['Value']); t.links.new(r_.outputs['Result'], b.inputs['Roughness'])
    s = l.modifiers.new('thick', 'SOLIDIFY'); s.thickness = .018; s.offset = 1

def touched(m, lo, hi):
    """Hairline scratches run round a turned part; a little dust settles. Under the eye, nothing metal is perfect."""
    if LEVEL < 3: return m
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    tc = t.nodes.new('ShaderNodeTexCoord'); mp = t.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (2.2, 2.2, 95)
    t.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    n = t.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 7; n.inputs['Detail'].default_value = 5
    t.links.new(mp.outputs[0], n.inputs['Vector'])
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .16; bp.inputs['Distance'].default_value = .008
    t.links.new(n.outputs['Fac'], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    r_ = t.nodes.new('ShaderNodeMapRange'); r_.inputs['From Min'].default_value = .35; r_.inputs['From Max'].default_value = .65; r_.inputs['To Min'].default_value = lo; r_.inputs['To Max'].default_value = hi
    t.links.new(n.outputs['Fac'], r_.inputs['Value'])
    v = t.nodes.new('ShaderNodeTexVoronoi'); v.inputs['Scale'].default_value = 26
    t.links.new(tc.outputs['Object'], v.inputs['Vector'])
    dust = t.nodes.new('ShaderNodeMapRange'); dust.inputs['From Min'].default_value = .03; dust.inputs['From Max'].default_value = .055; dust.inputs['To Min'].default_value = .75; dust.inputs['To Max'].default_value = 0
    t.links.new(v.outputs['Distance'], dust.inputs['Value'])
    mx = t.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
    t.links.new(r_.outputs['Result'], mx.inputs[0]); t.links.new(dust.outputs['Result'], mx.inputs[1]); t.links.new(mx.outputs[0], b.inputs['Roughness'])
    return m

_pol0, _bru0 = polished, brushed
def polished(): return touched(_pol0(), .06, .17)
def brushed(): return touched(_bru0(), .18, .34)
GILT, GILT_SOFT = polished, brushed

_studio0 = studio
def studio(color='#f6f5f1', k=.56):
    _studio0(color, k)
    if LEVEL >= 4:
        ob = bpy.data.objects['sweep'] if 'sweep' in bpy.data.objects else None
        if ob:
            t = ob.data.materials[0].node_tree
            bp = next((n for n in t.nodes if n.type == 'BUMP'), None)
            if bp: bp.inputs['Strength'].default_value = .4; bp.inputs['Distance'].default_value = .03

def camera_stage():
    """A lens, not a fog: only the very brightest points bloom, a touch. No film curve: it washed out the label's grey words (tried, rejected)."""
    if LEVEL < 5: return
    S.camera.data.dof.aperture_fstop = 5.6
    S.use_nodes = True
    t = S.node_tree
    for n in list(t.nodes): t.nodes.remove(n)
    rl = t.nodes.new('CompositorNodeRLayers'); gl = t.nodes.new('CompositorNodeGlare'); gl.glare_type = 'FOG_GLOW'; gl.threshold = 2.4; gl.size = 6; gl.quality = 'HIGH'; gl.mix = -.92
    out_ = t.nodes.new('CompositorNodeComposite')
    t.links.new(rl.outputs['Image'], gl.inputs['Image']); t.links.new(gl.outputs['Image'], out_.inputs['Image'])

def shot_close():
    # the Pair, closer: near enough for material to matter
    studio(); flags(26)
    pose(oil3(rot=math.radians(14), spin=20), (2.9, 2.2, 0))
    pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(16), name='conditioner'), (-3.8, -3.3, 0))
    cam((-8, -38, 11), (.2, 0, 8), lens=85, wide=False, fstop=9, focus=37)

# ------- Study 66: one model, the metal. "Too shiny... that cheap plastic" (Divya, 2 Nov).
# --finish: as-was | room | satin | champagne | lacquer
# Each adds one decision. room changes only what the metal sees; the others change only what the metal is.
FINISH = arg('finish', 'as-was')
LEVEL = 5
ROOM_R = 26

def reflection_room():
    """Everything the shine shows, in one object: a dome seen only by reflections.
    Mostly dark; soft boxes that fall off slowly instead of hard rectangles; nothing bright enough to clip gold.
    The real lights stop being reflected but still light the labels and glass as before."""
    for o in bpy.data.objects:
        if o.type == 'LIGHT': o.visible_glossy = False
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=ROOM_R, location=(0, 0, 8))
    o = bpy.context.active_object; o.name = 'reflection room'; bpy.ops.object.shade_smooth()
    o.visible_camera = False; o.visible_shadow = False; o.visible_diffuse = False; o.visible_transmission = False; o.visible_volume_scatter = False
    m = bpy.data.materials.new('room'); m.use_nodes = True; t = m.node_tree
    for n in list(t.nodes): t.nodes.remove(n)
    out_ = t.nodes.new('ShaderNodeOutputMaterial'); e = t.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (1, .985, .96, 1)
    t.links.new(e.outputs[0], out_.inputs['Surface'])
    tc = t.nodes.new('ShaderNodeTexCoord')
    nrm = t.nodes.new('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'; t.links.new(tc.outputs['Object'], nrm.inputs[0])
    total = t.nodes.new('ShaderNodeValue'); total.outputs[0].default_value = .05   # the room's dark: not black, or the metal looks cut out
    last = total.outputs[0]
    #        direction            stretch(tall)   outer  inner  peak
    boxes = [((-.78, -.56, .22),  .45,            62,    6,     1.25),   # key: broad, slow fall-off, gives the long gradient
             ((.9, -.3, .12),     .4,             34,    4,     .42),    # fill: a quiet second shape
             ((0, -.15, 1),       1,              48,    8,     .62),    # overhead, for tops and shoulders
             ((-.62, .76, .15),   .3,             16,    3,     .95),    # rim
             ((.62, .76, .15),    .3,             16,    3,     .95)]
    for d, st, outer, inner, peak in boxes:
        sc = t.nodes.new('ShaderNodeVectorMath'); sc.operation = 'MULTIPLY'; sc.inputs[1].default_value = (1, 1, st)
        t.links.new(nrm.outputs[0], sc.inputs[0])
        n2 = t.nodes.new('ShaderNodeVectorMath'); n2.operation = 'NORMALIZE'; t.links.new(sc.outputs[0], n2.inputs[0])
        dt = t.nodes.new('ShaderNodeVectorMath'); dt.operation = 'DOT_PRODUCT'; dt.inputs[1].default_value = Vector(d).normalized()
        t.links.new(n2.outputs[0], dt.inputs[0])
        mr = t.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHSTEP'
        mr.inputs['From Min'].default_value = math.cos(math.radians(outer)); mr.inputs['From Max'].default_value = math.cos(math.radians(inner))
        mr.inputs['To Min'].default_value = 0; mr.inputs['To Max'].default_value = peak
        t.links.new(dt.outputs['Value'], mr.inputs['Value'])
        ad = t.nodes.new('ShaderNodeMath'); ad.operation = 'ADD'; t.links.new(last, ad.inputs[0]); t.links.new(mr.outputs['Result'], ad.inputs[1]); last = ad.outputs[0]
    t.links.new(last, e.inputs['Strength'])
    o.data.materials.append(m)

def micro(t, b, scale=420, strength=.05, dist=.003):
    """The grain of a blasted or etched surface: isotropic, no direction. It shows as a soft sparkle-free bloom in the highlight."""
    tc = t.nodes.new('ShaderNodeTexCoord'); n = t.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = 3
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = dist
    t.links.new(tc.outputs['Object'], n.inputs['Vector']); t.links.new(n.outputs['Fac'], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])

CHAMPAGNE = (.93, .78, .50, 1)
def satin_metal(name='satin', col=None, lo=.33, hi=.36):
    m, t, b = principled(name)
    set_in(b, 'Base Color', col or GOLD_F0); set_in(b, 'Metallic', 1)
    noise_rough(t, b, lo, hi, scale=14)
    micro(t, b)
    return m
def lacquer_metal():
    # how much cosmetics gold is really made: silvery vacuum-metallised layer under a tinted clear coat
    m, t, b = principled('lacquer')
    set_in(b, 'Base Color', (.91, .92, .92, 1)); set_in(b, 'Metallic', 1); set_in(b, 'Roughness', .14)
    set_in(b, 'Coat Weight', 1); set_in(b, 'Coat Roughness', .05); set_in(b, 'Coat Tint', (1, .80, .45, 1))
    return m

if FINISH == 'satin':
    polished = brushed = lambda: satin_metal()
elif FINISH == 'champagne':
    polished = brushed = lambda: satin_metal('champagne', CHAMPAGNE)
elif FINISH == 'lacquer':
    polished = brushed = lacquer_metal
GILT, GILT_SOFT = polished, brushed

def shot_hero():
    studio(); flags(26)
    if FINISH != 'as-was': reflection_room()
    pose(oil3(rot=math.radians(14), spin=20), (0, 0, 0))
    cam((-6, -40, 10), (.35, 0, 8), lens=85, wide=False, fstop=9, focus=39)

_room0 = reflection_room
def reflection_room():
    _room0()
    # Wrong turn, kept: the floor's own faint sheen reflected the dome, and the dome's edge showed as a horizon behind the bottle. So the backdrop stops being glossy.
    sw = bpy.data.objects.get('sweep')
    for ob in ([sw] if sw else [o for o in bpy.data.objects if o.type == 'MESH' and o.name.lower().startswith(('sweep', 'mesh', 'plane'))]):
        for mm in ob.data.materials:
            bb = next((n for n in mm.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if bb and 'Specular IOR Level' in bb.inputs: bb.inputs['Specular IOR Level'].default_value = 0

# The family and the box, in the chosen finish: the same room, big enough to hold them.
_fam0, _car0 = shot_family2, shot_carton
def shot_family2():
    global ROOM_R
    ROOM_R = 70; _fam0(); reflection_room()
def shot_carton():
    global ROOM_R
    ROOM_R = 70; _car0(); reflection_room()


# ------- Study 71: "the one in the mockups looks so alive and bright, the one we created is so dull and dreary" (Divya, 4 Nov).
# Her three mockups each do one thing with light. --light takes one at a time, on the same bottle and the same labels:
#   block  : full everything.png   colour in the set, hard sun, crisp short shadows
#   window : elixir.png            white room, sun through a window, big soft-grey shadow shapes
#   sky    : Deep nourishing hair oil.png   saturated pale colour, high key, almost no shadow
# What all three have and ours did not: the shadows are light, not dark; the room is as bright as the object; nothing black near the glass.
LIGHT = arg('light', 'sky')
FINISH = arg('finish', 'satin')
# Against a bright room the Study 66 satin read as flat yellow paint. Paler gold, a tighter highlight, and the room's dark comes back so it has something to reflect.
polished = brushed = lambda: satin_metal('gold', (.98, .81, .5, 1), .23, .27)
GILT, GILT_SOFT = polished, brushed

# The labels from the mockups have a different proportion, so each is taller on its bottle. Always one scale number.
_lab0 = label_on
def label_on(g_obs, path, r, h_, z0, name):
    if path == 'oil.png': h_, z0 = 8.9, .95
    if path == 'elixir.png': h_, z0 = 7.3, 1.0
    _lab0(g_obs, path, r, h_, z0, name)

def even_world(strength):
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (1, 1, 1, 1); bg.inputs['Strength'].default_value = strength

def flat(name, color, verts):
    ob = mesh_obj(name, verts, [(0, 1, 2, 3)])
    m, t, b = principled(name)
    set_in(b, 'Base Color', hexc(color)); set_in(b, 'Roughness', .85)
    if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = .15
    paper_bump(t, b, strength=.05)
    ob.data.materials.append(m)
    return ob

def set_block():
    even_world(.66)
    flat('floor', '#f9d3ad', [(-900, -900, 0), (900, -900, 0), (900, 16, 0), (-900, 16, 0)])
    flat('wall', '#cdeaa6', [(-900, 16, 0), (900, 16, 0), (900, 16, 900), (-900, 16, 900)])
    sun(-132, 40, power=1.5, soft=1.0, col=(1, .975, .93))

def set_window():
    even_world(.88)
    flat('floor', '#ffffff', [(-900, -900, 0), (900, -900, 0), (900, 18, 0), (-900, 18, 0)])
    flat('wall', '#f4f4f2', [(-900, 18, 0), (900, 18, 0), (900, 18, 900), (-900, 18, 900)])
    v = sun(-126, 34, power=1.15, soft=1.2, col=(1, .97, .92))
    window_shadow(v, (0, 4, 8), height=120, w=120, h=120, bars=((-44, 9), (34, 5)), rails=((36, 7), (-40, 4)))

def set_sky():
    even_world(.9)
    sweep('#cff8fb', grain=.02, back=22, radius=26)
    sun(-125, 55, power=.5, soft=5, col=(1, .98, .95))

def bright_room():
    """The dome the metal sees, as Study 66 made it, but a bright room instead of a dark one."""
    reflection_room()
    m = bpy.data.objects['reflection room'].data.materials[0]
    next(n for n in m.node_tree.nodes if n.type == 'VALUE').outputs[0].default_value = .2
    for o in bpy.data.objects:
        if o.type == 'LIGHT': o.visible_glossy = True   # the sun's own small hard glint on the glass: most of what reads as bright

def light_through():
    """A glass bottle does not throw a black shadow. Light comes through it, coloured. Shadow rays see these materials as a tinted window, so the oil's shadow glows."""
    for mat, col in (('heavy glass', (.93, .95, .94, 1)), ('oil', (1, .74, .22, 1)), ('elixir', (.92, .95, .55, 1))):
        for m in bpy.data.materials:
            if not (m.name == mat or m.name.startswith(mat + '.')): continue
            t = m.node_tree; o = next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL')
            src = o.inputs['Surface'].links[0].from_socket
            lp = t.nodes.new('ShaderNodeLightPath'); tr = t.nodes.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = col
            mx = t.nodes.new('ShaderNodeMixShader')
            t.links.new(lp.outputs['Is Shadow Ray'], mx.inputs['Fac']); t.links.new(src, mx.inputs[1]); t.links.new(tr.outputs[0], mx.inputs[2])
            t.links.new(mx.outputs[0], o.inputs['Surface'])
            if m.name.startswith(('oil', 'elixir')):
                for n in t.nodes:
                    if n.type == 'VOLUME_ABSORPTION':
                        n.inputs['Density'].default_value = .2 if m.name.startswith('oil') else .1
                        if m.name.startswith('oil'): n.inputs['Color'].default_value = hexc('#ffc62e')
    for o in bpy.data.objects:
        if o.type == 'MESH' and any(s.material and s.material.name.startswith('air') for s in o.material_slots): o.visible_shadow = False
    S.cycles.transparent_max_bounces = 64

SETS = {'block': set_block, 'window': set_window, 'sky': set_sky}

def report_label(name):
    # where the label falls in the picture, for the page's landing
    from bpy_extras.object_utils import world_to_camera_view as w2c
    bpy.context.view_layer.update()
    o = next(x for x in bpy.data.objects if x.name.startswith(name))
    pts = [w2c(S, S.camera, o.matrix_world @ Vector(c)) for c in o.bound_box]
    X = [p.x * S.render.resolution_x for p in pts]; Y = [(1 - p.y) * S.render.resolution_y for p in pts]
    print('LABEL box', round(min(X)), round(max(X)), round(min(Y)), round(max(Y)), 'of', S.render.resolution_x, S.render.resolution_y)

def shot_hero():
    SETS[LIGHT]()
    pose(oil3(rot=math.radians(-8.5), spin=26), (0, 0, 0))   # the label faces the lens
    bright_room(); light_through()
    cam((-7.4, -50, 10.5), (.2, 0, 8.3), lens=85, wide=False, fstop=9, focus=50)
    report_label('oil label')

def shot_family2():
    global ROOM_R
    ROOM_R = 70
    SETS[LIGHT]()
    pose(box3(rot=math.radians(-12)), (-15.8, 3, 0))   # its face to the sun
    pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=math.radians(10), name='conditioner'), (-8.2, -.8, 0))
    pose(spray3('shampoo.png', 10.2, rot=math.radians(6), name='shampoo'), (-2.2, 2.6, 0))
    pose(elixir3(rot=math.radians(-8)), (4.6, -.8, 0))
    pose(oil3(rot=math.radians(-4), spin=-25), (12, 2.8, 0))
    pose(jar3(rot=math.radians(-6)), (20.2, -2.6, 0))
    bright_room(); light_through()
    cam((3, -98, 17), (2.6, 0, 7.6), lens=70, wide=True, fstop=14)

def shot_herowide():
    # the same bottle, wide enough to fill the page's screen
    SETS[LIGHT]()
    pose(oil3(rot=math.radians(-8.3), spin=26), (0, 0, 0))
    bright_room(); light_through()
    cam((-11, -75, 12.5), (.2, 0, 8.2), lens=85, wide=True, fstop=11, focus=76)
    report_label('oil label')

# ------- Divya: "you have taken the colors but you haven't changed the lighting. If you just look at the label, the label still looks equally unappealing."
# Three faults, all on the label, none of them colour:
#  1 blur: Study 64's camera_stage forces f/5.6, whatever the shot asked for, and focus sat on the bottle's middle, not its face.
#  2 a beige cast: a warm sun, and the peach floor bouncing into the paper. Her whites are neutral.
#  3 no shape: an even room lights every part of the curve alike and veils the ink. Her labels are brightest in the middle and roll off to the edges.
AMBIENT = float(arg('ambient', .34)); KEY = float(arg('key', 15000)); SUNP = float(arg('sun', 1.0))
S.cycles.denoising_prefilter = 'ACCURATE'; S.cycles.denoising_input_passes = 'RGB_ALBEDO_NORMAL'

def camera_stage():
    S.camera.data.dof.aperture_fstop = 18

_lab_exact = _exact0
def exact_label(path, r, h, z0, facing=-90, name='label'):
    l = _lab_exact(path, r, h, z0, facing=facing, name=name)
    t_ = l.data.materials[0].node_tree; b = next(n for n in t_.nodes if n.type == 'BSDF_PRINCIPLED')
    # printed stock with a soft sheen: ink stays dark, the white stays white. No tooth at this distance; it only greyed the ink.
    set_in(b, 'Roughness', .42)
    if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = .22
    for n in t_.nodes:
        if n.type == 'BUMP': n.inputs['Strength'].default_value = 0
    return l

_flat0 = flat
def flat(name, color, verts):
    o = _flat0(name, color, verts); o.visible_diffuse = False   # the set takes the light; it does not tint the label
    return o

def shape_light(power=None):
    p = power or KEY
    softlight((-24, -48, 22), (0, 0, 8), 46, 70, p)           # key: big, in front and to the left, so the curve goes bright to soft
    softlight((42, -30, 12), (0, 0, 8), 28, 50, p * .16)      # a little fill, so the far edge doesn't die
    softlight((-4, 4, 46), (0, 16, 9), 26, 26, p * .34)       # a pool of light on the wall behind: the set falls off instead of being flat

def set_block():
    even_world(AMBIENT)
    flat('floor', '#f9d3ad', [(-900, -900, 0), (900, -900, 0), (900, 16, 0), (-900, 16, 0)])
    flat('wall', '#cdeaa6', [(-900, 16, 0), (900, 16, 0), (900, 16, 900), (-900, 16, 900)])
    sun(-132, 40, power=SUNP, soft=1.0, col=(1, .99, .97)); shape_light()

def set_window():
    even_world(AMBIENT)
    flat('floor', '#ffffff', [(-900, -900, 0), (900, -900, 0), (900, 18, 0), (-900, 18, 0)])
    flat('wall', '#f7f7f5', [(-900, 18, 0), (900, 18, 0), (900, 18, 900), (-900, 18, 900)])
    v = sun(-126, 34, power=SUNP * 1.3, soft=1.2, col=(1, .99, .97)); shape_light()
    window_shadow(v, (0, 4, 8), height=120, w=120, h=120, bars=((-44, 9), (34, 5)), rails=((36, 7), (-40, 4)))

def set_sky():
    even_world(AMBIENT)
    o = sweep('#cff8fb', grain=.02, back=22, radius=26); o.visible_diffuse = False
    sun(-125, 55, power=SUNP * .5, soft=5, col=(1, .99, .98)); shape_light()

SETS = {'block': set_block, 'window': set_window, 'sky': set_sky}

_br0 = bright_room
def bright_room():
    _br0()
    m = bpy.data.objects['reflection room'].data.materials[0]
    next(n for n in m.node_tree.nodes if n.type == 'VALUE').outputs[0].default_value = .14
    for o in bpy.data.objects:
        if o.type == 'LIGHT': o.visible_glossy = o.data.type == 'SUN'

def shot_hero():
    SETS[LIGHT]()
    pose(oil3(rot=math.radians(-8.5), spin=26), (0, 0, 0))
    bright_room(); light_through()
    cam((-7.4, -50, 10.5), (.2, 0, 8.3), lens=85, wide=False, fstop=18, focus=47.8)
    report_label('oil label')

def shot_herowide():
    SETS[LIGHT]()
    pose(oil3(rot=math.radians(-8.3), spin=26), (0, 0, 0))
    bright_room(); light_through()
    cam((-11, -75, 12.5), (.2, 0, 8.2), lens=85, wide=True, fstop=18, focus=73)
    report_label('oil label')

_fam71 = shot_family2
def shot_family2():
    _fam71()
    S.camera.data.dof.focus_distance = 96


# ------- Study 73: Divya, 4 Nov: "we still want the white background. We just want them to be bright."
# Her references: water droplets on matte glass with a glossy plastic cap; an open jar with cream inside; a natural arrangement of stones, moss and twigs; satin anodised metal.
# Every shot is one named decision on the bright white of Study 71's corrected light.
from mathutils import Matrix, noise as mnoise
PAL = {'teal': '#55c2b4', 'leaf': '#b4d88f', 'lime': '#d8e37b', 'sun': '#fed767', 'coral': '#ef4d4d', 'white': '#f6f5f2'}
TINT = {'oil': '#ffc445', 'elixir': '#ff9a8e', 'shampoo': '#ffe07e', 'conditioner': '#6ad8ca', 'none': '#e3e9e8'}

def bright_world():
    """Everything the camera or the glass sees of the world is white; the world's light on surfaces stays low, so they keep their shape."""
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True
    t = w.node_tree; bg = t.nodes['Background']; bg.inputs['Color'].default_value = (1, 1, 1, 1)
    lp = t.nodes.new('ShaderNodeLightPath')
    mx = t.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
    t.links.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); t.links.new(lp.outputs['Is Transmission Ray'], mx.inputs[1])
    mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = AMBIENT; mr.inputs['To Max'].default_value = 1
    t.links.new(mx.outputs[0], mr.inputs['Value']); t.links.new(mr.outputs['Result'], bg.inputs['Strength'])

def white_set(floor=True, sun_el=44, sun_az=-130, soft=2.2, sunp=None):
    global _sun
    bright_world()
    if floor:
        o = sweep('#ffffff', grain=0, back=20, radius=26); o.visible_diffuse = False
        b = next(n for n in o.data.materials[0].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = 0
        set_in(b, 'Emission Color', (1, 1, 1, 1)); set_in(b, 'Emission Strength', .3)   # the paper holds near white; shadows still fall on it
    _sun = sun(sun_az, sun_el, power=sunp if sunp is not None else SUNP * .8, soft=soft, col=(1, .99, .97))
    shape_light(KEY * 1.05)

def finish_scene(room=26):
    global ROOM_R
    ROOM_R = room
    bright_room(); light_through()
    for m in bpy.data.materials:
        if m.name == 'oil' or m.name.startswith('oil.'):
            for n in m.node_tree.nodes:
                if n.type == 'VOLUME_ABSORPTION': n.inputs['Color'].default_value = hexc('#ffdf52'); n.inputs['Density'].default_value = .1
    for m in bpy.data.materials:
        if not m.name.startswith('frost'): continue
        t = m.node_tree; o = next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL')
        src = o.inputs['Surface'].links[0].from_socket
        lp = t.nodes.new('ShaderNodeLightPath'); tr = t.nodes.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = (.82, .84, .84, 1)
        mx = t.nodes.new('ShaderNodeMixShader')
        t.links.new(lp.outputs['Is Shadow Ray'], mx.inputs['Fac']); t.links.new(src, mx.inputs[1]); t.links.new(tr.outputs[0], mx.inputs[2]); t.links.new(mx.outputs[0], o.inputs['Surface'])

# ---- materials
_n = [0]
def uname(s):
    _n[0] += 1; return s + ' ' + str(_n[0])
def frost(tint='#f2f4f3', rough=.4, fade_to=None, z0=0, z1=12):
    """Matte glass: light still comes through it, but nothing behind it is sharp."""
    m, t, b = principled(uname('frost'))
    set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.5); set_in(b, 'Roughness', rough); set_in(b, 'Base Color', hexc(tint))
    if fade_to:
        tc = t.nodes.new('ShaderNodeTexCoord'); sp = t.nodes.new('ShaderNodeSeparateXYZ'); t.links.new(tc.outputs['Object'], sp.inputs[0])
        mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = z0; mr.inputs['From Max'].default_value = z1
        t.links.new(sp.outputs['Z'], mr.inputs['Value'])
        mix = t.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs[6].default_value = hexc(tint); mix.inputs[7].default_value = hexc(fade_to)
        t.links.new(mr.outputs['Result'], mix.inputs[0]); t.links.new(mix.outputs[2], b.inputs['Base Color'])
    return m
def gloss(color):
    """Moulded plastic, deep and wet-looking: colour in the body, a clear skin on top."""
    m, t, b = principled(uname('gloss'))
    set_in(b, 'Base Color', hexc(color)); set_in(b, 'Roughness', .09); set_in(b, 'Coat Weight', 1); set_in(b, 'Coat Roughness', .025); set_in(b, 'Subsurface Weight', .25); set_in(b, 'Subsurface Radius', (.4, .4, .4)); set_in(b, 'Subsurface Scale', .25)
    return m
def anodised(color):
    """Her reference's metal: dyed, satin, no grain you can name. The colour is in the metal, and the highlight is a long soft band."""
    m, t, b = principled(uname('anodised'))
    set_in(b, 'Base Color', hexc(color)); set_in(b, 'Metallic', 1)
    noise_rough(t, b, .29, .32, scale=12); micro(t, b, scale=500, strength=.03)
    return m
def water():
    """True refraction against a white room turned every drop into a white dot. What the eye reads as a drop is a dark rim, a glint at the top and a glow low down, so that is what this draws."""
    m = bpy.data.materials.new('water drop'); m.use_nodes = True; t = m.node_tree
    for n in list(t.nodes): t.nodes.remove(n)
    out_ = t.nodes.new('ShaderNodeOutputMaterial'); lw = t.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .5
    rim = t.nodes.new('ShaderNodeMapRange'); rim.inputs['From Min'].default_value = .25; rim.inputs['From Max'].default_value = .85; rim.inputs['To Min'].default_value = 1; rim.inputs['To Max'].default_value = .5
    t.links.new(lw.outputs['Facing'], rim.inputs['Value'])
    tr = t.nodes.new('ShaderNodeBsdfTransparent'); cmb = t.nodes.new('ShaderNodeCombineColor')
    for ch in ('Red', 'Green', 'Blue'): t.links.new(rim.outputs['Result'], cmb.inputs[ch])
    t.links.new(cmb.outputs[0], tr.inputs['Color'])
    gl = t.nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = .02; gl.inputs['Color'].default_value = (1, 1, 1, 1)
    fr = t.nodes.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.7
    mix = t.nodes.new('ShaderNodeMixShader'); t.links.new(fr.outputs[0], mix.inputs[0]); t.links.new(tr.outputs[0], mix.inputs[1]); t.links.new(gl.outputs[0], mix.inputs[2])
    geo = t.nodes.new('ShaderNodeNewGeometry'); sp = t.nodes.new('ShaderNodeSeparateXYZ'); t.links.new(geo.outputs['Normal'], sp.inputs[0])
    low = t.nodes.new('ShaderNodeMapRange'); low.inputs['From Min'].default_value = -.15; low.inputs['From Max'].default_value = -.85; low.inputs['To Min'].default_value = 0; low.inputs['To Max'].default_value = .16
    t.links.new(sp.outputs['Z'], low.inputs['Value'])
    em = t.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (1, 1, 1, 1); t.links.new(low.outputs['Result'], em.inputs['Strength'])
    ad = t.nodes.new('ShaderNodeAddShader'); t.links.new(mix.outputs[0], ad.inputs[0]); t.links.new(em.outputs[0], ad.inputs[1]); t.links.new(ad.outputs[0], out_.inputs['Surface'])
    m.blend_method = 'BLEND'
    return m
def pearl(color='#fbf6ea'):
    m, t, b = principled(uname('pearl'))
    set_in(b, 'Base Color', hexc(color)); set_in(b, 'Roughness', .3); set_in(b, 'Subsurface Weight', .85); set_in(b, 'Subsurface Radius', (.7, .55, .4)); set_in(b, 'Subsurface Scale', .5); set_in(b, 'Coat Weight', .3); set_in(b, 'Coat Roughness', .2)
    return m

# ---- caps
def cap_ball(name, z, r, mat):
    n = 24; prof = [(r * math.sin(i / n * math.pi), z + r - r * math.cos(i / n * math.pi)) for i in range(n + 1)]
    prof[0] = (0, prof[0][1]); prof[-1] = (0, prof[-1][1])
    return lathe(name + ' ball', prof, mat, segs=120)
def cap_cyl(name, z, r, h, mat):
    return lathe(name + ' cap', round_profile(r, z, z + h, .1), mat, segs=160)
def cap_pump(name, z, nr, mat):
    a = lathe(name + ' collar', round_profile(nr + .25, z, z + 1.5, .12), mat, segs=120)
    b_ = lathe(name + ' stem', round_profile(.4, z + 1.45, z + 2.6, .03), mat)
    c = lathe(name + ' head', [(0, z + 2.55), (.72, z + 2.55), (.78, z + 2.65), (.76, z + 3.4), (.6, z + 3.65), (0, z + 3.75)], mat)
    d = spout([(0, 0, z + 3.3), (1.7, .55, z + 3.42), (3.1, 1.0, z + 3.2), (3.55, 1.15, z + 2.72)], .22, mat)
    return [a, b_, c, d]

SHAPES = {'stout': dict(r=3.2, h=8.4, neck=1.1, sh=1.9, lh=5.9, z0=.65, foot=.5),
          'tall': dict(r=2.6, h=12, neck=1.0, sh=1.3, lh=9.1, z0=1.1, foot=.42),
          'slim': dict(r=2.7, h=11.2, neck=2.0, sh=.55, lh=8.9, z0=1.0, foot=.3)}
def bottle(label, shape='stout', tint='none', cap=None, name=None, clear=False, fade=None, rot=0):
    """A matte (or clear) body, its label at its own proportion, a cap. cap = (kind, material)."""
    s = SHAPES[shape]; name = name or uname('b')
    out = outer_bottle(s['r'], s['h'], s['neck'], .3, foot=s['foot'], shoulder=s['sh'])
    if clear:
        obs = shell(out, .45, 1.3, s['neck'] - .3, name, 'oil' if label == 'oil.png' else 'cream', s['h'] - 1.2)
    else:
        obs = [lathe(name + ' body', out + [(0, s['h'] + .32)], frost('#fbfcfb', rough=.27), segs=220)]
        # what it holds: seen only softly, through the wall. The wall's thickness shows at the foot and the shoulder.
        ri, zb, zt = s['r'] - .72, 1.35, s['h'] - s['sh'] * .75
        core, ct, cb = principled(uname('core')); set_in(cb, 'Base Color', hexc(fade or TINT[tint]) if False else hexc(TINT[tint])); set_in(cb, 'Roughness', .35); set_in(cb, 'Transmission Weight', .62); set_in(cb, 'IOR', 1.4)
        obs.append(lathe(name + ' core', round_profile(ri, zb, zt, .5), core, segs=120))
    l = exact_label(label, s['r'], s['lh'], s['z0'], name=name + ' label'); l.visible_shadow = False; l.visible_transmission = False; obs.append(l)
    z = s['h'] + .3
    if cap:
        k, m = cap
        if k == 'ball': obs.append(cap_ball(name, z - .08, s['neck'] * 1.75, m))
        elif k == 'cyl': obs.append(cap_cyl(name, z - .05, s['neck'] + .2, 3.6, m))
        elif k == 'pump': obs += cap_pump(name, z - .05, s['neck'], m)
    return group(obs, (0, 0, 0), rot, name), s

def drops(s, parent, n=700, seed=3, rmax=.2, ball=None):
    """Water sitting on the surface. Mostly fine mist, a few fat beads, thicker in patches, as a sprayed bottle really is."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    def bead(p, nrm, rad):
        q = Vector(nrm).to_track_quat('Z', 'Y').to_matrix().to_4x4()
        M = Matrix.Translation(p) @ q @ Matrix.Diagonal((1, 1, .6, 1))
        bmesh.ops.create_icosphere(bm, subdivisions=3 if rad > .09 else 2, radius=rad, matrix=M)
    r, z0, z1 = s['r'], s['foot'] + .15, s['h'] - s['sh']
    for i in range(n):
        a = math.radians(-90 + rnd.uniform(-115, 115)); z = rnd.uniform(z0, z1)
        patch = .55 + .45 * mnoise.noise(Vector((a * 1.6, z * .35, seed)))
        if rnd.random() > patch + .25: continue
        if abs(math.degrees(a) + 90) < 42 and s['z0'] + s['lh'] * .12 < z < s['z0'] + s['lh'] * .88 and rnd.random() < .82: continue
        rad = max(.03, rmax * rnd.random() ** 2.4)
        bead((r * math.cos(a), r * math.sin(a), z), (math.cos(a), math.sin(a), 0), rad)
    for i in range(int(n * .18)):   # the shoulder
        t = rnd.random(); ang = t * math.pi / 2
        rr = s['neck'] + (r - s['neck']) * math.cos(ang) ** .8; zz = z1 + s['sh'] * math.sin(ang); a = math.radians(-90 + rnd.uniform(-110, 110))
        bead((rr * math.cos(a), rr * math.sin(a), zz), (math.cos(a) * math.cos(ang), math.sin(a) * math.cos(ang), math.sin(ang)), max(.02, rmax * .7 * rnd.random() ** 3))
    if ball:
        c, R = Vector(ball[0]), ball[1]
        for i in range(int(n * .3)):
            th = rnd.uniform(0, math.pi); ph = math.radians(-90 + rnd.uniform(-110, 110))
            nrm = Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)))
            bead(c + nrm * R, nrm, max(.02, rmax * .8 * rnd.random() ** 3))
    me = bpy.data.meshes.new('drops'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    o = bpy.data.objects.new('drops', me); S.collection.objects.link(o); me.materials.append(water()); o.visible_shadow = False; o.parent = parent
    return o

def wet(label, shape, tint, color, loc, euler, seed=3, n=760, plastic=None):
    g, s = bottle(label, shape, tint, ('ball', plastic or gloss(color)))
    z = s['h'] + .3 - .08; R = s['neck'] * 1.75
    drops(s, g, n=n, seed=seed, ball=((0, 0, z + R), R))
    pose(g, loc, euler)
    return g

# ---- cream and jars
def swirl(name, r, z, h=.5, col='#fbf6ea', turns=11, peak=.3):
    """Cream that has been lifted by a finger: it dips, curls, and leaves a small peak."""
    rings, segs = 110, 280
    V, F = [(0, 0, z + h * (.62 + peak))], []
    for j in range(1, rings + 1):
        p = j / rings
        for k in range(segs):
            a = k / segs * 2 * math.pi
            v = .62 * (1 - p ** 5) ** .5 + .2 * math.sin(2 * a - turns * p) * (1 - p ** 4) * p ** .5 + peak * math.exp(-(p / .17) ** 2) + .03 * math.sin(7 * a + 19 * p) * p * (1 - p)
            V.append((r * p * math.cos(a), r * p * math.sin(a), z + h * v))
    for k in range(segs): F.append((0, 1 + k, 1 + (k + 1) % segs))
    for j in range(rings - 1):
        for k in range(segs):
            a0 = 1 + j * segs + k; a1 = 1 + j * segs + (k + 1) % segs
            F.append((a0, a0 + segs, a1 + segs, a1))
    o = mesh_obj(name, V, F); o.data.materials.append(pearl(col))
    for f in o.data.polygons: f.use_smooth = True
    return o

def open_jar(cream='#fbf6ea', rot=0, name='jar'):
    g = jar3(rot=rot)
    lid = bpy.data.objects.get('jar lid')
    if lid: bpy.data.objects.remove(lid, do_unlink=True)
    fill = next(o for o in bpy.data.objects if o.name.startswith('jar fill'))
    zt = max(v.co.z for v in fill.data.vertices); rr = max((v.co.x ** 2 + v.co.y ** 2) ** .5 for v in fill.data.vertices)
    sw = swirl('jar cream', rr + .01, zt - .1, h=.55, col=cream); sw.parent = g
    for ob in (fill,):
        for ms in ob.material_slots: ms.material = sw.data.materials[0]
    return g

def jar_lid(mat, r=3.12, mark='logo-white.png'):
    a = lathe('lid', round_profile(r, 0, 1.55, .14), mat, segs=200)
    obs = [a]
    if mark:
        w = r * 1.3
        pl = mesh_obj('lid mark', [(-w / 2, -w / 2, 1.556), (w / 2, -w / 2, 1.556), (w / 2, w / 2, 1.556), (-w / 2, w / 2, 1.556)], [(0, 1, 2, 3)], [(0, 0), (1, 0), (1, 1), (0, 1)])
        pl.data.materials.append(tex_mat('lid mark', os.path.join(SRC, 'labels', mark), rough=.3, alpha=True)); obs.append(pl)
    return group(obs, (0, 0, 0), 0, 'lid group')

def relief(w=90, col='#ffffff'):
    """Her Furterer reference, in white: one side stippled plaster, the other combed into fine lines that follow one long curve."""
    N = 640; V, F = [], []
    for j in range(N + 1):
        y = -w / 2 + j / N * w
        for i in range(N + 1):
            x = -w / 2 + i / N * w
            d = x - (7.5 * math.sin(y / 8.5) + 1.5)
            e = min(1, max(0, d / .5))
            V.append((x, y, e * (.34 + .16 * abs(math.sin(d * 3.2)))))
    for j in range(N):
        for i in range(N):
            a = j * (N + 1) + i; F.append((a, a + 1, a + N + 2, a + N + 1))
    o = mesh_obj('relief', V, F); m, t, b = principled('relief')
    set_in(b, 'Base Color', hexc(col)); set_in(b, 'Roughness', .8)
    if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = .05
    paper_bump(t, b, scale=55, strength=.75)
    o.data.materials.append(m)
    for f in o.data.polygons: f.use_smooth = True
    return o

# ---- the natural things
def rock(loc, size, seed, col=('#c9c6ba', '#8f9188'), rot=0):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=5, radius=1)
    sx, sy, sz = size
    off = Vector((seed * 3.1, seed * 1.7, seed * .9))
    for v in bm.verts:
        n_ = v.co.normalized()
        d = .16 * mnoise.noise(n_ * 1.3 + off) + .05 * mnoise.noise(n_ * 4 + off)
        v.co = Vector((n_.x * sx * (1 + d), n_.y * sy * (1 + d), n_.z * sz * (1 + d)))
    me = bpy.data.meshes.new('rock'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    o = bpy.data.objects.new('rock', me); S.collection.objects.link(o); o.location = loc; o.rotation_euler = (0, 0, rot)
    m, t, b = principled(uname('rock'))
    tc = t.nodes.new('ShaderNodeTexCoord'); n1 = t.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 2.6; n1.inputs['Detail'].default_value = 9; n1.inputs['Roughness'].default_value = .62
    t.links.new(tc.outputs['Object'], n1.inputs['Vector'])
    mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = .3; mr.inputs['From Max'].default_value = .7; t.links.new(n1.outputs['Fac'], mr.inputs['Value'])
    mx = t.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.inputs[6].default_value = hexc(col[0]); mx.inputs[7].default_value = hexc(col[1])
    t.links.new(mr.outputs['Result'], mx.inputs[0]); t.links.new(mx.outputs[2], b.inputs['Base Color'])
    set_in(b, 'Roughness', .68)
    n2 = t.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 22; n2.inputs['Detail'].default_value = 10
    t.links.new(tc.outputs['Object'], n2.inputs['Vector'])
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .5; bp.inputs['Distance'].default_value = .06
    t.links.new(n2.outputs['Fac'], bp.inputs['Height']); t.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    me.materials.append(m)
    return o

def moss(loc, rx, ry, h, seed=1, n=5200):
    """A low mound, then thousands of tiny tufts on it: moss is made of its own small shadows."""
    rnd = random.Random(seed); bm = bmesh.new()
    def Hh(x, y):
        q = 1 - (x / rx) ** 2 - (y / ry) ** 2
        return h * max(q, 0) ** .55
    N = 60
    bmesh.ops.create_grid(bm, x_segments=N, y_segments=N, size=1)
    gone = [v for v in bm.verts if v.co.x ** 2 + v.co.y ** 2 >= .97]
    bmesh.ops.delete(bm, geom=gone, context='VERTS')
    for v in bm.verts:
        x, y = v.co.x * rx, v.co.y * ry; v.co = Vector((x, y, Hh(x, y) - .02))
    for i in range(n):
        a = rnd.uniform(0, 6.283); p = rnd.random() ** .5
        x, y = rx * .98 * p * math.cos(a), ry * .98 * p * math.sin(a)
        rad = rnd.uniform(.05, .13)
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rad, matrix=Matrix.Translation((x, y, Hh(x, y) + rad * .25)))
    me = bpy.data.meshes.new('moss'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    o = bpy.data.objects.new('moss', me); S.collection.objects.link(o); o.location = loc
    m, t, b = principled(uname('moss'))
    tc = t.nodes.new('ShaderNodeTexCoord'); n1 = t.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 3.4; n1.inputs['Detail'].default_value = 6
    t.links.new(tc.outputs['Object'], n1.inputs['Vector'])
    mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = .36; mr.inputs['From Max'].default_value = .66; t.links.new(n1.outputs['Fac'], mr.inputs['Value'])
    mx = t.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.inputs[6].default_value = hexc('#4f7d24'); mx.inputs[7].default_value = hexc('#9dbb3f')
    t.links.new(mr.outputs['Result'], mx.inputs[0]); t.links.new(mx.outputs[2], b.inputs['Base Color']); set_in(b, 'Roughness', .85)
    me.materials.append(m)
    return o

def twig(start, direction, length=14, seed=1, depth=3, thick=.13, leaves=True):
    rnd = random.Random(seed)
    cu = bpy.data.curves.new('twig', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 1; cu.bevel_resolution = 2; cu.fill_mode = 'FULL'
    bm = bmesh.new()
    def branch(p, d, L, th, dep):
        steps = max(4, int(L / .9)); pts = [Vector(p)]; dir_ = Vector(d).normalized()
        for i in range(steps):
            dir_ = (dir_ + Vector((rnd.gauss(0, .15), rnd.gauss(0, .08), rnd.gauss(.02, .13)))).normalized()
            pts.append(pts[-1] + dir_ * L / steps)
            if dep > 0 and i > 1 and rnd.random() < .34:
                side = (dir_ + Vector((rnd.choice((-1, 1)) * rnd.uniform(.6, 1.1), rnd.gauss(0, .3), rnd.uniform(-.1, .5)))).normalized()
                branch(pts[-1], side, L * rnd.uniform(.32, .55), th * .6, dep - 1)
            if leaves and dep <= 1 and rnd.random() < .9:
                lf = rnd.uniform(.28, .5); nrm = Vector((rnd.gauss(0, .6), -1, rnd.gauss(.3, .6))).normalized()
                q = nrm.to_track_quat('Z', 'Y').to_matrix().to_4x4()
                M = Matrix.Translation(pts[-1]) @ q @ Matrix.Diagonal((lf, lf * .5, .03, 1))
                bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1, matrix=M)
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
        for i, q in enumerate(pts):
            sp.points[i].co = (q.x, q.y, q.z, 1); sp.points[i].radius = th * (1 - .75 * i / len(pts))
    branch(start, direction, length, thick, depth)
    o = bpy.data.objects.new('twig', cu); S.collection.objects.link(o)
    cu.materials.append(plain('bark', hexc('#6a4a33'), rough=.75))
    me = bpy.data.meshes.new('leaves'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    lo = bpy.data.objects.new('leaves', me); S.collection.objects.link(lo); me.materials.append(plain('leaf', hexc('#8fb54a'), rough=.5))
    return o

def leaf_shadows(v, target, n=46, height=95, spread=34, seed=4):
    """A branch between the sun and the wall: only its shadow is ever seen."""
    rnd = random.Random(seed); c = Vector(target) + v * height
    x = v.cross(Vector((0, 0, 1))).normalized(); y = v.cross(x).normalized()
    bm = bmesh.new(); q0 = v.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    for i in range(n):
        a, b_ = rnd.gauss(0, spread), rnd.gauss(0, spread * .7)
        rz = Matrix.Rotation(rnd.uniform(0, 3.14), 4, 'Z'); L = rnd.uniform(3, 7)
        M = Matrix.Translation(c + x * a + y * b_) @ q0 @ rz @ Matrix.Diagonal((L, L * .38, .05, 1))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1, matrix=M)
    me = bpy.data.meshes.new('gobo'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('gobo', me); S.collection.objects.link(o); o.visible_camera = False; o.visible_glossy = False; o.visible_transmission = False

def mirror_floor():
    verts = [(-900, -900, 0), (900, -900, 0), (900, 900, 0), (-900, 900, 0)]
    o = mesh_obj('acrylic', verts, [(0, 1, 2, 3)])
    m = bpy.data.materials.new('acrylic'); m.use_nodes = True; t = m.node_tree
    for n in list(t.nodes): t.nodes.remove(n)
    out_ = t.nodes.new('ShaderNodeOutputMaterial'); em = t.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (1, 1, 1, 1)
    tr = t.nodes.new('ShaderNodeBsdfTransparent'); mx = t.nodes.new('ShaderNodeMixShader'); mx.inputs[0].default_value = .72
    t.links.new(tr.outputs[0], mx.inputs[1]); t.links.new(em.outputs[0], mx.inputs[2]); t.links.new(mx.outputs[0], out_.inputs['Surface'])
    m.blend_method = 'BLEND'; o.data.materials.append(m); o.visible_shadow = False; o.visible_diffuse = False; o.visible_glossy = False
    return o

def anygen(shape='slim', label='oil.png', tint='none', fade=None, color='#3f9e93', loc=(0, 0, 0), euler=(0, 0, 0), kind='cyl', rot=0):
    g, s = bottle(label, shape, tint, (kind, anodised(color)), fade=fade, rot=rot)
    pose(g, loc, euler); return g

R_ = math.radians
FACE = R_(-8)
LOOK = dict(lens=85, wide=False, fstop=18)
def front(d=44, z=8, h=9.5):
    cam((-d * .14, -d, h), (0, 0, z), focus=d - 2.5, **LOOK)
def top(d=44, x=0, y=0, wide=True):
    cam((x, y - .01, d), (x, y, 0), lens=70, wide=wide, fstop=18, focus=d - 2)

SHOTS = {}
def shot(fn): SHOTS[fn.__name__] = fn; return fn

# ------ droplets: matte glass, plastic cap
@shot
def d1_teal_ball():
    white_set(floor=False); wet('oil.png', 'stout', 'oil', PAL['teal'], (0, 0, 0), (R_(4), R_(-20), FACE)); finish_scene(); front(z=5.5, h=7)
@shot
def d2_coral_ball():
    white_set(floor=False); wet('elixir.png', 'stout', 'elixir', PAL['coral'], (0, 0, 0), (R_(-4), R_(18), FACE), seed=5); finish_scene(); front(z=5.5, h=7)
@shot
def d3_falling_trio():
    white_set(floor=False)
    wet('oil.png', 'stout', 'oil', PAL['teal'], (-6, 0, 4), (R_(6), R_(-24), FACE), seed=3, n=520)
    wet('elixir.png', 'stout', 'elixir', PAL['coral'], (6.5, 5, 11), (R_(-8), R_(17), FACE), seed=5, n=520)
    wet('shampoo.png', 'stout', 'shampoo', PAL['sun'], (3.5, -4, -6), (R_(10), R_(32), FACE), seed=8, n=520)
    finish_scene(40); cam((-9, -70, 7), (0, 0, 5), lens=85, wide=False, fstop=18, focus=68)
@shot
def d4_clear_glass():
    white_set(); g, s = bottle('oil.png', 'stout', 'oil', ('ball', gloss(PAL['teal'])), clear=True)
    z = s['h'] + .22; R = s['neck'] * 1.75; drops(s, g, n=620, seed=6, ball=((0, 0, z + R), R)); pose(g, (0, 0, 0), (0, 0, FACE)); finish_scene(); front(z=6, h=7.5)
@shot
def d5_macro():
    white_set(floor=False); wet('oil.png', 'stout', 'oil', PAL['teal'], (0, 0, 0), (0, 0, FACE), seed=9, n=1000); finish_scene()
    cam((-3, -24, 7.5), (0, 0, 7), lens=85, wide=False, fstop=18, focus=20.5)
@shot
def d6_white_ball():
    white_set(); wet('conditioner.png', 'stout', 'conditioner', PAL['white'], (0, 0, 0), (0, 0, FACE), seed=12); finish_scene(); front(z=6, h=7.5)

# ------ open, the cream inside
@shot
def c1_top():
    white_set(sun_el=52); pose(open_jar(), (-3.6, -1, 0)); l = jar_lid(gloss(PAL['teal'])); pose(l, (4.4, 1.8, 0)); finish_scene(); top(32)
@shot
def c2_combed():
    white_set(floor=False, sun_el=26, sun_az=-160, sunp=SUNP * 1.1, soft=1.6); relief()
    pose(open_jar(), (-5.5, -2, .0)); l = jar_lid(gloss(PAL['leaf'])); pose(l, (6.2, 4.5, .45)); finish_scene(); top(38)
@shot
def c3_lid_leaning():
    white_set(); pose(open_jar(rot=R_(47)), (-1.4, 0, 0)); l = jar_lid(gloss(PAL['teal'])); pose(l, (6.6, 1.6, 2.9), (R_(66), 0, R_(16))); finish_scene()
    cam((-6, -44, 17), (1, 0, 3.4), lens=85, wide=True, fstop=18, focus=42)
@shot
def c4_teal_cream():
    white_set(sun_el=52); pose(open_jar(cream='#a9e0d6'), (0, 0, 0)); finish_scene(); top(30)

# ------ natural
def stack(y=0):
    rock((.6, y, 1.1), (6.2, 3.8, 1.3), 1, ('#e0d5bd', '#a79c84'))
    rock((-7.8, y - 3.5, .7), (2.8, 1.8, .85), 2, ('#b9bdb2', '#858a80'), R_(25))
    rock((8.8, y - 3.8, .55), (1.7, 1.25, .7), 3, ('#f2ecdc', '#d3cab4'))
    moss((6.4, y - .6, .1), 3, 2.6, 2.4, seed=2, n=2600)
    rock((.3, y, 3.1), (5.1, 3.5, 1.05), 4)
    rock((.0, y, 4.75), (4.4, 2.8, .72), 5, ('#c3c4b8', '#94968b'))
    moss((.1, y, 5.2), 3.5, 2.5, 1.0, seed=3)
    return 6.05
@shot
def n1_stones_jar():
    white_set(); z = stack(); pose(jar3(rot=R_(53)), (0, 0, z)); twig((2.6, .6, 5.6), (.5, .1, 1), 15, seed=2); twig((-3, .4, 5.4), (-.9, .0, .5), 8, seed=4, depth=1); finish_scene(40)
    cam((-9, -72, 12), (0, 0, 9), lens=85, wide=False, fstop=18, focus=70)
@shot
def n2_oil_on_stones():
    white_set(); z = stack(); g, s = bottle('oil.png', 'stout', 'oil', ('pump', gloss('#efe9db'))); pose(g, (0, 0, z), (0, 0, FACE)); twig((3, .8, 5.6), (.6, .2, 1), 16, seed=7); finish_scene(40)
    cam((-11, -82, 14), (0, 0, 12), lens=85, wide=False, fstop=18, focus=80)
@shot
def n3_family_bed():
    white_set()
    rock((-13, 2, .7), (9, 5, .95), 6, ('#e0d5bd', '#a79c84')); rock((5, 3, .8), (12, 5.5, 1.05), 7); rock((20, -2.5, .55), (3.6, 2.6, .8), 8)
    moss((-4, -3.5, .1), 5, 2.3, 1.6, seed=4, n=3400); moss((17, -5.5, .05), 3, 2, 1.4, seed=5, n=2200)
    g, _ = bottle('conditioner.png', 'tall', 'conditioner', ('pump', gloss('#f2efe5'))); pose(g, (-13, 2, 1.45), (0, 0, FACE))
    g, _ = bottle('shampoo.png', 'tall', 'shampoo', ('pump', gloss('#f2efe5'))); pose(g, (-4.5, 3.5, 1.6), (0, 0, FACE))
    g, _ = bottle('elixir.png', 'stout', 'elixir', ('ball', gloss(PAL['coral']))); pose(g, (4, 2, 1.65), (0, 0, FACE))
    g, _ = bottle('oil.png', 'stout', 'oil', ('ball', gloss(PAL['teal']))); pose(g, (12.5, 3.5, 1.55), (0, 0, FACE))
    twig((17, 3, 1), (.5, .2, 1), 16, seed=9); finish_scene(70)
    cam((0, -74, 13), (2, 0, 8.5), lens=70, wide=True, fstop=18, focus=72)
@shot
def n4_dropper_moss():
    white_set(); moss((0, 0, 0), 7.5, 5.5, 1.5, seed=8, n=7000); rock((-7.5, -4.3, .55), (1.8, 1.3, .7), 10, ('#f2ecdc', '#d3cab4')); rock((7.8, -3.4, .8), (2.5, 1.7, 1), 11)
    pose(elixir3(rot=FACE), (0, 0, 1.3)); twig((4.6, 1, 1.2), (.4, .1, 1), 12, seed=11); finish_scene(); front(d=58, z=7, h=9)
@shot
def n5_lying():
    white_set(sun_el=52)
    rock((-7, 6.5, 1), (5.5, 3.6, 1.3), 12); rock((7.5, 6, .8), (3.8, 2.8, 1.0), 13, ('#e0d5bd', '#a79c84')); moss((.8, 7.4, .05), 3.6, 2.4, 1.2, seed=7, n=2400)
    g, s = bottle('shampoo.png', 'tall', 'shampoo', ('ball', gloss(PAL['sun']))); pose(g, (-8.6, -2.6, 2.6), (R_(-90), 0, R_(-82)))
    twig((-15, -10.5, .4), (1, -.03, .08), 13, seed=13); finish_scene(); top(58)

# ------ metal, as in her reference
@shot
def m1_teal_on_rock():
    white_set(); rock((0, 0, .85), (8.5, 6, 1.05), 15, ('#9fa59f', '#5f655f')); moss((6.2, -3.2, .05), 2.8, 1.8, 1.3, seed=9, n=1800)
    anygen('slim', 'oil.png', 'conditioner', fade='#fbfdfc', color='#3f9e93', loc=(0, 0, 1.75), euler=(0, 0, FACE)); finish_scene(); cam((-8, -60, 12), (0, 0, 9), lens=85, wide=False, fstop=18, focus=58)
@shot
def m2_silver():
    white_set(); anygen('slim', 'conditioner.png', 'none', color='#d6d8da', euler=(0, 0, FACE)); finish_scene(); front(z=7.6, h=9)
@shot
def m3_coral():
    white_set(); anygen('slim', 'elixir.png', 'elixir', fade='#fdf7f4', color='#d9685d', euler=(0, 0, FACE)); finish_scene(); front(z=7.6, h=9)
@shot
def m4_floating():
    white_set(floor=False); anygen('slim', 'shampoo.png', 'shampoo', fade='#fdfcf5', color='#d2a03c', euler=(R_(6), R_(-22), FACE)); finish_scene(); front(d=60, z=7, h=9)
@shot
def m5_family():
    white_set()
    for lab, tint, col, x, y in (('conditioner.png', 'conditioner', '#3f9e93', -13, 1), ('shampoo.png', 'shampoo', '#d2a03c', -4.5, 3), ('elixir.png', 'elixir', '#d9685d', 4, 1), ('oil.png', 'oil', '#a98a52', 12.5, 3)):
        anygen('slim', lab, tint, color=col, loc=(x, y, 0), euler=(0, 0, FACE))
    finish_scene(70); cam((0, -68, 11), (0, 0, 7.5), lens=70, wide=True, fstop=18, focus=66)

# ------ others
@shot
def x1_mirror_family():
    white_set(floor=False); mirror_floor()
    for lab, tint, kind, col, x, sh in (('conditioner.png', 'conditioner', 'pump', '#f4f1e8', -13, 'tall'), ('shampoo.png', 'shampoo', 'pump', '#f4f1e8', -5, 'tall'), ('elixir.png', 'elixir', 'ball', PAL['coral'], 3.8, 'stout'), ('oil.png', 'oil', 'ball', PAL['teal'], 12.4, 'stout')):
        for sign in (1, -1):
            g, _ = bottle(lab, sh, tint, (kind, gloss(col)))
            e = bpy.data.objects.new('pose', None); S.collection.objects.link(e); g.parent = e
            e.location = (x, 0, 0); e.rotation_euler = (0, 0, R_(-4)); e.scale = (1, 1, sign)
    finish_scene(70); cam((0, -66, 3.5), (0, 0, 5), lens=70, wide=True, fstop=18, focus=64)
@shot
def x2_leaf_shadow():
    white_set(sun_el=36, sun_az=-122, soft=.8, sunp=SUNP * 1.6); bpy.data.objects['sweep'].data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = .1; leaf_shadows(_sun_v(), (2, 16, 9), n=60, spread=24)
    g, _ = bottle('oil.png', 'stout', 'oil', ('pump', gloss('#efe9db'))); pose(g, (0, 0, 0), (0, 0, FACE)); finish_scene(); front(d=58, z=6.5, h=9)
@shot
def x3_ball_family():
    white_set()
    for lab, tint, col, x, y in (('conditioner.png', 'conditioner', PAL['leaf'], -12, 2), ('shampoo.png', 'shampoo', PAL['sun'], -4, -1), ('elixir.png', 'elixir', PAL['coral'], 4, 2.2), ('oil.png', 'oil', PAL['teal'], 12, -.6)):
        g, _ = bottle(lab, 'stout', tint, ('ball', gloss(col))); pose(g, (x, y, 0), (0, 0, R_(-4)))
    finish_scene(70); cam((0, -82, 12), (0, 0, 6), lens=70, wide=True, fstop=18, focus=80)
@shot
def x4_gold_hero():
    white_set(); pose(oil3(rot=R_(-8.5), spin=26), (0, 0, 0)); finish_scene()
    cam((-7.4, -50, 10.5), (.2, 0, 8.3), lens=85, wide=False, fstop=18, focus=47.8)
@shot
def x5_gold_family():
    white_set()
    pose(box3(rot=R_(-12)), (-15.8, 3, 0)); pose(spray3('conditioner.png', 8.6, h=10.2, r=2.05, rot=R_(10), name='conditioner'), (-8.2, -.8, 0)); pose(spray3('shampoo.png', 10.2, rot=R_(6), name='shampoo'), (-2.2, 2.6, 0))
    pose(elixir3(rot=R_(-8)), (4.6, -.8, 0)); pose(oil3(rot=R_(-4), spin=-25), (12, 2.8, 0)); pose(jar3(rot=R_(-6)), (20.2, -2.6, 0)); finish_scene(70)
    cam((3, -98, 17), (2.6, 0, 7.6), lens=70, wide=True, fstop=18, focus=96)

def _sun_v():
    o = next(x for x in bpy.data.objects if x.type == 'LIGHT' and x.data.type == 'SUN')
    return Vector((0, 0, 1)) @ o.rotation_euler.to_matrix().inverted() if False else (o.rotation_euler.to_matrix() @ Vector((0, 0, 1))).normalized()

for _k, _f in SHOTS.items(): globals()['shot_' + _k] = _f

globals()['shot_' + SHOT]()
camera_stage()
bpy.ops.render.render(write_still=True)
print('RENDERED', SHOT, OUT)
