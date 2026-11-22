# Memoria del proyecto

> Estado y decisiones del proyecto, para retomarlo sin contexto previo.

## Qué es
Página web de una sola página, con HTML, CSS y JavaScript nativos. Sin frameworks, sin `package.json` y sin proceso de compilación. Proyecto académico de Elisava.

## Tema
"Algoritmo vs. Voluntad: La batalla por mi atención". Un recorrido por el historial de YouTube para ver cuánto tiempo se pierde por el algoritmo, y la pregunta de investigación: "¿Consumo lo que yo decido buscar o lo que la página de inicio me sirve en bandeja?".

## Decisiones
- Mantener la estructura simple de la plantilla: HTML, CSS y JavaScript en archivos separados.
- Home de tres pantallas apiladas (portada, pregunta y cierre con play) con scroll vertical nativo, al estilo onegrain.world.
- Entrada con las manchas formando el nombre; se disuelven y el contenido aparece. Se puede saltar y respeta `prefers-reduced-motion`.
- El ojo sigue el cursor y parpadea; al final se transforma en un play. Fondo con rejilla, capas de manchas, parallax, grano de película y cursor tipo lente.
- Scroll con imán por pantalla; las manchas orbitan el puntero y un clic sobre el ojo lo hace parpadear con sonido.
- Sonido generado con Web Audio (pad grave y campanas): solo se activa con el botón, apagado por defecto. Tras probar el autoplay se descartó porque los navegadores lo bloquean.
- Sin cifras reales todavía; se descartaron los microtextos (barra superior, capítulos, pistas y progreso).
- Paleta: fondo `#141415`, texto hueso y acento naranja `#ff5a36`.

## Estado
- El home está montado y pendiente de revisión visual en navegador.
- Sin tests y sin build: se comprueba abriendo `index.html` en el navegador.

## Pendientes
- Revisar el home en el navegador y ajustar velocidad, densidad y tamaño del ojo.
- Revisar el resultado en un móvil real y el rendimiento.
- Construir las páginas de datos con el export de YouTube.
