// RF02 / RF10: objetos de abastecimiento en el escenario. Unica via para recuperar municion.
import * as THREE from 'three';
import { CFG } from './config.js';
import { pickups as defs } from './levelData.js';

const COLORS = { pistola: 0xffc21a, escopeta: 0xff4a3a };

export function createPickups(scene) {
  const list = [];
  for (const d of defs) {
    const g = new THREE.Group(); g.position.set(d.x, 0, d.z);
    const c = COLORS[d.weapon];
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.45), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, roughness: 0.5 }));
    box.position.y = 1.0;
    for (let i = 0; i < 3; i++) {                                   // balas / cartuchos decorativos
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, d.weapon === 'pistola' ? 0.22 : 0.3, 8), new THREE.MeshStandardMaterial({ color: d.weapon === 'pistola' ? 0xb08a2a : 0xaa1a14 }));
      b.position.set(-0.2 + i * 0.2, 1.35, 0); g.add(b);
    }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 9, 12, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    beam.position.y = 4.5;
    g.add(box, beam); scene.add(g);
    list.push({ def: d, group: g, box, taken: false, t: Math.random() * 6 });
  }
  return {
    list,
    remaining: () => list.filter((p) => !p.taken).length,
    update(dt) { for (const p of list) { if (p.taken) continue; p.t += dt; p.box.rotation.y += dt * 1.6; p.box.position.y = 1.0 + Math.sin(p.t * 2) * 0.12; } },
    // Devuelve eventos de recogida. addAmmo(weaponId, n) -> balas realmente sumadas (0 si el arma esta llena => no se consume)
    collect(px, pz, addAmmo) {
      const ev = [];
      for (const p of list) {
        if (p.taken || Math.hypot(p.def.x - px, p.def.z - pz) > CFG.pickupRadius) continue;
        const gained = addAmmo(p.def.weapon, CFG.weapons.find((w) => w.id === p.def.weapon).perPickup);
        if (gained > 0) { p.taken = true; scene.remove(p.group); ev.push({ weapon: p.def.weapon, gained }); }
        else ev.push({ weapon: p.def.weapon, gained: 0 });
      }
      return ev;
    },
  };
}
