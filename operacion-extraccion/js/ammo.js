// RF02 (logica pura): cada arma tiene su PROPIO contador; no hay recarga libre.
export function createWeaponState(def) {
  return { id: def.id, nombre: def.nombre, ammo: def.ammo, max: def.max, perPickup: def.perPickup, cooldown: def.cooldown, lastShot: -Infinity };
}
// Intenta disparar: consume exactamente 1 bala; si hay 0 balas NO dispara.
export function tryShoot(w, now) {
  if (w.ammo <= 0) return 'sin_municion';
  if (now - w.lastShot < w.cooldown) return 'enfriando';
  w.ammo -= 1; w.lastShot = now;
  return 'ok';
}
// Solo se llama al recoger un objeto de abastecimiento del escenario. Devuelve cuantas balas se sumaron.
export function addAmmo(w, n) {
  const antes = w.ammo; w.ammo = Math.min(w.max, w.ammo + n); return w.ammo - antes;
}
