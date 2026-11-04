
# ------- Study 76: materiality. Divya on 75: "now it has philosophical depth and it feels real. please go into materiality as the next step."
# --mat N adds one decision at a time on the same bottle, in the same set. --view hero | label | collar | foot | cap
# 1 the label is printed stock: paper fibre, thickness, ink that sits on the paper and shines differently; the S in foil
# 2 the glass was moulded: a faint waviness, a side seam, thickness that goes green
# 3 the oil has body: honey colour by depth, a meniscus, a few bubbles
# 4 the metal was spun: circular machining lines, an anisotropic highlight, plating that dulls in the grooves
# 5 it has been touched: a smudge where a thumb goes, dust on what faces up, wear on the floor
MAT = int(arg('mat', 5)); VIEW = arg('view', 'hero')

def bumpy(t, b, height_socket, strength, dist):
    bp = t.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = dist
    t.links.new(height_socket, bp.inputs['Height'])
    old = b.inputs['Normal'].links[0].from_socket if b.inputs['Normal'].links else None
    if old: t.links.new(old, bp.inputs['Normal'])
    t.links.new(bp.outputs['Normal'], b.inputs['Normal'])

def noise_at(t, scale, detail=4, rough=.55, stretch=None):
    tc = t.nodes.new('ShaderNodeTexCoord'); n = t.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = detail; n.inputs['Roughness'].default_value = rough
    if stretch:
        mp = t.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = stretch
        t.links.new(tc.outputs['Object'], mp.inputs['Vector']); t.links.new(mp.outputs[0], n.inputs['Vector'])
    else:
        t.links.new(tc.outputs['Object'], n.inputs['Vector'])
    return n

def mapr(t, sock, a, b_, c, d):
    m = t.nodes.new('ShaderNodeMapRange'); m.inputs['From Min'].default_value = a; m.inputs['From Max'].default_value = b_; m.inputs['To Min'].default_value = c; m.inputs['To Max'].default_value = d
    t.links.new(sock, m.inputs['Value']); return m.outputs['Result']

# ---- 1 the label
def label_stock():
    l = next(o for o in bpy.data.objects if o.name.startswith('oil label'))
    m = l.data.materials[0]; t = m.node_tree
    b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED'); art = next(n for n in t.nodes if n.type == 'TEX_IMAGE'); out_ = next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL')
    for n in list(t.nodes):
        if n.type == 'BUMP': t.nodes.remove(n)
    lum = t.nodes.new('ShaderNodeRGBToBW'); t.links.new(art.outputs['Color'], lum.inputs[0])
    # uncoated stock: ink is smoother and glossier than the bare paper round it
    t.links.new(mapr(t, lum.outputs[0], .25, .95, .34, .66), b.inputs['Roughness'])
    set_in(b, 'Specular IOR Level', .32)
    fibre = noise_at(t, 95, 7, .66, (1, 2.4, 1))      # paper has a grain direction
    bumpy(t, b, fibre.outputs['Fac'], .75, .006)
    # ink sits on the paper: a hair proud of it
    inv = t.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1; t.links.new(lum.outputs[0], inv.inputs[1])
    bumpy(t, b, inv.outputs[0], .22, .004)
    # the S and the name in foil, as a printer would on a label like this. My decision, not in her file.
    fm = t.nodes.new('ShaderNodeTexImage'); fm.image = bpy.data.images.load(os.path.join(SRC, 'labels', 'oil-foil.png')); fm.image.colorspace_settings.name = 'Non-Color'; fm.interpolation = 'Cubic'
    uv = art.inputs['Vector'].links[0].from_socket if art.inputs['Vector'].links else None
    if uv: t.links.new(uv, fm.inputs['Vector'])
    fb = t.nodes.new('ShaderNodeBsdfPrincipled'); set_in(fb, 'Base Color', (.42, .44, .45, 1)); set_in(fb, 'Metallic', 1); set_in(fb, 'Roughness', .36)   # bright foil mirrored the white room and the name vanished: a darker satin holds
    foilbump = noise_at(t, 90, 3); bumpy(t, fb, foilbump.outputs['Fac'], .12, .004)
    mx = t.nodes.new('ShaderNodeMixShader'); t.links.new(fm.outputs[0], mx.inputs[0]); t.links.new(b.outputs[0], mx.inputs[1]); t.links.new(fb.outputs[0], mx.inputs[2]); t.links.new(mx.outputs[0], out_.inputs['Surface'])
    # it has a thickness, and a cut edge that catches light
    s = l.modifiers.new('stock', 'SOLIDIFY'); s.thickness = .016; s.offset = 1

# ---- 2 the glass
def moulded():
    m = bpy.data.materials.get('heavy glass')
    if not m: return
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED'); out_ = next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL')
    wave = noise_at(t, .55, 3, .45, (1, 1, .55)); bumpy(t, b, wave.outputs['Fac'], .9, .05)
    # the side seam of the two halves of the mould
    tc = t.nodes.new('ShaderNodeTexCoord'); sp = t.nodes.new('ShaderNodeSeparateXYZ'); t.links.new(tc.outputs['Object'], sp.inputs[0])
    ab = t.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; t.links.new(sp.outputs['Y'], ab.inputs[0])
    bumpy(t, b, mapr(t, ab.outputs[0], .0, .035, 1, 0), .9, .012)
    # thickness goes green, as soda-lime glass does
    v = t.nodes.new('ShaderNodeVolumeAbsorption'); v.inputs['Color'].default_value = hexc('#d9efe3'); v.inputs['Density'].default_value = .11
    t.links.new(v.outputs['Volume'], out_.inputs['Volume'])

# ---- 3 the oil
def oil_body():
    m = bpy.data.materials.get('oil')
    if m:
        for n in m.node_tree.nodes:
            if n.type == 'VOLUME_ABSORPTION': n.inputs['Color'].default_value = hexc('#f7dc55'); n.inputs['Density'].default_value = .24
    fill = next((o for o in bpy.data.objects if o.name == 'oil' or o.name.startswith('oil.')), None)
    if not fill: return
    top = max(v.co.z for v in fill.data.vertices); rr = max((v.co.x ** 2 + v.co.y ** 2) ** .5 for v in fill.data.vertices if v.co.z > top - .3)
    for v in fill.data.vertices:              # the oil climbs the glass
        if v.co.z > top - .001:
            q = (v.co.x ** 2 + v.co.y ** 2) ** .5
            if q > rr * .6: v.co.z += .1
    rnd = random.Random(4)
    air, at, ab = principled('air'); set_in(ab, 'Base Color', (1, 1, 1, 1)); set_in(ab, 'Transmission Weight', 1); set_in(ab, 'IOR', 1.0); set_in(ab, 'Roughness', 0)
    bm = bmesh.new()
    for i in range(46):
        a = rnd.uniform(0, 6.28); q = rr * rnd.uniform(.4, .97) ** .5; z = top - abs(rnd.gauss(0, .45)) - .04; r_ = rnd.uniform(.012, .05)
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r_, matrix=Matrix.Translation((q * math.cos(a), q * math.sin(a), z)))
    me = bpy.data.meshes.new('bubbles'); bm.to_mesh(me); bm.free()
    for f in me.polygons: f.use_smooth = True
    o = bpy.data.objects.new('bubbles', me); S.collection.objects.link(o); me.materials.append(air); o.visible_shadow = False; o.parent = fill.parent

# ---- 4 the metal
_rm0 = real_metal
def real_metal(col=(1.0, .8, .5, 1)):
    if MAT < 4: return _rm0(col)
    m, t, b = principled(uname('metal'))
    set_in(b, 'Metallic', 1)
    # spun on a lathe: the highlight stretches round the part, as on a real collar
    set_in(b, 'Anisotropic', .62); tg = t.nodes.new('ShaderNodeTangent'); tg.direction_type = 'RADIAL'; tg.axis = 'Z'; t.links.new(tg.outputs[0], b.inputs['Tangent'])
    lines = noise_at(t, 2.2, 6, .6, (1.2, 1.2, 150))
    t.links.new(mapr(t, lines.outputs['Fac'], .32, .68, .13, .24), b.inputs['Roughness'])
    bumpy(t, b, lines.outputs['Fac'], .14, .003)
    # plating thins nowhere here, but dirt and shadow gather in the grooves
    ao = t.nodes.new('ShaderNodeAmbientOcclusion'); ao.samples = 6; ao.inputs['Distance'].default_value = .16
    mx = t.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; t.links.new(mapr(t, ao.outputs['AO'], .2, .95, 0, 1), mx.inputs[0]); mx.inputs[6].default_value = (col[0] * .5, col[1] * .44, col[2] * .36, 1); mx.inputs[7].default_value = col
    t.links.new(mx.outputs[2], b.inputs['Base Color'])
    return m

_pl0 = plastic
def plastic(col):
    m = _pl0(col)
    if MAT >= 4:
        t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
        set_in(b, 'Coat Weight', 0); set_in(b, 'Roughness', .2)     # moulded plastic, not lacquer: a fine spark-eroded texture from the tool
        tex = noise_at(t, 260, 3); bumpy(t, b, tex.outputs['Fac'], .16, .0025)
    return m

# ---- 5 touched
def touched_glass():
    m = bpy.data.materials.get('heavy glass') or bpy.data.materials.get('matte glass')
    if not m: return
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    base = b.inputs['Roughness'].default_value if not b.inputs['Roughness'].links else None
    tc = t.nodes.new('ShaderNodeTexCoord'); sp = t.nodes.new('ShaderNodeSeparateXYZ'); t.links.new(tc.outputs['Object'], sp.inputs[0])
    # a thumb goes on the shoulder and the side, nowhere else
    n = noise_at(t, 2.6, 7, .68); patch = mapr(t, n.outputs['Fac'], .5, .64, 0, .2)
    where = mapr(t, sp.outputs['Z'], 8.4, 9.6, 0, 1)
    mul = t.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; t.links.new(patch, mul.inputs[0]); t.links.new(where, mul.inputs[1])
    if base is not None:
        ad = t.nodes.new('ShaderNodeMath'); ad.operation = 'ADD'; ad.inputs[1].default_value = base; t.links.new(mul.outputs[0], ad.inputs[0]); t.links.new(ad.outputs[0], b.inputs['Roughness'])

def worn_floor():
    m = bpy.data.materials.get('acrylic')
    if not m: return
    t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    n = noise_at(t, .9, 6, .6); t.links.new(mapr(t, n.outputs['Fac'], .3, .7, .01, .045), b.inputs['Roughness'])
    # acrylic is never clean: fine specks of dust that catch the backdrop. (Voronoi "hairlines" were tried first and read as cracked tile.)
    specks = noise_at(t, 26, 2, .4)
    set_in(b, 'Base Color', (0, 0, 0, 1))
    mx = t.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; t.links.new(mapr(t, specks.outputs['Fac'], .73, .78, 0, .5), mx.inputs[0]); mx.inputs[6].default_value = (0, 0, 0, 1); mx.inputs[7].default_value = (.5, .5, .5, 1)
    t.links.new(mx.outputs[2], b.inputs['Base Color'])

_bottle0 = bottle
def apply_materials():
    if MAT >= 1: label_stock()
    if MAT >= 2: moulded()
    if MAT >= 3: oil_body()
    if MAT >= 5: touched_glass(); worn_floor()

VIEWS = {  # camera, target, focus distance
 'label':  ((-.3, -19, 8.2), (0, -2.1, 7.6), 16.8),
 'collar': ((-.2, -19, 11.2), (0, -1, 10.9), 18.0),
 'foot':   ((0, -19, 2.0), (0, -2.1, 1.3), 16.9),
 'cap':    ((-.2, -22, 12.4), (0, -1.3, 11.3), 20.6),
 'paper':  ((-.15, -9.6, 8.6), (0, -2.15, 7.75), 7.5),
}
_st0 = shot_studio
def shot_studio():
    _st0()
    apply_materials()
    if VIEW != 'hero':
        loc, tgt, foc = VIEWS[VIEW]
        S.render.resolution_y = WIDTH
        for o in list(bpy.data.objects):
            if o.type == 'CAMERA': bpy.data.objects.remove(o, do_unlink=True)
        camera(loc, tgt, lens=100, dof=foc, fstop=8)
        S.camera.data.dof.aperture_fstop = 6.3
