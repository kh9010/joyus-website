
# ------- Study 80. Divya on 79: "no its not that, it is the way you have lit it i believe."
# Study 75's set lit from everywhere at once: no direction, no cast shadow, nothing falling from bright to dark across the form.
# --lit: each one light idea, one source doing the work. Same bottle, materials and colour.
#   window : one big soft source from the side, falling off across the bottle and the wall, a dark card opposite
#   sun    : hard sun from behind and to the side, a long shadow coming toward the lens
#   strips : two long narrow lights either side and one above, a pool of light on the wall behind
LIT = arg('lit', 'window')

def world_amb(amb):
    """A real sky in the reflections, and only a little light on surfaces, so shadows stay shadows."""
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True; t = w.node_tree
    bg = t.nodes['Background']; env = t.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(f"{ASSETS}/{arg('hdr', 'kloofendal_48d_partly_cloudy_puresky')}_2k.hdr")
    t.links.new(env.outputs[0], bg.inputs['Color'])
    lp = t.nodes.new('ShaderNodeLightPath'); mr = t.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = amb; mr.inputs['To Max'].default_value = float(arg('refl', 1.0))
    t.links.new(lp.outputs['Is Glossy Ray'], mr.inputs['Value']); t.links.new(mr.outputs['Result'], bg.inputs['Strength'])

def surface(color='#f1eee8'):
    o = sweep(color, grain=.1, back=20, radius=30)
    b = next(n for n in o.data.materials[0].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    set_in(b, 'Roughness', .55)
    return o

def studio_set():
    if LIT == 'window':
        world_amb(.1); surface()
        card('window', 52, 78, (-44, -14, 30), (0, 2, 9), float(arg('key', 1.55)))
        flag('negative', 34, 70, (17, -6, 34), (0, 0, 34))
        card('sliver', 16, 60, (34, 22, 34), (0, 0, 10), float(arg('rim', 1.6)))
    elif LIT == 'sun':
        world_amb(.5); surface('#fbf9f5')
        sun(float(arg('saz', 128)), float(arg('sel', 42)), power=float(arg('sunp', 3.2)), soft=.9, col=(1, .96, .88))
        card('bounce', 40, 50, (-6, -60, 22), (0, 0, 8), float(arg('fill', 2.2)))
    else:
        world_amb(.08); surface('#e9e7e2')
        card('strip left', 7, 70, (-22, -8, 36), (0, 0, 10), float(arg('strip', 4.6)))
        card('strip right', 7, 70, (22, -8, 36), (0, 0, 10), float(arg('strip', 4.6)) * .75)
        card('over', 46, 30, (0, -8, 52), (0, 0, 6), float(arg('over', .9)))
        card('pool', 26, 26, (0, 2, 54), (0, 40, 10), float(arg('pool', 5)))

_st80 = shot_studio
def shot_studio():
    _st80()
    see_through()       # a bottle throws a coloured shadow, not a black one
    if LIT in ('window', 'sun', 'strips'):
        for o in bpy.data.objects:
            if o.type == 'LIGHT': o.visible_glossy = True

# Divya: "or maybe the camera angle?" --ca: where the camera stands. Straight-on and low flattens a cylinder into a rectangle.
CA = arg('ca', 'straight')
_st80b = shot_studio
def shot_studio():
    _st80b()
    spots = {'three': ((-26, -56, 25), (.4, 0, 7.6), 100, 58), 'close': ((-11, -27, 13), (0, 0, 8.6), 60, 26), 'down': ((-8, -34, 44), (0, 0, 7), 85, 52)}
    g = next((o for o in bpy.data.objects if o.name == 'bottle'), None)
    if CA in spots:
        loc, tgt, lens, foc = spots[CA]
        for o in list(bpy.data.objects):
            if o.type == 'CAMERA': bpy.data.objects.remove(o, do_unlink=True)
        camera(loc, tgt, lens=lens, dof=foc, fstop=8); S.camera.data.dof.aperture_fstop = 9
        if g: g.rotation_euler = (0, 0, math.atan2(loc[0], -loc[1]) * .7)   # the label turns most of the way toward the lens, not all of it: the bottle shows it is round
