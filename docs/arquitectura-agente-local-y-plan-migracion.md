# Arquitectura del Agente Local y plan de migración

Estado: propuesta técnica basada en la inspección del repositorio del 9 de agosto de 2026. No implementa la migración.

## Alcance, evidencia y supuestos

Este documento separa tres clases de afirmaciones:

- **Observado**: existe en el código o configuración actual y se cita mediante ruta, módulo, clase, función o endpoint.
- **Recomendado**: arquitectura objetivo o decisión de migración.
- **Supuesto**: no puede comprobarse en este repositorio y requiere validación externa.

El árbol de trabajo no estaba limpio durante el análisis. En particular, `local_tools/local_agent/`, `local_tools/music_analyzer/`, `src/platform/local-agent/`, la UI musical y sus pruebas son archivos nuevos aún no confirmados; `local_tools/instagram_exporter/agent.py`, el empaquetado y `src/instagramAgentClient.js` también contienen cambios no confirmados. Se analizaron como el estado real más reciente y no se modificaron. Git solo conserva historia anterior del agente de Instagram; no existe en el repositorio una implementación histórica distinta de `music-analyzer` aparte del código nuevo actual. La referencia a una función anterior `process_song()` aparece únicamente en `docs/plan-analizador-musical-local.md`, no en código localizable; por tanto no se atribuyen propiedades a esa implementación ausente.

Validación ejecutada:

- `python -m pytest local_tools/instagram_exporter/tests local_tools/music_analyzer/tests -q`: **38 pruebas pasan**.
- `npm test`: **493 de 494 pruebas pasan**. El único fallo es ajeno a este alcance, en `tests/mortgageIntegration.test.js`, por una expectativa sobre la cantidad de casos hipotecarios.

## 1. Resumen ejecutivo

El repositorio ya ha tomado la dirección correcta en términos funcionales: hay un solo servidor FastAPI en `127.0.0.1:8765`, un transporte web compartido parcial en `src/platform/local-agent/`, seguridad y SSE parcialmente extraídos en `local_tools/local_agent/`, y el analizador musical se ejecuta como worker del mismo binario. No hay actualmente dos daemons en competencia.

La auditoría transversal encontró además una tercera integración local, aunque no un tercer agente: Novel Studio habla directamente con Ollama en `localhost:11434` desde `src/platform/ai/providers/ollama.js`. No cambia que Instagram y música sean los dos primeros casos del Local Agent, pero confirma que detection, CORS, modelos y software local volverán a duplicarse si no existe una plataforma común. Debe tratarse como candidato posterior, no incorporarse al MVP actual.

El problema es que la convergencia está invertida: el ejecutable general sigue teniendo como composition root `local_tools/instagram_exporter/agent.py`. Ese archivo crea el servidor, configura autenticación, monta música, gestiona paths y conserva toda la API de Instagram. El instalador ya se llama **Felipe Local Tools Agent**, pero la arquitectura interna todavía dice “Instagram posee al agente y música se enchufa dentro”. Esa relación debe invertirse.

La recomendación es la **alternativa B**:

1. extraer el composition root y la infraestructura reutilizable de `instagram_exporter/agent.py` a `local_tools/local_agent/`;
2. convertir Instagram en una capability registrada, conservando `InstagramExportEngine` y temporalmente sus endpoints heredados;
3. registrar `music-analyzer` como segunda capability, conservando su worker y Audio Engine Pack;
4. unificar tareas, eventos, grants de archivos, software/dependencias e instalaciones detrás de servicios del Core;
5. exponer en la web un único `AgentClient`, con wrappers tipados de Instagram y música sobre un protocolo genérico de capabilities y tasks.

No conviene reescribir en C#, Go ni otro lenguaje ahora. Python/FastAPI maximiza la reutilización, y ambos casos reales ya dependen profundamente de Python. Si más adelante hace falta un host nativo para actualización, UAC, DPAPI o servicio de Windows, C#/.NET es el candidato preferente para un **bootstrapper/updater pequeño**, no para reescribir los motores ni para bloquear esta migración.

El protocolo recomendado es híbrido:

- en el wire: operaciones genéricas declaradas (`capabilityId`, `operation`, `input`) y recursos comunes (`tasks`, `software`, `files`);
- en la aplicación: métodos tipados (`agent.instagram.exportAccount()`, `agent.music.analyze()`) implementados sobre ese wire.

Así, agregar un tercer software exige un descriptor, handlers y, si corresponde, software/dependencias confiables; no exige otro localhost, pairing, instalador, updater, canal de eventos o cliente web.

## 2. Arquitectura actual

### 2.1 Instagram Exporter

#### Ubicación, lenguaje e inicio

- Vive en `local_tools/instagram_exporter/` y está escrito en Python.
- El motor principal reutilizable es `local_tools/instagram_exporter/instagram_exporter.py`, clase `InstagramExportEngine`, método `run()`.
- La CLI heredada usa `main()`/`main_async()` y `CliInteraction` en ese mismo módulo.
- El agente HTTP se inicia en `local_tools/instagram_exporter/agent.py`, función `main()`, con Uvicorn y `create_app()`.
- Para desarrollo/uso manual, `INICIAR-AGENTE.cmd` invoca `run-agent.ps1`; este crea `.venv-agent`, instala `requirements-agent.txt` y `requirements-organizer.txt`, y ejecuta `agent.py`.
- En el paquete congelado, `agent.py:main()` también despacha `--organize-worker`, `--music-worker` y `--model-worker` dentro del mismo ejecutable PyInstaller.

#### Dependencias

- `requirements.txt`: Playwright.
- `requirements-agent.txt`: incluye `requirements.txt`, FastAPI, Uvicorn y Pydantic.
- `requirements-organizer.txt`: Pillow, OpenCV headless, num2words, pillow-heif y pypdf.
- `requirements-dev.txt`: dependencias de prueba/build, utilizadas por `build-installer.ps1`.
- Chrome se detecta mediante `chrome_available()`; Chromium de Playwright mediante `chromium_available()`.
- Ollama se detecta mediante `ollama_available()` y se usa opcionalmente desde `organizar_multimedia.py`.

#### Comunicación con la Web App

La UI `src/InstagramImporterPage.jsx` importa el shim `src/instagramAgentClient.js`; este ya delega transporte y pairing a `src/platform/local-agent/client.js` y SSE a `src/platform/local-agent/events.js`. La base predeterminada es `http://127.0.0.1:8765`.

No hay WebSocket. El progreso usa **Server-Sent Events sobre `fetch` autenticado**, lo cual permite enviar el header `Authorization` y reanudar desde `last_event_id`.

Endpoints actuales de Instagram, creados en `local_tools/instagram_exporter/agent.py:create_app()`:

| Método | Endpoint | Función actual |
|---|---|---|
| `GET` | `/health` | detección pública y estado de Chrome/Chromium/Ollama |
| `POST` | `/pairing` | devuelve el token persistente a un `Origin` permitido |
| `POST` | `/exports` | `JobManager.create()` |
| `GET` | `/exports/{job_id}` | `JobManager.get().public()` |
| `POST` | `/exports/{job_id}/continue` | libera la espera de login manual |
| `POST` | `/exports/{job_id}/selection` | entrega cantidad de posts |
| `POST` | `/exports/{job_id}/cancel` | `JobManager.cancel()` |
| `GET` | `/exports/{job_id}/events` | SSE con replay y heartbeat |
| `POST` | `/destinations/select` | selector nativo de carpeta y grant opaco |
| `POST` | `/credentials/openai` | guarda una clave local |
| `POST` | `/exports/{job_id}/open-output` | abre únicamente la carpeta del job |

El endpoint nuevo `GET /v1/health` también se crea aquí y mezcla información general con un mapa ad hoc `tools.instagramExporter`/`tools.musicAnalyzer`.

#### Procesos y filesystem

- `InstagramExportEngine.run()` abre un contexto persistente Playwright, espera login/2FA manual, recopila URLs, descarga posts y escribe manifests.
- `JobManager._organize()` ejecuta `organizar_multimedia.py` como subproceso mediante `asyncio.create_subprocess_exec`; no usa shell.
- `organizar_multimedia.py` invoca internamente Ollama, pip solo cuando se pasa explícitamente `--install-dependencies`, y herramientas de análisis multimedia mediante argumentos construidos por el código.
- `AgentPaths.create()` crea `session`, `exports`, `logs` y `agent-config.json`.
- En desarrollo, `project_runtime()` usa `runtime/instagram_exporter`; congelado usa `%LOCALAPPDATA%/FelipeMasanes/InstagramExporter/runtime/instagram_exporter`.
- `DestinationRegistry` en `local_tools/local_agent/destinations.py` entrega grants opacos de un uso, pero acepta cualquier carpeta seleccionada localmente.
- El job público de Instagram expone actualmente `outputFolder` como ruta absoluta desde `Job.public()`; esto debe eliminarse del contrato futuro.

#### Autenticación y seguridad actuales

- `load_or_create_config()` genera un token aleatorio de 32 bytes y lo persiste en texto en `agent-config.json`.
- `install_security_middleware()` en `local_tools/local_agent/authentication.py` valida allowlist exacta de `Origin`, Bearer token con comparación constante, tamaño máximo de body, CORS, Private Network Access y headers `no-store`/`nosniff`.
- El agente escucha explícitamente en `127.0.0.1`, nunca en `0.0.0.0`.
- `/pairing` entrega automáticamente el mismo secreto de larga vida a cualquier script ejecutándose bajo un origin permitido; `InstagramImporterPage` lo guarda en `localStorage` bajo `instagram-agent-pairing-token`.
- No hay vínculo con cuenta web, dispositivo, consentimiento local, expiración, scopes, firma por request, nonce, protección de replay ni rate limiting.
- `POST /credentials/openai` guarda la clave en texto en `openai.key`, no en Windows Credential Manager/DPAPI.

#### Distribución y actualización

- `packaging/agent.spec` construye `FelipeLocalToolsAgent.exe` con PyInstaller e incluye Playwright, los módulos compartidos y música.
- `packaging/installer.iss` instala por usuario en `%LOCALAPPDATA%/Programs/FelipeLocalToolsAgent`, usa `PrivilegesRequired=lowest`, ofrece autostart opcional y registra `felipe-tools://` más el alias heredado `instagram-agent://`.
- `build-installer.ps1` construye y valida el exe; `build-unified-installer.ps1` agrega el Audio Engine Pack.
- `.github/workflows/release-instagram-agent.yml` ya publica “Felipe Local Tools” para tags `local-tools-v*` y heredados `instagram-agent-v*`.
- No existe updater del agente, firma Authenticode, rollback, verificación de publisher ni canal estable/beta implementado.

#### Qué es específico y qué ya es reutilizable

Específico de Instagram:

- `InstagramExportEngine`, `ExportConfig`, `ExportInteraction`, parsing de perfiles, navegación Playwright, scraping, descarga de posts y manifests en `instagram_exporter.py`.
- `ApiInteraction`, `ExportRequest`, `SelectionRequest` y el flujo login/selección de `agent.py`.
- El estado persistente de navegador (`session`) y la exclusión de exportaciones concurrentes por perfil persistente.
- La organización posterior vive hoy junto a Instagram, aunque `organizar_multimedia.py` es conceptualmente más general que Instagram; conviene dejarla inicialmente como operación interna opcional y evaluar luego una capability `media-organizer`, sin separarla en el MVP.

Reutilizable:

- middleware de seguridad, SSE/replay, modelos Pydantic estrictos y grants opacos ya extraídos a `local_tools/local_agent/`;
- loopback FastAPI/Uvicorn, configuración, logging, detección, packaging, protocolo URL e instalador por usuario;
- patrones de task/cancelación/eventos y ejecución de subprocesos, aunque hoy siguen duplicados y deben generalizarse.

### 2.2 Music Analyzer

#### Ubicación, lenguaje e inicio

- Vive en `local_tools/music_analyzer/` y está escrito en Python.
- No abre servidor propio. `local_tools/music_analyzer/api.py:create_music_router()` se monta dentro de `instagram_exporter/agent.py:create_app()`.
- El proceso pesado se inicia con `python -m local_tools.music_analyzer.worker <request.json>` o con el dispatch `--music-worker` del exe congelado.
- La descarga de modelos usa un segundo worker explícito, `model_worker.py`.
- La UI está en `src/MusicAnalyzerPage.jsx` y `src/music-analyzer/`.

#### Dependencias y herramientas

- El proceso HTTP depende de FastAPI/Pydantic, pero no carga Torch, Demucs o Librosa.
- `requirements-engine.txt` fija Demucs 4.0.1 y declara Librosa, NumPy y SoundFile.
- `build-engine-pack.ps1` construye Python 3.10 embebido, site-packages, FFmpeg/FFprobe, el worker y el engine en un ZIP versionado.
- `engine/separation.py:LocalDemucsProvider` invoca Demucs mediante el Python del pack.
- `engine/audio.py:prepare_audio()` invoca FFmpeg.
- `engine/validation.py:_ffprobe_metadata()` invoca FFprobe.
- `engine/chords.py:detect_chords()` importa Librosa/NumPy solo dentro del worker.
- Los modelos permitidos son `htdemucs` y `htdemucs_6s`, definidos tanto en el contrato como en `MODEL_CATALOG`; el valor web no puede convertirse en un argumento Demucs arbitrario.

#### Recepción de archivos y filesystem

- `POST /v1/music/sources/select` abre `choose_audio_file()`, un selector nativo Tk, y registra la ruta en `SourceRegistry`.
- La web recibe solo `sourceId`, nombre, extensión, tamaño y duración; nunca envía una ruta local.
- `validate_source()` comprueba existencia, tamaño máximo (200 MB), extensión allowlisted, firma mágica y duración máxima (20 minutos cuando puede obtenerla).
- `POST /v1/music/destinations/select` entrega un `destinationId` opaco de un uso.
- `MusicJobManager.create()` resuelve IDs a rutas, crea `request.json` interno y un directorio de salida por job.
- `MusicJobManager._apply_worker_event()` verifica que cada artefacto devuelto por el worker sea un archivo dentro de `job.output_dir`.
- `job.json` persiste estado público sin rutas, pero el manager no recarga jobs al reiniciar; la persistencia es parcial.
- `DELETE /v1/music/jobs/{id}` elimina output y manifest de jobs terminales.

#### Procesos, progreso y resultados

- `MusicJobManager._run()` usa `asyncio.create_subprocess_exec`, sin shell, con comando elegido internamente.
- El worker recibe un archivo JSON interno, ejecuta `engine.pipeline.analyze()` y emite JSON Lines: `job_progress`, `job_result` o `job_error`.
- `ProgressReporter` calcula progreso global con pesos de fase y comprueba cancelación.
- Fases reales: validación, conversión, separación, detección de acordes, detección por stems y exportación.
- Resultados: audio original/copia, WAV convertido, stems, acordes JSON/CSV, log y ZIP; `Artifact.to_dict()` no expone paths.
- Descarga autenticada: `GET /v1/music/jobs/{job}/artifacts/{artifact}/download`.
- Reproducción: se crea una `MediaSession` opaca, ligada a origin y con expiración de 300 segundos; `GET /v1/media/{session}` soporta Range sin Bearer porque `<audio>` no permite gestionar bien ese header.
- Progreso web: SSE mediante `streamMusicEvents()` y recuperación con `GET /v1/music/jobs/{id}`.

#### API musical actual

`local_tools/music_analyzer/api.py:create_music_router()` expone:

- fuentes/destinos: `POST /v1/music/sources/select`, `DELETE /v1/music/sources/{id}`, `POST /v1/music/destinations/select`;
- jobs: `POST /v1/music/jobs`, `GET /v1/music/jobs/{id}`, `GET .../events`, `POST .../cancel`, `DELETE .../{id}`;
- artefactos: `GET .../artifacts`, `POST .../media-session`, `GET .../download`, `POST .../open-output`;
- software de motor: `GET /v1/music/engine`, `POST /v1/music/engine/installs` y endpoints de estado/eventos/cancelación;
- modelos: `GET /v1/models`, `POST /v1/models/pulls`, estado/eventos/cancelación y `DELETE /v1/models/{engine}/{model}`.

#### Instalación y seguridad específicas

- `EnginePackManager` acepta solo descriptor local/bundled o HTTPS hacia una allowlist de hosts GitHub, valida SHA-256, impide Zip Slip, exige archivos mínimos y activa versiones mediante `current.json`.
- El hash protege el ZIP frente a corrupción, pero el descriptor que contiene el hash no está firmado. Si un atacante modifica descriptor y ZIP juntos, la verificación no establece publisher.
- La validación mínima del pack comprueba presencia, no hashes por archivo, firma Authenticode ni SBOM.
- `ModelManager` usa un catálogo fijo y `model_store.py` valida manifests internos y limita borrado a archivos declarados dentro del root.
- La descarga real del checkpoint es realizada por Demucs; falta pinning de hashes de modelos y una política explícita de hosts/tamaños en el Core.

#### Qué es específico y qué debe subir al Core

Específico de música:

- contratos de opciones/análisis, validación de audio, conversión, Demucs, acordes, exportaciones y artifacts semánticos;
- catálogo de modelos Demucs y conocimiento del Audio Engine Pack;
- worker JSONL y traducción de progreso de Demucs;
- UI de selección de tareas, modelos, mixer, timeline y resultados.

Común o generalizable:

- `MusicJobManager`, `EngineInstall` y `ModelPull` repiten ciclo de task, eventos, cancelación y estado;
- `SourceRegistry`, `DestinationRegistry`, artefactos, media sessions y borrado seguro son variantes de un servicio de archivos/grants;
- descarga, hash, staging, instalación por versión y puntero actual son un provider `portable-zip` del Installer común;
- catálogo/health/install/update son conceptos de `SoftwareManager`, aunque el descriptor concreto del Audio Engine Pack siga en la capability.

### 2.3 Otras integraciones locales encontradas

La búsqueda completa de localhost, procesos e instaladores encontró un consumidor adicional relevante:

- `src/platform/ai/providers/ollama.js:normalizeOllamaUrl()` permite `localhost`, `127.0.0.1` y `::1` sobre el puerto configurado (por defecto 11434).
- `listOllamaModels()`, `pullOllamaModel()` y `requestOllamaGeneration()` llaman directamente a la API de Ollama desde el navegador.
- `src/novel-studio/NovelStudioApp.jsx:detectOllama()` e `installOllamaModel()` implementan detección, descarga/progreso y errores propios.
- `ollamaOriginCommand()` genera un comando PowerShell que la UI pide copiar manualmente para modificar `OLLAMA_ORIGINS`; el wizard también muestra `ollama pull <modelo>`. El agente no ejecuta esos strings, por lo que no es hoy un endpoint de shell, pero sí es infraestructura local paralela y una experiencia operativa que no debería multiplicarse.
- `local_tools/instagram_exporter/organizar_multimedia.py:installed_ollama_models()` y `ensure_ollama_model()` también detectan y descargan modelos de Ollama, esta vez desde un proceso local.

No se encontraron otros daemons, workers o ejecutores locales propios fuera de Instagram/música. Los endpoints bajo `api/ai/` son backend web y no forman parte del loopback agent.

Recomendación: no desviar los dos primeros PRs para migrar Novel Studio. Registrar Ollama posteriormente como software/dependencia externa y, si hay demanda, crear una capability `ollama-provider` que centralice status/model tasks/generación. Hasta entonces, documentar que la llamada directa es una excepción heredada con su propio threat model; no usarla como patrón para el tercer software.

## 3. Comparación

| Área | Instagram Exporter | Music Analyzer | Conclusión |
|---|---|---|---|
| Comunicación web | endpoints heredados `/exports`; shim sobre transporte común | router `/v1/music`; cliente feature sobre transporte común | unificar discovery, tasks y cliente; mantener wrappers tipados |
| HTTP | FastAPI composition root | router montado en el mismo FastAPI | ya comparten daemon |
| WebSocket | no | no | no introducirlo en MVP |
| Eventos | SSE por job, replay 500, heartbeat | mismo helper SSE por job | extraer un Event Bus/journal único |
| Procesos | Playwright in-process; organizer subprocess | worker, model worker, FFmpeg y Demucs subprocess | Core ProcessRunner + políticas por capability |
| Filesystem | paths de sesión/export; output absoluto expuesto | source/destination IDs y artifacts opacos | adoptar modelo musical de grants/artifacts |
| Python | agente, motor y organizer | agente, worker y motor | conservar Python |
| FFmpeg | OpenCV para video; no FFmpeg central en export | FFmpeg/FFprobe empaquetados | dependencia/software de música por ahora |
| Instalación | PyInstaller + Inno; script venv de desarrollo | ZIP versionado instalado desde web | separar Agent Installer de Software Installer |
| Actualizaciones | no implementadas | versiones de pack, sin update automático | diseñar canales firmados separados |
| Logs | `agent.log`, outputs/manifests; job solo memoria | `analysis.log`, `job.json`; sin restore | auditoría común con redacción y retención |
| Errores | string y eventos `error` | `{code,message}` estable | adoptar error envelope tipado |
| Tasks | `Job`/`JobManager` propio | `MusicJob`, `EngineInstall`, `ModelPull` propios | duplicación principal; TaskManager común |
| Seguridad | origin, Bearer, body limit, grants de destino | reutiliza middleware; añade source IDs y media sessions | buena base, pairing insuficiente |
| Autenticación | token global persistente, auto-pair | mismo token, otra key de localStorage | una identidad de dispositivo y sesiones scoped |
| Concurrencia | una exportación activa | un análisis activo; installs/pulls separados | scheduler común con resource locks |

La duplicación actual o inminente se concentra en modelos de job, colas/subscribers, almacenamiento de eventos, cancelación, timestamps, recuperación, selección de archivos/carpetas, subprocess lifecycle, instalación, health, catálogo y clientes de conexión. Todo ello pertenece al agente común. Las fases de scraping y audio no deben unificarse.

Novel Studio/Ollama ya duplica detección, CORS, catálogo de modelos, instalación/progreso y errores fuera del AgentClient. Queda explícitamente fuera de los dos primeros migrations, pero es evidencia real de que el tercer caso debe entrar por la plataforma común.

## 4. Código reutilizable

Reutilizar directamente, con cambios acotados:

- `local_tools/local_agent/authentication.py`: base de middleware; reemplazar token global por sesiones firmadas/scoped.
- `local_tools/local_agent/events.py`: formato SSE, heartbeat y replay; hacer que lea un journal del TaskManager.
- `local_tools/local_agent/destinations.py`: `ensure_within()` y patrón de grants; generalizar a `FileGrantService` con TTL, scope y uso.
- `local_tools/local_agent/models.py`: base estricta y UTC.
- `src/platform/local-agent/client.js`: timeout, fetch, base URL; convertirlo en instancia única con auth/session/discovery.
- `src/platform/local-agent/events.js`: parser SSE y stream por fetch.
- `src/platform/local-agent/contracts.js`: helpers; sustituir estados específicos de música por contrato común.
- `src/platform/local-agent/capabilities/music.js`: adaptar la instalación de Audio Engine Pack para usar `/v1/software` y la abstracción genérica del agente.
- `local_tools/instagram_exporter/packaging/agent.spec`, `installer.iss`, `build-installer.ps1` y workflow: reutilizar cadena de distribución, renombrando ubicaciones y agregando firma/verificación.
- `local_tools/music_analyzer/engine_pack.py`: extraer mecánica ZIP/hash/staging hacia un provider común; conservar descriptor musical.
- Patrones de `JobManager` y `MusicJobManager`: reutilizar comportamiento y pruebas, no copiar ambas clases.
- Tests de seguridad/SSE de `local_tools/instagram_exporter/tests/test_agent.py` y tests de API/artefactos de `test_music_api.py` como pruebas de compatibilidad.

No reutilizar sin endurecer:

- `load_or_create_config()` como almacén de secretos en texto;
- auto-pairing de `/pairing`;
- `EnginePackManager.descriptor()` como raíz de confianza sin firma;
- paths absolutos en `Job.public()`;
- `openai.key` en texto;
- gestores de jobs in-memory sin restauración.

## 5. Código específico de Instagram

Debe permanecer dentro de `instagram_exporter`:

- `instagram_exporter.py`: `InstagramExportEngine`, `ExportConfig`, `ExportInteraction`, `ExportCancelled`, validadores de perfil, recolección/descarga y manifests;
- un nuevo adapter `capability.py`: schema de `export-account`, traducción de eventos del motor a progreso común y comandos interactivos `continue-login`/`select-count`;
- almacenamiento de sesión Playwright bajo un namespace privado de la capability;
- políticas de concurrencia: lock exclusivo `instagram-browser-profile`;
- health de Chrome/Chromium/Playwright;
- pruebas del comportamiento de perfil, login manual, selección y cancelación.

`organizar_multimedia.py` se mantiene inicialmente invocado por Instagram para no ampliar alcance. Debe declarar Ollama/OpenAI y librerías visuales como dependencias, no instalarlas desde input web. Más adelante puede extraerse como capability independiente si otro flujo real la necesita.

## 6. Código específico de Music Analyzer

Debe permanecer dentro de `music_analyzer`:

- `contracts.py` salvo las partes genéricas de task/artifact;
- todo `engine/`;
- `worker.py`, `model_worker.py` y `model_store.py`;
- catálogo de modelos Demucs;
- descriptor de software `audio-engine-pack` y checks de health específicos;
- schemas de la operación `analyze` y semántica de sus resultados;
- UI de mixer, acordes, opciones y modelos.

Debe migrar al Core:

- ciclo común de `MusicJobManager` hacia TaskManager/ProcessRunner;
- `SourceRegistry`, destinos y media sessions hacia FileGrantService/ArtifactService;
- mecánica general de `EnginePackManager` hacia Installer `portable-zip`;
- ciclo de `ModelPull` hacia tasks comunes, dejando el handler de descarga en música.

## 7. Arquitectura objetivo

```text
                         INTERNET
                            |
             +--------------+---------------+
             |        Aplicación web        |
             |                              |
             |  Instagram UI    Music UI    |
             |         \          /         |
             |          AgentClient         |
             +--------------+---------------+
                            |
             HTTP JSON + SSE autenticados
                            |
                    127.0.0.1:8765
                            |
  +-------------------------+--------------------------+
  |                     Local Agent                    |
  |                                                    |
  |  Core                                              |
  |  + API / protocolo       + Pairing / sesiones      |
  |  + Capability Registry   + Task Manager            |
  |  + Event Bus / journal   + Process Runner          |
  |  + File Grants/Artifacts + Software Manager        |
  |  + Installer/Downloads   + Updater                 |
  |  + Secrets / Logs / Audit / Resource Scheduler     |
  |                                                    |
  |  Capabilities estáticas y confiables               |
  |  + instagram-exporter    + music-analyzer          |
  +------------+----------------------+----------------+
               |                      |
       Playwright/Chrome       Audio Engine Pack worker
       sesión/exportación      Python/FFmpeg/Demucs/
                               Librosa/modelos
```

Las capabilities se registran estáticamente al arrancar en el MVP. No hay plugin store, hot loading ni ejecución de manifests aportados por la web.

## 8. Agent Core

Responsabilidades exactas:

1. **Host HTTP loopback**: bind exclusivo a `127.0.0.1`, límites, CORS/PNA, routing, error envelope y negociación de protocolo.
2. **Identity/pairing/session**: identidad de dispositivo, claves, pairing con cuenta/origin, scopes, expiración, revocación y replay protection.
3. **Capability Registry**: catálogo estático, versiones, operaciones, schemas y handlers; el Core no importa conceptos de Instagram o audio fuera del registro.
4. **TaskManager**: IDs, estados comunes, persistencia, cancelación, recuperación, locks de recursos, resultados y errores.
5. **EventBus**: secuencia monotónica por agente y task, journal acotado, SSE único y replay.
6. **ProcessRunner**: ejecutar únicamente specs construidos por código confiable; sin endpoint shell, `shell=False`, entorno allowlisted, timeouts, process tree cancellation, stdout/stderr acotados y redacción.
7. **FileGrantService**: selectores nativos, handles opacos, TTL, permisos `read`/`write`, cardinalidad, consumo y revocación.
8. **ArtifactService**: IDs opacos, verificación de containment, downloads y media sessions breves.
9. **SoftwareManager**: detect/health/version/updateAvailable y acciones permitidas por catálogo.
10. **Installer/DownloadManager**: planes confiables, hashes/firmas, staging, rollback y providers registrados.
11. **Dependency resolution**: grafo capability → software → dependencia; diagnóstico y reparación, sin que la web dicte comandos.
12. **Secrets**: DPAPI/Windows Credential Manager; nunca archivos planos ni logs.
13. **Logs/audit**: eventos estructurados, correlation/task ID, retención, exportación de diagnóstico y redacción.
14. **Updater**: límites separados para agente y componentes, implementado después del MVP.

El Core no debe conocer `profile`, `Demucs`, `ffmpeg`, `post`, `stem` ni `chord`. Solo conoce manifests, operaciones, tasks, recursos, archivos, software y políticas.

## 9. AgentClient

Debe ser una única instancia de aplicación, no funciones de conexión repetidas por página. Responsabilidades:

- descubrir agente y protocolo (`isAvailable`, `getAgentInfo`);
- mantener la sesión de pairing, renovar challenge/ticket y revocar;
- añadir headers de autenticación, request ID, timestamp, nonce y firma;
- manejar timeout, abort, errores tipados y compatibilidad de protocolo;
- cachear capabilities/software con invalidación por eventos;
- crear/consultar/cancelar tasks;
- mantener una sola conexión SSE y demultiplexar suscripciones;
- seleccionar fuentes/destinos mediante grants comunes;
- exponer wrappers tipados sin duplicar transporte.

Interfaz recomendada:

```typescript
interface AgentClient {
  isAvailable(): Promise<boolean>;
  getAgentInfo(): Promise<AgentInfo>;
  getCapabilities(): Promise<CapabilityDescriptor[]>;
  listSoftware(): Promise<SoftwareStatus[]>;
  installSoftware(id: string): Promise<Task>;
  runTask<I>(capabilityId: string, operation: string, input: I): Promise<Task>;
  getTask(id: string): Promise<Task>;
  cancelTask(id: string): Promise<Task>;
  subscribe(filter: EventFilter, listener: (event: AgentEvent) => void): Unsubscribe;
  files: FileGrantClient;
  instagram: InstagramClient;
  music: MusicClient;
}
```

`InstagramClient.exportAccount()` y `MusicClient.analyze()` llaman internamente a `runTask()`. Esta combinación ofrece ergonomía y tipado sin crear protocolos paralelos.

Migración web concreta:

- absorber `src/instagramAgentClient.js` como adapter de compatibilidad temporal;
- absorber transporte de `src/music-analyzer/client.js` en wrappers registrados;
- mover token/conexión actualmente duplicados en `InstagramImporterPage.jsx` y `MusicAnalyzerPage.jsx` a un provider/hook común;
- usar una única key de sesión; durante transición leer las keys heredadas y borrarlas tras re-pairing seguro.

## 10. Capability model

Conceptos separados:

| Concepto | Significado | Ejemplo |
|---|---|---|
| Capability | contrato funcional expuesto | `music-analyzer` |
| Operation | acción declarada de una capability | `analyze` |
| Software | unidad instalable/versionable | `audio-engine-pack` |
| Dependency | requisito de capability/software | modelo `htdemucs` |
| Installer | mecanismo del Core que aplica un plan confiable | `portable-zip` |
| Task | instancia auditable de una operación/instalación | `task_01...` |

Contrato Python conceptual:

```python
class Capability(Protocol):
    descriptor: CapabilityDescriptor

    async def detect(self, context: CapabilityContext) -> CapabilityStatus: ...
    async def health(self, context: CapabilityContext) -> HealthReport: ...
    def operations(self) -> Mapping[str, OperationHandler]: ...
```

Cada `OperationDescriptor` declara input/output schema, permisos requeridos, si crea task, locks de recursos, sensibilidad, posibilidad de cancelación y versiones de protocolo compatibles. El handler recibe servicios del Core; nunca un request FastAPI crudo ni comandos enviados por la web.

Registro MVP explícito:

```python
registry.register(InstagramExporterCapability())
registry.register(MusicAnalyzerCapability())
```

No se escanean carpetas ni manifests de terceros al arrancar.

## 11. Instagram Exporter Capability

Descriptor propuesto:

- id: `instagram-exporter`;
- capabilityVersion: versión del contrato;
- software: inicialmente `bundled` con el agente;
- operaciones: `export-account`, `continue-login`, `select-count`, `open-output`;
- health: Playwright, Chrome/Chromium y sesión;
- lock: `instagram-browser-profile` exclusivo.

`export-account` crea una task común. Las acciones interactivas no crean otra task: envían una señal declarada a una task en `waiting_for_user`, validando que la señal sea esperada y pertenezca a la sesión autorizada. Los estados actuales se mapean así:

| Estado actual | Estado común | phase/message |
|---|---|---|
| `opening_browser` | `starting` | `opening-browser` |
| `awaiting_login` | `waiting_for_user` | `instagram-login` |
| `collecting_posts` | `running` | `collecting-posts` |
| `awaiting_selection` | `waiting_for_user` | `post-selection` |
| `exporting`/`organizing` | `running` | fase específica |
| terminales | terminal común | resultado/error |

Los endpoints `/exports/*` permanecen temporalmente como facade que traduce al TaskManager. Se eliminan solo cuando la web y una versión de compatibilidad hayan migrado.

## 12. Music Analyzer Capability

Descriptor propuesto:

- id: `music-analyzer`;
- operación: `analyze`;
- software requerido: `audio-engine-pack` con rango compatible;
- dependencias seleccionables: modelos Demucs allowlisted;
- grants: un input `read` y opcionalmente un destination `write-once`;
- locks: `audio-engine-cpu`/`audio-engine-gpu` según dispositivo y límites de recursos.

Flujo:

1. la web pide `agent.files.select({kind: "audio", mode: "read"})`;
2. el Core abre selector local, valida tipo/tamaño y devuelve `fileGrantId`;
3. `music.analyze()` envía el ID y opciones tipadas;
4. la capability consume/resuelve el grant y crea el request interno del worker;
5. TaskManager ejecuta el worker con ProcessRunner y traduce JSONL a eventos comunes;
6. ArtifactService valida output y devuelve IDs/metadatos;
7. la web descarga o crea media sessions mediante IDs.

`worker.py` y `engine.pipeline.analyze()` se conservan. El worker sigue aislando Torch/Demucs/Librosa del servidor HTTP. No se deben mover esas dependencias pesadas al proceso Core.

## 13. SoftwareManager

Modelo de estado:

```json
{
  "id": "audio-engine-pack",
  "displayName": "Audio Engine Pack",
  "state": "installed",
  "installedVersion": "2.1.0",
  "availableVersion": "2.2.0",
  "health": "healthy",
  "updateAvailable": true,
  "dependencies": []
}
```

Responsabilidades:

- consultar detectores locales, no confiar en estado de la web;
- distinguir `not-installed`, `installing`, `installed`, `degraded`, `update-available`, `repair-required` y `unsupported`;
- resolver dependencias y compatibilidad antes de ejecutar;
- crear tasks comunes para install/update/repair/uninstall;
- emitir cambios de health/versión;
- impedir acciones no declaradas en el catálogo firmado.

Mapa inicial:

- `instagram-exporter-runtime`: bundled con el agente; no instalable independientemente en MVP;
- `audio-engine-pack`: portable ZIP versionado e instalable sin admin;
- `demucs-model:htdemucs` y `:htdemucs_6s`: assets gestionados por la capability, visibles como dependencias; pueden convertirse después en software tipo `model` si la UI necesita gestión uniforme;
- Chrome/Ollama: dependencias externas detectables, pero no instaladas silenciosamente en MVP.

## 14. Installer system

Abstracción:

```text
Trusted Software Catalog
        |
        v
InstallPlanResolver -- valida plataforma, versión, firma, hash y policy
        |
        v
InstallerProvider Registry
  + portable-zip    (MVP, Audio Engine Pack)
  + bundled-asset   (MVP si aplica)
  + msi             (futuro)
  + signed-exe      (futuro)
  + winget          (futuro)
  + python-env/pip  (futuro, lockfile/hash obligatorio)
  + npm             (futuro, solo catálogo/lockfile)
```

La Web App envía solo `softwareId` y una acción. Nunca URL, hash, nombre de exe, flags, script ni comando.

Requisitos del provider:

- entrada `InstallPlan` generada desde catálogo firmado;
- staging en root controlado por el agente;
- descarga con hosts y redirects validados, límites de tamaño y timeout;
- firma Ed25519 del manifest con clave pública fijada en el agente, SHA-256/SHA-512 del payload y, para MSI/EXE, Authenticode/publisher esperado;
- protección Zip Slip, symlinks/reparse points, nombres reservados y zip bombs;
- instalación atómica por versión y rollback;
- verificación post-install/health;
- journal y cleanup seguro.

El provider `portable-zip` debe extraerse de `EnginePackManager`, pero el manifest del Audio Engine Pack permanece propiedad de música.

## 15. Task Manager

Contrato común:

```typescript
type TaskStatus =
  | "queued" | "starting" | "running" | "waiting_for_user"
  | "completed" | "failed" | "cancelled";

interface Task {
  id: string;
  kind: "capability-operation" | "software-action" | "dependency-action";
  capabilityId?: string;
  operation: string;
  status: TaskStatus;
  phase?: string;
  progress?: { overall: number; phase?: number };
  message: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: unknown;
  error?: AgentError;
}
```

Reglas:

- IDs no predecibles y ownership por pairing/session;
- transiciones validadas por máquina de estados;
- cancelación idempotente, cooperativa primero y terminación del process tree después de grace period;
- persistencia atómica de metadata y journal;
- al reiniciar: tasks activas pasan a `failed` con `agent_restarted`, o se reanudan solo si el handler declara recovery seguro;
- scheduler con límites globales de CPU/disco y locks declarados;
- TTL/retención distinta para metadata, resultados y logs;
- resultados nunca incluyen rutas o secretos.

Instagram y música conservan fases propias en `phase`; no deben inflar la enum común con estados de dominio.

## 16. Event system

MVP recomendado: un único stream autenticado `GET /v1/events`, SSE sobre `fetch`, con filtros opcionales por `taskId`/topic y replay mediante `Last-Event-ID`. Razones:

- ya funciona y está probado en ambos casos;
- `fetch` permite headers de autenticación/firma;
- el flujo agente → navegador es unidireccional;
- WebSocket en navegador complica autenticación sin token en URL y añade hijacking/subprotocol handling innecesario.

Envelope:

```json
{
  "id": "evt_01...",
  "sequence": 481,
  "type": "task.progress",
  "occurredAt": "2026-08-09T20:30:00Z",
  "taskId": "task_01...",
  "capabilityId": "music-analyzer",
  "data": {"phase":"separating","overall":42,"phaseProgress":67,"message":"..."}
}
```

Tipos iniciales:

- `task.created`, `task.started`, `task.waiting_for_user`, `task.progress`, `task.completed`, `task.failed`, `task.cancelled`;
- `software.status_changed`, `software.install.progress`;
- `capability.health_changed`;
- `agent.status_changed`, `session.revoked`.

La UI suscribe una vez y demultiplexa. Los endpoints SSE por job se mantienen como adapters durante transición.

## 17. Protocolo Web ↔ Agent

### Endpoints objetivo mínimos

| Método | Endpoint | Propósito |
|---|---|---|
| `GET` | `/healthz` | detección pública mínima, sin inventario local |
| `GET` | `/v1/agent` | identidad/versiones autenticadas |
| `GET` | `/v1/capabilities` | descriptors/operations |
| `GET` | `/v1/software` | estado real local |
| `POST` | `/v1/pairings` | consumir ticket y solicitar aprobación |
| `POST` | `/v1/sessions/challenge` | challenge anti-replay |
| `DELETE` | `/v1/sessions/current` | revocar sesión |
| `POST` | `/v1/file-grants/select` | selector nativo tipado |
| `DELETE` | `/v1/file-grants/{id}` | revocar grant |
| `POST` | `/v1/tasks` | operación declarada |
| `GET` | `/v1/tasks/{id}` | estado común |
| `POST` | `/v1/tasks/{id}/cancel` | cancelación idempotente |
| `POST` | `/v1/tasks/{id}/signals/{signal}` | interacción allowlisted |
| `GET` | `/v1/tasks/{id}/artifacts` | metadata |
| `GET` | `/v1/artifacts/{id}/content` | descarga autenticada |
| `POST` | `/v1/artifacts/{id}/media-sessions` | reproducción breve |
| `POST` | `/v1/software/{id}/actions/{action}` | install/update/repair/uninstall |
| `GET` | `/v1/events` | SSE único |

Request de operación:

```json
{
  "capabilityId": "music-analyzer",
  "operation": "analyze",
  "operationVersion": "1",
  "input": {
    "sourceGrantId": "grant_...",
    "tasks": {"separateStems": true, "detectChords": true},
    "model": "htdemucs"
  },
  "idempotencyKey": "browser-generated-uuid"
}
```

Respuesta `202`:

```json
{"task":{"id":"task_...","status":"queued","capabilityId":"music-analyzer","operation":"analyze"}}
```

Error común:

```json
{
  "error": {
    "code": "dependency_not_ready",
    "message": "Instala Audio Engine Pack antes de analizar.",
    "retryable": false,
    "details": {"softwareId":"audio-engine-pack"},
    "requestId": "req_..."
  }
}
```

Usar códigos estables; no devolver stack traces, comandos, paths, stderr crudo ni excepciones de proveedor. `protocolVersion` se negocia en header (`X-Agent-Protocol: 1`) y se devuelve en `/v1/agent`.

## 18. Archivos locales

Política recomendada, especialmente para música:

- la web nunca envía rutas;
- selección exclusivamente mediante UI nativa iniciada por endpoint declarado;
- grants aleatorios, ligados a pairing/origin, con tipo, permisos, TTL y usos;
- source musical `read-once` o `read-for-task`, destino `write-for-task`;
- revalidar existencia, canonical path, tipo, firma, tamaño y duración al consumir, no solo al seleccionar;
- copiar input a staging controlado si se necesita estabilidad/aislamiento; documentar coste de disco;
- output por task bajo `%LOCALAPPDATA%/FelipeMasanes/LocalAgent/data/...`, ACL del usuario actual;
- artefactos por ID; no `outputFolder` ni `sourcePath` en API/logs;
- media session aleatoria de un uso o corta duración, ligada a origin/session/artifact y con Range;
- cuotas de input/output, free-space preflight y cleanup por retención;
- `open-output` solo para un directorio de artefactos registrado, nunca un path enviado;
- borrado con containment revalidado y rechazo de symlinks/junctions/reparse points.

Debe migrarse el buen patrón de `SourceRegistry`/`Artifact` de música hacia Instagram. La ruta absoluta expuesta por `Job.public()` debe convertirse en `outputArtifactId` o `canOpenOutput`.

## 19. Seguridad

### Modelo de amenazas

Actores considerados:

- página maliciosa en Internet;
- XSS o dependencia comprometida dentro del origin permitido;
- atacante local no privilegiado;
- proceso local que falsifica `Origin`;
- replay de requests/eventos;
- capability o worker comprometido;
- artefacto/instalador/modelo/manifiesto alterado;
- actualización comprometida en CI/CD o hosting;
- usuario engañado para elevar privilegios.

| Amenaza | Estado actual | Control objetivo |
|---|---|---|
| Página maliciosa/CSRF | CORS+Origin exacto y custom auth ayudan | pairing criptográfico, firma por request, scopes, PNA, no cookies |
| Origin spoofing por proceso local | `Origin` se trata casi como identidad | Origin solo como señal; clave cliente no exportable + firma y nonce |
| XSS en app | roba token de `localStorage` y puede operar | WebCrypto key no exportable, scopes mínimos, sesiones cortas, confirmación local para acciones sensibles; XSS aún puede abusar durante ejecución |
| Replay | no hay nonce/timestamp | challenge, timestamp corto, nonce único, body hash, replay cache e idempotency key |
| WebSocket hijacking | no hay WS | seguir con SSE; si se añade WS, ticket efímero one-shot y validación Origin |
| Command injection | no hay shell web; comandos internos | prohibir `/terminal`; args arrays, allowlists, `shell=False`, env limpia |
| Path traversal/arbitrary files | grants parciales y containment | FileGrantService, artifact IDs, reparse/symlink checks, roots/ACL |
| Privilege escalation | installer per-user | agente normal; helper UAC firmado y efímero para plan exacto |
| Binary tampering | hash ZIP sin root de confianza | manifest firmado, pinned key, Authenticode, hashes y post-health |
| Supply chain | rangos pip y CI sin SBOM/firma | lockfiles/hashes, dependabot/audit, SBOM, provenance, CI protegido |
| Manifest alterado | descriptor local sin firma | firma detached/canónica verificada antes de confiar en URL/hash |
| Installer malicioso | no acepta URL web, pero publisher no se valida | catálogo fijo, publisher allowlist, firma doble y consentimiento |
| DoS local/web | body limit y una tarea por feature | rate limits, quotas, scheduler, timeouts, output/log caps |
| Secret leakage | OpenAI key en texto | DPAPI/Credential Manager, redacción, nunca retorno API |
| Exposición LAN | bind correcto | test de bind IPv4/IPv6, no firewall exception, fail closed |

La API directa de Ollama en `src/platform/ai/providers/ollama.js` no queda protegida por pairing del agente: depende del CORS/configuración de Ollama y amplía la superficie de un XSS en Novel Studio. Su migración posterior debe eliminar la necesidad de autorizar el origin web directamente en Ollama; el agente sería el único cliente local autorizado y aplicaría catálogo/scopes.

### Reglas no negociables

- ningún endpoint recibe `command`, `executable`, `arguments`, `script`, `url` de instalador o path arbitrario;
- solo operations registradas y schemas estrictos;
- capabilities y software firmados/compilados por el publisher;
- autenticación obligatoria excepto health mínimo y primer paso de pairing;
- autorización por scope (`capability:instagram:run`, `software:audio-engine:install`, etc.);
- acciones sensibles requieren presencia/consentimiento local: pairing, elevar, instalar publisher nuevo, desinstalar y acceso a nuevas carpetas;
- logs no incluyen tokens, claves, paths completos, cookies de Instagram ni audio.

### HTTP, HTTPS local y loopback

Para el MVP se recomienda mantener HTTP en `127.0.0.1` con autenticación criptográfica de aplicación. HTTPS local añade ciclo de certificados, confianza del navegador y renovación que actualmente no existe; un certificado autofirmado no mejora el modelo si el browser no confía en él. Debe reevaluarse si se adopta un bootstrapper capaz de administrar certificado confiable o un canal de browser/native messaging.

El bind debe ser `127.0.0.1` explícito. Evaluar `[::1]` por separado, nunca `0.0.0.0`/`::`. Mantener allowlist exacta de origins, PNA opt-in solo para origins configurados, `Vary: Origin`, sin credentials/cookies y sin wildcard. DNS names locales no deben sustituir la IP numérica sin protección contra rebinding.

## 20. Pairing

El pairing debe separar **cuenta**, **dispositivo**, **cliente web** y **sesión**.

Flujo recomendado:

```text
Usuario autenticado en Web App
       |
       | solicita ticket one-shot al backend
       v
Pairing ticket firmado
(accountId, origin, expiresAt, nonce, scopes)
       |
       v
POST 127.0.0.1/v1/pairings + public key WebCrypto
       |
       v
Agente verifica firma con clave pública fijada
       |
       v
Ventana local muestra cuenta/origin/código y pide aprobación
       |
       v
Agente crea deviceId + clave de dispositivo protegida por DPAPI
y registra la public key del cliente/scopes
       |
       v
Sesión corta; requests firmados con nonce/timestamp/body hash
```

El backend es necesario para vincular realmente una cuenta; el repositorio actual no contiene este endpoint de tickets. **Supuesto**: la Web App dispone o dispondrá de autenticación de cuenta y puede emitir tickets firmados. Si aún no existe cuenta, el MVP puede usar pairing local con código visible en una ventana del agente, pero debe modelarse como `local-profile`, no fingir vínculo cloud.

Propiedades:

- `deviceId` estable, nombre editable y `agentInstanceId` rotatorio si se reinstala;
- múltiples cuentas/clientes permitidos solo por política explícita;
- scopes visibles y revocables localmente y desde cuenta cuando haya conectividad;
- logout web revoca sesión, no necesariamente el dispositivo;
- unpair elimina public keys/sesiones, no resultados sin confirmación;
- claves privadas de navegador no exportables mediante WebCrypto/IndexedDB; reconocer que XSS todavía puede firmar mientras controla el origin;
- requests de alto impacto pueden exigir confirmación local incluso estando paired.

## 21. Privilegios

El instalador actual ya usa `PrivilegesRequired=lowest`; debe conservarse. El agente corre en la sesión del usuario, con acceso solo a sus roots y carpetas autorizadas.

Cuando un software requiera admin:

1. SoftwareManager prepara y verifica un `InstallPlan` inmutable.
2. El agente muestra qué software, publisher, versión y cambios requieren elevación.
3. Lanza un helper pequeño, firmado, con `runas`/UAC y un token IPC one-shot.
4. El helper vuelve a verificar firma/hash/plan y acepta solo operaciones primitivas allowlisted.
5. Ejecuta, devuelve resultado firmado/autenticado por named pipe restringido y termina.
6. El agente normal verifica health y cierra la task.

El helper no expone CLI genérica, PowerShell ni named pipe global. No se instala un servicio SYSTEM para el MVP.

## 22. Versionado

Distinguir:

- `agentVersion`: binario/Core distribuido, SemVer;
- `protocolVersion`: compatibilidad wire, entero/major explícito;
- `capabilityVersion`: contrato/implementación de cada capability;
- `softwareVersion`: versión detectada del componente instalado;
- opcional `operationVersion`: schema de una operación si evoluciona independientemente.

Respuesta propuesta:

```json
{
  "agentVersion": "1.3.0",
  "protocolVersions": ["1"],
  "activeProtocolVersion": "1",
  "deviceId": "device_...",
  "capabilities": {
    "instagram-exporter": {"capabilityVersion":"2.0.0"},
    "music-analyzer": {"capabilityVersion":"1.0.0"}
  },
  "software": {
    "audio-engine-pack": {"softwareVersion":"2.1.0"}
  }
}
```

Cambios aditivos mantienen protocol v1; breaking changes crean v2 con ventana de coexistencia. AgentClient debe rechazar de forma clara una incompatibilidad, no intentar endpoints al azar.

## 23. Instalación y actualización

### Tecnología

| Criterio | Python actual | C#/.NET | Go |
|---|---|---|---|
| Reutilización | máxima; todo el código actual | baja para Core si se reescribe | baja para Core si se reescribe |
| Windows/UAC/DPAPI/servicios | posible, menos natural | excelente | posible, más manual |
| HTTP/SSE | FastAPI probado | ASP.NET excelente | excelente |
| Workers Python | nativo | supervisión externa | supervisión externa |
| Packaging | PyInstaller grande/frágil | self-contained/MSIX/Inno sólido | binario único pequeño |
| Memoria/startup | mayores | medios | bajos |
| Riesgo de migración | bajo | alto | alto |
| Mantenibilidad actual | alineada al equipo/código | exige stack adicional | exige stack adicional |

Decisión: mantener Python/FastAPI para el agente v1. Si aparecen fallos reales de bootstrap/update/UAC o se exige servicio nativo, crear después un host/updater C# pequeño que supervise el Core y workers Python. Go no ofrece una ventaja suficiente frente a C# para la integración Windows requerida.

### Instalación del agente

- un único instalador “Felipe Local Agent” por usuario;
- conservar AppId para upgrade y aliases de protocolo durante transición;
- firmar exe/installer con Authenticode y timestamp;
- no incluir modelos pesados; idealmente tampoco el Audio Engine Pack en el instalador base cuando el downloader firmado esté listo;
- registrar inicio automático solo con consentimiento;
- no abrir firewall ni bind LAN.

### Actualización

Separar canales:

1. **Agent/Core update**: proceso updater externo, artefacto firmado, staging, cierre coordinado, swap/rollback y health post-start.
2. **Capability update**: en el MVP las capabilities Python viajan con el agent; no se actualizan solas.
3. **Software update**: Audio Engine Pack y modelos se gestionan independientemente mediante SoftwareManager.

Dejar preparado un `CapabilityPackage` firmado no significa implementar hot loading. La actualización independiente de capability puede llegar cuando exista un tercer caso real y compatibilidad/rollback probados; inicialmente reiniciar el agente tras actualizar un paquete confiable es aceptable.

## 24. Destino de instagram-exporter-agent

### Recomendación: alternativa B

```text
instagram-exporter-agent
        |
        +-- extraer infraestructura --> local-agent Core
        |
        `-- conservar lógica ----------> instagram-exporter capability
```

No se recomienda A (renombrarlo directamente): perpetuaría `agent.py` mezclando composición, API, jobs, auth y dominio, y haría que toda nueva capability dependiera conceptualmente de Instagram.

No se recomienda C (nuevo agente desde cero): descartaría middleware, SSE, packaging, tests y flujo desplegado, duplicaría temporalmente localhost/pairing y aumentaría el riesgo de big bang.

B permite una “strangler migration”:

- extraer primero composition root/config/runtime;
- introducir registry y adapter de Instagram;
- mantener `/exports` y `instagram-agent://` como facades;
- migrar UI al protocolo común;
- retirar facades después de telemetría/ventana de compatibilidad.

La deuda principal no es el lenguaje sino la dirección de dependencias. `local_agent` debe importar/registrar capabilities en el composition root, mientras los módulos Core nunca importan clases de Instagram. Los handlers de Instagram reciben interfaces del Core.

## 25. Destino de music-analyzer

Código que permanece:

- engine, worker, validación, Demucs, FFmpeg, acordes, exports, modelos y UI específica;
- JSONL como protocolo interno worker-host, versionándolo;
- Audio Engine Pack como software separado.

Código que se mueve/refactoriza:

- rutas comunes de task/artifact/files hacia Core;
- lifecycle de jobs/pulls/installs hacia TaskManager;
- mecánica ZIP hacia Installer portable;
- sources/destinations/media sessions hacia FileGrant/Artifact services.

Código a eliminar eventualmente:

- `MusicJob` y ciclos de events/subscribers duplicados;
- polling separado de installs/model pulls en UI cuando el stream único esté disponible;
- endpoints feature-specific redundantes de status/cancel/events;
- cualquier persistencia de paths internos fuera del Core.

Dependencias gestionadas:

- Local Agent instala/verifica `audio-engine-pack` desde catálogo firmado;
- Music Capability declara y valida modelos Demucs;
- FFmpeg/Python/Torch/Librosa son contenido del pack, no requisitos globales del PC;
- GPU/CUDA se detecta y se expresa como health/compatibilidad; no instalar drivers desde la web.

Archivos/progreso/resultados siguen el flujo descrito en las secciones 12 y 18. El resultado web es metadata/IDs; los archivos permanecen locales.

## 26. Estructura futura del repositorio

```text
local_tools/
  local_agent/
    __init__.py
    main.py                 # entrypoint/composition root
    app.py                  # FastAPI y protocolo
    config.py
    runtime.py
    security/
      authentication.py
      pairing.py
      sessions.py
      secrets.py
    capabilities/
      base.py
      registry.py
    tasks/
      models.py
      manager.py
      store.py
      scheduler.py
    events/
      bus.py
      sse.py
    processes/
      runner.py
    files/
      grants.py
      artifacts.py
      media_sessions.py
    software/
      models.py
      manager.py
      catalog.py
      installers/
        base.py
        portable_zip.py
    logging/
      audit.py
      redaction.py
    packaging/
      agent.spec
      installer.iss
  instagram_exporter/
    capability.py
    api_legacy.py
    instagram_exporter.py
    organizar_multimedia.py
    tests/
  music_analyzer/
    capability.py
    operations.py
    contracts.py
    worker.py
    model_worker.py
    engine/
    software/
      audio_engine_pack.py
      manifest.schema.json
    tests/

src/platform/local-agent/
  AgentClient.js
  AgentProvider.jsx
  auth.js
  events.js
  contracts.js
  errors.js
  capabilities/
    instagram.js
    music.js
```

No es necesario crear todas estas carpetas en el primer PR; es el destino de responsabilidades.

### Debe existir desde el principio

- un composition root neutral;
- registry estático y operaciones declaradas;
- AgentClient único;
- loopback, auth, schemas estrictos, file IDs y no-shell;
- Task/Event contracts comunes;
- separación Core/capability/software;
- version fields y error envelope.

### Debe quedar preparado arquitectónicamente

- install/update/repair/uninstall;
- updater de agent y software por separado;
- providers MSI/EXE/winget;
- helper UAC;
- capabilities actualizables con firma/restart;
- account/device revocation remota.

### No necesitamos todavía

- marketplace/plugin store;
- hot loading;
- scripts arbitrarios;
- 20 installer providers;
- servicio Windows/SYSTEM;
- orquestación cloud de tasks locales;
- WebSocket;
- reescritura C#/Go;
- instalación automática de Chrome, Ollama, drivers o CUDA.

La arquitectura sí deja un lugar futuro para la integración Ollama ya observada, pero no la convierte en tercer capability durante esta migración inicial.

## 27. Migración por PRs

### PR 1 — Neutralizar el composition root y registrar capabilities

**Objetivo:** hacer que el binario sea realmente `local-agent` sin cambiar comportamiento observable ni retirar endpoints.

**Archivos nuevos:** `local_tools/local_agent/main.py`, `app.py`, `config.py`, `runtime.py`, `capabilities/base.py`, `capabilities/registry.py`, `instagram_exporter/capability.py`, `music_analyzer/capability.py`, tests de composition/registry.

**Archivos modificados:** `instagram_exporter/agent.py` como launcher/facade temporal, `packaging/agent.spec`, scripts npm/build y tests de API.

**Cambios:** mover host/config/paths/main; crear registry estático; montar adapters de ambas capabilities; agregar `GET /v1/agent` y `GET /v1/capabilities`; conservar todos los endpoints existentes.

**Riesgos:** imports circulares, paths frozen, PyInstaller hidden imports, migración de runtime existente.

**Pruebas:** unitarias de registry; regresión de los 38 tests; arranque source/frozen; bind solo loopback; upgrade sobre instalación existente.

**Criterio de aceptación:** el entrypoint y título no viven en Instagram, ambas capabilities aparecen en discovery y las UIs actuales funcionan sin cambios.

### PR 2 — AgentClient único y contrato de versión/error

**Objetivo:** eliminar detección/pairing/transporte duplicado en features.

**Archivos nuevos:** `AgentClient.js`, `AgentProvider.jsx`, `errors.js`, wrappers `capabilities/instagram.js` y `music.js`.

**Archivos modificados:** `client.js`, `events.js`, `instagramAgentClient.js`, `InstagramImporterPage.jsx`, `MusicAnalyzerPage.jsx`, `music-analyzer/client.js` y tests JS.

**Cambios:** singleton/provider; discovery/version negotiation; error envelope; una sesión y un stream manager; shims heredados.

**Riesgos:** lifecycle React, reconexión SSE y recuperación de token legacy.

**Pruebas:** unitarias de timeout/errors/replay; componentes con agente ausente/incompatible; prueba manual alternando ambas páginas.

**Criterio de aceptación:** ninguna feature llama directamente a `fetch(127.0.0.1)` ni implementa pairing/health por su cuenta.

### PR 3 — Pairing de dispositivo y sesiones seguras

**Objetivo:** sustituir token global automático por pairing explícito y requests anti-replay.

**Archivos nuevos:** `security/pairing.py`, `sessions.py`, `secrets.py`, auth WebCrypto del cliente y, si existe cuenta, endpoint cloud de ticket.

**Archivos modificados:** middleware, config, AgentClient y UI de pairing.

**Cambios:** device ID/key, ticket/código local, scopes, sesiones cortas, request signatures, nonce/replay cache, migración/revocación de token heredado.

**Riesgos:** compatibilidad de navegador, XSS residual, usuarios offline y pérdida de key.

**Pruebas:** origins maliciosos/falsificados, replay, timestamp, body alterado, revocación, doble pairing, XSS threat tests conceptuales.

**Criterio de aceptación:** conocer el origin o leer `/healthz` no basta para obtener credenciales ni ejecutar una operación.

**Implementación incremental realizada:** consentimiento mediante diálogo nativo,
sesión de dispositivo de 12 horas, scopes cerrados, firma HMAC WebCrypto,
timestamp/nonce, protección de replay en memoria y revocación. El repositorio no
contiene todavía autenticación de cuentas web ni un backend que emita tickets;
por eso esta etapa vincula navegador + origen + instalación local, pero no afirma
una identidad de cuenta. Esa asociación deberá añadirse con un ticket firmado del
backend cuando exista una sesión web verificable. El secreto HMAC almacenado por
el agente también deberá migrar a DPAPI durante el hardening del PR 7.

### PR 4 — TaskManager y EventBus comunes, migrando Instagram primero

**Objetivo:** probar el contrato común con la capability que originó el agente.

**Archivos nuevos:** `tasks/*`, `events/bus.py`, persistence y adapter legacy de exports.

**Archivos modificados:** `instagram_exporter/capability.py`, `agent.py`, SSE y wrapper web Instagram.

**Cambios:** task común, fases, `waiting_for_user`, señales login/selección, cancelación, journal y stream único; `/exports` traduce a tasks.

**Riesgos:** interacción manual, cierre de Playwright y recuperación tras restart.

**Pruebas:** ciclo completo actual, transición inválida, cancelación, replay, restart, compatibilidad endpoints.

**Criterio de aceptación:** una exportación es visible y controlable como Task común sin cambiar `InstagramExportEngine`.

### PR 5 — Music Analyzer sobre Task/File/Artifact services comunes

**Objetivo:** retirar la segunda implementación de jobs manteniendo el worker.

**Archivos nuevos:** `files/grants.py`, `artifacts.py`, `media_sessions.py`, adapter musical.

**Archivos modificados:** `music_analyzer/jobs.py`, `api.py`, capability, cliente/UI y tests.

**Cambios:** `analyze` como operación; source/destination grants; JSONL → Task events; artifact IDs; media session común.

**Riesgos:** Range streaming, outputs externos autorizados, cancelación de process tree y jobs existentes.

**Pruebas:** WAV/MP3 fake, traversal, symlink/junction, worker malicioso con artifact externo, Range, cancel/delete/restart.

**Criterio de aceptación:** Instagram y música comparten TaskManager/EventBus/File services; no quedan modelos de job paralelos.

### PR 6 — SoftwareManager e Installer portable ZIP

**Objetivo:** generalizar el Audio Engine Pack sin construir providers innecesarios.

**Archivos nuevos:** `software/*`, `installers/base.py`, `portable_zip.py`, esquema/catálogo firmado.

**Archivos modificados:** `engine_pack.py`, build del pack, API/UI de instalación y workflow.

**Cambios:** estado software común; plan firmado; ZIP provider; install/update/repair básico; manifest separado del mecanismo.

**Riesgos:** compatibilidad con packs instalados, zip bomb/reparse, firma/rotación de claves y rollback.

**Pruebas:** hash/firma incorrectos, manifest alterado, host/redirect, traversal, cancelación, rollback y health.

**Criterio de aceptación:** la web instala por `softwareId`; no existe endpoint que acepte URL o comando.

### PR 7 — ProcessRunner, secrets, logs y hardening

**Objetivo:** centralizar límites de ejecución y observabilidad segura.

**Archivos nuevos:** `processes/runner.py`, `logging/audit.py`, `redaction.py`, secret store DPAPI.

**Archivos modificados:** organizer, music worker/model manager, task handlers y credentials API.

**Cambios:** process specs internos, tree cancellation, env allowlist, log caps, correlation IDs, DPAPI y migración de `openai.key`.

**Riesgos:** diferencias Windows/Linux de desarrollo, migración de secretos y pérdida de diagnósticos útiles.

**Pruebas:** command/path injection, huge stdout, timeout, orphan processes, secret redaction y ACL.

**Criterio de aceptación:** todo proceso local pasa por runner o una excepción documentada dentro del worker; secretos no están en texto/logs.

### PR 8 — Updater seguro, signing y UAC puntual

**Objetivo:** completar lifecycle de producción sin elevar el agente permanente.

**Archivos nuevos:** updater/helper firmados, manifests de release, pipeline de signing/provenance.

**Archivos modificados:** Inno, workflow, SoftwareManager y UI de update.

**Cambios:** agent update atómico/rollback; Authenticode; canal estable; helper UAC solo si un software real lo requiere.

**Riesgos:** bloqueo de archivos, antivirus/SmartScreen, pérdida de firma, downgrade y recovery.

**Pruebas:** upgrade/downgrade prohibido, firma inválida, proceso activo, rollback, instalación offline y UAC cancelado.

**Criterio de aceptación:** actualización comprometida o incompleta no reemplaza una versión sana; agente sigue ejecutándose sin admin.

## 28. MVP

El MVP arquitectónico más pequeño no es instalar cualquier software. Es demostrar una ruta común real, conservando la funcionalidad existente:

```text
Instagram UI
   |
   v
AgentClient.runTask("instagram-exporter", "export-account", input)
   |
   v
Local Agent / Capability Registry / TaskManager
   |
   v
InstagramExportEngine (sin reescribir)
   |
   v
Task events + result/artifact IDs
   |
   v
AgentClient + UI
```

Incluye:

- neutral composition root;
- discovery/version;
- registry estático con ambas capabilities visibles;
- una operación Instagram sobre TaskManager;
- SSE común y adapter legacy;
- AgentClient único;
- sin updater, marketplace, UAC ni installers nuevos.

Después, migrar música al mismo TaskManager prueba que el diseño soporta un segundo runtime/worker y no es solo un rename de Instagram.

## 29. Orden de migración

**Migrar primero `instagram-exporter-agent`.**

Razones:

1. contiene la infraestructura que debe extraerse: servidor, config, pairing, paths, packaging y entrypoint;
2. es el componente histórico desplegado y define compatibilidad de instalador/protocolo URL;
3. neutralizarlo elimina la dirección de dependencia incorrecta antes de consolidar más música dentro suyo;
4. `InstagramExportEngine` ya está desacoplado de FastAPI y ofrece un corte limpio;
5. sus tests cubren el lifecycle interactivo y permiten mantener facade legacy.

Esto no significa reescribir el exporter antes de avanzar música. Significa extraer el host y migrar una operación Instagram al contrato común; luego música migra como segundo consumidor. El motor musical ya tiene la separación worker adecuada y puede seguir funcionando mediante su router actual durante esa transición.

## 30. Primer PR

**EL PRIMER PR QUE RECOMIENDO IMPLEMENTAR ES:** neutralizar el composition root actual, introducir un Capability Registry estático y publicar discovery versionado, preservando íntegramente las APIs actuales.

### Objetivo

Cambiar la relación “música dentro del agente de Instagram” por “Instagram y música registradas en un Local Agent neutral”, sin cambiar aún pairing, TaskManager ni UI.

### Archivos

Nuevos:

- `local_tools/local_agent/main.py`
- `local_tools/local_agent/app.py`
- `local_tools/local_agent/config.py`
- `local_tools/local_agent/runtime.py`
- `local_tools/local_agent/capabilities/base.py`
- `local_tools/local_agent/capabilities/registry.py`
- `local_tools/instagram_exporter/capability.py`
- `local_tools/music_analyzer/capability.py`
- tests `local_tools/local_agent/tests/test_app.py` y `test_registry.py`

Modificados:

- `local_tools/instagram_exporter/agent.py` para quedar como launcher/facade de compatibilidad;
- `local_tools/instagram_exporter/packaging/agent.spec` para apuntar al entrypoint neutral;
- `build-installer.ps1`, `package.json`, workflow y documentación de build;
- pruebas actuales solo donde cambie el import del app factory.

### Interfaces

- `Capability.descriptor()` o propiedad equivalente;
- `Capability.register_routes(app, context)` como adapter temporal;
- `CapabilityRegistry.register/get/list` con rechazo de IDs duplicados;
- `AgentContext` con config, runtime paths y servicios compartidos existentes;
- `create_agent_app(context, registry)` y `main()` neutrales.

No diseñar todavía un plugin ABI ni cargar manifests desde disco.

### Endpoints

Nuevos:

- `GET /v1/agent`: `agentVersion`, `protocolVersions`, nombre y estado mínimo;
- `GET /v1/capabilities`: IDs/versiones/operaciones declaradas y health resumido.

Conservados sin cambios:

- `/health`, `/pairing`, `/exports/*`, `/destinations/*`, `/credentials/*`;
- todos los `/v1/music/*`, `/v1/models/*` y `/v1/media/*`.

### Código que reutilizamos

- app factory y Uvicorn de `instagram_exporter/agent.py`;
- middleware, events, destinations y models ya extraídos;
- `InstagramExportEngine` intacto;
- `create_music_router()` intacto;
- PyInstaller/Inno/AppId/protocol aliases y las 38 pruebas específicas.

### Código que todavía NO tocamos

- auto-pairing/token y keys de localStorage;
- modelos `Job`/`MusicJob`;
- endpoints legacy;
- worker musical, Demucs, FFmpeg y Audio Engine Pack;
- organizer/Ollama/OpenAI;
- updater, SoftwareManager, UAC y firma de paquetes.

### Prueba manual

1. iniciar mediante el nuevo entrypoint;
2. confirmar que solo escucha en `127.0.0.1:8765`;
3. abrir ambas páginas y verificar health/pairing actuales;
4. ejecutar una exportación pequeña y un análisis musical con worker/pack disponible;
5. comprobar `GET /v1/agent` y que `/v1/capabilities` lista exactamente `instagram-exporter` y `music-analyzer`;
6. ejecutar el exe PyInstaller y validar los aliases `felipe-tools://` e `instagram-agent://`.

### Pruebas automatizadas

- registry rechaza duplicados y no conoce dominios;
- app monta ambas capabilities y no expone docs;
- discovery cumple schema/version;
- security middleware sigue protegiendo rutas;
- todos los tests Python actuales pasan;
- tests JS actuales de plataforma/música pasan;
- smoke test frozen `--initialize` y bind loopback.

### Resultado observable

El usuario no percibe una regresión. Técnicamente, el ejecutable deja de pertenecer a Instagram: el Local Agent posee el servidor y registra dos capabilities pares. Ese corte habilita los siguientes PRs sin crear un segundo agente ni reescribir los motores.
