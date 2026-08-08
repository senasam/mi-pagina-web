# Agente local de Instagram Exporter

## Arquitectura

La aplicacion React/Vite se comunica directamente con `http://127.0.0.1:8765`.
El servidor web nunca actua como proxy ni recibe cookies, contrasenas, sesiones o
archivos exportados. El agente FastAPI crea un trabajo asincrono y adapta el
motor reutilizable de `instagram_exporter.py`; Playwright abre un contexto
persistente visible, el usuario completa login/2FA y la web reanuda el trabajo.
Los cambios se transmiten con SSE autenticado consumido mediante `fetch`.

Solo existe un agente local. El acceso previo a carpetas del estudio de novelas
usa File System Access API dentro del navegador y no es un backend reutilizable.
La integracion web previa de Ollama se conserva; el agente controla su propio
flujo para poder organizar una exportacion aun si se cierra la pagina.

## Runtime y privacidad

En desarrollo se usan:

```text
runtime/instagram_exporter/
|-- agent-config.json
|-- openai.key                 (solo si el usuario la agrega)
|-- session/                   (perfil persistente de Chrome)
|-- exports/                   (salida predeterminada)
`-- logs/
```

En la aplicacion empaquetada el mismo arbol vive en
`%LOCALAPPDATA%\FelipeMasanes\InstagramExporter\runtime\instagram_exporter` para
no escribir dentro de la carpeta de instalacion. `INSTAGRAM_AGENT_RUNTIME`
permite cambiar la raiz en desarrollo.

La salida predeterminada siempre se resuelve bajo `exports/`. Para una carpeta
externa la web no puede enviar una ruta: `POST /destinations/select` muestra el
selector nativo de Windows y entrega una autorizacion opaca, aleatoria y de un
solo uso. Esto hace que la excepcion sea una decision local del usuario.

Ollama mantiene medios y analisis en el PC. Si se elige OpenAI, el agente usa la
API key guardada localmente y envia las imagenes a la API de OpenAI; la interfaz
lo advierte expresamente. La clave nunca se envia al servidor de esta web.

## Desarrollo local

Web:

```powershell
npm ci
npm run dev
```

Agente:

```powershell
cd local_tools\instagram_exporter
.\run-agent.ps1
```

Alternativa manual:

```powershell
python -m venv .venv-agent
.venv-agent\Scripts\python -m pip install -r requirements-agent.txt
.venv-agent\Scripts\python -m pip install -r requirements-organizer.txt
.venv-agent\Scripts\python -m playwright install chromium
.venv-agent\Scripts\python agent.py
```

El agente escucha exclusivamente en `127.0.0.1`. El puerto predeterminado es
`8765`; se cambia con `INSTAGRAM_AGENT_PORT`, `--port` o `port` en
`agent-config.json`. La web usa `VITE_INSTAGRAM_AGENT_URL`.

## Emparejamiento y CORS

La primera inicializacion genera 32 bytes aleatorios (256 bits) y guarda el
token en `agent-config.json`. La interfaz solicita ese token automaticamente con
`POST /pairing`; el usuario no tiene que verlo, copiarlo ni pegarlo. Este endpoint
solo responde cuando la solicitud incluye uno de los origenes web permitidos.
Solicitudes sin `Origin` o desde otro sitio no pueden emparejarse.

La web guarda el token en el almacenamiento local del navegador y lo envia solo
como `Authorization: Bearer`. No se incluye en URLs ni eventos. El agente compara
el valor con tiempo constante y no habilita access logs. `--show-token` se
conserva exclusivamente para diagnostico.

`INSTAGRAM_AGENT_ORIGINS` define los origenes exactos antes de la primera
inicializacion. Despues pueden editarse en `allowedOrigins` de la configuracion
con el agente detenido. No se admiten comodines. Las preflight `OPTIONS`
incluyen soporte de Private Network Access para una web HTTPS hacia loopback.

## API

- `GET /health`: deteccion publica minima y disponibilidad de Chrome, Chromium,
  Playwright y Ollama.
- `POST /pairing`: entrega la credencial solo a un origen web permitido.
- `POST /exports`: crea un trabajo y devuelve `202` inmediatamente.
- `GET /exports/{id}`: estado completo.
- `POST /exports/{id}/continue`: valida que Chrome este exactamente en el perfil.
- `POST /exports/{id}/selection`: seleccion; `0` significa todas.
- `POST /exports/{id}/cancel`: cancelacion cooperativa.
- `GET /exports/{id}/events`: SSE con replay corto y heartbeat cada 15 segundos.
- `POST /destinations/select`: selector nativo y autorizacion opaca de un uso.
- `POST /credentials/openai`: guarda la clave en el runtime local.
- `POST /exports/{id}/open-output`: abre unicamente la salida del trabajo.

Salvo `/health` y el emparejamiento restringido por origen, todos exigen token.
El cuerpo esta limitado a 16 KiB, Pydantic rechaza campos desconocidos, solo se
conserva un trabajo activo y 50 trabajos en memoria. No existe ningun endpoint
para ejecutar comandos o aceptar rutas.

## Estados y eventos

Estados: `created`, `opening_browser`, `awaiting_login`, `collecting_posts`,
`awaiting_selection`, `exporting`, `organizing`, `completed`, `cancelling`,
`cancelled`, `failed`.

Los eventos incluyen navegador abierto, espera de login, conteo, seleccion,
inicio/fin de publicacion, advertencias, errores, cancelacion, exportacion,
descarga de modelo y organizacion. La web recupera `GET /exports/{id}` si se
corta SSE y reconecta desde el ultimo ID.

## Dependencias

- `requirements.txt`: motor Playwright.
- `requirements-agent.txt`: FastAPI, Uvicorn y validacion.
- `requirements-organizer.txt`: Pillow, OpenCV headless y lectores opcionales.
- `requirements-dev.txt`: pytest, HTTPX y PyInstaller.

Los rangos admiten actualizaciones compatibles. Para actualizarlos, cambia un
rango, recrea el entorno, ejecuta todas las pruebas y valida el instalador. El
codigo de produccion no instala paquetes silenciosamente; la CLI del organizador
solo lo hace al recibir `--install-dependencies` de forma explicita.

## Pruebas y build

```powershell
npm test
python -m pytest local_tools\instagram_exporter\tests -q
npm run build
```

Las pruebas usan motores simulados; no abren Instagram, no descargan perfiles y
no dependen de Ollama.

## Instalador de Windows

Instala Inno Setup 6 y ejecuta:

```powershell
npm run build:instagram-agent
```

Para comprobar solo PyInstaller:

```powershell
.\local_tools\instagram_exporter\build-installer.ps1 -SkipInstaller
```

El script crea un entorno aislado, incorpora Python y Chromium de Playwright,
genera el ejecutable, lo inicializa y compila el instalador. Inno Setup ofrece
inicio automatico como tarea desmarcada e incluye desinstalador. Desinstalar no
elimina sesiones, claves ni exportaciones.

El workflow `release-instagram-agent.yml` construye el instalador en Windows al
publicar una etiqueta `instagram-agent-v*` y lo adjunta a GitHub Releases con el
nombre estable `InstagramExporterAgent-Setup.exe`. El despliegue de la web apunta
a la descarga `releases/latest`, de modo que un usuario final no necesita tener
el repositorio, Python ni una carpeta local del proyecto.

El instalador tambien registra el protocolo `instagram-agent://` en
`HKCU\Software\Classes\instagram-agent`. La pagina "Importar desde Instagram"
muestra un boton "Iniciar agente" que abre `instagram-agent://start`; Windows
lanza el ejecutable instalado y la web sondea `/health` hasta detectarlo. El
protocolo solo existe tras instalar el `.exe`; en desarrollo con
`run-agent.ps1` el boton no tiene efecto y la pagina conserva las
instrucciones manuales como alternativa.

## Diagnostico

- Chrome no detectado: instala Chrome o ejecuta `python -m playwright install chromium`.
- Login bloqueado: completa challenge/2FA y deja la pestaña en
  `https://www.instagram.com/usuario/`, no en Inicio, Explorar o una publicacion.
- Ollama ausente: instala Ollama, abre su servicio y comprueba `ollama list`.
- Modelo ausente: el agente ejecuta la descarga mediante el organizador y emite
  eventos separados de descarga.
- CORS: agrega el origen exacto (esquema, host y puerto) y reinicia el agente.
- Agente no detectado: comprueba `http://127.0.0.1:8765/health` y el puerto.

## Futuras herramientas locales

Cada herramienta va bajo `local_tools/<nombre>/`, con motor independiente de UI,
dependencias separadas, pruebas y README. Si necesita capacidades de escritorio,
se debe ampliar este agente con endpoints tipados y acotados en vez de crear un
segundo servicio o un ejecutor generico de comandos.
