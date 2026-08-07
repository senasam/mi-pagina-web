# Herramientas locales

Este directorio reúne herramientas auxiliares que se ejecutan localmente y que no forman parte de la aplicación web principal.

Cada herramienta futura debe vivir en su propia subcarpeta e incluir:

- su código fuente;
- sus propias dependencias;
- un `README.md` con instrucciones de instalación, configuración y uso.

La estructura debe mantener este patrón:

```text
local_tools/
├── instagram_exporter/
├── otra_herramienta/
├── procesamiento_audio/
└── generador_imagenes/
```

## Archivos de ejecución

El código fuente y los datos generados deben permanecer separados. Las rutas de trabajo deben ser configurables y todos los archivos temporales, sesiones, resultados y logs deben escribirse bajo:

```text
runtime/<nombre_de_herramienta>/
```

Ninguna herramienta debe guardar esos archivos dentro de su subcarpeta en `local_tools/`. El contenido de `runtime/` es local y no se versiona.

## Código compartido y credenciales

`local_tools/` contiene herramientas ejecutables, no módulos compartidos de la interfaz web. El código reutilizable por aplicaciones del navegador vive en `src/platform/`; los adaptadores ejecutados por el servidor viven en `api/`.

Las herramientas deben identificar sus credenciales por herramienta y proveedor. Nunca deben guardar claves API en el código fuente, en `runtime/`, en resultados exportados ni en archivos incluidos en respaldos. Si en el futuro varias herramientas necesitan acceder a un almacén seguro del dispositivo, se añadirá una herramienta independiente como `local_tools/ai_gateway/`, con sus propias dependencias y documentación.
