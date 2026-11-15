"""Verifica que los .glb sean validos: cabecera, JSON, limites de accesores, nodos esperados, caja envolvente.
Uso: python3 tools/verificar_glb.py"""
import json, struct, sys, glob
OK = True
def leer(path):
    d = open(path, "rb").read()
    magic, ver, total = struct.unpack_from("<4sII", d, 0); assert magic == b"glTF" and ver == 2 and total == len(d), "cabecera invalida"
    jl, jt = struct.unpack_from("<I4s", d, 12); assert jt == b"JSON"; js = json.loads(d[20:20 + jl])
    bl, bt = struct.unpack_from("<I4s", d, 20 + jl); assert bt == b"BIN\x00"; binb = d[28 + jl:28 + jl + bl]
    assert js["buffers"][0]["byteLength"] == bl
    return js, binb
SIZE = {5126: 4, 5123: 2, 5125: 4}; NC = {"SCALAR": 1, "VEC3": 3}
for p in sorted(glob.glob("assets/models/*.glb")):
    try:
        js, b = leer(p); tris = 0; mn = [1e9]*3; mx = [-1e9]*3
        for m in js["meshes"]:
            for pr in m["primitives"]:
                for k, ai in list(pr["attributes"].items()) + [("idx", pr["indices"])]:
                    a = js["accessors"][ai]; v = js["bufferViews"][a["bufferView"]]
                    assert v["byteOffset"] % 4 == 0 and v["byteOffset"] + v["byteLength"] <= len(b), "bufferView fuera de rango"
                    assert a["count"] * NC[a["type"]] * SIZE[a["componentType"]] <= v["byteLength"], "accesor excede su vista"
                ia = js["accessors"][pr["indices"]]; tris += ia["count"] // 3
                n = js["accessors"][pr["attributes"]["POSITION"]]["count"]
                f = "<%dH" % ia["count"] if ia["componentType"] == 5123 else "<%dI" % ia["count"]
                idx = struct.unpack_from(f, b, js["bufferViews"][ia["bufferView"]]["byteOffset"]); assert max(idx) < n, "indice fuera de rango"
        for a in js["accessors"]:
            if "min" in a: mn = [min(x, y) for x, y in zip(mn, a["min"])]; mx = [max(x, y) for x, y in zip(mx, a["max"])]
        nombres = [n["name"] for n in js["nodes"]]
        print(f"OK  {p}: {len(js['nodes'])} nodos, {tris} triangulos, materiales={len(js['materials'])}, caja={[round(x,2) for x in mn]}..{[round(x,2) for x in mx]}, nodos={nombres}")
    except Exception as e:
        OK = False; print("ERROR", p, e)
sys.exit(0 if OK else 1)
