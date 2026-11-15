# Guion del video (máximo 3:00) – Operación Extracción

Graba la pantalla (OBS Studio, Xbox Game Bar con `Win+G`, o Zoom/Meet compartiendo pantalla) con tu voz.
Mantén abiertos en pantalla: el juego (`http://localhost:8000`) y VS Code con `js/combat.js` y `js/zombieLogic.js`.

| Tiempo | Qué muestras | Qué dices (adáptalo con tus palabras) |
|---|---|---|
| 0:00–0:15 | Pantalla de inicio del juego | "Soy [nombre]. Este es Operación Extracción, un FPS 3D hecho con Three.js: cruzar una ciudad infestada y llegar a la zona de extracción." |
| 0:15–0:55 | **Código** `js/combat.js` (función `fire`) | "Para disparar uso **raycasting**: `Raycaster.setFromCamera` lanza un rayo desde el centro de la cámara. Primero comprueba el arma con `tryShoot` (consume una bala y bloquea si hay cero). Luego intersecta los zombis vivos y las paredes; si la pared está más cerca que el zombi, el disparo se bloquea." |
| 0:55–1:25 | **Código** `js/zombieLogic.js` | "Cada zombi es una máquina de estados: `idle`, `active` y `dead`. `stepZombie` lo mantiene quieto hasta que el jugador entra en su rango de detección. `hitZombie` resta 1 de resistencia por impacto válido y muere exactamente al segundo. Un muerto ya no persigue ni ataca." |
| 1:25–1:45 | Juego: inicio, WASD, mouse, **tecla 1 y 2** | "Movimiento WASD relativo a la cámara, mouse con Pointer Lock. Las armas son modelos .glb hijos de la cámara; con 1 y 2 cambio de arma y cada una tiene su contador." |
| 1:45–2:15 | Juego: disparar con **clics sueltos**, dejar presionado (no hay ráfaga), vaciar el cargador y mostrar "SIN MUNICIÓN" | "Un clic es un disparo. Si mantengo presionado no hay disparo automático. Al llegar a cero no puedo disparar." |
| 2:15–2:35 | Juego: recoger una caja de munición (haz amarillo/rojo), zombi inactivo que se activa al acercarme, matar uno con 2 disparos | "La munición solo se recupera recogiendo cajas en el mapa. Los zombis esperan hasta que entro en su rango; este murió exactamente al segundo impacto." |
| 2:35–2:50 | Juego: ser atrapado → **GAME OVER** (puedes grabarlo antes) | "Si un zombi me toca, aparece GAME OVER y la partida se detiene." |
| 2:50–3:00 | Zona de extracción verde / mensaje **MISIÓN COMPLETADA** (o muéstralo con una toma previa) | "Al entrar a la zona verde, misión completada. El código está en mi GitHub. Gracias." |

Consejos: ensaya una vez, ve rápido por el mapa (el recorrido más corto toma ~1 minuto), y exporta en MP4 de máximo 3:00.
