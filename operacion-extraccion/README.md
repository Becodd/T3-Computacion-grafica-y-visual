# 🧟 Operación Extracción – Sobrevive al apocalipsis

Videojuego 3D de disparos en primera persona (FPS) hecho con **HTML5 + JavaScript + Three.js (WebGL)**.
Cruza una ciudad abandonada infestada de zombis, administra tu munición y llega a la **zona de extracción**.

## ▶️ Instalación y ejecución

Requisitos: un navegador moderno (Chrome / Edge / Firefox) e internet (Three.js se carga por CDN, versión fija 0.160.0).
El juego **no abre con doble clic**: necesita un servidor local.

1. Clona o descarga el repositorio y abre una terminal en su carpeta.
2. Inicia un servidor, por ejemplo:
   - `python -m http.server 8000` (Windows) / `python3 -m http.server 8000` (Mac/Linux), o
   - `npx serve .`, o VS Code → extensión **Live Server** → *Go Live*.
3. Entra a **http://localhost:8000** y haz clic en la pantalla para jugar.

*Sin internet:* descarga `three.module.js` y la carpeta `examples/jsm` de `three@0.160.0`, guárdalas en `libs/` y cambia las rutas del `importmap` en `index.html`.

## 🎮 Controles

| Control | Acción |
|---|---|
| **W / A / S / D** | Avanzar / izquierda / retroceder / derecha |
| **Mouse** | Orientar la cámara (Pointer Lock) |
| **Clic izquierdo** | **Un** disparo por clic (mantener presionado no dispara en ráfaga) |
| **1 / 2** | Pistola / Escopeta |
| **Esc** | Pausa (clic para continuar) |
| **R** | Reiniciar tras GAME OVER o victoria |

## 🕹️ Cómo se juega
- **Inicio:** zona azul "INICIO" con pistola (12 balas) y escopeta (4 cartuchos).
- **Desarrollo:** 4 muros de contención en **zigzag** te obligan a cruzar todo el mapa (≈ 370 m de ruta mínima). Hay 23 zombis (caminantes lentos y **corredores** rojizos, más rápidos y con mayor rango). Cada zombi resiste **2 impactos**.
- **Munición:** solo se recupera recogiendo **cajas** del escenario (haz amarillo = pistola +6, haz rojo = escopeta +3). No hay recarga libre.
- **Derrota:** si un zombi te toca → **GAME OVER**.
- **Final:** entra al anillo verde (visible desde lejos) → **¡MISIÓN COMPLETADA! Has llegado a la zona de extracción**.

## ✅ Mapa de requerimientos y rúbrica

| Criterio | Dónde está en el código |
|---|---|
| **1. Cámara FPS y movimiento (2.5)** | `js/player.js` (WASD relativo a la cámara, mouse con Pointer Lock, colisiones); el arma es hija de la cámara: `js/weapons.js` (`camera.add(root)`) |
| **2. Modelos y sistema de armas (3)** | `assets/models/pistola.glb`, `escopeta.glb` cargados con `GLTFLoader` en `js/weapons.js`; teclas 1/2 en `js/main.js`; un disparo por clic: solo el evento `mousedown` dispara |
| **3. Municiones (2)** | `js/ammo.js` (contador propio por arma, `tryShoot` bloquea en 0, `addAmmo` solo desde `js/pickups.js`) |
| **4. Zombis (3)** | `assets/models/zombi.glb` (`js/zombies.js`); estados `idle`→`active` por rango (`js/zombieLogic.js`, `stepZombie`); persecución hacia el jugador |
| **5. Disparos y colisiones (3)** | `js/combat.js`: **raycasting** contra zombis vivos y paredes (oclusión); `hitZombie`: -1 por impacto, muere exactamente al 2.º; el muerto sale de la lista de blancos y no persigue ni ataca |
| **6. Escenario y progresión (2.5)** | `js/levelData.js` + `js/level.js`: ciudad con edificios, autos, barreras; inicio, campos infestados y extracción con anillo/haz verde; mensaje de victoria en `js/main.js` |
| **7. Jugabilidad (2)** | Game Over y congelamiento de la partida (`finish('over')`); cajas de munición (coleccionable); dificultad por munición limitada, corredores y zigzag |
| **8. Código y sustentación (2)** | Este repositorio + README + `docs/GUION_VIDEO.md` |

Parámetros ajustables (rangos de detección, municiones, velocidades, hp): `js/config.js`.

## 🧪 Verificación incluida
- `node tools/test_logica.mjs` → prueba municiones, estados del zombi, 2 impactos exactos, colisiones, y que el nivel sea **completable** (búsqueda de ruta con el radio del jugador) y **no corto**.
- `python3 tools/verificar_glb.py` → valida la estructura de los 3 modelos `.glb`.

## 📁 Estructura
```
index.html · css/style.css
js/  main.js  config.js  levelData.js  level.js  player.js  weapons.js  ammo.js
     zombies.js  zombieLogic.js  collision.js  pickups.js  combat.js  hud.js  audio.js
assets/models/   pistola.glb  escopeta.glb  zombi.glb
assets/textures/ asfalto.jpg  concreto.jpg  edificio.jpg
tools/  generar_modelos_glb.py  generar_texturas.py  verificar_glb.py  test_logica.mjs
docs/   GUION_VIDEO.md
```

## 📦 Fuentes y licencias de recursos
- **Modelos .glb, texturas y sonidos: creados por el autor** mediante los scripts de `tools/` y WebAudio (sin recursos de terceros, sin problemas de licencia).
- **Three.js** © mrdoob y colaboradores, licencia MIT (https://threejs.org).
