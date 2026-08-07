# Exportador de contenido de Instagram

Automatiza un navegador visible para recorrer un perfil de Instagram y guardar:

- fotos y videos de cada publicacion, incluyendo carruseles;
- `caption.txt` con la leyenda detectada;
- `article_text_raw.txt` como respaldo del texto visible;
- `metadata.json` por publicacion;
- `posts.csv` y `posts.json` como manifiestos generales;
- URL original y captura de pantalla cuando ocurre un error.

## Uso responsable

Usalo solo para contenido propio o de clientes que hayan autorizado expresamente
la descarga y reutilizacion. No evita inicios de sesion, 2FA, CAPTCHA, perfiles
privados, restricciones de acceso ni bloqueos de la plataforma.

## Instalacion

Requiere Python 3.10 o superior y Google Chrome, o Chromium de Playwright.

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## Flujo manual recomendado

Ya no es obligatorio indicar el perfil al iniciar el script. En PowerShell:

```powershell
python instagram_exporter.py --confirm-permission
```

El programa abrira una ventana de Chrome y se detendra. Luego:

1. Inicia sesion manualmente en Instagram.
2. Completa la autenticacion de dos factores, si aparece.
3. Navega manualmente hasta el perfil exacto que quieres exportar.
4. Sin cerrar Chrome, vuelve a PowerShell.
5. Escribe `CONTINUAR` y presiona Enter.

El script verificara la URL de las pestañas abiertas. Solo comenzara cuando
detecte una pestaña situada en una URL de perfil como:

```text
https://www.instagram.com/nombre_del_cliente/
```

Si todavia estas en la pantalla de inicio de sesion, en Inicio, en Explorar o
dentro de una publicacion individual, te pedira que abras el perfil y vuelvas a
escribir `CONTINUAR`.

## Abrir inicialmente un perfil conocido

El argumento de perfil sigue disponible, pero el programa igualmente esperara
la orden `CONTINUAR` antes de comenzar:

```powershell
python instagram_exporter.py nombre_del_perfil --confirm-permission
```

Puedes navegar a otro perfil antes de escribir `CONTINUAR`; se exportara el
perfil que este abierto en el navegador en ese momento.

## Probar con pocas publicaciones

```powershell
python instagram_exporter.py --max-posts 10 --confirm-permission
```

La sesion se conserva en `.instagram_browser_session`, de modo que normalmente
no tendras que iniciar sesion de nuevo en ejecuciones posteriores.

Si Chrome no esta instalado, usa Chromium:

```powershell
python instagram_exporter.py --browser chromium --confirm-permission
```

No uses `--headless` con este flujo, porque necesitas interactuar manualmente con
el navegador antes de dar la orden de continuar.

## Estructura de salida

Sin `--output`, la primera exportacion diaria usa el nombre
`usuario_yyyymmdd`. Si ya existe, las siguientes agregan la hora y los minutos:
`usuario_yyyymmdd_hhmm`. Puedes seguir usando `--output salida_cliente` para
elegir manualmente otro nombre. Si coinciden dos exportaciones en el mismo
minuto, se agrega un contador final para no sobrescribirlas.

```text
conoceramica_20260806/
|-- post_urls.txt
|-- posts.csv
|-- posts.json
`-- posts/
    `-- 0001_2026-08-01_CODIGO_texto-de-la-publicacion/
        |-- 01_image.jpg
        |-- 02_video.mp4
        |-- caption.txt
        |-- article_text_raw.txt
        |-- metadata.json
        `-- source_url.txt
```

## Limitaciones

Instagram modifica regularmente sus selectores y su interfaz. Si deja de
detectar leyendas o el boton de un carrusel, probablemente haya que actualizar
los selectores. La API oficial de Instagram es preferible para una solucion de
produccion cuando cada cliente puede autorizar una cuenta profesional.

## Preparar los medios para una web o aplicacion

Despues de exportar, ejecuta el organizador e indica la carpeta de la
exportacion:

```powershell
python organizar_multimedia.py --root conoceramica_20260806
```

El organizador usa modelos visuales locales mediante Ollama. Al comenzar muestra
un menu para elegir el modelo; `qwen3-vl:4b` es la opcion predeterminada y basta
con presionar `Enter` para seleccionarla. Si el
modelo seleccionado no esta instalado, ejecuta su descarga automaticamente. Si
ya esta instalado, lo reutiliza sin descargarlo otra vez.

Tambien se puede elegir el modelo sin mostrar el menu:

```powershell
python organizar_multimedia.py --root conoceramica_20260806 --model qwen3-vl:4b
```

Ollama debe estar instalado y su servicio debe estar iniciado. El procesamiento
se realiza localmente y no requiere una clave ni consumo de la API de OpenAI.

El resultado se guarda directamente en `categorized_multimedia/`, sin subcarpetas.
Cada imagen o video incorpora categoria, descripcion, publicacion e identidad
del medio en su nombre. La misma carpeta incluye:

- `registro_categorized_multimedia.csv`, inventario tabular completo;
- `catalogo_multimedia.json`, metadatos utilizables desde una web o aplicacion;
- `sistema_diseno.json`, paleta global, formas, estilos y composiciones sugeridas;
- `LEEME_RESULTADO.txt`, resumen y verificacion del proceso.

Las paletas HEX se calculan desde los pixeles reales. Las formas, el estilo y la
composicion son interpretaciones automaticas del modelo visual y conviene
revisarlas antes de convertirlas en decisiones definitivas de diseno.
