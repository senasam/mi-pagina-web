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
