// RF04 / RF05 / RF07: zombis cargados desde GLB, maquina de estados (idle/active/dead), animacion procedural de nodos
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CFG } from './config.js';
import { createZombie, hitZombie, stepZombie } from './zombieLogic.js';
import { resolveCircle } from './collision.js';
import { zombies as zombieSpawns } from './levelData.js';

export async function createZombies(scene, colliders) {
  const gltf = await new GLTFLoader().loadAsync(CFG.zombies.glb);        // <- carga del modelo .glb
  const list = [];
  for (const sp of zombieSpawns) {
    const root = gltf.scene.clone(true); root.rotation.order = 'YXZ';
    const type = CFG.zombies.types[sp.type], tint = new THREE.Color(...type.tint), mats = [];
    root.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiply(tint); o.userData.e0 = o.material.emissive.clone(); mats.push(o.material); } });
    const state = createZombie(CFG.zombies, sp.type, sp.x, sp.z);
    state.yaw = Math.random() * Math.PI * 2;
    const z = { state, root, mats, phase: Math.random() * 6, flash: 0, fall: 0,
      parts: { bI: root.getObjectByName('BrazoI'), bD: root.getObjectByName('BrazoD'), pI: root.getObjectByName('PiernaI'), pD: root.getObjectByName('PiernaD'), head: root.getObjectByName('Cabeza') } };
    root.userData.zombie = z; root.position.set(sp.x, 0, sp.z); root.rotation.y = state.yaw; scene.add(root); list.push(z);
  }
  const api = {
    list,
    aliveRoots: () => list.filter((z) => z.state.state !== 'dead').map((z) => z.root),
    activeCount: () => list.filter((z) => z.state.state === 'active').length,
    deadCount: () => list.filter((z) => z.state.state === 'dead').length,
    hit(z) { const r = hitZombie(z.state); if (r.valid) z.flash = 0.15; return r; },     // RF07: -1 de resistencia por impacto valido
    update(dt, px, pz) {
      let caught = false;
      for (const z of list) {
        const s = z.state, prev = s.state;
        if (prev === 'dead') {                                                              // cuerpo caido; ya no persigue ni ataca
          z.fall = Math.min(1, z.fall + dt / 0.6); z.root.rotation.x = -Math.PI / 2 * z.fall; z.root.position.y = 0.22 * z.fall;
        } else {
          const r = stepZombie(s, px, pz, dt, CFG.zombies.catchDistance);
          if (r === 'caught') caught = true;
          if (r === 'active') resolveCircle(s, CFG.zombies.radius, colliders);
          z.phase += dt * (r === 'active' ? s.speed * 2.4 : 1.2);
          const a = z.parts, sw = r === 'active' ? 0.7 : 0.05;
          a.pI.rotation.x = Math.sin(z.phase) * sw; a.pD.rotation.x = -Math.sin(z.phase) * sw;
          const armBase = r === 'active' ? -1.45 : -0.15;                                  // activo: brazos al frente
          a.bI.rotation.x = armBase + Math.sin(z.phase * 0.8) * 0.12; a.bD.rotation.x = armBase - Math.sin(z.phase * 0.8) * 0.12;
          a.head.rotation.z = Math.sin(z.phase * 0.5) * 0.15; a.head.rotation.x = r === 'active' ? 0.2 : 0.05;
          z.root.position.set(s.x, Math.abs(Math.sin(z.phase)) * (r === 'active' ? 0.05 : 0), s.z);
          let dy = s.yaw - z.root.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); z.root.rotation.y += dy * Math.min(1, dt * 8);
        }
        if (z.flash > 0) {                                                                  // destello rojo al recibir un impacto
          z.flash -= dt; z.flashing = true;
          for (const m of z.mats) m.emissive.setRGB(0.9, 0.05, 0.05);
        } else if (z.flashing) {
          z.flashing = false; z.root.traverse((o) => { if (o.isMesh) o.material.emissive.copy(o.userData.e0); });
        }
      }
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {   // separacion entre zombis vivos
        const a = list[i].state, b = list[j].state; if (a.state !== 'active' || b.state !== 'active') continue;
        const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
        if (d > 1e-4 && d < 0.9) { const p = (0.9 - d) / 2; a.x -= dx / d * p; a.z -= dz / d * p; b.x += dx / d * p; b.z += dz / d * p; }
      }
      return caught;
    },
  };
  return api;
}
