// Pruebas automaticas de la logica del juego (sin navegador). Uso: node tools/test_logica.mjs
import { CFG } from '../js/config.js';
import { createWeaponState, tryShoot, addAmmo } from '../js/ammo.js';
import { createZombie, hitZombie, stepZombie } from '../js/zombieLogic.js';
import { resolveCircle } from '../js/collision.js';
import { WORLD, START, EXTRACTION, boxes, colliders, zombies, pickups } from '../js/levelData.js';

let fallos = 0;
const ok = (c, msg) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + msg); if (!c) fallos++; };

// --- RF02 municiones ---
const [pis, esc] = CFG.weapons.map(createWeaponState);
ok(pis.ammo !== esc.ammo, `contadores independientes (pistola ${pis.ammo}, escopeta ${esc.ammo})`);
ok(tryShoot(pis, 10) === 'ok' && pis.ammo === 11 && esc.ammo === 4, 'un disparo consume 1 bala solo del arma usada');
ok(tryShoot(pis, 10.05) === 'enfriando' && pis.ammo === 11, 'no hay disparo automatico por cooldown (no consume)');
pis.ammo = 0; ok(tryShoot(pis, 99) === 'sin_municion' && pis.ammo === 0, 'bloqueo al llegar a 0 municiones');
ok(addAmmo(pis, pis.perPickup) === 6 && pis.ammo === 6, 'recoger objeto suma balas');
esc.ammo = esc.max - 1; ok(addAmmo(esc, 3) === 1 && esc.ammo === esc.max, 'no supera el maximo del arma');

// --- RF05 / RF07 zombis ---
const t = CFG.zombies.types.caminante, d = CFG.zombies;
let z = createZombie(d, 'caminante', 0, -100);
for (let i = 0; i < 600; i++) stepZombie(z, 0, 0, 0.016, d.catchDistance);
ok(z.range === 18 && z.state === 'idle' && z.x === 0 && z.z === -100, 'permanece inactivo y quieto fuera del rango de deteccion');
z = createZombie(d, 'caminante', 0, -(t.range - 1));
const r0 = stepZombie(z, 0, 0, 0.016, d.catchDistance);
ok(r0 === 'active' && z.z > -(t.range - 1), 'se activa dentro del rango y avanza hacia el jugador');
for (let i = 0; i < 2000; i++) { if (stepZombie(z, 0, 0, 0.016, d.catchDistance) === 'caught') break; }
ok(Math.hypot(z.x, z.z) <= d.catchDistance + 0.1, 'la persecucion llega hasta el jugador (contacto)');
z = createZombie(d, 'caminante', 0, -10);
ok(hitZombie(z).killed === false && z.hp === 1 && z.state !== 'dead', 'primer impacto: hp 2 -> 1, sigue vivo');
const h2 = hitZombie(z); ok(h2.killed && z.hp === 0 && z.state === 'dead', 'segundo impacto: muere exactamente');
ok(hitZombie(z).valid === false, 'un impacto sobre un muerto no es valido');
const px = z.x, pz = z.z; let ev = stepZombie(z, 0, 0, 1, d.catchDistance);
ok(ev === 'dead' && z.x === px && z.z === pz, 'muerto: no persigue ni ataca');

// --- colisiones ---
const p = { x: 0, z: 0 }; resolveCircle(p, 1, [{ minX: 5, maxX: 6, minZ: 5, maxZ: 6 }]); ok(p.x === 0 && p.z === 0, 'fuera de la caja no se mueve');
const q = { x: 0.2, z: 0 }; resolveCircle(q, 1, [{ minX: -3, maxX: 3, minZ: -3, maxZ: 3 }]);
ok(!(q.x > -3 && q.x < 3 && q.z > -3 && q.z < 3), 'centro dentro de la caja: es expulsado');

// --- nivel (RF03 / RF08 / RF11) ---
const dentro = (x, z, m) => colliders.some((c) => x > c.minX - m && x < c.maxX + m && z > c.minZ - m && z < c.maxZ + m);
ok(zombies.every((e) => !dentro(e.x, e.z, CFG.zombies.radius + 0.2)), `${zombies.length} zombis fuera de edificios/objetos`);
ok(pickups.every((e) => !dentro(e.x, e.z, 1.2)), `${pickups.length} objetos de municion accesibles (fuera de colisionadores)`);
const enRango = zombies.filter((e) => Math.hypot(e.x - START.x, e.z - START.z) <= CFG.zombies.types[e.type].range);
ok(enRango.length === 0, 'ningun zombi se activa en la zona de inicio');
ok(!dentro(START.x, START.z, CFG.player.radius) && !dentro(EXTRACTION.x, EXTRACTION.z, CFG.player.radius), 'inicio y extraccion libres');

// BFS sobre rejilla con el radio del jugador: el nivel debe poder completarse y no ser corto
const cell = 0.5, R = CFG.player.radius, nx = Math.ceil((WORLD.maxX - WORLD.minX) / cell), nz = Math.ceil((WORLD.maxZ - WORLD.minZ) / cell);
const bloq = (x, z) => x < WORLD.minX + R || x > WORLD.maxX - R || z < WORLD.minZ + R || z > WORLD.maxZ - R ||
  colliders.some((c) => { const cx = Math.max(c.minX, Math.min(x, c.maxX)), cz = Math.max(c.minZ, Math.min(z, c.maxZ)); return (x - cx) ** 2 + (z - cz) ** 2 < R * R; });
const key = (i, j) => i * nz + j, dist = new Map(), cola = [];
const si = Math.round((START.x - WORLD.minX) / cell), sj = Math.round((START.z - WORLD.minZ) / cell);
dist.set(key(si, sj), 0); cola.push([si, sj]);
const ei = Math.round((EXTRACTION.x - WORLD.minX) / cell), ej = Math.round((EXTRACTION.z - WORLD.minZ) / cell);
while (cola.length) {
  const [i, j] = cola.shift(); const dd = dist.get(key(i, j));
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz || dist.has(key(ii, jj))) continue;
    if (bloq(WORLD.minX + ii * cell, WORLD.minZ + jj * cell)) continue; dist.set(key(ii, jj), dd + 1); cola.push([ii, jj]);
  }
}
const largo = dist.get(key(ei, ej)) * cell;
ok(largo !== undefined && !Number.isNaN(largo), 'la zona de extraccion es alcanzable desde el inicio');
console.log(`INFO ruta mas corta ~ ${largo} m  (a ${CFG.player.speed} m/s = ${(largo / CFG.player.speed).toFixed(0)} s sin combatir)`);
ok(largo > 250, 'recorrido largo: no se completa de inmediato');
const total = (w) => CFG.weapons.find((x) => x.id === w).ammo + pickups.filter((p) => p.weapon === w).length * CFG.weapons.find((x) => x.id === w).perPickup;
const necesarias = zombies.length * CFG.zombies.hp;
console.log(`INFO municion total disponible: pistola ${total('pistola')}, escopeta ${total('escopeta')} = ${total('pistola') + total('escopeta')} | impactos para matar a todos: ${necesarias}`);
ok(total('pistola') + total('escopeta') < necesarias * 1.6 && total('pistola') + total('escopeta') > necesarias * 0.9, 'dificultad: municion limitada pero suficiente');
console.log(fallos ? `\n${fallos} PRUEBA(S) FALLARON` : '\nTODAS LAS PRUEBAS PASARON');
process.exit(fallos ? 1 : 0);
