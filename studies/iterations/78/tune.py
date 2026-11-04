
# ------- Study 78. Divya on 77: "bead blasted + brushed together both at 25% strength and change the color to make it feel better also, cap also at 50% strength, paper at 25%".
# Strength here means how far each surface moves away from a plain satin: 100% is Study 77's value.
TINTS = {'champagne': (1.0, .85, .67, 1), 'soft': (1.0, .80, .55, 1), 'rose': (1.0, .79, .64, 1)}
TINT_NOW = TINTS[arg('tint', 'champagne')]
K_METAL, K_CAP, K_PAPER = .25, .5, .25
BASE_ROUGH = .3

def real_metal(col=None):
    col = TINT_NOW
    m, t, b = principled(uname('metal')); set_in(b, 'Metallic', 1)
    ao = t.nodes.new('ShaderNodeAmbientOcclusion'); ao.samples = 6; ao.inputs['Distance'].default_value = .14
    mx = t.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; t.links.new(mapr(t, ao.outputs['AO'], .2, .95, 0, 1), mx.inputs[0]); mx.inputs[6].default_value = (col[0] * .5, col[1] * .44, col[2] * .37, 1); mx.inputs[7].default_value = col
    t.links.new(mx.outputs[2], b.inputs['Base Color'])
    # brushed at 25%: Study 77 ran roughness .24 to .42, anisotropy .75, bump .55
    set_in(b, 'Anisotropic', .75 * K_METAL); tg = t.nodes.new('ShaderNodeTangent'); tg.direction_type = 'RADIAL'; tg.axis = 'Z'; t.links.new(tg.outputs[0], b.inputs['Tangent'])
    l = noise_at(t, 1, 5, .55, (.5, .5, 34)); bumpy(t, b, l.outputs['Fac'], .55 * K_METAL, .012)
    # blasted at 25%: Study 77 ran roughness .36 to .5, bump .55
    n = noise_at(t, 34, 3, .5); bumpy(t, b, n.outputs['Fac'], .55 * K_METAL, .012)
    r1 = mapr(t, l.outputs['Fac'], .35, .65, -.09 * K_METAL, .09 * K_METAL); r2 = mapr(t, n.outputs['Fac'], .3, .7, -.07 * K_METAL, .07 * K_METAL)
    a1 = t.nodes.new('ShaderNodeMath'); a1.operation = 'ADD'; t.links.new(r1, a1.inputs[0]); t.links.new(r2, a1.inputs[1])
    a2 = t.nodes.new('ShaderNodeMath'); a2.operation = 'ADD'; a2.inputs[1].default_value = BASE_ROUGH; t.links.new(a1.outputs[0], a2.inputs[0]); t.links.new(a2.outputs[0], b.inputs['Roughness'])
    return m

def plastic(col):
    m = _pl0(col); t = m.node_tree; b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    set_in(b, 'Coat Weight', 0)
    n = noise_at(t, 30, 2, .45)
    # Study 77 ran roughness .3 to .46 and bump .5
    t.links.new(mapr(t, n.outputs['Fac'], .3, .7, .26, .34), b.inputs['Roughness'])
    bumpy(t, b, n.outputs['Fac'], .5 * K_CAP, .012)
    return m

_stock77 = label_stock
def label_stock():
    _stock77()
    l = next(o for o in bpy.data.objects if o.name.startswith('oil label'))
    t = l.data.materials[0].node_tree
    # every paper relief down to a quarter; the ink's lightening on the peaks too
    for n in t.nodes:
        if n.type == 'BUMP': n.inputs['Strength'].default_value *= K_PAPER
        if n.type == 'MAP_RANGE' and abs(n.inputs['To Min'].default_value - .9) < 1e-6: n.inputs['To Min'].default_value = 1 - (1 - .9) * K_PAPER
