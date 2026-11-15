// RF03 / RF08 (datos puros): mapa "Ciudad abandonada". 90 x 205 unidades.
// Recorrido en ZIGZAG: cuatro muros de contencion con un unico paso alternado (derecha/izquierda) obligan a cruzar
// todo el mapa. Inicio (z=+6) -> campos infestados -> zona de extraccion (z=-180).
export const WORLD = { minX: -45, maxX: 45, minZ: -192, maxZ: 12 };
export const START = { x: 0, z: 6, yaw: 0 };                 // yaw 0 = mirando hacia -Z
export const EXTRACTION = { x: 0, z: -180, r: 7 };

// [tipo, x, z, ancho, fondo, alto]  (x,z = centro)
const B = (t, x, z, w, d, h) => ({ t, x, z, w, d, h });
export const boxes = [
  // perimetro
  B('muro', -46, -90, 2, 208, 7), B('muro', 46, -90, 2, 208, 7), B('muro', 0, 13, 94, 2, 7), B('muro', 0, -193, 94, 2, 7),
  // muros de contencion (zigzag): A y C dejan paso a la DERECHA, B y D a la IZQUIERDA
  B('barrera', -11.5, -40, 67, 2, 4.5), B('barrera', 11.5, -80, 67, 2, 4.5),
  B('barrera', -11.5, -120, 67, 2, 4.5), B('barrera', 11.5, -160, 67, 2, 4.5),
  // campo 1
  B('edificio', -38, -18, 14, 18, 11), B('edificio', 38, -30, 14, 16, 12), B('auto', -20, -10, 2.2, 4.6, 1.6), B('auto', 14, -22, 4.6, 2.2, 1.6),
  B('caja', -8, -29, 3, 3, 2.5), B('contenedor', 28, -8, 2.4, 4, 1.8),
  // campo 2
  B('edificio', 0, -58, 14, 12, 9), B('auto', 30, -52, 2.2, 4.6, 1.6), B('auto', -10, -70, 4.6, 2.2, 1.6), B('caja', -30, -55, 3, 3, 2.5), B('contenedor', 20, -72, 4, 2.4, 1.8),
  // campo 3
  B('edificio', 0, -100, 16, 12, 10), B('edificio', -30, -108, 12, 10, 8), B('auto', -25, -90, 2.2, 4.6, 1.6), B('auto', 25, -92, 2.2, 4.6, 1.6),
  B('caja', 10, -85, 3, 3, 2.5), B('contenedor', 35, -105, 2.4, 4, 1.8),
  // campo 4
  B('edificio', 0, -140, 16, 12, 10), B('auto', 28, -130, 4.6, 2.2, 1.6), B('auto', -20, -150, 4.6, 2.2, 1.6), B('caja', -35, -135, 3, 3, 2.5), B('contenedor', 20, -152, 4, 2.4, 1.8),
  // zona final
  B('edificio', 36, -178, 16, 20, 12), B('auto', -15, -170, 2.2, 4.6, 1.6), B('caja', 20, -172, 3, 3, 2.5), B('contenedor', 30, -186, 4, 2.4, 1.8),
];
export const colliders = boxes.map((b) => ({ minX: b.x - b.w / 2, maxX: b.x + b.w / 2, minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2 }));

// Zombis: [tipo, x, z]. 23 enemigos repartidos por campos (ninguno cerca del inicio).
const Z = (type, x, z) => ({ type, x, z });
export const zombies = [
  Z('caminante', 5, -20), Z('caminante', -10, -34),
  Z('caminante', 28, -48), Z('caminante', 10, -62), Z('caminante', -18, -52), Z('corredor', -25, -74), Z('caminante', 5, -75),
  Z('caminante', -30, -86), Z('corredor', -10, -92), Z('caminante', 15, -98), Z('caminante', 30, -112), Z('corredor', -18, -116), Z('caminante', 8, -112),
  Z('caminante', 28, -125), Z('corredor', 10, -132), Z('caminante', -10, -128), Z('caminante', -30, -142), Z('corredor', 20, -146), Z('caminante', -5, -152), Z('caminante', 35, -150),
  Z('caminante', -30, -168), Z('corredor', 0, -172), Z('caminante', 15, -182),
];

// Objetos de abastecimiento (RF02 / RF10): 'pistola' o 'escopeta'
const P = (weapon, x, z) => ({ weapon, x, z });
export const pickups = [
  P('pistola', 8, -5), P('escopeta', -12, -24),
  P('pistola', -30, -30), P('escopeta', 22, -45), P('pistola', 30, -62),
  P('escopeta', -34, -84), P('pistola', -5, -86),
  P('pistola', 20, -125), P('escopeta', 30, -118),
  P('escopeta', 10, -156), P('pistola', -10, -165),
];
