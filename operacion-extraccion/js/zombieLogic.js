// RF05 / RF07 (logica pura, sin Three.js): maquina de estados del zombi y sistema de impactos.
// Estados: 'idle' (inactivo) -> 'active' (persigue) -> 'dead' (muerto).
export function createZombie(cfg, type, x, z) {      // cfg = CFG.zombies
  const t = cfg.types[type];
  return { type, x, z, hp: cfg.hp, speed: t.speed, range: t.range, state: 'idle', yaw: 0 };
}
// Un impacto valido resta 1 de resistencia; muere al llegar a 0 (exactamente al 2.o impacto).
export function hitZombie(z) {
  if (z.state === 'dead') return { valid: false, killed: false };
  z.hp -= 1;
  if (z.hp <= 0) { z.hp = 0; z.state = 'dead'; return { valid: true, killed: true }; }
  return { valid: true, killed: false };
}
// Paso de IA: inactivo hasta que el jugador entra en su rango; luego persigue. Devuelve el estado resultante.
export function stepZombie(z, px, pz, dt, catchDistance) {
  if (z.state === 'dead') return 'dead';
  const dx = px - z.x, dz = pz - z.z, d = Math.hypot(dx, dz);
  if (z.state === 'idle') { if (d <= z.range) z.state = 'active'; else return 'idle'; }
  if (d <= catchDistance) return 'caught';
  const step = Math.min(z.speed * dt, d);
  z.x += (dx / d) * step; z.z += (dz / d) * step; z.yaw = Math.atan2(dx, dz);
  return 'active';
}
