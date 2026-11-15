"""Genera los modelos GLB (pistola, escopeta, zombi) SIN dependencias externas (solo libreria estandar).
Escribe archivos glTF 2.0 binarios validos: malla + normales + materiales PBR + jerarquia de nodos con nombre.
Uso (desde la raiz del proyecto): python3 tools/generar_modelos_glb.py
Convencion: +Y arriba, las armas apuntan hacia -Z (como la camara de Three.js), el zombi mira hacia +Z."""
import json, math, struct, os

# ---------- geometria basica (posiciones, normales, indices) ----------
class Geo:
    def __init__(s): s.p, s.n, s.i = [], [], []
    def quad(s, a, b, c, d, n):
        o = len(s.p); s.p += [a, b, c, d]; s.n += [n] * 4; s.i += [o, o+1, o+2, o, o+2, o+3]
    def merge(s, g):
        o = len(s.p); s.p += g.p; s.n += g.n; s.i += [k + o for k in g.i]

def box(sx, sy, sz):
    x, y, z = sx/2, sy/2, sz/2; g = Geo()
    g.quad((-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z),(0,0,1));   g.quad((x,-y,-z),(-x,-y,-z),(-x,y,-z),(x,y,-z),(0,0,-1))
    g.quad((x,-y,z),(x,-y,-z),(x,y,-z),(x,y,z),(1,0,0));   g.quad((-x,-y,-z),(-x,-y,z),(-x,y,z),(-x,y,-z),(-1,0,0))
    g.quad((-x,y,z),(x,y,z),(x,y,-z),(-x,y,-z),(0,1,0));   g.quad((-x,-y,-z),(x,-y,-z),(x,-y,z),(-x,-y,z),(0,-1,0))
    return g

def cyl(rt, rb, h, seg=16):           # eje Y, centrado; rt=0 -> cono
    g = Geo(); sl = math.atan2(rb - rt, h)
    for k in range(seg):
        a0, a1 = 2*math.pi*k/seg, 2*math.pi*(k+1)/seg
        def v(a, r, y): return (r*math.cos(a), y, r*math.sin(a))
        def nv(a): return (math.cos(a)*math.cos(sl), math.sin(sl), math.sin(a)*math.cos(sl))
        o = len(g.p)
        g.p += [v(a0, rb, -h/2), v(a1, rb, -h/2), v(a1, rt, h/2), v(a0, rt, h/2)]
        g.n += [nv(a0), nv(a1), nv(a1), nv(a0)]; g.i += [o, o+2, o+1, o, o+3, o+2]
        for (r, y, ny) in ((rt, h/2, 1), (rb, -h/2, -1)):
            if r <= 0: continue
            o = len(g.p); g.p += [(0, y, 0), v(a0, r, y), v(a1, r, y)]; g.n += [(0, ny, 0)] * 3
            g.i += [o, o+2, o+1] if ny > 0 else [o, o+1, o+2]
    return g

def sphere(r, la=10, lo=14):
    g = Geo()
    for i in range(la + 1):
        t = math.pi * i / la
        for j in range(lo + 1):
            f = 2 * math.pi * j / lo; n = (math.sin(t)*math.cos(f), math.cos(t), math.sin(t)*math.sin(f))
            g.p.append((n[0]*r, n[1]*r, n[2]*r)); g.n.append(n)
    for i in range(la):
        for j in range(lo):
            a = i*(lo+1)+j; b = a+lo+1; g.i += [a, a+1, b, a+1, b+1, b]
    return g

def place(g, t=(0,0,0), rx=0.0, ry=0.0, rz=0.0, s=(1,1,1)):
    def rot(v):
        x, y, z = v[0]*s[0], v[1]*s[1], v[2]*s[2]
        y, z = y*math.cos(rx) - z*math.sin(rx), y*math.sin(rx) + z*math.cos(rx)
        x, z = x*math.cos(ry) + z*math.sin(ry), -x*math.sin(ry) + z*math.cos(ry)
        x, y = x*math.cos(rz) - y*math.sin(rz), x*math.sin(rz) + y*math.cos(rz)
        return (x, y, z)
    def rotn(v):
        r = rot((v[0]/s[0] if s[0] else 0, v[1]/s[1] if s[1] else 0, v[2]/s[2] if s[2] else 0)); l = math.sqrt(sum(c*c for c in r)) or 1
        return (r[0]/l, r[1]/l, r[2]/l)
    out = Geo(); out.p = [tuple(c + t[k] for k, c in enumerate(rot(v))) for v in g.p]; out.n = [rotn(v) for v in g.n]; out.i = list(g.i)
    return out

# ---------- escritor GLB ----------
def mat(name, rgb, metal=0.0, rough=0.7, emissive=None):
    m = {"name": name, "pbrMetallicRoughness": {"baseColorFactor": [rgb[0], rgb[1], rgb[2], 1.0], "metallicFactor": metal, "roughnessFactor": rough}}
    if emissive: m["emissiveFactor"] = list(emissive)
    return m

def node(name, t=(0,0,0), parts=None, children=None):
    return {"name": name, "t": t, "parts": parts or [], "children": children or []}

def write_glb(path, materials, root):
    bin_, views, accs, meshes, nodes = bytearray(), [], [], [], []
    def pad4():
        while len(bin_) % 4: bin_.append(0)
    def add_view(data, target):
        pad4(); views.append({"buffer": 0, "byteOffset": len(bin_), "byteLength": len(data), "target": target}); bin_.extend(data); return len(views) - 1
    def emit(nd):
        idx = len(nodes); entry = {"name": nd["name"]}; nodes.append(entry)
        if any(nd["t"]): entry["translation"] = [float(c) for c in nd["t"]]
        if nd["parts"]:
            by = {}
            for g, m in nd["parts"]: by.setdefault(m, Geo()).merge(g)
            prims = []
            for m, g in by.items():
                pos = b"".join(struct.pack("<3f", *v) for v in g.p); nor = b"".join(struct.pack("<3f", *v) for v in g.n)
                big = len(g.p) > 65535; ind = struct.pack("<%d%s" % (len(g.i), "I" if big else "H"), *g.i)
                vp, vn, vi = add_view(pos, 34962), add_view(nor, 34962), add_view(ind, 34963)
                mn = [min(v[k] for v in g.p) for k in range(3)]; mx = [max(v[k] for v in g.p) for k in range(3)]
                accs.append({"bufferView": vp, "componentType": 5126, "count": len(g.p), "type": "VEC3", "min": mn, "max": mx}); ap = len(accs) - 1
                accs.append({"bufferView": vn, "componentType": 5126, "count": len(g.n), "type": "VEC3"}); an = len(accs) - 1
                accs.append({"bufferView": vi, "componentType": 5125 if big else 5123, "count": len(g.i), "type": "SCALAR"}); ai = len(accs) - 1
                prims.append({"attributes": {"POSITION": ap, "NORMAL": an}, "indices": ai, "material": m, "mode": 4})
            meshes.append({"name": nd["name"] + "_malla", "primitives": prims}); entry["mesh"] = len(meshes) - 1
        if nd["children"]: entry["children"] = [emit(c) for c in nd["children"]]
        return idx
    emit(root); pad4()
    gltf = {"asset": {"version": "2.0", "generator": "Operacion Extraccion - generar_modelos_glb.py"}, "scene": 0, "scenes": [{"nodes": [0]}],
            "nodes": nodes, "meshes": meshes, "materials": materials, "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(bin_)}]}
    js = json.dumps(gltf, separators=(",", ":")).encode()
    while len(js) % 4: js += b" "
    total = 12 + 8 + len(js) + 8 + len(bin_)
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total)); f.write(struct.pack("<I4s", len(js), b"JSON")); f.write(js)
        f.write(struct.pack("<I4s", len(bin_), b"BIN\x00")); f.write(bin_)
    print("OK", path, len(nodes), "nodos", sum(len(g["primitives"]) for g in meshes), "primitivas", total, "bytes")

R90 = math.pi / 2   # cilindros (eje Y) -> eje Z: rx = 90 grados

# ---------- PISTOLA ----------
def pistola():
    M = [mat("metal_oscuro", (0.12, 0.12, 0.14), 0.9, 0.35), mat("polimero", (0.06, 0.06, 0.07), 0.1, 0.8),
         mat("acero", (0.55, 0.56, 0.6), 1.0, 0.25), mat("mira_naranja", (1.0, 0.45, 0.05), 0, 0.5, (0.6, 0.2, 0.0))]
    P = [(place(box(0.05, 0.055, 0.26), (0, 0.03, -0.10)), 0), (place(box(0.046, 0.03, 0.2), (0, -0.005, -0.07)), 1),
         (place(cyl(0.011, 0.011, 0.04, 12), (0, 0.03, -0.255), rx=R90), 2),
         (place(box(0.042, 0.125, 0.055), (0, -0.078, 0.02), rx=-0.2), 1), (place(box(0.01, 0.025, 0.06), (0, -0.04, -0.045)), 1),
         (place(box(0.012, 0.014, 0.012), (0, 0.063, -0.2)), 3), (place(box(0.03, 0.012, 0.012), (0, 0.063, 0.02)), 1),
         (place(box(0.052, 0.02, 0.02), (0, 0.03, -0.215)), 2)]
    write_glb("assets/models/pistola.glb", M, node("Pistola", parts=P, children=[node("Boca", (0, 0.03, -0.28))]))

# ---------- ESCOPETA ----------
def escopeta():
    M = [mat("canon", (0.1, 0.1, 0.11), 0.95, 0.3), mat("madera", (0.38, 0.22, 0.1), 0.0, 0.7), mat("receptor", (0.18, 0.18, 0.2), 0.8, 0.4),
         mat("mira", (1.0, 0.8, 0.1), 0, 0.5, (0.5, 0.4, 0.0))]
    P = [(place(cyl(0.02, 0.02, 0.66, 14), (0, 0.0, -0.38), rx=R90), 0), (place(cyl(0.017, 0.017, 0.5, 12), (0, -0.04, -0.31), rx=R90), 2),
         (place(box(0.058, 0.048, 0.17), (0, -0.04, -0.36)), 1), (place(box(0.054, 0.075, 0.22), (0, -0.002, 0.04)), 2),
         (place(box(0.046, 0.09, 0.3), (0, -0.032, 0.3), rx=0.12), 1), (place(box(0.04, 0.1, 0.05), (0, -0.075, 0.1), rx=-0.25), 1),
         (place(box(0.012, 0.014, 0.012), (0, 0.025, -0.7)), 3), (place(box(0.04, 0.03, 0.05), (0, -0.045, 0.01)), 2)]
    write_glb("assets/models/escopeta.glb", M, node("Escopeta", parts=P, children=[node("Boca", (0, 0, -0.72))]))

# ---------- ZOMBI (brazos y piernas son nodos pivote animables desde JS) ----------
def zombi():
    M = [mat("piel_zombi", (0.42, 0.56, 0.35), 0, 0.9), mat("camisa_rota", (0.35, 0.28, 0.22), 0, 0.95), mat("pantalon", (0.17, 0.2, 0.27), 0, 0.95),
         mat("sangre", (0.35, 0.02, 0.02), 0, 0.6), mat("ojos", (1.0, 0.9, 0.3), 0, 0.5, (0.9, 0.8, 0.1)), mat("botas", (0.08, 0.07, 0.07), 0, 0.9),
         mat("pelo", (0.1, 0.08, 0.06), 0, 1.0)]
    cuerpo = [(place(box(0.5, 0.68, 0.27), (0, 1.15, 0)), 1), (place(box(0.52, 0.12, 0.29), (0, 0.84, 0)), 2),
              (place(box(0.2, 0.22, 0.02), (0.08, 1.2, 0.14)), 3), (place(box(0.16, 0.3, 0.02), (-0.14, 0.98, 0.14)), 3),
              (place(box(0.12, 0.16, 0.3), (0.2, 1.35, 0)), 0)]
    cabeza = [(place(sphere(0.17), (0, 0.12, 0), s=(1, 1.1, 1)), 0), (place(box(0.2, 0.06, 0.12), (0, -0.02, 0.07)), 3),
              (place(box(0.04, 0.035, 0.02), (-0.06, 0.15, 0.155)), 4), (place(box(0.04, 0.035, 0.02), (0.06, 0.15, 0.155)), 4),
              (place(box(0.28, 0.07, 0.26), (0, 0.27, -0.02)), 6)]
    brazo = lambda sgn: [(place(box(0.14, 0.34, 0.14), (0, -0.17, 0)), 1), (place(box(0.12, 0.3, 0.12), (0, -0.46, 0)), 0), (place(box(0.13, 0.12, 0.13), (0, -0.67, 0.0)), 0)]
    pierna = lambda: [(place(box(0.18, 0.8, 0.2), (0, -0.4, 0)), 2), (place(box(0.2, 0.1, 0.3), (0, -0.78, 0.05)), 5)]
    raiz = node("Zombi", children=[node("Cuerpo", parts=cuerpo), node("Cabeza", (0, 1.5, 0), cabeza),
        node("BrazoI", (-0.34, 1.43, 0), brazo(-1)), node("BrazoD", (0.34, 1.43, 0), brazo(1)),
        node("PiernaI", (-0.13, 0.82, 0), pierna()), node("PiernaD", (0.13, 0.82, 0), pierna())])
    write_glb("assets/models/zombi.glb", M, raiz)

if __name__ == "__main__":
    os.makedirs("assets/models", exist_ok=True); pistola(); escopeta(); zombi()
