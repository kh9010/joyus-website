
# ------- Study 82. Divya on 81: "the metallicness is too high and roughness too low? ... so unmetal like. a friend who is a 3d artist said to subdivide?"
# Two questions, tested apart. --sub 1: real edges (a small bevel on every corner, then subdivision). --mm / --mr: the metal's metallic and roughness.
SUB = int(arg('sub', 1)); MM = float(arg('mm', 1)); MR = float(arg('mr', .3))
BASE_ROUGH = MR
_rm82 = real_metal
def real_metal(col=None):
    m = _rm82(col)
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'); b.inputs['Metallic'].default_value = MM
    return m

def refine():
    if not SUB: return
    n_ = 0
    for o in bpy.data.objects:
        if o.type != 'MESH' or not o.data.materials: continue
        if not any(ms and ms.name.startswith(('metal', 'plastic')) for ms in o.data.materials): continue
        bv = o.modifiers.new('edges', 'BEVEL'); bv.limit_method = 'ANGLE'; bv.angle_limit = math.radians(float(arg('angle', 28))); bv.width = float(arg('bevel', .012)); bv.segments = 2; bv.profile = .6
        ss = o.modifiers.new('sub', 'SUBSURF'); ss.levels = 2; ss.render_levels = int(arg('level', 2)); ss.subdivision_type = 'CATMULL_CLARK'
        n_ += 1
    print('REFINED', n_)

_st82 = shot_studio
def shot_studio():
    _st82()
    refine()
    if arg('ca', '') == 'tight':
        for o in list(bpy.data.objects):
            if o.type == 'CAMERA': bpy.data.objects.remove(o, do_unlink=True)
        camera((-9, -27, 11.5), (.1, 0, 7.9), lens=70, dof=26.5, fstop=8); S.camera.data.dof.aperture_fstop = 9
        g = next((o for o in bpy.data.objects if o.name == 'bottle'), None)
        if g: g.rotation_euler = (0, 0, math.atan2(-9, 27) * .7)
