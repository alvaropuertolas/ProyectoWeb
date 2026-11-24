# Ficha — Scroll 2: La pregunta

**Objetivo:** plantear la pregunta de investigación: "¿Consumo lo que *yo decido* buscar o lo que la página de inicio *me sirve en bandeja*?". Mientras tanto, el fondo de manchas forma un ojo que me mira.

**Referencia:** layout propio hecho en Figma, pasado como imagen a la IA.

## Loop

| # | Pedí | Se me dio | Verificación | Decisión |
|---|------|-----------|--------------|----------|
| 1 | Pasar del botón "Ver mi pregunta" a que la pregunta sea una pantalla propia | Home de dos pantallas con recorrido horizontal movido por el scroll | La probé en el navegador | No me convenció el horizontal: pedí scroll de arriba a abajo |
| 2 | Scroll vertical, menos texto y más fondo | Dos pantallas apiladas; se eliminan la barra superior, los capítulos, la pista de scroll y la barra de progreso | La revisé en Safari | Aceptado: la pregunta queda sola |
| 3 | Que el ojo de manchas sea más reconocible | Contorno de almendra, iris, pupila naranja, brillo y anillos | Lo miré en pantalla | Aceptado |
| 4 | Extras: scroll con imán, manchas que orbitan el cursor y guiño al hacer clic en el ojo | `scroll-snap` por pantalla, órbita alrededor del puntero y parpadeo con sonido | Lo probé con el trackpad | Me quedo con el imán fuerte (`mandatory`) |

## Dónde decido yo
- El texto exacto de la pregunta y qué palabras van en naranja.
- Scroll vertical en vez de horizontal.
- Quitar los microtextos: la pregunta tiene que estar sola.
- Que el ojo siga al cursor, porque es la metáfora de que el algoritmo me observa.

## Quién verifica
- **Yo**, en Safari con trackpad: que el imán no sea molesto y que el ojo se reconozca.
- **La IA** revisa el código, pero no ve la animación: la sensación la juzgo yo.
