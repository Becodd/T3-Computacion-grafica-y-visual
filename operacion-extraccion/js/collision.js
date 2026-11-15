// Colision circulo (jugador/zombi) contra cajas alineadas a los ejes en el plano XZ (logica pura).
export function resolveCircle(pos, r, boxes) {
  for (let it = 0; it < 2; it++) {
    for (const b of boxes) {
      const cx = Math.max(b.minX, Math.min(pos.x, b.maxX)), cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
      const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-9) { const d = Math.sqrt(d2); pos.x = cx + (dx / d) * r; pos.z = cz + (dz / d) * r; }
      else {   // el centro quedo dentro de la caja: sacarlo por el lado mas cercano
        const l = pos.x - b.minX, rt = b.maxX - pos.x, t = pos.z - b.minZ, bt = b.maxZ - pos.z, m = Math.min(l, rt, t, bt);
        if (m === l) pos.x = b.minX - r; else if (m === rt) pos.x = b.maxX + r; else if (m === t) pos.z = b.minZ - r; else pos.z = b.maxZ + r;
      }
    }
  }
  return pos;
}
