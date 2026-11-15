// RF06: camara en primera persona + movimiento WASD + mouse (Pointer Lock) + colisiones con el escenario
import { CFG } from './config.js';
import { resolveCircle } from './collision.js';

export function createPlayer(camera, colliders, start, dom) {
  const pos = { x: start.x, z: start.z }; let yaw = start.yaw, pitch = 0, bobT = 0;
  const keys = {};
  addEventListener('keydown', (e) => { keys[e.code] = true; });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  addEventListener('mousemove', (e) => {                       // movimiento del mouse -> orientar la camara
    if (document.pointerLockElement !== dom) return;
    yaw -= e.movementX * CFG.player.sensitivity;
    pitch = Math.max(-1.45, Math.min(1.45, pitch - e.movementY * CFG.player.sensitivity));
  });
  const api = { pos, moving: false, get yaw() { return yaw; } };
  api.update = (dt) => {
    const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    let vx = -Math.sin(yaw) * f + Math.cos(yaw) * s, vz = -Math.cos(yaw) * f - Math.sin(yaw) * s;
    const len = Math.hypot(vx, vz); api.moving = len > 0;
    if (len > 0) { pos.x += (vx / len) * CFG.player.speed * dt; pos.z += (vz / len) * CFG.player.speed * dt; bobT += dt * 9; }
    resolveCircle(pos, CFG.player.radius, colliders);
    camera.position.set(pos.x, CFG.player.eye + (api.moving ? Math.sin(bobT) * 0.045 : 0), pos.z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  };
  api.update(0);
  return api;
}
