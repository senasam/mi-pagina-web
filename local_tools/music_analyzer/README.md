# Motor del analizador musical

Implementacion independiente de UI para validar audio, convertirlo con FFmpeg,
separar pistas con Demucs, detectar acordes y exportar JSON, CSV y ZIP. Las
dependencias pesadas se cargan en `worker.py`, pensado para ejecutarse como un
subproceso de un solo uso del agente local.

## Desarrollo

Desde la raiz del repositorio:

```powershell
python -m pip install -r local_tools/music_analyzer/requirements-dev.txt
python -m pytest local_tools/music_analyzer/tests -q
```

Las pruebas usan un proveedor de separacion y detector de acordes falsos; no
descargan Torch, Demucs ni modelos. Para procesar audio real, FFmpeg/FFprobe
deben estar disponibles y el Audio Engine Pack debe instalar las dependencias
de `requirements-engine.txt`.

Los modelos nunca se descargan al iniciar un analisis. El agente expone el
catalogo `/v1/models` y crea descargas explicitas con `/v1/models/pulls`. Cada
instalacion valida se registra mediante un manifiesto interno; si falta, el
motor devuelve `model_not_installed` antes de ejecutar Demucs.

## Worker

El agente creara un JSON interno (con rutas ya resueltas desde identificadores
opacos) y ejecutara:

```powershell
python -m local_tools.music_analyzer.worker runtime/music_analyzer/jobs/<id>/request.json
```

La salida es JSON Lines: eventos `job_progress`, seguidos por `job_result` o
`job_error`. Este contrato no acepta comandos genericos ni rutas enviadas por
la pagina web; esa traduccion segura corresponde a la Fase 3 del agente.

## Instalador para usuarios

El build unificado se genera desde la raiz con:

```powershell
npm run build:local-tools-unified
```

El resultado es `instagram_exporter/installer-output/FelipeLocalTools-Setup.exe`.
Incluye el agente y el Audio Engine Pack; desde la pagina web el usuario instala
el pack, descarga explicitamente un modelo Demucs y luego procesa su audio sin
abrir una terminal.
