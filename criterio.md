# Criterio de trabajo

> Reglas para decidir qué hacer y qué no en este proyecto.

## Prioridad, de mayor a menor
1. Lo que pide el usuario, literalmente.
2. Las reglas de la plantilla: cambios mínimos y trazables.
3. Lo que ya existe en el proyecto (patrones, estilos, estructura).
4. La opción más simple.

## Qué es un buen cambio
- Toca solo las líneas necesarias.
- Se explica en una frase.
- Se puede verificar abriendo la página o leyendo el diff.
- Queda registrado en `log.md`.

## Qué no hacer
- Añadir archivos, dependencias, frameworks o funciones no pedidas.
- Refactorizar, reformatear o "mejorar" código ajeno.
- Cambiar nombres de archivos o la estructura sin pedirlo.
- Dar algo por terminado sin comprobarlo.

## Cómo decidir
- Entre dos opciones, la que introduzca menos código nuevo.
- Si empatan, la que cubra mejor los casos raros.
- Si el error es caro de deshacer (borrar, sobrescribir, publicar), preguntar antes.
- Si falta información, preguntar; no rellenar huecos por imaginación.

## Terminado significa
- El cambio está hecho y probado.
- `log.md` actualizado con fecha y motivo.
- Dicho qué se ha comprobado y qué no.
