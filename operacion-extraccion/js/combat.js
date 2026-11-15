// RF01 / RF02 / RF07: un disparo por clic, consumo de municion y deteccion de impactos por RAYCASTING
import * as THREE from 'three';
import { CFG } from './config.js';
import { tryShoot } from './ammo.js';

export function createCombat({ scene, camera, weapons, zombies, level, hud, audio }) {
  const ray = new THREE.Raycaster(); ray.far = CFG.shotRange;
  const centro = new THREE.Vector2(0, 0);
  const sparks = [];
  function spark(point, color) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color, transparent: true }));
    m.position.copy(point); scene.add(m); sparks.push({ m, life: 0.25 });
  }
  return {
    update(dt) { for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; s.m.material.opacity = Math.max(0, s.life / 0.25); s.m.scale.setScalar(1 + (0.25 - s.life) * 6); if (s.life <= 0) { scene.remove(s.m); sparks.splice(i, 1); } } },
    fire(now) {
      if (!weapons.isReady()) return;                                   // no se dispara mientras se cambia de arma
      const w = weapons.current(), r = tryShoot(w, now);                // consume 1 bala o bloquea si hay 0
      if (r === 'sin_municion') { audio.empty(); hud.emptyFlash(); return; }
      if (r !== 'ok') return;
      weapons.onShot(); audio.shot(w.id); hud.updateWeapons(weapons.states, weapons.index);
      camera.updateMatrixWorld(); ray.setFromCamera(centro, camera);
      const zh = ray.intersectObjects(zombies.aliveRoots(), true)[0];   // solo zombis vivos pueden recibir impactos
      const sh = ray.intersectObjects(level.solidMeshes, false)[0];     // las paredes ocluyen el disparo
      if (zh && (!sh || zh.distance < sh.distance)) {
        let o = zh.object; while (o && !o.userData.zombie) o = o.parent;
        if (o) { const res = zombies.hit(o.userData.zombie); if (res.valid) { hud.hitMarker(res.killed); audio.hit(res.killed); spark(zh.point, 0xff3030); } }
      } else if (sh) spark(sh.point, 0xcccccc);
    },
  };
}
