
# ------- Study 79. Divya on 78: "maybe it is because you dont have a good sky map?" She is right to ask: the world was black, so metal and glass had only my few cards to reflect.
# --hdr name: a real photographed room, seen only by reflections and light, never by the camera, which still sees the white backdrop.
HDR = arg('hdr', 'none'); HDRP = float(arg('hdrp', 1.0)); HSPIN = float(arg('hspin', 0))

_bw0 = black_world
def black_world():
    if HDR == 'none': return _bw0()
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; t = w.node_tree
    bg = t.nodes['Background']; env = t.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(f'{ASSETS}/{HDR}_2k.hdr')
    tc = t.nodes.new('ShaderNodeTexCoord'); mp = t.nodes.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value = (0, 0, R_(HSPIN))
    t.links.new(tc.outputs['Generated'], mp.inputs['Vector']); t.links.new(mp.outputs[0], env.inputs['Vector']); t.links.new(env.outputs[0], bg.inputs['Color'])
    # wrong turn: lighting everything with it blew the label to white. So reflections see the room; surfaces do not.
    lp = t.nodes.new('ShaderNodeLightPath'); mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0; mr.inputs['To Max'].default_value = HDRP
    t.links.new(lp.outputs['Is Glossy Ray'], mr.inputs['Value']); t.links.new(mr.outputs['Result'], bg.inputs['Strength'])

# Soft gold is the working colour from Study 78.
TINT_NOW = TINTS[arg('tint', 'soft')]

_stock78 = label_stock
def label_stock():
    _stock78()
    l = next(o for o in bpy.data.objects if o.name.startswith('oil label'))
    for n in l.data.materials[0].node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED' and n.inputs['Metallic'].default_value == 0: n.inputs['Specular IOR Level'].default_value = .1   # the room should not veil the paper

_stock79 = label_stock
def label_stock():
    # with a bright room to mirror, full foil lost the name. Half foil over her grey ink: it still catches light, and the words always hold.
    _stock79()
    l = next(o for o in bpy.data.objects if o.name.startswith('oil label'))
    t = l.data.materials[0].node_tree
    mx = next(n for n in t.nodes if n.type == 'MIX_SHADER'); src = mx.inputs[0].links[0].from_socket
    k = t.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = .45; t.links.new(src, k.inputs[0]); t.links.new(k.outputs[0], mx.inputs[0])
