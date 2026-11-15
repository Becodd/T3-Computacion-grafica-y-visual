// RF03: construye el escenario 3D "ciudad abandonada" a partir de levelData.js (geometria programada + texturas)
import * as THREE from 'three';
import { WORLD, EXTRACTION, START, boxes } from './levelData.js';

function label(text, color, w = 512, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, w, h); g.strokeStyle = color; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = color; g.font = 'bold 56px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildLevel(scene, loader) {
  const solidMeshes = [];                 // para ocluir disparos (raycasting contra paredes)
  const tex = (url, rx, ry) => { const t = loader.load(url); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

  // ambiente nocturno: niebla + luz de luna + relleno
  scene.background = new THREE.Color(0x0b1220); scene.fog = new THREE.Fog(0x0b1220, 12, 90);
  scene.add(new THREE.AmbientLight(0x5a6a8a, 0.9), new THREE.HemisphereLight(0x7f95c0, 0x1a1410, 0.6));
  const moon = new THREE.DirectionalLight(0x8fa6d6, 0.8); moon.position.set(-30, 50, 20); scene.add(moon);

  // suelo
  const cz = (WORLD.minZ + WORLD.maxZ) / 2, L = WORLD.maxZ - WORLD.minZ + 6;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, L), new THREE.MeshStandardMaterial({ map: tex('assets/textures/asfalto.jpg', 17, L / 6), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, cz); scene.add(ground);

  const add = (m, solid = true) => { scene.add(m); if (solid) solidMeshes.push(m); return m; };
  const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
  const std = (c, r = 0.9) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const carColors = [0x7a1f1f, 0x1f3b5c, 0x4d4d4d, 0x6b6b2a, 0x2c4a3a];
  let carN = 0;

  for (const b of boxes) {
    if (b.t === 'auto') {                                       // carroceria + cabina + 4 ruedas
      const g = new THREE.Group(), long = b.d > b.w, col = carColors[carN++ % carColors.length];
      const body = mesh(new THREE.BoxGeometry(b.w, 0.8, b.d), std(col, 0.6)); body.position.y = 0.75;
      const cab = mesh(new THREE.BoxGeometry(long ? b.w * 0.9 : b.w * 0.5, 0.6, long ? b.d * 0.5 : b.d * 0.9), std(0x151a22, 0.3)); cab.position.y = 1.45;
      g.add(body, cab); solidMeshes.push(body, cab);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const w = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 14), std(0x0a0a0a));
        if (long) { w.rotation.z = Math.PI / 2; w.position.set(sx * b.w / 2, 0.35, sz * b.d * 0.32); } else { w.rotation.x = Math.PI / 2; w.position.set(sx * b.w * 0.32, 0.35, sz * b.d / 2); }
        g.add(w);
      }
      g.position.set(b.x, 0, b.z); scene.add(g); continue;
    }
    let mat;
    if (b.t === 'edificio') mat = new THREE.MeshStandardMaterial({ map: tex('assets/textures/edificio.jpg', Math.max(1, Math.round(Math.max(b.w, b.d) / 4)), Math.max(1, Math.round(b.h / 4))), roughness: 1 });
    else if (b.t === 'caja') mat = std(0x6b4a2a, 0.9);
    else if (b.t === 'contenedor') mat = std(0x2f5d4a, 0.7);
    else mat = new THREE.MeshStandardMaterial({ map: tex('assets/textures/concreto.jpg', Math.max(1, Math.round(b.w / 4)), Math.max(1, Math.round(b.h / 4))), roughness: 1, color: b.t === 'barrera' ? 0xd7c9b5 : 0xffffff });
    const m = mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat); m.position.set(b.x, b.h / 2, b.z); add(m);
    if (b.t === 'barrera') { const s = mesh(new THREE.BoxGeometry(b.w, 0.3, b.d + 0.2), std(0xc9a227, 0.6)); s.position.set(b.x, b.h + 0.15, b.z); scene.add(s); }   // franja de advertencia
  }

  // farolas con luz calida
  for (const [x, z] of [[24, -20], [-15, -60], [35, -90], [-35, -125], [30, -165]]) {
    const pole = mesh(new THREE.CylinderGeometry(0.1, 0.14, 5, 8), std(0x2a2a2a)); pole.position.set(x, 2.5, z);
    const head = mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc27a })); head.position.set(x, 5.1, z);
    const pl = new THREE.PointLight(0xffa860, 70, 32, 2); pl.position.set(x, 4.8, z);
    scene.add(pole, head, pl);
  }

  // ---- INICIO (zona azul + cartel) ----
  const sz = mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshBasicMaterial({ color: 0x2a6cff, transparent: true, opacity: 0.3, fog: false }));
  sz.rotation.x = -Math.PI / 2; sz.position.set(START.x, 0.03, START.z - 1); scene.add(sz);
  const sign = mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: label('INICIO · ZONA SEGURA', '#6fa8ff'), transparent: true }));
  sign.position.set(0, 3.6, 11.8); sign.rotation.y = Math.PI; scene.add(sign);
  const sl = new THREE.PointLight(0x4f8cff, 40, 22, 2); sl.position.set(0, 3, 6); scene.add(sl);

  // ---- EXTRACCION (anillo verde + haz de luz visible desde lejos + cartel) ----
  const ex = new THREE.Group(); ex.position.set(EXTRACTION.x, 0, EXTRACTION.z); scene.add(ex);
  const ring = mesh(new THREE.RingGeometry(EXTRACTION.r - 1.2, EXTRACTION.r, 48), new THREE.MeshBasicMaterial({ color: 0x38ff7a, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05;
  const disc = mesh(new THREE.CircleGeometry(EXTRACTION.r - 1.2, 48), new THREE.MeshBasicMaterial({ color: 0x38ff7a, transparent: true, opacity: 0.18, fog: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.04;
  const beam = mesh(new THREE.CylinderGeometry(EXTRACTION.r - 1.5, EXTRACTION.r - 1.5, 60, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x38ff7a, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  beam.position.y = 30;
  const H = mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: label('H', '#38ff7a', 128, 128), transparent: true, opacity: 0.9 })); H.rotation.x = -Math.PI / 2; H.position.y = 0.06;
  ex.add(ring, disc, beam, H);
  const es = mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: label('ZONA DE EXTRACCIÓN', '#38ff7a', 1024, 256), transparent: true, fog: false }));
  es.position.set(0, 5.5, WORLD.minZ + 0.5); scene.add(es);
  const el = new THREE.PointLight(0x38ff7a, 80, 30, 2); el.position.set(EXTRACTION.x, 3, EXTRACTION.z); scene.add(el);

  return { solidMeshes, ringMat: ring.material, beam };
}
