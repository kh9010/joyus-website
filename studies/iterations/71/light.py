
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
