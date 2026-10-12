# Suguru

Juego de lógica Suguru para iPhone, con 500 niveles en cinco dificultades. Se instala como app en la pantalla de inicio, funciona sin conexión y cambia a modo nocturno junto con el iPhone.

**Jugar:** https://pablocarvallo.github.io/suguru/

## Reglas

1. El tablero está dividido en bloques de 1 a 5 casillas, separados por líneas gruesas.
2. Cada bloque lleva los números del 1 hasta su tamaño, sin repetir. Un bloque de 3 casillas lleva el 1, el 2 y el 3.
3. Dos casillas que se tocan, por un lado o por una esquina, nunca tienen el mismo número.

Todos los niveles tienen una sola solución y se resuelven solo con lógica, sin adivinar.

## Dificultades

| Dificultad   | Tablero | Qué se necesita para resolver                  |
|--------------|---------|------------------------------------------------|
| Principiante | 5×5     | Deducciones directas                           |
| Fácil        | 6×6     | Encontrar el único lugar posible de un número  |
| Medio        | 7×7     | Descartar números por vecindad                 |
| Difícil      | 8×8     | Razonar con grupos de casillas vecinas         |
| Experto      | 9×9     | Cadenas largas de deducciones                  |

Cada dificultad tiene 100 niveles, ordenados del más fácil al más difícil.

## Funciones

- Notas en lápiz, deshacer, borrar y pistas que explican la siguiente deducción.
- El número pequeño de cada tecla indica cuántas veces falta ese número en el tablero.
- Bajo el tablero se ve qué números faltan en el bloque de la casilla elegida.
- Guarda las partidas a medias, los niveles resueltos y el mejor tiempo de cada uno.
- Apariencia automática (sigue el modo claro u oscuro del iPhone), clara u oscura.

## Instalar en el iPhone

1. Abre https://pablocarvallo.github.io/suguru/ en Safari.
2. Toca **Compartir** y luego **Agregar a inicio**.

El juego queda con su icono y se abre a pantalla completa. Después de abrirlo una vez con conexión, también funciona sin internet.

## Archivos

- `index.html`: el juego completo, con los 500 niveles incluidos.
- `manifest.webmanifest` y `icons/`: nombre e icono de la app.
- `sw.js`: guarda el juego para usarlo sin conexión.
- `generador/`: herramientas para crear y verificar niveles.
  - `node generador/bank.js` genera un banco nuevo de niveles (`bank.json`). Tarda unos minutos.
  - `node generador/verify.js` comprueba que cada nivel tenga una sola solución.
  - `node generador/construir.js` arma `index.html` a partir de `plantilla.html` y `bank.json`.
