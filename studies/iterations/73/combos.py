
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
