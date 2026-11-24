# Contexto del proyecto

## Qué es
Página web de un proyecto académico de Elisava. Una sola página con HTML, CSS y JavaScript nativos. Sin frameworks, sin `package.json` y sin proceso de compilación.

- **Repositorio:** `alvaropuertolas/ProyectoWeb` (plantilla original: `Paladini-Elisava/Projecte-Inicial`).
- **Rama:** `main`.

## Contenido actual
- **Home:** tres secciones apiladas con scroll vertical nativo y ajuste magnético por pantalla (portada, pregunta y play).
- **Sección 1:** "alvaropuertolas" a gran escala y "Algoritmo vs Voluntad" como kicker naranja.
- **Sección 2:** la pregunta "¿Consumo lo que yo decido buscar o lo que la página de inicio me sirve en bandeja?".
- **Sección 3:** las manchas forman un play, con un botón de pista "click"; no se puede pasar de ahí con scroll.
- **Sala de datos:** al pulsar el play, tras el warp, se entra en una sala 3D a pantalla completa organizada en capítulos por año (2019–2025). Cada año tiene su etiqueta y tres datos placeholder (horas, vídeos, canales); un raíl lateral permite saltar de año y la cámara se imanta al capítulo al parar. El ratón gira la cámara, la rueda o el arrastre avanzan; "volver" y `Esc` salen. En móvil, al pulsar el play se pide permiso de movimiento (iOS exige un gesto); si se acepta, la vista sigue la inclinación, y el arrastre táctil sigue disponible siempre: mientras arrastras, el dedo manda sobre el giroscopio. Está en construcción.
- **Móvil:** `viewport-fit=cover` y safe areas para ocupar toda la pantalla sin que la cabecera, el raíl o la pista queden bajo el notch o la barra de Safari.
- **Entrada:** al cargar, las manchas forman el nombre, se disuelven y aparece el contenido; se puede saltar con cualquier gesto.
- **Animación e interacción:** manchas grises irregulares en canvas, con rejilla, manchas grandes, contornos y cruces; forman un ojo con iris, pupila naranja y anillos. El ojo sigue el cursor y parpadea; las manchas cercanas orbitan el puntero; un clic sobre el ojo provoca un parpadeo con sonido. El fondo tiene parallax y grano de película. El cursor nativo se oculta con ratón y queda solo el anillo propio, que crece sobre el botón de sonido.
- **Sonido:** pad grave y campanas generados con Web Audio; botón arriba a la derecha para activarlo o silenciarlo, apagado por defecto.

## Archivos
- `index.html`: canvas de fondo, cursor, botón de sonido, tres secciones apiladas y la sala de datos.
- `style.css`: estilos. Diseño oscuro: fondo `#141415`, Helvetica, acento naranja `#ff5a36`, tipografía a gran escala, grano, cursor tipo lente, control de sonido y sala de datos.
- `script.js`: motor de canvas (entrada con el nombre, ojo con mirada y parpadeo, play, parallax, sala 3D) y audio generado con Web Audio.
- `README.md`: solo el título del repositorio.
- `personalidad.md`: cómo debe trabajar el asistente.
- `criterio.md`: reglas de decisión.
- `log.md`: registro de cambios.
- `memoria.md`: estado y decisiones del proyecto.
- `fichas/`: una ficha del loop por scroll (qué se pidió, qué se dio, quién decide y quién verifica).

## Estado
- El home está montado (2026-11-22); pendiente la revisión visual en navegador.
- Las páginas de datos están por hacer.
- No hay tests ni build.

## Restricciones
- Es una plantilla del profesor: solo se cambian los textos que se piden. Nada de añadidos no solicitados.
- Los documentos de contexto se actualizan cuando cambia el proyecto.
