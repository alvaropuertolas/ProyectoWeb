# Registro de cambios (log)

Cambios relevantes del proyecto, del más reciente al más antiguo.

## Cuándo añadir una entrada
- Cambia el contenido o el comportamiento de la web.
- Se añade, elimina o reorganiza un archivo.
- Se corrige un error.
- Cambia el diseño, la accesibilidad o la compatibilidad.
- Se toma o cambia una decisión técnica.

No hace falta registrar retoques tipográficos ni cambios automáticos. Agrupa los cambios pequeños relacionados en una sola entrada.

## Formato

```markdown
## AAAA-MM-DD — Título breve
- **Cambios:** qué se ha añadido, modificado o corregido.
- **Motivo:** para qué se hizo.
- **Verificación:** cómo se comprobó.
- **Pendientes:** solo si hay.
```

Reglas:
1. La entrada nueva va arriba, justo debajo de estas instrucciones.
2. Fecha en formato ISO (`AAAA-MM-DD`).
3. Incluye `log.md` en el mismo commit que el cambio.
4. No apuntes como completado algo que no se ha verificado.

---

## 2026-11-26 — Sin silla y "?" sin cortar
- **Cambios:** quitada la silla de la sala del veredicto. "¿Y tú, cuántos eliges?" con margen a la derecha para que la cursiva no corte la "?".
- **Motivo:** el usuario ve la silla fuera de lugar y la interrogación cortada.
- **Verificación:** Safari escritorio: sin silla y el texto acaba 7 px dentro de su caja.

## 2026-11-26 — Sala del veredicto oscura y con detalle
- **Cambios:** la sala final pasa a estar a oscuras: un velo negro cubre todo y la única luz es la pantalla, que parpadea; cada línea (dividida en tramos) se ilumina según su distancia a la tele y se apaga hacia el negro. Detalle nuevo: suelo de baldosas, paredes alicatadas con zócalo, puerta cerrada con una raya de luz por debajo, cable de la tele por el suelo, bombilla apagada que se balancea, polvo visible solo en el haz de la pantalla, resplandor sobre la tele y una silla vacía de espaldas con correas en los brazos (el espectador).
- **Motivo:** el usuario ve la sala básica y la quiere oscura, tipo sala de interrogatorio, aprovechando el brillo de la pantalla.
- **Verificación:** Safari escritorio, estado final a 6 s, 60 fps, sin errores en consola. Sin probar en móvil real ni con sonido.

## 2026-11-26 — Veredicto en una sala con TV antigua
- **Cambios:** el veredicto deja de ser una pantalla blanca. Al llegar a "fin" se construye, línea a línea, una sala virtual (suelo en rejilla, paredes, techo) con una TV antigua en 3D en el centro: cuerpo macizo con caras ordenadas por profundidad, antenas en V, botones que giran, rejilla de altavoz y patas. La TV se enciende con la raya típica de tele antigua y la pantalla muestra el 86 % contando, la cuadrícula 10 × 10 y la frase en Kuronuri 100, con líneas de barrido, estática, viñeta y saltos de imagen; su luz tiñe el suelo. Sonido de encendido (chasquido, pitido y estática). La cámara se calma frente a la tele. Las cifras y "¿Y tú, cuántos eliges?" entran al final, abajo. Quitados el número, la línea y la cuadrícula en HTML.
- **Motivo:** el usuario ve el final de sopetón y propone una sala virtual con una TV antigua que muestre el resultado.
- **Verificación:** Safari escritorio: construcción a 1,4 s y estado final a 6 s, sin errores en consola. Sin probar en móvil real ni con sonido.

## 2026-11-26 — Sala más suave, sonido por mundo y veredicto con cuadrícula
- **Cambios:** deriva y giro de la cámara reducidos a la mitad (mareaban). Quitada la nota "reconstruido" de la ficha (2019–2022 siguen siendo estimaciones; queda documentado en el código y en este log). Icono de sonido apagado recentrado (1,75 px). Cada mundo de la sala tiene su sonido (teclas, notas en órbita, tic-tac, scroll, autoplay, túnel, glitch), cada año entra con una nota más grave y el veredicto con un golpe grave tras bajar el pad. El veredicto añade una cuadrícula 10 × 10 que se llena de naranja hasta 86 y la pregunta "¿Y tú, cuántos eliges?". Portada: la tesis "La batalla por mi atención." pasa a ser el titular (`h1`, Kuronuri) y el nombre queda como firma; la entrada sigue formando "alvaropuertolas" con manchas, centrado y dibujado por su cuenta.
- **Motivo:** peticiones del usuario: menos mareo, que parezca real, icono centrado, que el sonido haga algo en la sala y un final menos aburrido; quitar protagonismo al nombre (opción elegida: tesis grande, nombre firma).
- **Verificación:** Safari escritorio: veredicto y cuadrícula (86 casillas), sin errores en consola. Sonido no escuchado (la sesión no tiene audio).

## 2026-11-26 — Un mundo por año y pérdida de control
- **Cambios:** cada año de la sala tiene su propio mundo 3D: 2019 barra de búsqueda que escribe "lo que yo quiera"; 2020 órbita con estelas; 2021 reloj de 24 barras con las horas reales de consumo; 2022 feed de miniaturas en scroll infinito con anuncios que parpadean; 2023 cadena de autoplay con un pulso; 2024 túnel de miniaturas hacia la cámara; 2025 remolino pixelado de 223 vídeos. La cámara pierde control con el % de algoritmo (100 % en 2019 → 15 % en 2025): deriva y se inclina sola; la telemetría muestra "TU CONTROL". Con sonido, el pad se abre y el ruido sube a la par. Datos con un mismo hilo en todos los años: vídeos, búsquedas y vídeos por búsqueda (1,6 → 5,6); fuera los comentarios. Icono de sonido centrado en ambos estados.
- **Motivo:** el usuario ve la sala repetitiva y pide que cada año se sienta distinto y que todos los datos apunten a que el algoritmo controla lo que ve.
- **Verificación:** Safari escritorio, los 7 años y el veredicto; centrado del icono medido (0 px de desvío horizontal). Sin probar en móvil real ni el sonido.

## 2026-11-26 — Kuronuri, veredicto y menos redundancia
- **Cambios:** serif cambiada a Kuronuri (OFL, lihbr; subconjunto latino en `fonts/`, licencia en `fonts/OFL-Kuronuri.txt`). La frase de cada año se pixela más cuanto más manda el algoritmo (niveles 0 → 100) y "me sirve en bandeja" ya sale degradada. Nuevo capítulo final "fin": la pantalla se invierte y responde a la pregunta del home con un 86 % gigante. Texto que se descifra al entrar en pantalla y al pasar por los años del raíl. Quitados duplicados: título del HUD, "capítulo 01 / 07", "[01 / 07]", registros y fuente repetidos; el gancho del home pasa a ser una pregunta ("39.839 vídeos. ¿Cuántos elegí yo?").
- **Motivo:** el usuario pide Kuronuri, menos redundancia y algo que le falta a la web (comparada con la de un compañero): faltaba variedad de mecánicas y un momento de revelación.
- **Verificación:** Safari escritorio: fuentes cargadas, 2025 pixelado, veredicto con 86 %, portada y pregunta. Sin probar en móvil real.

## 2026-11-26 — HUD de telemetría y datos reales por año
- **Cambios:** HUD en mono en las cuatro esquinas del home (reloj, mirada del cursor, estado, registros que se cargan en la entrada, panel actual y regla de progreso). Serif italic (Newsreader, Google Fonts) para la pregunta y el subtítulo; ficha "Muestra Nº 001" bajo el nombre; cifra gancho "≈ 9 / 10" en la pregunta. En la sala, cada año tiene ficha con frase, tres cifras que cuentan hacia arriba y barra algoritmo/voluntad; el aro del año se pinta en naranja según el % de algoritmo y la nube de cada año es más naranja cuanto más manda el algoritmo. Telemetría de profundidad y rumbo.
- **Datos:** Google Takeout de YouTube, agregados (sin títulos ni búsquedas). "Algoritmo" = reproducción sin búsqueda en los 2 min previos: 79 % (2023, jul–dic), 83 % (2024), 86 % (2025). Comentarios por año y anuncios de 2022 son reales. 2019–2022 no tienen historial de reproducciones: vídeos, horas y % se reconstruyen con la tendencia y la ficha lo marca ("≈ reconstruido").
- **Motivo:** pedido del usuario: web menos sosa con referentes onegrain.world y mf.avqor.studio, y datos orientados a cómo el algoritmo controla lo que ve.
- **Verificación:** abierto en Safari (escritorio y 390 px): entrada, HUD, sala, ficha de 2019 y 2025. Sin probar en móvil real.

## 2026-11-24 — Fichas del loop
- **Cambios:** añadida la carpeta `fichas/` con una ficha por scroll (portada, pregunta y play/sala). Cada ficha recoge qué se pidió, qué se obtuvo, cómo se verificó, dónde decido yo y quién verifica.
- **Motivo:** entrega pedida por el profesor.
- **Verificación:** contenido sacado de este log y del historial de git.
- **Pendientes:** el usuario revisa las columnas "Verificación" y "Dónde decido yo".

## 2026-11-24 — Ajustes de diseño tras revisión
- **Cambios:** en `style.css`, los microtextos (pista del play, pista de la sala y años del raíl) pasan a opacidad 0.6 para mejorar el contraste. El foco con teclado del play se marca con un contorno naranja en la pista. Todos los microtextos quedan en 0.7rem con 0.18em de tracking. El kicker pasa a tracking 0 y el nombre de -0.1em a -0.07em. En `index.html`, la pista "click" pasa a "pulsa" y se sube la versión de caché de los archivos.
- **Motivo:** el usuario pidió aplicar las mejoras de la revisión de diseño.
- **Verificación:** diff revisado; sin comprobación visual porque la captura de Safari salió en blanco.
- **Pendientes:** revisar en el navegador el espaciado del nombre y la legibilidad del raíl.

## 2026-11-23 — Móvil a pantalla completa y giroscopio
- **Cambios:** `viewport-fit=cover` y safe areas (`env(safe-area-inset-*)`) en paneles, sala, botón de sonido, raíl y pista inferior; la barra de la sala reserva espacio para el sonido y el estado se reduce en móvil. Eliminado el botón de giroscopio: el permiso se pide al pulsar el play (iOS exige un gesto) y, si se concede, la vista sigue la inclinación; el arrastre táctil sigue funcionando para avanzar y para mirar cuando el giro no está disponible. Icono de sonido cambiado a altavoz con ondas.
- **Motivo:** la cabecera se pisaba con el sonido y el usuario quería el permiso sin botón.
- **Verificación:** el usuario confirma que el giroscopio funciona; se invierte el eje vertical, luego se baja la sensibilidad y se suavizan los extremos. Finalmente el usuario pide invertir ambos ejes manteniendo esa suavidad. También se permite mirar arrastrando el dedo aunque el giroscopio esté activo: el dedo manda durante 1,5 s y después vuelve el giro.
- **Pendientes:** confirmar la sensación final en iPhone.

## 2026-11-23 — Más partículas y micro-movimiento
- **Cambios:** aumentada la densidad de manchas en el home y de partículas en la sala (general y nubes por año). Las manchas del ojo y del play ya no quedan quietas: tienen una oscilación lenta propia; las partículas de la sala también. Segundo aumento de densidad: casi el doble en toda la web y algo más en la sala.
- **Motivo:** petición del usuario: más partículas y el mismo micro-movimiento de la portada en todas las escenas.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador).
- **Pendientes:** comprobar densidad y rendimiento en móvil.

## 2026-11-23 — Partículas al volver atrás
- **Cambios:** el polvo de la sala se recicla en ambos sentidos; al retroceder hacia años anteriores vuelve a rodear la cámara en lugar de quedarse fuera del plano lejano.
- **Motivo:** al volver desde 2025 las partículas desaparecían.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador).
- **Pendientes:** comprobar el recorrido completo de ida y vuelta.

## 2026-11-23 — Sala de datos por años
- **Cambios:** la sala 3D se organiza en capítulos 2019–2025. Cada año muestra una etiqueta grande y tres datos placeholder (horas, vídeos, canales). Raíl lateral de años clicable, año actual en naranja; al dejar de hacer scroll, la cámara se imanta al capítulo más cercano. La rueda y el arrastre recorren el túnel. Ajuste: los años van en contorno, se desvanecen al acercarse y quedan dentro de un aro de paso; cada año tiene su propia nube de partículas.
- **Motivo:** tomar la estructura narrativa del referente cómic (años/capítulos), no su estética.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador).
- **Pendientes:** sustituir los placeholders por los datos reales del export.

## 2026-11-23 — Sala de datos en 3D
- **Cambios:** la pantalla de datos desaparece del scroll; al pulsar el play (tras el warp) se entra en una sala 3D a pantalla completa: túnel de manchas con profundidad, niebla y etiquetas flotantes (horas, canales, categorías…). El ratón gira la cámara, la rueda avanza/retrocede y en móvil se arrastra. Botón "volver" y `Esc` para salir; dentro, el scroll de la web queda bloqueado.
- **Motivo:** petición del usuario: sentir que se mueve literalmente por los datos.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador).
- **Pendientes:** sustituir las etiquetas de ejemplo por datos reales y probar rendimiento en móvil.

## 2026-11-23 — Transición warp y datos solo por clic
- **Cambios:** sustituido el portal por una huida de las manchas: al pulsar el play, las formas que lo componen salen despedidas hacia el espectador, se salta a la pantalla de datos y vuelven a asentarse detrás del título. La pantalla de datos ahora está `hidden` hasta el clic, así que no se puede alcanzar con scroll. El botón "click" sigue debajo del play.
- **Motivo:** el usuario consideró cutre el portal y pidió que las formas llevaran a los datos y que el acceso fuera obligatoriamente por clic.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador).
- **Pendientes:** probar en Safari y móvil.

## 2026-11-23 — Portal al play y pantalla de datos
- **Cambios:** botón invisible sobre el play con la pista "click" debajo. Al pulsarlo, un portal circular naranja cubre la pantalla, se salta a la cuarta sección ("Los datos · en construcción") y se revela. Se ajustaron los tiempos de aparición del ojo y del play a cuatro pantallas.
- **Motivo:** pedido del usuario: una transición llamativa hacia los datos y una pista de clic.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador).
- **Pendientes:** revisar la transición en Safari y en móvil.

## 2026-11-23 — Scroll con imán y guiño
- **Cambios:** scroll vertical con ajuste obligatorio por pantalla (`scroll-snap`). Las manchas cercanas al puntero orbitan además de apartarse. Un clic sobre el ojo lo hace parpadear con un pequeño sonido, si el audio está activado.
- **Motivo:** extras elegidos por el usuario.
- **Verificación:** sin verificación visual ni auditiva (sesión sin permisos de navegador).
- **Pendientes:** probar si el imán resulta demasiado agresivo en trackpad; en tal caso, pasar `mandatory` a `proximity`.

## 2026-11-23 — Ajustes para móvil
- **Cambios:** el canvas ya no se reconstruye cuando solo cambia la altura de la ventana (barra de Safari); menos manchas y resolución limitada a 1.25 en pantallas pequeñas; nombre y kicker reducidos por debajo de 360 px. El canvas se estira con CSS al cambiar la altura, sin reiniciar la animación.
- **Motivo:** evitar reinicios de la animación al hacer scroll en el móvil y mejorar el rendimiento.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador).
- **Pendientes:** revisar en un teléfono real o en el modo responsive de Safari.

## 2026-11-23 — Vuelta al sonido manual
- **Cambios:** eliminados el autoplay, el intento con contexto aparte y los avisos pulsantes. El sonido se activa solo con el botón, como en la versión que funcionaba; se mantienen la mezcla suave (`0.16`) y las campanas en canal propio.
- **Motivo:** pedido del usuario tras no conseguir que sonara al abrir.
- **Verificación:** comprobado por el usuario en Safari: el sonido funciona al pulsar el botón; el fallo era del navegador.
- **Pendientes:** probar en Chrome y borrar `test-audio.html`.

## 2026-11-23 — Arreglo del arranque de audio
- **Cambios:** el botón solo se marca como activo cuando el contexto de audio está realmente en marcha; el primer clic, tecla o toque crea un contexto nuevo dentro del gesto. El icono pulsa mientras está apagado y deja de pulsar al sonar. El intento fallido ya no desarma los reintentos y la rueda deja de contar como gesto de activación.
- **Motivo:** el audio quedaba mudo por la política de autoplay; un intento fallido desactivaba los reintentos y el botón podía parecer encendido sin sonido.
- **Verificación:** sin verificación auditiva (sesión sin permisos de navegador).
- **Pendientes:** comprobar en Safari y Chrome con un clic real.

## 2026-11-23 — Sonido al abrir
- **Cambios:** al cargar se intenta arrancar el audio; si el navegador lo bloquea (política de autoplay), se activa con el primer gesto: clic, tecla, toque o rueda. El botón de sonido refleja el estado y permite silenciar.
- **Motivo:** petición del usuario: que la web se abra con sonido.
- **Verificación:** sin verificación auditiva; el autoplay depende de cada navegador.
- **Pendientes:** comprobar en Safari y Chrome.

## 2026-11-23 — Cursor propio
- **Cambios:** al primer movimiento de ratón se oculta el cursor nativo y se muestra solo el anillo propio, que crece y se tiñe de naranja sobre el botón de sonido. En táctil o sin JS se mantiene el cursor del sistema.
- **Motivo:** petición del usuario: ver únicamente el cursor de la web.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador).
- **Pendientes:** comprobar que el anillo se ve bien en la pantalla de presentación.

## 2026-11-23 — Sonido, kicker más grande y entrada afinada
- **Cambios:** "Algoritmo vs Voluntad" más grande y sin punto. Botón de sonido fijo arriba a la derecha: activa un pad grave generado con Web Audio y campanas al formarse el ojo y el play. La entrada ya termina sola (temporizadores independientes del bucle), forma el nombre en barrido de izquierda a derecha, no tiembla al completarse, el canvas se limita a 1.5x y el grano es una textura estática.
- **Motivo:** petición del usuario y arreglo de la entrada, que se quedaba esperando un clic.
- **Verificación:** sin verificación visual ni auditiva (sesión sin permisos de navegador).
- **Pendientes:** escuchar el volumen del pad y ajustarlo si molesta.

## 2026-11-22 — Entrada, mirada viva, metamorfosis y pulido
- **Cambios:** entrada en la que las manchas forman "alvaropuertolas" y se disuelven (puntos muestreados del `h1` real); el ojo sigue el cursor (pupila, iris y brillo), las manchas se apartan del puntero y el ojo parpadea con scroll rápido o cada pocos segundos. Tercera pantalla en la que el ojo se convierte en un play (triángulo con marco). Pulido: parallax del fondo, grano de película y cursor tipo lente. La entrada se puede saltar con cualquier gesto y todo respeta `prefers-reduced-motion`.
- **Motivo:** pedido del usuario: impresionar y sumar las cuatro mejoras propuestas.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador). Revisar abriendo `index.html`.
- **Pendientes:** comprobar la legibilidad de la entrada y el rendimiento en el equipo real.

## 2026-11-22 — Fondo más poblado y ojo más legible
- **Cambios:** añadidos al canvas una rejilla tenue, cruces pequeñas flotantes, más manchas (hasta 260), contorno de almendra del ojo, iris con marcas, pupila naranja sólida, brillo y un segundo anillo exterior; ojo ampliado y más manchas asignadas al contorno.
- **Motivo:** hacer el ojo más reconocible y el fondo menos vacío.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador). Revisar abriendo `index.html`.
- **Pendientes:** ajustar densidad si el resultado se ve cargado.

## 2026-11-22 — Scroll vertical y fondo enriquecido
- **Cambios:** home pasado a scroll vertical nativo: dos secciones apiladas a pantalla completa (portada y pregunta). Eliminados los microtextos e indicadores (barra superior, capítulo, pista de scroll, barra de progreso y descripción). Fondo ampliado en `script.js`: más manchas, capa de manchas grandes muy tenues, formas solo de contorno y anillo tipo lente que gira al formarse el ojo.
- **Motivo:** pedido del usuario: deslizamiento de arriba a abajo, menos texto y más fondo.
- **Verificación:** sin verificación visual (sesión sin permisos de navegador). Revisar abriendo `index.html`.
- **Pendientes:** ajustar densidad y velocidad al verlo.

## 2026-11-22 — Home de visualización: manchas y scroll horizontal
- **Cambios:** `index.html` reescrito como home de dos pantallas (portada + pregunta) con recorrido horizontal controlado por scroll vertical. `script.js` pasa a ser un motor de canvas: manchas grises irregulares que flotan y se agrupan formando un ojo con pupila naranja. `style.css` reescrito: fondo `#141415`, texto hueso, acento naranja, Helvetica, indicador de capítulo y barra de progreso. Eliminado el botón "Ver mi pregunta": la pregunta ahora es la segunda pantalla.
- **Motivo:** nuevo enfoque de visualización de datos al estilo onegrain.world.
- **Verificación:** sin verificación visual: la sesión no permite abrir el navegador. Revisar abriendo `index.html`.
- **Pendientes:** páginas de datos y ajuste de la animación al verla.

## 2026-11-18 — Rediseño completo y primer slide
- **Cambios:** `index.html` reestructurado como un slide a pantalla completa: "Alvaro Puertolas" como título, "Algoritmo vs. Voluntad" como kicker y "La batalla por mi atención" como subtítulo; se mantienen la descripción, el botón y la pregunta. Barra de reproductor decorativa (0:00 / ∞). `style.css` reescrito: fondo casi negro, Helvetica, acento naranja `#ff5a36`, segunda línea del nombre en contorno y animaciones de autoplay, barra y aparición de la pregunta.
- **Motivo:** el profesor pide un primer slide con el nombre.
- **Verificación:** sin verificación visual: la sesión no permite abrir el navegador. Revisar abriendo `index.html`.
- **Pendientes:** valorar si el resto de slides se añaden después.

## 2026-11-10 — Memoria actualizada
- **Cambios:** `memoria.md` reescrito en castellano y actualizado al estado actual; retoque de una línea en `contexto.md`.
- **Motivo:** dejar los cuatro documentos (contexto, criterio, personalidad y memoria) coherentes para la revisión del profesor.
- **Verificación:** contenido contrastado con `index.html`, `style.css`, `script.js` y `log.md`.

## 2026-11-04 — Fondo oscuro y tipografía Helvetica
- **Cambios:** fondo gris oscuro (`#333333`), texto claro (`#f0f0f0`), tipografía Helvetica y `letter-spacing: -0.02em` en `style.css`. Se mantiene el azul del `h1`.
- **Motivo:** quitar el fondo blanco y concentrar un poco el texto.
- **Verificación:** abierto `index.html` en Safari y revisado el resultado.

## 2026-11-04 — Documentos de contexto
- **Cambios:** añadidos `personalidad.md`, `contexto.md` y `criterio.md`; `context.md` renombrado a `contexto.md`, traducido y actualizado; `log.md` reescrito en castellano con este formato.
- **Motivo:** tener contexto estable entre sesiones: cómo trabajar, qué es el proyecto y con qué criterio decidir.
- **Verificación:** contenido contrastado con `index.html`, `style.css`, `script.js` y el historial de git.
- **Pendientes:** decidir si `memoria.md` se mantiene o se funde en `contexto.md`.

## 2026-11-02 — Revisión inicial y documentación
- **Cambios:** revisados `README.md`, `index.html`, `style.css` y `script.js`; añadidos `memoria.md`, `context.md` y este registro.
- **Motivo:** documentar la estructura inicial y establecer una base para el mantenimiento.
- **Verificación:** leídos los cuatro archivos originales; identificada una página HTML básica con CSS y JavaScript.
- **Pendientes:** definir el contenido definitivo de la página y mejorar el diseño.
