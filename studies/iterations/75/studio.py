
# ------- Study 75: Divya: "look through tutorials... I think you are not getting some fundamental things right."
# The recipe, as the tutorials give it (research.md), applied literally to Study 74's label-driven bottle:
# - a reflective thing is lit by what it reflects, so: no default lights, no three-point; emission planes with gradients
# - a large bright plane behind, which is the backdrop and the backlight at once, so the glass glows from inside
# - gradient cards each side that define the sides of the bottle; black flags that give the edges their dark line
# - a black, nearly mirror floor: it reflects the white backdrop, so the white "background" is seamless and the bottle has a real reflection
# - a low camera, long lens, looking slightly up
# - real caustics, not a faked tint: filter glossy 0, more transmission bounces, higher indirect clamp
S.cycles.use_denoising = True
S.cycles.blur_glossy = 0
S.cycles.caustics_reflective = True; S.cycles.caustics_refractive = True
S.cycles.transmission_bounces = 32; S.cycles.max_bounces = 32; S.cycles.glossy_bounces = 16
S.cycles.sample_clamp_indirect = 40

def black_world():
    w = bpy.data.worlds.new('w'); S.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)

def card(name, w_, h_, loc, target, peak, side=0, feather=.55, col=(1, 1, 1, 1)):
    """An emission plane. side: 0 even, +1 or -1 bright along that edge, fading away across the card."""
    o = mesh_obj(name, [(-w_ / 2, -h_ / 2, 0), (w_ / 2, -h_ / 2, 0), (w_ / 2, h_ / 2, 0), (-w_ / 2, h_ / 2, 0)], [(0, 1, 2, 3)])
    o.location = loc; o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('Z', 'Y').to_euler()
    m = bpy.data.materials.new(name); m.use_nodes = True; t = m.node_tree
    for n in list(t.nodes): t.nodes.remove(n)
    out_ = t.nodes.new('ShaderNodeOutputMaterial'); em = t.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = col
    t.links.new(em.outputs[0], out_.inputs['Surface'])
    if side:
        tc = t.nodes.new('ShaderNodeTexCoord'); sp = t.nodes.new('ShaderNodeSeparateXYZ'); t.links.new(tc.outputs['Object'], sp.inputs[0])
        mr = t.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHERSTEP'
        mr.inputs['From Min'].default_value = -side * w_ * (feather - .5); mr.inputs['From Max'].default_value = side * w_ * .5
        mr.inputs['To Min'].default_value = 0; mr.inputs['To Max'].default_value = peak
        t.links.new(sp.outputs['X'], mr.inputs['Value']); t.links.new(mr.outputs['Result'], em.inputs['Strength'])
    else:
        em.inputs['Strength'].default_value = peak
    o.data.materials.append(m); o.visible_shadow = False
    return o

def flag(name, w_, h_, loc, target):
    o = mesh_obj(name, [(-w_ / 2, -h_ / 2, 0), (w_ / 2, -h_ / 2, 0), (w_ / 2, h_ / 2, 0), (-w_ / 2, h_ / 2, 0)], [(0, 1, 2, 3)])
    o.location = loc; o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('Z', 'Y').to_euler()
    m, t, b = principled(name); set_in(b, 'Base Color', (0, 0, 0, 1)); set_in(b, 'Roughness', 1)
    o.data.materials.append(m); o.visible_camera = False; o.visible_shadow = False
    return o

def studio_set():
    black_world()
    # the floor: black acrylic. What you see in it is the backdrop.
    f = mesh_obj('acrylic', [(-400, -300, 0), (400, -300, 0), (400, 42, 0), (-400, 42, 0)], [(0, 1, 2, 3)])
    m, t, b = principled('acrylic'); set_in(b, 'Base Color', (0, 0, 0, 1)); set_in(b, 'Roughness', float(arg('floorrough', .012))); set_in(b, 'Specular IOR Level', 1)
    f.data.materials.append(m)
    card('backdrop', 500, 260, (0, 42, 120), (0, -100, 120), float(arg('back', 1.25)))
    # side cards: long soft gradients, brightest toward the back, reflected in the curve of the glass and the metal
    card('left', 42, 60, (-30, -10, 32), (0, 0, 32), float(arg('sidep', 5)), side=1)
    card('right', 34, 60, (30, -6, 32), (0, 0, 32), float(arg('sidep', 5)) * .55, side=-1)
    # the front: big and dim, only for the label's white. It does not show on the glass as a shape, because it fades at both ends.
    card('front', 60, 50, (-14, -60, 34), (0, 0, 8), float(arg('frontp', 3.6)))
    # flags: black cards just out of frame, for the dark line at the bottle's edges, and one above for the shoulders
    flag('flag left', 14, 60, (-9, 8, 32), (-9, -40, 32)); flag('flag right', 14, 60, (9, 8, 32), (9, -40, 32))
    flag('flag top', 30, 18, (0, 4, 26), (0, 4, 0))

def shot_studio():
    studio_set()
    fin = arg('fin', 'clear')
    obs = bottle('clear' if fin != 'wet' else 'matte')
    obs += pump(real_metal()) if fin != 'wet' else cap(plastic(arg('capcol', '#2c9a8d')))
    if fin == 'wet':
        obs.append(water_drops())
        for o in bpy.data.objects:
            if o.name.startswith('flag'): o.visible_transmission = False
    g = group(obs, (0, 0, 0), 0, 'bottle'); g.rotation_euler = (0, 0, 0)
    S.render.resolution_y = int(WIDTH * 1.25)
    d = float(arg('d', 62))
    camera((0, -d, float(arg('camz', 3.2))), (0, 0, float(arg('tz', 8.15))), lens=float(arg('lens', 122)), dof=d - 2.2, fstop=8)
    S.camera.data.dof.aperture_fstop = 8

def camera_stage():
    pass
