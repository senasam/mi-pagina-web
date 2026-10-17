# My Portfolio — React + Vite + Tailwind

## Quickstart (StackBlitz or local)

### StackBlitz
1. Open this project on StackBlitz (File → Upload Project).
2. After upload, StackBlitz auto-installs deps.
3. Click **Start Dev Server** if it doesn't start automatically.

### Local
```bash
npm install
npm run dev
```

### Importador local de Instagram

La pagina `/herramientas/importar-instagram` se conecta a un agente autenticado
en `127.0.0.1`. Consulta [la guia del agente](docs/instagram-exporter-agent.md)
para desarrollo, emparejamiento, seguridad, pruebas y construccion del
instalador de Windows.
Open the URL shown in your terminal (usually http://localhost:5173).

## Build
```bash
npm run build
npm run preview
```

## Indicadores financieros (opcionales)

Los endpoints del servidor consultan fuentes públicas oficiales para la UF, inflación esperada, depósitos a plazo y referencias históricas de Cuenta 2 por tipo de fondo. Para usar directamente la API BDE del Banco Central de Chile antes del respaldo público, configura estas variables solo en el servidor:

```text
BCCH_API_USER=usuario_bde
BCCH_API_PASSWORD=clave_bde
```

La interfaz no recibe ni expone esas credenciales. `CMF_API_KEY` sigue siendo opcional para la fuente primaria de UF.

### UF (`/api/indicadores/uf`)

- `GET /api/indicadores/uf` → UF de hoy. `?fecha=YYYY-MM-DD` → UF de esa fecha. `?serie=fin-de-mes&desde=YYYY-MM&hasta=YYYY-MM` → UF del último día de cada mes (máx. 15 años).
- Fuente primaria: API de la CMF (requiere `CMF_API_KEY`, gratuita en https://api.cmfchile.cl/). Respaldo: mindicador.cl. Si ambas fallan se devuelve el último valor cacheado con `status: "cached"`.
- Configura `CMF_API_KEY` en `.env.local` para desarrollo y en *Vercel → Settings → Environment Variables* para producción. Nunca la expongas con prefijo `VITE_`.

## Evaluador de demanda laboral

Ruta `/herramientas/evaluador-demanda-laboral`. Código en `src/labor-claim/`:

- `laborClaimEngine.js`: motor puro (sin UI). Tests en `tests/laborClaimEngine.test.js`.
- `legalParams.js`: tasas y topes versionados (`valor`, `vigenteDesde`, `vigenteHasta`, `fuenteId`, `verificado`). Para actualizar una tasa o tope, cierra el tramo vigente con `vigenteHasta` y agrega uno nuevo; marca `verificado: false` con una `nota` si aún no lo contrastaste con la fuente oficial (la UI lo mostrará como "pendiente de verificar").
- `legalSources.js`: registro de fuentes (`id`, `titulo`, `articulo`, `url`, `fechaVerificacion`, `estado`).
- `holidays.js`: feriados legales para convertir días hábiles de vacaciones en días corridos.

## IA opcional del estudio de novela

Los botones **Sugerir título** y **Generar resumen** llaman a OpenAI únicamente cuando el usuario los pulsa. La configuración principal se realiza desde **Configuración → Inteligencia artificial** dentro del estudio. La clave y el modelo se guardan en `preferences.json` dentro de la carpeta local del workspace.

Este almacenamiento es deliberadamente legible y no está cifrado: la clave también se incluirá en los respaldos ZIP. No compartas `preferences.json` ni un respaldo sin retirar antes la credencial. La aplicación no mantiene una clave global en Vercel.

La clave nunca se incluye en el bundle compilado; se lee de la carpeta autorizada y viaja por HTTPS al endpoint únicamente al solicitar una sugerencia. Al pulsar uno de los botones, se envían a OpenAI la prosa de la escena actual y sus metadatos editoriales; el usuario debe revisar el resultado y aceptarlo antes de que se guarde.

También están disponibles dos modos sin API de OpenAI:

- **ChatGPT manual:** copia una solicitud y abre la URL de ChatGPT configurada, incluida la de un proyecto. La URL queda en el `preferences.json` local; el usuario inicia sesión, ejecuta la solicitud y pega el resultado en el estudio. La aplicación nunca lee la sesión ni las cookies de ChatGPT.
- **Ollama local:** detecta modelos instalados en `http://localhost:11434` y genera el resultado enteramente en el PC. Si Ollama o sus modelos no están disponibles, el asistente exige elegir primero el tipo de instalación y un tamaño de modelo antes de mostrar comandos. No instala ni descarga nada automáticamente.

Para permitir que el sitio acceda al servidor local, el asistente genera un comando de PowerShell que añade únicamente el origen actual a `OLLAMA_ORIGINS`. Después se debe reiniciar Ollama. Los modelos sugeridos son Qwen3 4B, 8B, 14B y 30B; la interfaz muestra el tamaño de descarga y una orientación aproximada de memoria antes de elegir.
