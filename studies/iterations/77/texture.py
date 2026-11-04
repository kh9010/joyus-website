
# ------- Study 77. Divya on 76: "these metals are just not right... the paper changes also are too small. i think the items need to be slightly textured? real surfaces are never 100% smooth."
# The fault was scale. At full-bottle size a pixel is about .1 mm, and my grain was .1 mm or finer, so it averaged away. Every texture here is sized to be seen.
# --metal brushed | blasted | beaten, each a different surface, not a different setting.
METAL = arg('metal', 'blasted'); GOLD = (1.0, .76, .42, 1)

def real_metal(col=GOLD):
    col = GOLD
    m, t, b = principled(uname('metal')); set_in(b, 'Metallic', 1); set_in(b, 'Base Color', col)
    ao = t.nodes.new('ShaderNodeAmbientOcclusion'); ao.samples = 6; ao.inputs['Distance'].default_value = .14
    mx = t.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; t.links.new(mapr(t, ao.outputs['AO'], .2, .95, 0, 1), mx.inputs[0]); mx.inputs[6].default_value = (col[0] * .45, col[1] * .38, col[2] * .3, 1); mx.inputs[7].default_value = col
    t.links.new(mx.outputs[2], b.inputs['Base Color'])
    if METAL == 'brushed':
        # lines .3 mm apart, round the part: you can count them
        set_in(b, 'Anisotropic', .75); tg = t.nodes.new('ShaderNodeTangent'); tg.direction_type = 'RADIAL'; tg.axis = 'Z'; t.links.new(tg.outputs[0], b.inputs['Tangent'])
        l = noise_at(t, 1, 5, .55, (.5, .5, 34))
        t.links.new(mapr(t, l.outputs['Fac'], .35, .65, .24, .42), b.inputs['Roughness'])
        bumpy(t, b, l.outputs['Fac'], .55, .012)
    elif METAL == 'blasted':
        # bead-blasted: thrown sand. No mirror anywhere, a soft broad highlight and a fine tooth
        n = noise_at(t, 34, 3, .5)
        t.links.new(mapr(t, n.outputs['Fac'], .3, .7, .36, .5), b.inputs['Roughness'])
        bumpy(t, b, n.outputs['Fac'], .55, .012)
    else:
        # hand-beaten: facets from a small hammer, each catching light its own way, with a fine grain over them
        v = t.nodes.new('ShaderNodeTexVoronoi'); v.inputs['Scale'].default_value = 3.6; v.inputs['Randomness'].default_value = .9
        tc = t.nodes.new('ShaderNodeTexCoord'); t.links.new(tc.outputs['Object'], v.inputs['Vector'])
        bumpy(t, b, v.outputs['Distance'], .85, .05)
        n = noise_at(t, 26, 3, .5)
        t.links.new(mapr(t, n.outputs['Fac'], .3, .7, .24, .38), b.inputs['Roughness'])
        bumpy(t, b, n.outputs['Fac'], .25, .008)
    return m

def plastic(col):
    m = _pl0(col); t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    set_in(b, 'Coat Weight', 0)
    # spark-eroded tool: the fine stipple on a good moulded cap
    n = noise_at(t, 30, 2, .45)
    t.links.new(mapr(t, n.outputs['Fac'], .3, .7, .3, .46), b.inputs['Roughness'])
    bumpy(t, b, n.outputs['Fac'], .5, .012)
    return m

_stock0 = label_stock
def label_stock():
    """Cold-press paper. Tried first: the tooth of her own scan, but the scan is blown out to white (std 1.1 of 255), so what came back was JPEG blocks.
    So this is drawn: a soft dimple about .6 mm across with a finer grain in it, the texture of the watercolour paper the motifs were painted on."""
    _stock0()
    l = next(o for o in bpy.data.objects if o.name.startswith('oil label'))
    t = l.data.materials[0].node_tree
    b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED' and n.inputs['Metallic'].default_value == 0)
    art = next(n for n in t.nodes if n.type == 'TEX_IMAGE' and n.image.name.startswith('oil.png'))
    big = noise_at(t, float(arg('tooth', 15)), 5, .58)
    bumpy(t, b, big.outputs['Fac'], float(arg('toothb', .9)), float(arg('toothd', .03)))
    # the ink misses the peaks and pools in the valleys: the print itself carries the paper
    ml = t.nodes.new('ShaderNodeMix'); ml.data_type = 'RGBA'; ml.blend_type = 'MULTIPLY'; ml.inputs[0].default_value = 1
    t.links.new(art.outputs['Color'], ml.inputs[6])
    grey = mapr(t, big.outputs['Fac'], .34, .66, float(arg('toothc', .9)), 1.0)
    t.links.new(grey, ml.inputs[7])
    t.links.new(ml.outputs[2], b.inputs['Base Color'])

_mould0 = moulded
def moulded():
    _mould0()
    m = bpy.data.materials.get('heavy glass')
    if m:
        t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
        p = noise_at(t, 7, 3, .5); bumpy(t, b, p.outputs['Fac'], .04, .006)    # the faintest orange-peel from the mould; more than this looks like cling film

_frost0 = glass_matte
def glass_matte():
    m = _frost0(); t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    n = noise_at(t, 30, 3, .5); bumpy(t, b, n.outputs['Fac'], .4, .012)       # acid-etched, a tooth you can see where it catches light
    return m

_mould1 = moulded
def moulded():
    _mould1()
    m = bpy.data.materials.get('heavy glass')
    if m:
        for n in m.node_tree.nodes:
            if n.type == 'BUMP' and n.inputs['Distance'].default_value > .04:
                n.inputs['Strength'].default_value = .18; n.inputs['Distance'].default_value = .012
