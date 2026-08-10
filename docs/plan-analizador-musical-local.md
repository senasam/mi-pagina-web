# Plan completo: analizador musical local integrado en la web

Fecha: 2026-08-09

## Estado de implementacion

Actualizado: 2026-08-09

- Fase 0 completada: contratos, estados, artefactos, limites y modelos permitidos.
- Fase 1 completada: motor independiente, validacion por firma, conversion con
  FFmpeg, proveedor Demucs desacoplado, acordes, exportaciones, progreso,
  cancelacion y worker de un solo uso.
- Fase 2 completada: autenticacion, SSE, modelos HTTP y autorizaciones de destino
  comunes; los endpoints heredados de Instagram conservan compatibilidad.
- Fase 3 MVP completada: fuentes opacas, trabajos en subproceso, cancelacion,
  manifiestos, artefactos, descargas, streaming Range y sesiones temporales.
- Fase 4 MVP completada: ruta React, tarjeta, preparacion, formulario, progreso,
  recuperacion, mezclador, timeline y descargas.
- Fase 5 base completada: catalogo Demucs, descarga explicita, progreso,
  cancelacion, eliminacion y bloqueo de descargas implicitas durante el analisis.
- Fase 6 base completada: agente general 1.2.0, protocolo `felipe-tools://`,
  Audio Engine Pack autocontenido para Windows x64, instalador unificado y
  workflow de GitHub Release. El instalador conserva el protocolo heredado de
  Instagram y no requiere Python en el equipo del usuario.
- Pruebas especificas: 37 Python y 4 JavaScript; la build Vite de produccion,
  el arranque del agente empaquetado y la integridad del pack estan validados.
- Siguiente bloque: prueba de aceptacion en Windows limpio y Fase 7 (Ollama).

El repositorio `music_splitter_chords` citado como fuente no estaba disponible
en el workspace al continuar la implementacion. El motor se implemento con los
contratos definidos en este documento, sin incorporar Gradio.

## 1. Objetivo

Agregar una herramienta en:

```text
/herramientas/analizador-musical
```

que permita:

- seleccionar un audio local;
- separar voz e instrumentos;
- detectar acordes y sincronizarlos con la reproduccion;
- descargar stems, JSON, CSV y ZIP;
- instalar o descargar los componentes locales necesarios;
- gestionar modelos desde la web;
- procesar localmente o mediante una API externa;
- mantener privacidad, autenticacion y control explicito del usuario.

La interfaz se implementara en React utilizando la UX/UI de la web. Gradio se
eliminara de la version integrada. Gurobi no es necesario y actualmente tampoco
forma parte del proyecto musical.

## 2. Decision arquitectonica principal

Se ampliara el agente local existente en vez de ejecutar otra aplicacion Gradio
o levantar un segundo servidor.

```text
Web React/Vite
      |
      v
Felipe Local Tools Agent
http://127.0.0.1:8765
      |
      |-- Instagram Exporter
      |-- Music Analyzer
      |-- Model Manager
      `-- Proveedores remotos opcionales
```

El agente existente ya tiene:

- FastAPI;
- autenticacion mediante token;
- CORS restringido;
- emparejamiento automatico;
- trabajos asincronicos;
- progreso mediante SSE;
- seleccion segura de carpetas;
- instalador de Windows;
- apertura mediante protocolo personalizado.

Se preservara la compatibilidad con Instagram mientras el agente evoluciona
desde "Instagram Exporter Agent" hacia **Felipe Local Tools Agent**.

## 3. Separacion de capacidades y modelos

No se debe utilizar un selector generico de proveedor para todas las funciones.
Cada capacidad requiere motores diferentes.

| Capacidad | Motor local | Proveedor remoto |
| --- | --- | --- |
| Conversion de audio | FFmpeg | No necesario |
| Separacion de pistas | Demucs | API especializada |
| Deteccion de acordes | Librosa/Essentia | API especializada opcional |
| Explicacion musical | Ollama | OpenAI u otra API |
| Recomendaciones musicales | Ollama | OpenAI u otra API |

Ollama sera opcional. No reemplaza a Demucs.

### 3.1 Modelos Demucs iniciales

- `htdemucs`: voz, bateria, bajo y otros.
- `htdemucs_6s`: agrega guitarra y piano.

### 3.2 Funciones futuras con Ollama

- explicar una progresion;
- detectar patrones armonicos;
- generar una hoja de practica;
- resumir la estructura de la cancion;
- sugerir tonalidad o interpretacion musical;
- crear notas sobre cada seccion.

Estas funciones no deben bloquear el funcionamiento principal del analizador.

## 4. Estructura de archivos propuesta

```text
local_tools/
|-- local_agent/
|   |-- agent.py
|   |-- authentication.py
|   |-- events.py
|   |-- models.py
|   |-- destinations.py
|   |-- packaging/
|   `-- tests/
|
|-- instagram_exporter/
|   `-- ...
|
`-- music_analyzer/
    |-- engine/
    |   |-- audio.py
    |   |-- chords.py
    |   |-- chord_formatting.py
    |   |-- separation.py
    |   |-- exports.py
    |   `-- validation.py
    |-- worker.py
    |-- jobs.py
    |-- contracts.py
    |-- model_manager.py
    |-- providers/
    |   |-- base.py
    |   |-- local_demucs.py
    |   `-- remote_audio.py
    |-- requirements-engine.txt
    |-- requirements-dev.txt
    |-- README.md
    `-- tests/

src/
|-- MusicAnalyzerPage.jsx
|-- music-analyzer/
|   |-- MusicSetupPanel.jsx
|   |-- MusicSourceSelector.jsx
|   |-- MusicProcessingForm.jsx
|   |-- MusicJobProgress.jsx
|   |-- MultitrackPlayer.jsx
|   |-- ChordTimeline.jsx
|   |-- MusicResults.jsx
|   |-- ModelManager.jsx
|   |-- musicAnalyzer.css
|   |-- model.js
|   `-- formatters.js
|
`-- platform/
    |-- local-agent/
    |   |-- client.js
    |   |-- events.js
    |   `-- contracts.js
    `-- ai/
        `-- ...

runtime/
`-- music_analyzer/
    |-- jobs/
    |-- outputs/
    |-- cache/
    |-- models/
    `-- logs/
```

El motor musical reutilizara la logica de:

- `music_splitter_chords/src/separator.py`;
- `music_splitter_chords/src/chords.py`;
- `music_splitter_chords/src/audio_utils.py`;
- `music_splitter_chords/src/chord_formatting.py`;
- `music_splitter_chords/src/file_utils.py`.

No se copiara la interfaz Gradio de `app.py`.

## 5. Motor musical

### 5.1 Extraccion de la logica

La funcion actual `process_song()` es demasiado grande y esta ligada a
componentes Gradio. Se dividira en fases independientes:

```text
validate_source()
prepare_audio()
ensure_model()
separate_stems()
detect_mix_chords()
detect_stem_chords()
publish_artifacts()
create_archive()
```

Cada fase:

- recibe datos tipados;
- reporta progreso;
- comprueba cancelacion;
- produce artefactos definidos;
- no conoce React, FastAPI ni Gradio.

### 5.2 Ejecucion aislada

Torch y Demucs no deberian cargarse dentro del proceso principal de FastAPI.
El agente iniciara un worker separado:

```text
FastAPI Agent
    |
    `-- Music Worker subprocess
            |-- Torch
            |-- Demucs
            |-- Librosa
            `-- FFmpeg
```

Ventajas:

- un fallo de Torch no detiene el agente;
- la memoria se libera al finalizar;
- se puede cancelar el proceso;
- el agente continua respondiendo;
- posteriormente se pueden tener workers CPU y GPU diferentes.

Para el MVP habra un trabajo musical activo a la vez.

### 5.3 Salidas

Cada resultado sera un artefacto:

```json
{
  "id": "artifact-vocals",
  "kind": "audio-stem",
  "stem": "vocals",
  "label": "Voz",
  "mimeType": "audio/wav",
  "size": 12455678,
  "downloadable": true,
  "playable": true
}
```

Tipos iniciales:

- audio original;
- WAV convertido;
- voz;
- bateria;
- bajo;
- guitarra;
- piano;
- otros;
- acordes JSON;
- acordes CSV;
- ZIP;
- log tecnico.

## 6. Seleccion segura de archivos

La pagina no enviara rutas locales como:

```text
C:\Users\usuario\Music\cancion.mp3
```

En su lugar:

```text
POST /v1/music/sources/select
```

El agente abre el selector nativo y responde:

```json
{
  "sourceId": "opaque-random-id",
  "name": "cancion.mp3",
  "extension": ".mp3",
  "size": 8451092,
  "duration": 238.4
}
```

La ruta real permanece dentro del agente.

Tambien habra:

```text
POST /v1/music/destinations/select
```

La autorizacion de destino:

- sera opaca;
- correspondera a una seleccion explicita;
- no permitira escapar de la carpeta seleccionada;
- podra ser de un solo uso o estar ligada al trabajo.

Si el usuario no elige destino, la salida se guardara bajo:

```text
runtime/music_analyzer/outputs/<job-id>/
```

## 7. Contrato de trabajos

### 7.1 Solicitud

```json
{
  "sourceId": "source-token",
  "destinationId": "destination-token",
  "tasks": {
    "separateStems": true,
    "detectChords": true,
    "detectStemChords": false,
    "createZip": true
  },
  "separation": {
    "provider": "local-demucs",
    "model": "htdemucs",
    "device": "auto"
  },
  "audio": {
    "convertToWav": true
  }
}
```

### 7.2 Estados

```text
created
queued
validating
preparing_engine
downloading_model
converting
separating
detecting_chords
detecting_stem_chords
exporting
completed
cancelling
cancelled
failed
```

### 7.3 Progreso

Cada evento incluira:

```json
{
  "id": 27,
  "type": "job_progress",
  "jobId": "job-id",
  "state": "separating",
  "percentage": 46,
  "message": "Separando pistas con Demucs",
  "phasePercentage": 58,
  "updatedAt": "2026-08-09T18:30:00Z"
}
```

Los eventos se conservaran temporalmente para permitir reconexion despues de
recargar la pagina.

## 8. API local completa

### 8.1 Agente y capacidades

| Metodo | Endpoint | Proposito |
| --- | --- | --- |
| `GET` | `/health` | Compatibilidad minima heredada |
| `GET` | `/v1/health` | Capacidades completas |
| `POST` | `/pairing` | Emparejamiento |
| `GET` | `/v1/system/resources` | CPU, GPU, RAM y disco |

### 8.2 Fuentes y destinos

| Metodo | Endpoint | Proposito |
| --- | --- | --- |
| `POST` | `/v1/music/sources/select` | Seleccionar audio |
| `POST` | `/v1/music/destinations/select` | Seleccionar salida |
| `DELETE` | `/v1/music/sources/{id}` | Revocar seleccion |

### 8.3 Trabajos

| Metodo | Endpoint | Proposito |
| --- | --- | --- |
| `POST` | `/v1/music/jobs` | Crear trabajo |
| `GET` | `/v1/music/jobs/{id}` | Recuperar estado |
| `GET` | `/v1/music/jobs/{id}/events` | Progreso SSE |
| `POST` | `/v1/music/jobs/{id}/cancel` | Cancelar |
| `DELETE` | `/v1/music/jobs/{id}` | Eliminar trabajo terminado |
| `POST` | `/v1/music/jobs/{id}/open-output` | Abrir carpeta |

### 8.4 Artefactos

| Metodo | Endpoint | Proposito |
| --- | --- | --- |
| `GET` | `/v1/music/jobs/{id}/artifacts` | Listar resultados |
| `POST` | `/v1/music/jobs/{id}/artifacts/{artifactId}/media-session` | Autorizar reproduccion |
| `GET` | `/v1/media/{sessionId}` | Streaming con Range |
| `GET` | `/v1/music/jobs/{id}/artifacts/{artifactId}/download` | Descargar |

### 8.5 Modelos

| Metodo | Endpoint | Proposito |
| --- | --- | --- |
| `GET` | `/v1/models` | Catalogo y estado |
| `POST` | `/v1/models/pulls` | Descargar |
| `GET` | `/v1/models/pulls/{id}` | Estado |
| `GET` | `/v1/models/pulls/{id}/events` | Progreso |
| `POST` | `/v1/models/pulls/{id}/cancel` | Cancelar |
| `DELETE` | `/v1/models/{engine}/{modelId}` | Eliminar con confirmacion |

No se implementara ningun endpoint para ejecutar comandos genericos.

## 9. Reproduccion segura de audio

Los elementos `<audio>` no permiten enviar facilmente el token Bearer en cada
peticion de rango. Por eso el flujo sera:

1. React solicita una sesion de reproduccion autenticada.
2. El agente genera una capacidad temporal.
3. La URL solo permite leer un artefacto.
4. La autorizacion expira rapidamente.
5. No permite listar carpetas ni acceder a otros archivos.

Ejemplo:

```text
/v1/media/random-session-id
```

La sesion estara ligada a:

- artefacto;
- origen permitido;
- vencimiento;
- trabajo;
- modo de solo lectura.

El agente mantendra desactivados los access logs que puedan registrar
identificadores temporales.

## 10. Centro de modelos

### 10.1 Interfaz

El centro de modelos mostrara:

- nombre;
- motor;
- funcion;
- estado;
- tamano de descarga;
- espacio ocupado;
- RAM recomendada;
- CPU/GPU compatible;
- ultima utilizacion;
- actualizacion disponible;
- botones descargar, cancelar y eliminar.

Estados:

```text
not-installed
downloading
installed
loading
in-use
update-available
error
```

### 10.2 Demucs

Se configurara una carpeta controlada:

```text
%LOCALAPPDATA%\FelipeMasanes\LocalTools\models\demucs
```

El worker usara esa ubicacion como cache, evitando depender de carpetas globales
impredecibles.

La descarga sera explicita. Si el usuario intenta procesar sin modelo, la web
mostrara:

```text
Este analisis requiere htdemucs.
Descarga aproximada: ...
Espacio disponible: ...
[Descargar modelo] [Cancelar]
```

Demucs estara detras de un contrato reemplazable porque el repositorio original
se encuentra archivado.

### 10.3 Ollama

Flujo:

1. Detectar `http://127.0.0.1:11434`.
2. Si falta, mostrar "Descargar Ollama".
3. Abrir el instalador oficial.
4. Pedir al usuario confirmar la instalacion en Windows.
5. Volver a comprobar automaticamente.
6. Listar los modelos instalados.
7. Permitir descargas mediante `/api/pull`.
8. Permitir cancelar o eliminar con confirmacion.

El agente se comunicara con Ollama. Esto evita exigir configuraciones CORS como
`OLLAMA_ORIGINS`.

La web no podra instalar Ollama silenciosamente; Windows siempre mantendra la
confirmacion del usuario.

## 11. Paquetes e instalador

Se separaran tres conceptos.

### 11.1 Agente base

Contiene:

- FastAPI;
- autenticacion;
- integracion de Instagram;
- selector de archivos;
- gestor de trabajos;
- gestor de modelos;
- actualizador.

Debe ser relativamente pequeno.

### 11.2 Audio Engine Pack

Contiene:

- Python embebido;
- FFmpeg;
- Torch CPU;
- Torchaudio;
- Demucs;
- Librosa;
- SoundFile;
- worker musical.

Se instalara bajo demanda desde la web.

### 11.3 Modelos

Se descargaran despues:

- `htdemucs`;
- `htdemucs_6s`;
- modelos Ollama opcionales.

Esto evita que el instalador inicial pese varios gigabytes.

Cada paquete debera tener:

- version;
- sistema operativo;
- arquitectura;
- tamano;
- hash SHA-256;
- URL permitida;
- firma o manifiesto firmado;
- requisitos minimos.

## 12. UX/UI de la pagina

### 12.1 Encabezado

```text
Analizador musical
Separa instrumentos, detecta acordes y estudia una cancion sin subirla.
```

Indicador visible:

```text
Procesamiento local
Tu audio permanece en este equipo.
```

Si se usa API:

```text
Procesamiento remoto
El audio se enviara al proveedor seleccionado.
```

### 12.2 Paso 1: preparacion

Tarjeta de estado:

- agente local;
- motor de audio;
- FFmpeg;
- modelo Demucs;
- Ollama opcional;
- espacio disponible.

Cada problema tendra una accion concreta.

### 12.3 Paso 2: audio

- boton "Seleccionar audio";
- nombre;
- duracion;
- formato;
- tamano;
- boton cambiar;
- selector de carpeta de salida.

Formatos iniciales:

```text
WAV, MP3, FLAC, M4A
```

### 12.4 Paso 3: analisis

Opciones:

- separar pistas;
- detectar acordes;
- detectar acordes por pista;
- crear ZIP;
- convertir previamente a WAV.

Modelo:

- cuatro pistas;
- seis pistas.

Ejecucion:

- local, recomendado;
- servicio web, cuando este disponible.

### 12.5 Paso 4: progreso

Mostrar:

- fase;
- progreso global;
- progreso de fase;
- modelo;
- tiempo transcurrido;
- advertencias;
- boton cancelar.

### 12.6 Paso 5: resultados

#### Mezclador

Por pista:

- reproducir;
- volumen;
- mute;
- solo;
- descargar;
- acorde actual opcional.

#### Timeline

- acorde actual grande;
- anterior;
- siguiente;
- segmentos clicables;
- cursor sincronizado;
- confianza y metodo en detalles.

#### Exportaciones

- stems individuales;
- acordes JSON;
- acordes CSV;
- ZIP;
- abrir carpeta;
- nuevo analisis.

## 13. Proveedores remotos

### 13.1 Contrato

```python
class AudioSeparationProvider:
    def capabilities(self): ...
    def estimate(self, source): ...
    def submit(self, source, options): ...
    def status(self, remote_job_id): ...
    def cancel(self, remote_job_id): ...
    def download_results(self, remote_job_id): ...
```

Los proveedores se registraran por capacidad:

```text
audio-separation/local-demucs
audio-separation/remote-provider
music-assistant/ollama
music-assistant/openai
```

### 13.2 Modos de credenciales

#### BYOK local

- clave guardada en Windows Credential Manager;
- agente llama directamente al proveedor;
- clave nunca llega a la web desplegada.

#### Cuenta administrada futura

- usuario autenticado;
- backend guarda credenciales del servicio;
- control de cuotas, costos y facturacion;
- subida mediante almacenamiento firmado.

### 13.3 Consentimiento

Antes de enviar audio se mostrara:

- proveedor;
- datos enviados;
- tamano;
- costo estimado;
- retencion conocida;
- enlace a politica;
- confirmacion explicita.

El MVP no depende de proveedores remotos.

## 14. Seguridad

### 14.1 Agente

- escuchar exclusivamente en `127.0.0.1`;
- origenes exactos, sin comodines;
- token aleatorio de 256 bits;
- comparacion en tiempo constante;
- limites de tamano de cuerpos JSON;
- modelos Pydantic con campos adicionales rechazados;
- access logs desactivados;
- soporte de Private Network Access;
- maximo de trabajos concurrentes;
- rate limits locales.

### 14.2 Archivos

- identificadores opacos;
- nunca aceptar rutas desde la web;
- validar extension y firma real del archivo;
- limites configurables de tamano y duracion;
- impedir traversal;
- escribir unicamente dentro de runtime o destino autorizado;
- no sobrescribir sin confirmacion;
- nombres de archivo sanitizados.

### 14.3 Modelos

- catalogo permitido;
- no aceptar URLs arbitrarias;
- verificar hash;
- impedir nombres que se interpreten como argumentos;
- confirmar eliminacion;
- bloquear eliminacion cuando el modelo este en uso.

### 14.4 APIs externas

- claves fuera del codigo;
- secretos nunca incluidos en eventos o logs;
- advertencia de privacidad;
- timeout;
- cancelacion;
- limite de costo;
- eliminacion de temporales.

## 15. Persistencia y recuperacion

Cada trabajo tendra un manifiesto local:

```text
runtime/music_analyzer/jobs/<job-id>/job.json
```

Contenido:

- ID;
- estado;
- opciones;
- referencias internas;
- progreso;
- artefactos;
- timestamps;
- errores sanitizados.

No contendra:

- claves API;
- tokens del navegador;
- contenido completo del audio;
- rutas expuestas a la web.

Al reiniciar el agente:

- trabajos terminados se recuperan;
- trabajos interrumpidos pasan a `failed` o `cancelled`;
- artefactos existentes siguen disponibles;
- descargas incompletas se limpian o reanudan cuando sea seguro.

## 16. Pruebas

### 16.1 Python unitarias

- validacion de audio;
- sanitizacion de nombres;
- parsing de progreso Demucs;
- deteccion de acordes;
- exportaciones JSON/CSV;
- ZIP;
- calculo de artefactos;
- estados de trabajo;
- cancelacion.

### 16.2 API

- origen permitido y no permitido;
- emparejamiento;
- token correcto e incorrecto;
- cuerpos invalidos;
- rutas inexistentes;
- IDs opacos;
- seleccion de archivos simulada;
- SSE y replay;
- cancelacion;
- streaming Range;
- traversal;
- eliminacion de modelos.

### 16.3 React

- deteccion del agente;
- instalacion requerida;
- formulario;
- validaciones;
- recuperacion de trabajos;
- progreso;
- errores;
- timeline;
- mezclador;
- cambio local/remoto;
- consentimiento de privacidad.

### 16.4 Integracion

- audio WAV corto;
- MP3 convertido;
- trabajo solo de acordes;
- trabajo solo de stems;
- flujo completo;
- modelo ausente;
- FFmpeg ausente;
- disco insuficiente;
- cancelacion durante separacion;
- recarga durante procesamiento.

### 16.5 Instalador

- Windows limpio;
- actualizacion sobre agente de Instagram;
- desinstalacion;
- agente sin Audio Engine Pack;
- instalacion del pack;
- descarga de modelo;
- CPU sin GPU;
- rutas con espacios y caracteres Unicode.

## 17. Observabilidad

Los logs locales usaran:

```text
runtime/music_analyzer/logs/
```

Registrar:

- inicio y final de fase;
- duracion;
- motor y modelo;
- estado de descarga;
- codigo de error;
- uso aproximado de recursos.

No registrar:

- claves;
- token de emparejamiento;
- contenido del audio;
- URLs firmadas;
- rutas completas en mensajes enviados a la web.

La interfaz tendra "Copiar diagnostico" con informacion sanitizada.

## 18. Fases de implementacion

### Fase 0: contratos y alcance

Entregables:

- decisiones de arquitectura;
- contratos de trabajo;
- contratos de artefactos;
- estados;
- catalogo inicial de modelos;
- limites de archivo;
- alcance Windows MVP.

Criterio de salida:

- API y flujo aprobados antes de mover el motor.

### Fase 1: motor musical independiente

Trabajo:

- crear `local_tools/music_analyzer`;
- extraer separacion, acordes, audio y exportacion;
- retirar Gradio;
- dividir `process_song`;
- implementar callback de progreso y cancelacion;
- escribir pruebas.

Criterio de salida:

- el motor procesa un audio desde pruebas o CLI sin interfaz grafica.

### Fase 2: plataforma comun del agente

Trabajo:

- extraer autenticacion y SSE del agente de Instagram;
- conservar endpoints heredados;
- introducir `/v1`;
- preparar registro de herramientas;
- crear cliente React comun.

Criterio de salida:

- Instagram funciona igual utilizando la plataforma reorganizada.

### Fase 3: API musical

Trabajo:

- selector nativo;
- destinos;
- trabajos;
- subprocess worker;
- eventos;
- cancelacion;
- artefactos;
- reproduccion Range;
- apertura de carpeta.

Criterio de salida:

- un cliente HTTP puede realizar el flujo musical completo.

### Fase 4: pagina React

Trabajo:

- nueva ruta;
- tarjeta en herramientas;
- preparacion;
- seleccion;
- formulario;
- progreso;
- recuperacion;
- resultados;
- mezclador;
- timeline;
- descargas.

Criterio de salida:

- el usuario realiza todo el analisis sin abrir terminal ni Gradio.

### Fase 5: gestor de Demucs

Trabajo:

- catalogo;
- deteccion de cache;
- descarga explicita;
- progreso;
- cancelacion;
- espacio;
- eliminacion;
- validacion de hash.

Criterio de salida:

- una instalacion sin modelo puede prepararse completamente desde la web.

### Fase 6: empaquetado

Trabajo:

- agente general;
- protocolo `felipe-tools://`;
- actualizacion compatible;
- Audio Engine Pack;
- workflow de GitHub Release;
- URLs estables;
- prueba en Windows limpio.

Criterio de salida:

- un usuario sin Python puede instalar y procesar una cancion.

### Fase 7: Ollama

Trabajo:

- deteccion;
- boton de instalacion;
- reintento automatico;
- catalogo de modelos;
- descarga y progreso;
- eliminacion;
- funciones musicales generativas.

Criterio de salida:

- el usuario puede generar una explicacion musical local sin configurar CORS.

### Fase 8: primer proveedor remoto

Trabajo:

- seleccionar proveedor;
- adaptador;
- credenciales;
- consentimiento;
- estimacion;
- subida;
- polling;
- descarga;
- cancelacion;
- politica de limpieza.

Criterio de salida:

- el mismo formulario puede ejecutar separacion local o remota mostrando
  claramente privacidad y costo.

## 19. Orden recomendado de entregas

### Entrega 1: MVP local

- motor refactorizado;
- agente musical;
- React;
- seleccion segura;
- Demucs;
- acordes;
- progreso;
- resultados;
- descargas.

### Entrega 2: instalacion autoservicio

- agente general;
- Audio Engine Pack;
- centro de modelos;
- instalacion limpia;
- actualizaciones.

### Entrega 3: IA generativa

- Ollama;
- explicacion de progresiones;
- notas y material de practica;
- proveedor OpenAI opcional.

### Entrega 4: procesamiento remoto

- API especializada;
- consentimiento;
- costos;
- almacenamiento y limpieza.

## 20. Criterios finales de aceptacion

La funcionalidad se considerara completa cuando:

- no sea necesario abrir Gradio ni una terminal;
- el usuario pueda instalar el agente desde la web;
- el agente pueda preparar el motor musical;
- el usuario pueda descargar modelos explicitamente;
- un audio local pueda procesarse sin salir del PC;
- la web nunca conozca su ruta real;
- separacion y acordes puedan ejecutarse independientemente;
- el trabajo pueda cancelarse;
- la pagina pueda recargarse sin perder el trabajo;
- los stems puedan reproducirse sincronizados;
- los acordes sigan el tiempo del audio;
- todos los resultados puedan descargarse;
- Instagram siga funcionando;
- no existan endpoints de comandos arbitrarios;
- Ollama sea opcional;
- el modo remoto advierta claramente la transferencia;
- las pruebas cubran seguridad, trabajos, modelos e instalador.

## 21. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Demucs esta archivado | Dependencia futura fragil | Adaptador reemplazable y version fijada |
| Torch aumenta mucho el instalador | Descarga inicial pesada | Audio Engine Pack separado |
| Procesamiento CPU lento | Mala experiencia en canciones largas | Estimacion, progreso, cancelacion y GPU futura |
| Archivos WAV muy grandes | Disco y reproduccion | Espacio previo, limpieza y streaming Range |
| Fallo de Torch/Demucs | Caida del servicio | Worker en subprocess independiente |
| APIs remotas retienen audio | Riesgo de privacidad | Consentimiento y politica visible |
| Modelo descargado sin permiso | Consumo inesperado | Descarga siempre explicita |
| Migracion rompe Instagram | Regresion existente | Endpoints heredados y pruebas de compatibilidad |
| Claves expuestas | Riesgo de seguridad | Windows Credential Manager y secretos fuera de logs |
| Multiples trabajos agotan RAM | Inestabilidad | Una tarea activa en el MVP y cola limitada |

## 22. Archivos principales que cambiaria la implementacion

### Nuevos

- `local_tools/music_analyzer/**`;
- `local_tools/local_agent/**` cuando se extraiga la plataforma comun;
- `src/MusicAnalyzerPage.jsx`;
- `src/music-analyzer/**`;
- `src/platform/local-agent/**`;
- pruebas Python, JavaScript y de integracion;
- documentacion del agente y del instalador.

### Existentes

- `src/App.jsx`, para registrar la ruta;
- `src/contentData.js`, para publicar la tarjeta;
- `package.json`, para scripts de pruebas y empaquetado;
- `local_tools/instagram_exporter/agent.py`, durante la migracion;
- `local_tools/instagram_exporter/packaging/**`, para mantener compatibilidad;
- `README.md` y documentacion de arquitectura.

## 23. Primer bloque de implementacion recomendado

El primer bloque debe cubrir las fases 0 y 1:

1. definir contratos definitivos de opciones, trabajos, eventos y artefactos;
2. crear `local_tools/music_analyzer`;
3. trasladar el motor sin Gradio;
4. ejecutar Demucs mediante una interfaz desacoplada;
5. convertir la deteccion de acordes en un servicio reutilizable;
6. agregar cancelacion y progreso;
7. cubrir el motor con pruebas sin descargar modelos durante los tests.

Completar ese bloque establece una base estable para construir el agente, la UI,
el instalador y Ollama sin tener que reescribir el nucleo posteriormente.
