// Punto de entrada: carga recursos, ensambla sistemas y ejecuta el bucle de juego con estados
// loading -> menu -> playing <-> paused -> over (Game Over) | win (extraccion)
import * as THREE from 'three';
import { CFG } from './config.js';
import { START, EXTRACTION, colliders } from './levelData.js';
import { buildLevel } from './level.js';
import { createPlayer } from './player.js';
import { createWeapons } from './weapons.js';
import { createZombies } from './zombies.js';
import { createPickups } from './pickups.js';
import { createCombat } from './combat.js';
import { addAmmo } from './ammo.js';
import { createHud } from './hud.js';
import { audio } from './audio.js';

const hud = createHud();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
document.getElementById('game').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.03, 220);
scene.add(camera);                                                 // necesario: las armas son hijas de la camara
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

let state = 'loading', game = null, last = performance.now(), fullMsgAt = 0;

async function init() {
  hud.overlay('CARGANDO…', 'Cargando modelos GLB y texturas', '');
  const loader = new THREE.TextureLoader();
  const level = buildLevel(scene, loader);
  const linterna = new THREE.SpotLight(0xfff2d0, 260, 45, 0.5, 0.6, 1.6);     // linterna del jugador
  camera.add(linterna, linterna.target); linterna.target.position.set(0, 0, -5);
  const player = createPlayer(camera, colliders, START, renderer.domElement);
  const weapons = await createWeapons(camera);
  const zombies = await createZombies(scene, colliders);
  const pickups = createPickups(scene);
  const combat = createCombat({ scene, camera, weapons, zombies, level, hud, audio });
  game = { level, player, weapons, zombies, pickups, combat };
  weapons.onSwitch = () => hud.updateWeapons(weapons.states, weapons.index);
  hud.updateWeapons(weapons.states, weapons.index);
  window.__juego = game;                                                       // depuracion desde la consola
  state = 'menu';
  hud.overlay('OPERACIÓN EXTRACCIÓN', 'El mundo ha sido invadido. Cruza la ciudad infestada, administra tu munición y llega a la zona de extracción (haz verde).',
    'Haz clic para jugar · WASD mover · Mouse apuntar · Clic izq. disparar · 1/2 armas');
}

const lock = () => { audio.init(); renderer.domElement.requestPointerLock(); };
document.getElementById('overlay').addEventListener('click', () => { if (state === 'menu' || state === 'paused') lock(); });
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (locked && (state === 'menu' || state === 'paused')) { state = 'playing'; hud.hideOverlay(); }
  else if (!locked && state === 'playing') { state = 'paused'; hud.overlay('PAUSA', 'Partida en pausa', 'Haz clic para continuar'); }
});
// RF01: SOLO el evento mousedown dispara => un clic = un disparo; mantener presionado no repite
document.addEventListener('mousedown', (e) => { if (e.button === 0 && state === 'playing' && document.pointerLockElement) game.combat.fire(performance.now() / 1000); });
addEventListener('keydown', (e) => {
  if (state === 'playing') { if (e.code === 'Digit1' || e.code === 'Numpad1') game.weapons.select(0); if (e.code === 'Digit2' || e.code === 'Numpad2') game.weapons.select(1); }
  if ((state === 'over' || state === 'win') && e.code === 'KeyR') location.reload();                     // reinicio (mejora voluntaria)
});

function finish(kind) {
  state = kind; document.exitPointerLock();
  if (kind === 'over') { audio.over(); hud.overlay('GAME OVER', 'Un zombi te atrapó.', 'Pulsa R para reiniciar', 'bad'); }
  else { audio.win(); hud.overlay('¡MISIÓN COMPLETADA!', 'Has llegado a la zona de extracción', `Zombis abatidos: ${game.zombies.deadCount()}/${game.zombies.list.length} · Pulsa R para jugar de nuevo`, 'good'); }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (game) {
    game.weapons.update(dt, state === 'playing' && game.player.moving);
    game.combat.update(dt); game.pickups.update(dt);
    if (state === 'playing') {
      game.player.update(dt);
      const { x, z } = game.player.pos;
      if (game.zombies.update(dt, x, z)) { finish('over'); }                          // RF09: contacto => Game Over (se congela todo)
      else {
        for (const ev of game.pickups.collect(x, z, (id, n) => addAmmo(game.weapons.states.find((s) => s.id === id), n))) {
          if (ev.gained > 0) { audio.pickup(); hud.toast(`+${ev.gained} balas de ${ev.weapon}`); hud.updateWeapons(game.weapons.states, game.weapons.index); }
          else if (now - fullMsgAt > 2500) { fullMsgAt = now; hud.toast('Munición llena para esa arma'); }
        }
        const d = Math.hypot(x - EXTRACTION.x, z - EXTRACTION.z);
        hud.setObjective(d, game.zombies.deadCount(), game.zombies.list.length, game.zombies.activeCount());
        if (d <= EXTRACTION.r - 1.2) finish('win');                                    // RF08: zona de extraccion
      }
    }
  }
  renderer.render(scene, camera);
}
init().catch((e) => { console.error(e); hud.overlay('ERROR', 'No se pudo cargar el juego. Abre el proyecto con un servidor local y con internet (ver README).', String(e.message || e), 'bad'); });
requestAnimationFrame(frame);
