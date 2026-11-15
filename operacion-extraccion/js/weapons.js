// RF01: dos armas GLB en primera persona (hijas de la camara), cambio con teclas 1/2, animacion de retroceso
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CFG } from './config.js';
import { createWeaponState } from './ammo.js';

export async function createWeapons(camera) {
  const loader = new GLTFLoader(), states = CFG.weapons.map(createWeaponState), views = [];
  for (const def of CFG.weapons) {
    const gltf = await loader.loadAsync(def.glb);              // <- carga del modelo .glb
    const root = gltf.scene; root.scale.setScalar(def.view.scale); root.position.set(...def.view.pos); root.visible = false;
    root.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    const muzzle = root.getObjectByName('Boca') || root;
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd070 })); flash.visible = false; muzzle.add(flash);
    const light = new THREE.PointLight(0xffc070, 0, 8, 2); muzzle.add(light);
    camera.add(root);                                           // el arma acompana a la camara (posicion/rotacion heredadas)
    views.push({ root, base: root.position.clone(), flash, light });
  }
  let index = 0, phase = 'idle', t = 0, target = 0, kick = 0, flashT = 0, bob = 0;
  views[0].root.visible = true;
  const api = {
    states, get index() { return index; }, current: () => states[index], isReady: () => phase === 'idle',
    select(i) { if (i === index || phase !== 'idle' || i < 0 || i >= states.length) return false; target = i; phase = 'down'; t = 0; return true; },
    onShot() { kick = 1; flashT = 0.06; },
    update(dt, moving) {
      if (phase === 'down') { t += dt / 0.16; if (t >= 1) { views[index].root.visible = false; index = target; views[index].root.visible = true; phase = 'up'; t = 0; api.onSwitch?.(index); } }
      else if (phase === 'up') { t += dt / 0.2; if (t >= 1) { phase = 'idle'; t = 1; } }
      const lower = phase === 'down' ? t : phase === 'up' ? 1 - t : 0;
      kick = Math.max(0, kick - dt * 9); if (moving) bob += dt * 9;
      const v = views[index]; v.root.position.set(v.base.x + (moving ? Math.cos(bob * 0.5) * 0.008 : 0), v.base.y - lower * 0.4 + (moving ? Math.sin(bob) * 0.008 : 0), v.base.z + kick * 0.07);
      v.root.rotation.set(-kick * 0.18 - lower * 0.5, 0, 0);
      flashT = Math.max(0, flashT - dt); v.flash.visible = flashT > 0; v.light.intensity = flashT > 0 ? 6 : 0;
    },
  };
  return api;
}
