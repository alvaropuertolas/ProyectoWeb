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
