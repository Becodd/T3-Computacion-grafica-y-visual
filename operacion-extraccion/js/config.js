// Parametros configurables del juego (RF02, RF05, RF11): cantidades de municion, rangos de deteccion, velocidades...
export const CFG = {
  player: { speed: 6, radius: 0.95, eye: 1.7, sensitivity: 0.0022 },
  shotRange: 60,
  weapons: [
    { id: 'pistola',  nombre: 'PISTOLA',  glb: 'assets/models/pistola.glb',  ammo: 12, max: 48, perPickup: 6, cooldown: 0.28,
      view: { pos: [0.2, -0.2, -0.42], scale: 1.5 } },
    { id: 'escopeta', nombre: 'ESCOPETA', glb: 'assets/models/escopeta.glb', ammo: 4,  max: 16, perPickup: 3, cooldown: 0.85,
      view: { pos: [0.22, -0.2, -0.3], scale: 0.75 } },
  ],
  zombies: {
    glb: 'assets/models/zombi.glb',
    hp: 2,                      // RF07: dos puntos de resistencia
    catchDistance: 1.3,         // RF09: contacto => Game Over
    radius: 0.5,
    types: {
      caminante: { speed: 2.2, range: 18, tint: [1, 1, 1] },
      corredor:  { speed: 4.2, range: 24, tint: [1.0, 0.7, 0.7] },   // mas rapido y mas sensible (dificultad)
    },
  },
  pickupRadius: 1.8,
  extractionMessage: '¡MISIÓN COMPLETADA! Has llegado a la zona de extracción',
};
