
# ------- Study 74. Divya on 73: "why on white... the atmosphere has to be complete"; "a lot of these look fake in modeling and texturing";
# "the metallics still look bad"; "the water drops... look like fungus"; "colors should still be thematically correct";
# "the labels should be the driving force behind the size and proportions".
# One bottle, one place, two finishes, before any more of them.
ASSETS = arg('assets'); FIN = arg('fin', 'clear')
from mathutils import Matrix, noise as mnoise
S.unit_settings.scale_length = .01     # one unit is a centimetre, so depth of field and light behave at the real size

# ---- the label decides. Its print file (Secret Senses 100 ml cover 06 18.ai) is 102 x 224 pt: 3.6 x 7.9 cm, for 100 ml.
LW, LH = 102 / 72 * 2.54, 224 / 72 * 2.54
R_OUT = 2.15                           # so the label takes the front 96 degrees of the round, as on her sprays
WALL = .3
Z0 = .75                               # a thick foot under the label
STRAIGHT = Z0 + LH + .32               # the body ends just above the label
SHOULDER = .95
H_BODY = STRAIGHT + SHOULDER
NECK = .82
VOL = math.pi * (R_OUT - WALL) ** 2 * (STRAIGHT - .7) + .65 * math.pi * (R_OUT - WALL) ** 2 * SHOULDER
print('LABEL drives: %.2f x %.2f cm; radius %.2f, wraps %.0f deg, body %.2f tall, holds about %.0f ml' % (LW, LH, R_OUT, math.degrees(LW / R_OUT), H_BODY, VOL))

R_ = math.radians
_mat = [0]
def uname(s):
    _mat[0] += 1; return s + ' ' + str(_mat[0])

def place():
    """A real place: photographed light and reflections. The brand book's own page is a lake and forest."""
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; t = w.node_tree
    bg = t.nodes['Background']; env = t.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(ASSETS + '/blue_grotto_4k.hdr')
    tc = t.nodes.new('ShaderNodeTexCoord'); mp = t.nodes.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, R_(float(arg('spin', 320))))
    t.links.new(tc.outputs['Generated'], mp.inputs['Vector']); t.links.new(mp.outputs[0], env.inputs['Vector']); lp = t.nodes.new('ShaderNodeLightPath'); mxr = t.nodes.new('ShaderNodeMath'); mxr.operation = 'MAXIMUM'
    t.links.new(lp.outputs['Is Camera Ray'], mxr.inputs[0]); t.links.new(lp.outputs['Is Transmission Ray'], mxr.inputs[1])
    gm = t.nodes.new('ShaderNodeGamma'); gm.inputs['Gamma'].default_value = float(arg('lift', .76)); t.links.new(env.outputs[0], gm.inputs['Color'])
    gain = t.nodes.new('ShaderNodeVectorMath'); gain.operation = 'SCALE'; gain.inputs['Scale'].default_value = float(arg('seen', 1.95)); t.links.new(gm.outputs[0], gain.inputs[0])
    cast = t.nodes.new('ShaderNodeVectorMath'); cast.operation = 'SCALE'; cast.inputs['Scale'].default_value = float(arg('hdri', 1.05)); t.links.new(env.outputs[0], cast.inputs[0])
    mx = t.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; t.links.new(mxr.outputs[0], mx.inputs[0]); t.links.new(cast.outputs[0], mx.inputs[6]); t.links.new(gain.outputs[0], mx.inputs[7])
    t.links.new(mx.outputs[2], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1

def ledge():
    """Scanned wet rock: real colour, real relief, real roughness."""
    T = ASSETS + '/gray_rocks/'
    ext = lambda n: T + n + ('.jpg' if os.path.exists(T + n + '.jpg') else '.png')
    N = 900; X0, X1, Y0, Y1 = -70, 70, -48, 78
    V, F, UV = [], [], []
    disp = bpy.data.images.load(ext('disp')); disp.colorspace_settings.name = 'Non-Color'
    W_, H_ = disp.size; px = list(disp.pixels[0::4]) if False else None
    import numpy as np
    arr = np.array(disp.pixels[:], dtype=np.float32).reshape(H_, W_, 4)[:, :, 0]
    for _ in range(4):
        arr = (arr + np.roll(arr, 2, 0) + np.roll(arr, -2, 0) + np.roll(arr, 2, 1) + np.roll(arr, -2, 1)) / 5
    tile = 52.0                       # the scan is about this many cm across at this scale
    for j in range(N + 1):
        y = Y0 + (Y1 - Y0) * j / N
        for i in range(N + 1):
            x = X0 + (X1 - X0) * i / N
            u, v = x / tile, y / tile
            d = arr[int((v % 1) * (H_ - 1)), int((u % 1) * (W_ - 1))]
            edge = max(0, (y - (22 + 5 * math.sin(x / 11))) / 40) ** 2       # the rock falls away behind, toward the water
            h_ = (d - .5) * 2.6 - edge * 3.2
            pad = min(1, max(0, (math.hypot(x, y) - 2.3) / 3.2)); pad = pad * pad * (3 - 2 * pad)
            V.append((x, y, .05 + h_ * pad)); UV.append((u, v))
    for j in range(N):
        for i in range(N):
            a = j * (N + 1) + i; F.append((a, a + 1, a + N + 2, a + N + 1))
    o = mesh_obj('ledge', V, F, UV)
    for f in o.data.polygons: f.use_smooth = True
    m, t, b = principled('rock scan')
    def tex(path, data=False):
        n = t.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(path)
        if data: n.image.colorspace_settings.name = 'Non-Color'
        return n
    d = tex(ext('diff')); r = tex(ext('rough'), True); nn = tex(ext('nor'), True)
    t.links.new(d.outputs[0], b.inputs['Base Color'])
    # wet: water fills the low parts, so they go darker and shinier
    rr = t.nodes.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = .28; rr.inputs['To Max'].default_value = .75; t.links.new(r.outputs[0], rr.inputs['Value']); t.links.new(rr.outputs[0], b.inputs['Roughness'])
    nm = t.nodes.new('ShaderNodeNormalMap'); t.links.new(nn.outputs[0], nm.inputs['Color']); nm.inputs['Strength'].default_value = .6; t.links.new(nm.outputs[0], b.inputs['Normal'])
    o.data.materials.append(m)
    # the water they stand in: clear and shallow, so it mirrors the fall and shows the stones through it
    w_, wt, wb = principled('pool')
    set_in(wb, 'Base Color', (.93, 1, .97, 1)); set_in(wb, 'Transmission Weight', 1); set_in(wb, 'IOR', 1.33); set_in(wb, 'Roughness', .012)
    tc = wt.nodes.new('ShaderNodeTexCoord'); nz = wt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = .11; nz.inputs['Detail'].default_value = 4
    wt.links.new(tc.outputs['Object'], nz.inputs['Vector']); bp = wt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .14; bp.inputs['Distance'].default_value = .4
    wt.links.new(nz.outputs['Fac'], bp.inputs['Height']); wt.links.new(bp.outputs['Normal'], wb.inputs['Normal'])
    p = mesh_obj('pool', [(-90, -60, -.5), (90, -60, -.5), (90, 90, -.5), (-90, 90, -.5)], [(0, 1, 2, 3)]); p.data.materials.append(w_); p.visible_shadow = False
    bpy.data.objects.remove(p, do_unlink=True)
    return o

def ferns(places):
    bpy.ops.import_scene.gltf(filepath=ASSETS + '/fern_02/fern_02_2k.gltf')
    imp = [x for x in bpy.context.selected_objects if x.type == 'MESH']
    print('FERN meshes', [x.name for x in imp])
    for k, (loc, s, rot) in enumerate(places):
        src = imp[k % len(imp)]
        c = src.copy(); c.data = src.data; S.collection.objects.link(c); c.parent = None
        vs = [v.co for v in src.data.vertices]; size = max(max(v[i] for v in vs) - min(v[i] for v in vs) for i in range(3)); print('FERN size', round(size, 3))
        # the importer's scale is not to be trusted: s is how wide this fern is on the set, in cm
        c.matrix_world = Matrix.Translation(loc) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Scale(s / size, 4)
    for x in imp: bpy.data.objects.remove(x, do_unlink=True)

def real_metal(col=(1.0, .80, .50, 1)):
    """It needs little of its own: reflectance, a fine satin, and a real place to reflect."""
    m, t, b = principled(uname('metal'))
    set_in(b, 'Base Color', col); set_in(b, 'Metallic', 1); noise_rough(t, b, .17, .21, scale=30); micro(t, b, scale=600, strength=.015)
    return m
def plastic(col):
    m, t, b = principled(uname('plastic')); set_in(b, 'Base Color', hexc(col)); set_in(b, 'Roughness', .12); set_in(b, 'Coat Weight', .6); set_in(b, 'Coat Roughness', .04); set_in(b, 'Specular IOR Level', .5)
    return m
def glass_clear():
    m, t, b = principled('heavy glass'); set_in(b, 'Base Color', (.97, 1, .985, 1)); set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.5); set_in(b, 'Roughness', 0)
    return m
def glass_matte():
    m, t, b = principled('matte glass'); set_in(b, 'Base Color', (.97, .99, .98, 1)); set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.5); set_in(b, 'Roughness', .3)
    tc = t.nodes.new('ShaderNodeTexCoord'); n = t.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 90; n.inputs['Detail'].default_value = 4
    t.links.new(tc.outputs['Object'], n.inputs['Vector']); mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = .26; mr.inputs['To Max'].default_value = .34
    t.links.new(n.outputs['Fac'], mr.inputs['Value']); t.links.new(mr.outputs[0], b.inputs['Roughness'])
    return m
def liquid(tint, dens):
    m = bpy.data.materials.new('oil'); m.use_nodes = True; t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    set_in(b, 'Base Color', (1, 1, 1, 1)); set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.46); set_in(b, 'Roughness', 0)
    v = t.nodes.new('ShaderNodeVolumeAbsorption'); v.inputs['Color'].default_value = hexc(tint); v.inputs['Density'].default_value = dens
    t.links.new(v.outputs['Volume'], next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL').inputs['Volume'])
    return m

def body_profile():
    return outer_bottle(R_OUT, H_BODY, NECK, .28, foot=.32, shoulder=SHOULDER)

def bottle(fin):
    prof = body_profile(); obs = []
    lip = prof[-1]
    # inner wall: thick foot, thinner wall, as blown glass
    inner = [(NECK - .28, H_BODY + .3), (NECK - .28, H_BODY - .05)]
    for i in range(1, 11):
        a = i / 10 * math.pi / 2
        inner.append((NECK - .28 + (R_OUT - WALL - NECK + .28) * math.sin(a) ** .8, H_BODY - .05 - (SHOULDER - .05) * (1 - math.cos(a))))
    inner.append((R_OUT - WALL, 1.25))
    for i in range(1, 9):
        a = i / 8 * math.pi / 2; inner.append((R_OUT - WALL - .45 + .45 * math.cos(a), .75 + .5 - .5 * math.sin(a)))
    inner.append((0, .75))
    g = lathe('glass', prof + inner, glass_clear() if fin == 'clear' else glass_matte(), segs=256); obs.append(g)
    fill_top = H_BODY - .55
    cont = [(r_ - .004, z) for r_, z in reversed(inner[2:]) if z <= fill_top]
    rr = cont[-1][0]
    cont = cont + [(rr * .985, fill_top + .03), (rr * .4, fill_top), (0, fill_top)]
    obs.append(lathe('oil', cont, liquid(arg('oil', '#f6d352'), float(arg('dens', '.26'))), segs=180))
    l = exact_label('oil.png', R_OUT, LH, Z0, name='oil label'); l.visible_shadow = False; obs.append(l)
    return obs

def pump(mat):
    z = H_BODY + .28; n = NECK
    ribs = [(0, z), (n + .22, z)]
    for i in range(7):
        q = z + i * .17; ribs += [(n + .22, q + .02), (n + .18, q + .085), (n + .22, q + .15)]
    ribs += [(n + .22, z + 1.3), (n * .75, z + 1.42), (0, z + 1.42)]
    obs = [lathe('collar', ribs, mat, segs=160), lathe('shaft', round_profile(.3, z + 1.38, z + 2.3, .03), mat)]
    obs.append(lathe('head', [(0, z + 2.26), (.52, z + 2.26), (.56, z + 2.33), (.54, z + 2.92), (.44, z + 3.12), (0, z + 3.2)], mat))
    zs = z + 2.84; a = R_(22); d = (math.cos(a), math.sin(a))
    obs.append(spout([(0, 0, zs), (d[0] * 1.3, d[1] * 1.3, zs + .08), (d[0] * 2.35, d[1] * 2.35, zs - .07), (d[0] * 2.72, d[1] * 2.72, zs - .45)], .165, mat))
    return obs

def cap(mat):
    z = H_BODY + .22
    return [lathe('cap', round_profile(R_OUT * .62, z, z + 2.3, .07), mat, segs=200)]

def water_drops(seed=5):
    """Water on a cold bottle: fine and many, a few big ones that have started to sag, nothing touching. True refraction, because now there is a real place for them to bend."""
    rnd = random.Random(seed)
    m, t, b = principled('water'); set_in(b, 'Base Color', (1, 1, 1, 1)); set_in(b, 'Transmission Weight', 1); set_in(b, 'IOR', 1.33); set_in(b, 'Roughness', 0)
    placed = []; V = []; F = []
    def free(a, z, rad):
        for a2, z2, r2 in placed[-900:]:
            if (R_OUT * (a - a2)) ** 2 + (z - z2) ** 2 < (rad + r2 + .012) ** 2: return False
        return True
    def add(a0, z0, rad):
        rings = 5 if rad > .07 else 3; segs = 18 if rad > .07 else 10
        base = len(V); wob = rnd.uniform(0, 9)
        sag = min(.42, rad * 2.1)
        H = rad * .34
        V.append((0, 0, 0))   # placeholder for the apex, set below
        def pt(ang, rho, h):
            # in the surface's own coordinates: round the bottle, up the bottle, out from it
            du = rho * math.cos(ang); dz = rho * math.sin(ang) * (1 + sag * .5) - sag * rad * (1 - rho) * .9
            a = a0 + du / R_OUT; rr = R_OUT + h
            return (rr * math.cos(a), rr * math.sin(a), z0 + dz)
        V[base] = pt(0, 0, H)
        for i in range(1, rings + 1):
            q = i / rings; rho = rad * q
            h = H * (1 - q ** 2.4) ** .75 + .001
            for k in range(segs):
                ang = k / segs * 6.2832; w = 1 + .1 * mnoise.noise(Vector((math.cos(ang) * 1.4 + wob, math.sin(ang) * 1.4, wob)))
                V.append(pt(ang, rho * w, h))
        for k in range(segs): F.append((base, base + 1 + k, base + 1 + (k + 1) % segs))
        for i in range(rings - 1):
            for k in range(segs):
                a_ = base + 1 + i * segs + k; c_ = base + 1 + i * segs + (k + 1) % segs
                F.append((a_, a_ + segs, c_ + segs, c_))
        F.append(tuple(base + 1 + (rings - 1) * segs + k for k in range(segs - 1, -1, -1)))  # closed underneath
    bands = [(.11, .15, 7), (.055, .085, 70), (.03, .045, 420), (.012, .022, 2200)]
    for lo, hi, n in bands:
        tries = 0; got = 0
        while got < n and tries < n * 6:
            tries += 1
            a = R_(-90 + rnd.uniform(-118, 118)); z = rnd.uniform(.42, STRAIGHT + .1); rad = rnd.uniform(lo, hi)
            # breath on glass is not even: thinner over parts of the label, so its words stay
            if abs(math.degrees(a) + 90) < 40 and Z0 + LH * .1 < z < Z0 + LH * .9 and rnd.random() < (1 if rad > .05 else .3): continue
            if rnd.random() > .8 + .2 * mnoise.noise(Vector((a * 1.7, z * .5, seed))): continue
            if free(a, z, rad):
                placed.append((a, z, rad)); add(a, z, rad); got += 1
    o = mesh_obj('water', V, F)
    for f in o.data.polygons: f.use_smooth = True
    o.data.materials.append(m); o.visible_shadow = False
    print('DROPS', len(placed))
    return o

def light():
    """The place lights it; the sun comes from behind and through the glass; a big soft card in front keeps the label's white, as a photographer's reflector would."""
    s = sun(float(arg('saz', 112)), float(arg('sel', 46)), power=float(arg('sunp', 1.7)), soft=1.4, col=(1, .97, .9))
    softlight((-20, -46, 18), (0, 0, 7), 40, 50, float(arg('key', 3400)))
    for o in bpy.data.objects:
        if o.type == 'LIGHT' and o.data.type == 'AREA': o.visible_glossy = False; o.data.color = (1, .93, .84)   # the sky is blue; the card brings the paper back to white

def see_through():
    for mat, col in (('heavy glass', (.95, .97, .96, 1)), ('matte glass', (.8, .84, .82, 1)), ('oil', (1, .86, .42, 1))):
        for m in bpy.data.materials:
            if not (m.name == mat or m.name.startswith(mat + '.')): continue
            t = m.node_tree; o = next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL')
            src = o.inputs['Surface'].links[0].from_socket
            lp = t.nodes.new('ShaderNodeLightPath'); tr = t.nodes.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = col
            mx = t.nodes.new('ShaderNodeMixShader')
            t.links.new(lp.outputs['Is Shadow Ray'], mx.inputs['Fac']); t.links.new(src, mx.inputs[1]); t.links.new(tr.outputs[0], mx.inputs[2]); t.links.new(mx.outputs[0], o.inputs['Surface'])

def camera_stage():
    S.camera.data.dof.aperture_fstop = float(arg('fstop', 1.3))

def shot_grotto():
    place(); ledge()
    if FIN == 'clear':
        obs = bottle('clear') + pump(real_metal())
    elif FIN == 'chrome':
        obs = bottle('clear') + pump(real_metal((.93, .93, .92, 1)))
    else:
        obs = bottle('matte') + cap(plastic(arg('capcol', '#2c9a8d'))); obs.append(water_drops())
    g = group(obs, (0, 0, 0), 0, 'bottle'); g.rotation_euler = (0, 0, R_(-5.7))
    g.location = (0, 0, float(arg('z', .05)))
    ferns([((-14, 26, -1), 15, 2.2), ((14, 30, -1.6), 19, -.7)])
    light(); see_through()
    d = float(arg('d', 46)); h = float(arg('camz', 2.5))
    S.render.resolution_y = int(WIDTH * 1.25)
    camera((-d * .1, -d, h), (0, 0, float(arg('tz', 8.4))), lens=85, dof=d - 1.5, fstop=3.2)
