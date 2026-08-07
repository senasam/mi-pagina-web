#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ORGANIZADOR MULTIMEDIA CERAMICA v5.0

Este programa:
1. Pide solamente la carpeta principal.
2. Recorre todas sus subcarpetas de manera recursiva.
3. Analiza primero y exclusivamente el contenido visual de imagenes y videos.
4. Usa los textos cercanos solo para validar, nunca para inventar el nombre.
5. Genera nombres breves, descriptivos, unicos y aptos para web.
6. NO modifica los originales.
7. Crea una carpeta llamada "categorized_multimedia" con los informes y una
   subcarpeta "archivos_renombrados" que contiene copias de todas las imagenes
   y videos analizados usando sus nombres nuevos.
8. Registra paletas, formas, estilos y composiciones para iniciar un sistema de
   diseno web.
9. Si ya existe una salida anterior, la conserva con un nombre de respaldo.
10. Verifica al final que la subcarpeta de copias contenga la misma cantidad de
   medios que la entrada y crea un registro CSV.

La primera ejecucion necesita Internet para instalar dependencias y descargar
el modelo visual elegido mediante Ollama. Las siguientes ejecuciones comprueban
que siga instalado y lo reutilizan localmente.
"""

from __future__ import annotations

import os

# Deben definirse antes de importar Transformers/Torch.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

import colorsys
import base64
import csv
import html
import importlib.util
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.request
import zipfile
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Sequence
from xml.etree import ElementTree


PROGRAM_VERSION = "6.0"
DEFAULT_OLLAMA_MODEL = os.environ.get("CERAMICA_MODEL_ID", "qwen3-vl:4b")
OLLAMA_API_URL = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL_OPTIONS = (
    ("qwen3-vl:4b", "recomendado: buen equilibrio entre calidad y velocidad"),
    ("qwen3-vl:8b", "mayor calidad, pero considerablemente mas lento"),
    ("qwen2.5vl:3b", "alternativa visual mas liviana"),
)
OUTPUT_DIRECTORY_NAME = "categorized_multimedia"
RENAMED_MEDIA_DIRECTORY_NAME = "archivos_renombrados"
LEGACY_OUTPUT_DIRECTORY_NAMES = {"multimedia_output"}
REPORT_NAME = "registro_categorized_multimedia.csv"
SUMMARY_NAME = "LEEME_RESULTADO.txt"
CATALOG_NAME = "catalogo_multimedia.json"
DESIGN_SYSTEM_NAME = "sistema_diseno.json"
VIDEO_SAMPLE_FRAMES = 10
MAX_CONTEXT_TOTAL_CHARS = 2600
MAX_CONTEXT_FILE_CHARS = 1400
MAX_CONTEXT_FILES = 3
MAX_TEXT_FILE_BYTES = 20 * 1024 * 1024
MAX_FILENAME_LENGTH = 95
WINDOWS_SAFE_PATH_LIMIT = 240
MODEL_RETRY_MIN_FIELDS = 5
LOW_CONFIDENCE_THRESHOLD = 55
TEXT_CONTAMINATION_THRESHOLD = 0.42

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff", ".gif",
    ".heic", ".heif", ".avif",
}
VIDEO_EXTENSIONS = {
    ".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".wmv", ".flv",
    ".mpeg", ".mpg", ".3gp", ".mts", ".m2ts",
}
TEXT_EXTENSIONS = {
    ".txt", ".md", ".markdown", ".html", ".htm", ".json", ".jsonl",
    ".csv", ".tsv", ".xml", ".yaml", ".yml", ".rtf", ".docx", ".odt",
    ".pdf", ".srt", ".vtt",
}

CONTEXT_PRIORITY_NAMES = {
    "caption", "copy", "descripcion", "description", "texto", "text",
    "contenido", "content", "post", "publicacion", "metadata", "meta",
    "titulo", "title", "bajada", "guion", "script", "notas", "notes",
}

GENERIC_FOLDER_NAMES = {
    "imagen", "imagenes", "image", "images", "img", "foto", "fotos",
    "video", "videos", "media", "multimedia", "archivo", "archivos",
    "assets", "uploads", "upload", "contenido", "content", "post", "posts",
}

WINDOWS_RESERVED_NAMES = {
    "con", "prn", "aux", "nul",
    *(f"com{i}" for i in range(1, 10)),
    *(f"lpt{i}" for i in range(1, 10)),
}

# Vocabulario canonico. Si el modelo entrega un objeto visual breve que no esta
# aqui, la version 5.0 puede conservarlo de forma segura en el nombre. Estas
# reglas se usan para traducir sinonimos y estabilizar los conceptos frecuentes.
VERB_RULES = [
    ("tornear", ("pottery wheel", "potter wheel", "wheel throwing", "throwing clay", "torno", "torneando", "tornear")),
    ("amasar", ("wedging", "kneading clay", "amasando", "amasar", "preparando arcilla")),
    ("esmaltar", ("glazing", "applying glaze", "esmalte", "esmaltando", "esmaltar", "vidriado")),
    ("pintar", ("painting", "paint brush", "pincel", "pintando", "pintar")),
    ("decorar", ("decorating", "designing", "patterns", "carving", "incising", "sgraffito", "stamping", "texturing", "tallando", "grabando", "decorando", "esgrafiado")),
    ("hornear", ("kiln", "firing", "coccion", "horno", "horneando", "cociendo")),
    ("pulir", ("polishing", "burnishing", "puliendo", "brunido")),
    ("modelar", ("hand building", "hand-building", "sculpting", "shaping clay", "molding clay", "modelando", "moldeando", "modelar", "construccion manual", "pellizco", "churros")),
    ("cortar", ("cutting clay", "cutting", "cortando", "cortar", "calando", "calado")),
    ("verter", ("pouring slip", "casting slip", "vertiendo", "vaciando", "vaciado")),
    ("exhibir", ("displayed", "finished piece", "product photo", "exhibida", "exhibido", "pieza terminada", "producto terminado", "mostrando", "presentando")),
    ("aprender", ("class", "lesson", "students", "teaching", "curso", "clase", "alumnos", "aprendiendo")),
]

OBJECT_RULES = [
    ("tetera", ("teapot", "tetera")),
    ("taza", ("mug", "coffee cup", "ceramic cup", "taza", "tazon")),
    ("pocillo", ("small cup", "espresso cup", "pocillo")),
    ("vaso", ("tumbler", "drinking cup", "vaso")),
    ("copa", ("goblet", "wine cup", "copa")),
    ("cuenco", ("bowl", "cuenco", "bol")),
    ("ensaladera", ("salad bowl", "ensaladera")),
    ("frutero", ("fruit bowl", "frutero")),
    ("plato", ("plate", "dish", "plato")),
    ("fuente", ("serving dish", "platter", "fuente")),
    ("bandeja", ("tray", "bandeja")),
    ("jarron", ("vase", "flower vase", "jarron", "florero")),
    ("jarra", ("pitcher", "jug", "jarra", "jarro")),
    ("botella", ("ceramic bottle", "bottle", "botella")),
    ("macetero", ("planter", "plant pot", "flower pot", "macetero", "maceta")),
    ("azulejo", ("ceramic tile", "clay tile", "tile", "azulejo", "baldosa")),
    ("mural", ("ceramic mural", "wall panel", "mural")),
    ("escultura", ("sculpture", "figurine", "statue", "escultura", "figura", "busto")),
    ("relieve", ("ceramic relief", "bas relief", "relieve")),
    ("aros", ("earring", "earrings", "aros", "pendientes")),
    ("colgante", ("pendant", "colgante")),
    ("collar", ("necklace", "collar")),
    ("portavelas", ("candle holder", "tealight holder", "portavelas", "candelabro")),
    ("porta-incienso", ("incense holder", "incense burner", "porta incienso", "porta-incienso", "incensario")),
    ("lampara", ("ceramic lamp", "lamp base", "lampara")),
    ("jabonera", ("soap dish", "jabonera")),
    ("azucarero", ("sugar bowl", "azucarero")),
    ("salero", ("salt cellar", "salt shaker", "salero")),
    ("alcancia", ("piggy bank", "money box", "alcancia")),
    ("cuchara", ("ceramic spoon", "spoon", "cuchara")),
    ("olla", ("ceramic pot with lid", "cooking pot", "olla")),
    ("vasija", ("clay pot", "ceramic pot", "vessel", "vasija", "recipiente")),
    ("set", ("ceramic set", "tableware set", "juego de ceramica", "conjunto")),
    ("pieza", ("ceramic object", "ceramic piece", "clay piece", "pottery piece", "pieza ceramica", "pieza de arcilla")),
]

TECHNIQUE_RULES = [
    ("torno", ("pottery wheel", "potter wheel", "wheel throwing", "torno")),
    ("modelado-manual", ("hand building", "hand-building", "built by hand", "modelado manual", "construccion manual")),
    ("pellizco", ("pinch pot", "pinching", "tecnica de pellizco", "pellizco")),
    ("churros", ("coil building", "coiling", "churros", "rollos de arcilla")),
    ("placas", ("slab building", "clay slab", "placas", "planchas de arcilla")),
    ("laminado", ("rolling pin", "rolled clay", "rodillo", "lamina de arcilla", "laminado")),
    ("esgrafiado", ("sgraffito", "incising", "scratching design", "esgrafiado")),
    ("tallado", ("carving", "carved", "tallado")),
    ("calado", ("piercing clay", "cutout", "openwork", "calado")),
    ("texturizado", ("texturing", "stamping", "impressed texture", "textura", "estampado")),
    ("impresion", ("printing on clay", "image transfer", "transfer", "impresion", "calcomania")),
    ("engobe", ("slip decoration", "colored slip", "engobe")),
    ("esmaltado", ("glazing", "glazed", "glaze", "esmaltado", "esmalte", "vidriado")),
    ("pintado", ("painting", "painted", "brush", "pincel", "pintado")),
    ("coccion", ("kiln", "firing", "coccion", "horno")),
    ("raku", ("raku", "rakú")),
    ("nerikomi", ("nerikomi", "colored clay pattern")),
    ("pulido", ("polishing", "burnishing", "pulido", "brunido")),
    ("amasado", ("wedging", "kneading", "amasado")),
    ("vaciado", ("slip casting", "casting", "vaciado", "barbotina")),
    ("molde", ("mold", "mould", "molde")),
]

MATERIAL_RULES = [
    ("porcelana", ("porcelain", "porcelana")),
    ("gres", ("stoneware", "gres")),
    ("loza", ("earthenware", "loza")),
    ("terracota", ("terracotta", "terracota")),
    ("arcilla", ("clay", "barro", "arcilla", "pasta ceramica")),
    ("ceramica", ("ceramic", "ceramics", "pottery", "ceramica")),
]

SCENE_RULES = [
    ("clase", ("class", "lesson", "students", "curso", "clase", "alumnos")),
    ("taller", ("studio", "workshop", "taller")),
    ("herramientas", ("tools", "pottery tools", "herramientas")),
    ("mesa", ("work table", "wooden table", "table", "mesa")),
    ("manos", ("hands", "hand working", "manos")),
    ("torno", ("pottery wheel", "wheel", "torno")),
    ("horno", ("kiln", "horno")),
    ("estanteria", ("shelf", "shelving", "estanteria", "repisa")),
    ("exhibicion", ("display", "exhibition", "product display", "exhibicion", "vitrina")),
]

COLOR_RULES = [
    ("azul", ("blue", "azul", "celeste", "turquesa")),
    ("verde", ("green", "verde", "oliva")),
    ("blanco", ("white", "blanco", "crema", "marfil")),
    ("negro", ("black", "negro")),
    ("gris", ("gray", "grey", "gris")),
    ("rojo", ("red", "rojo", "burdeo")),
    ("rosado", ("pink", "rosado", "rosa")),
    ("amarillo", ("yellow", "amarillo", "ocre")),
    ("naranjo", ("orange", "naranjo")),
    ("morado", ("purple", "morado", "violeta", "lila")),
    ("marron", ("brown", "marron", "cafe", "beige", "arena")),
]

UNKNOWN_VALUES = {
    "", "no-identificado", "no-identificada", "no identificado", "no identificada",
    "desconocido", "desconocida", "ninguno", "ninguna", "n/a", "na",
}

FIELD_STOPWORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del",
    "en", "con", "por", "para", "y", "o", "principal", "visible", "objeto",
    "ceramico", "ceramica", "pieza",
}


@dataclass
class TextContext:
    text: str
    sources: list[str]


@dataclass
class ModelFields:
    action: str
    obj: str
    technique: str
    detail: str
    colors: str
    shapes: str
    style: str
    composition: str
    raw: str

    @property
    def combined(self) -> str:
        return " ".join([
            self.action, self.obj, self.technique, self.detail, self.colors,
            self.shapes, self.style, self.composition, self.raw,
        ])


@dataclass
class ProcessResult:
    original: str
    copied: str
    generated_name: str
    media_type: str
    category: str
    publication: str
    color_palette: list[str]
    shapes: str
    visual_style: str
    composition: str
    folder_context: str
    text_sources: str
    model_response: str
    confidence: int
    analysis_quality: str
    text_validation: str
    status: str
    error: str = ""


# ---------------------------------------------------------------------------
# Dependencias y arranque
# ---------------------------------------------------------------------------

def restart_program(root: Path) -> None:
    script = str(Path(__file__).resolve())
    print("\nReiniciando una vez para activar los componentes instalados...\n")
    arguments = [sys.executable, script, "--root", str(root), "--deps-ready"]
    selected_model = parse_named_argument("--model")
    if selected_model:
        arguments.extend(["--model", selected_model])
    os.execv(sys.executable, arguments)


def ensure_dependencies(root: Path) -> None:
    requirements = [
        ("PIL", "Pillow>=10"),
        ("cv2", "opencv-python>=4.9"),
        ("num2words", "num2words>=0.5"),
        ("pillow_heif", "pillow-heif>=0.18"),
        ("pypdf", "pypdf>=5"),
    ]

    missing: list[str] = []
    for module_name, pip_requirement in requirements:
        if importlib.util.find_spec(module_name) is None:
            missing.append(pip_requirement)

    if not missing:
        return

    print("\nFaltan componentes. Se instalaran automaticamente:")
    for item in missing:
        print(f"  - {item}")

    command = [sys.executable, "-m", "pip", "install", "--upgrade", *missing]
    try:
        subprocess.check_call(command)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            "No fue posible instalar las dependencias. Revisa la conexion a "
            "Internet y los permisos de Python."
        ) from exc

    restart_program(root)


def parse_named_argument(name: str) -> str:
    if name in sys.argv:
        index = sys.argv.index(name)
        if index + 1 < len(sys.argv):
            return sys.argv[index + 1]
    return ""


def parse_root_argument() -> str:
    return parse_named_argument("--root")


def normalize_path_input(raw_value: str) -> Path:
    value = raw_value.strip().strip('"').strip("'")
    value = os.path.expandvars(os.path.expanduser(value))
    return Path(value).resolve()


# ---------------------------------------------------------------------------
# Descubrimiento de medios y textos
# ---------------------------------------------------------------------------

def ascii_slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower().strip())
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-{2,}", "-", text).strip("-")


def is_generated_output(path: Path, root: Path) -> bool:
    try:
        relative = path.relative_to(root)
    except ValueError:
        return False
    if not relative.parts:
        return False
    first_part = relative.parts[0].lower()
    output_names = {OUTPUT_DIRECTORY_NAME.lower(), *LEGACY_OUTPUT_DIRECTORY_NAMES}
    return any(first_part.startswith(name) for name in output_names)


def media_files(root: Path) -> list[Path]:
    supported = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS
    found: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file() or is_generated_output(path, root):
            continue
        if path.suffix.lower() in supported:
            found.append(path)
    return sorted(found, key=lambda item: str(item).casefold())


def clean_whitespace(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def decode_text_bytes(data: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="ignore")


def strip_markup(text: str) -> str:
    text = re.sub(r"<script\b[^>]*>.*?</script>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<style\b[^>]*>.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    return clean_whitespace(html.unescape(text))


def flatten_json_values(value) -> list[str]:
    result: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(key, str):
                result.append(key)
            result.extend(flatten_json_values(item))
    elif isinstance(value, list):
        for item in value:
            result.extend(flatten_json_values(item))
    elif isinstance(value, (str, int, float, bool)):
        result.append(str(value))
    return result


def read_docx_or_odt(path: Path) -> str:
    member = "word/document.xml" if path.suffix.lower() == ".docx" else "content.xml"
    with zipfile.ZipFile(path) as archive:
        xml_data = archive.read(member)
    xml_root = ElementTree.fromstring(xml_data)
    parts = [element.text for element in xml_root.iter() if element.text]
    return clean_whitespace(" ".join(parts))


def read_pdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    pages: list[str] = []
    for page in reader.pages[:6]:
        pages.append(page.extract_text() or "")
        if sum(len(page_text) for page_text in pages) >= MAX_CONTEXT_FILE_CHARS:
            break
    return clean_whitespace(" ".join(pages))


def read_text_document(path: Path) -> str:
    try:
        if path.stat().st_size > MAX_TEXT_FILE_BYTES:
            return ""
    except OSError:
        return ""

    extension = path.suffix.lower()
    try:
        if extension == ".pdf":
            text = read_pdf(path)
        elif extension in {".docx", ".odt"}:
            text = read_docx_or_odt(path)
        else:
            text = decode_text_bytes(path.read_bytes())
            if extension in {".html", ".htm", ".xml"}:
                text = strip_markup(text)
            elif extension in {".json", ".jsonl"}:
                try:
                    text = " ".join(flatten_json_values(json.loads(text)))
                except json.JSONDecodeError:
                    pass
            elif extension == ".rtf":
                text = re.sub(r"\\'[0-9a-fA-F]{2}", " ", text)
                text = re.sub(r"\\[a-zA-Z]+-?\d* ?", " ", text)
                text = text.replace("{", " ").replace("}", " ")
            text = clean_whitespace(text)
    except Exception:
        return ""

    return text[:MAX_CONTEXT_FILE_CHARS].strip()


def context_file_score(path: Path, media_path: Path, root: Path) -> tuple[int, int, str]:
    score = 0
    text_stem = ascii_slug(path.stem)
    media_stem = ascii_slug(media_path.stem)

    if text_stem == media_stem:
        score += 120
    elif media_stem and len(media_stem) < 70 and (media_stem in text_stem or text_stem in media_stem):
        score += 75

    if any(word in text_stem.split("-") for word in CONTEXT_PRIORITY_NAMES):
        score += 50

    if path.parent == media_path.parent:
        score += 40
    elif path.parent == media_path.parent.parent:
        score += 12

    try:
        media_depth = len(media_path.parent.relative_to(root).parts)
        text_depth = len(path.parent.relative_to(root).parts)
        distance = abs(media_depth - text_depth)
    except ValueError:
        distance = 99

    return (-score, distance, path.name.casefold())


def nearby_text_candidates(media_path: Path, root: Path) -> list[Path]:
    directories = [media_path.parent]
    current = media_path.parent
    for _ in range(2):
        if current == root or root not in current.parents:
            break
        current = current.parent
        directories.append(current)
        if current == root:
            break

    candidates: list[Path] = []
    seen: set[Path] = set()
    for directory in directories:
        try:
            entries = directory.iterdir()
        except OSError:
            continue
        for path in entries:
            if (
                path.is_file()
                and path.suffix.lower() in TEXT_EXTENSIONS
                and path not in seen
                and not is_generated_output(path, root)
            ):
                candidates.append(path)
                seen.add(path)

    candidates.sort(key=lambda path: context_file_score(path, media_path, root))
    return candidates


def collect_text_context(media_path: Path, root: Path) -> TextContext:
    snippets: list[str] = []
    sources: list[str] = []
    total = 0

    for path in nearby_text_candidates(media_path, root):
        if len(sources) >= MAX_CONTEXT_FILES or total >= MAX_CONTEXT_TOTAL_CHARS:
            break
        text = read_text_document(path)
        if len(text) < 8:
            continue
        remaining = MAX_CONTEXT_TOTAL_CHARS - total
        text = text[:remaining]
        source_name = str(path.relative_to(root))
        snippets.append(f"Documento {source_name}: {text}")
        sources.append(source_name)
        total += len(text)

    return TextContext(text="\n".join(snippets), sources=sources)


def folder_context(file_path: Path, root: Path) -> str:
    try:
        parts = file_path.parent.relative_to(root).parts
    except ValueError:
        parts = file_path.parent.parts[-4:]

    useful: list[str] = []
    for part in parts[-4:]:
        normalized = ascii_slug(part)
        if normalized and normalized not in GENERIC_FOLDER_NAMES:
            useful.append(normalized)
    return " ".join(useful)


# ---------------------------------------------------------------------------
# Modelo visual mediante Ollama
# ---------------------------------------------------------------------------

def choose_ollama_model() -> str:
    requested = parse_named_argument("--model").strip()
    if requested:
        return requested

    print("\nModelo visual de Ollama:")
    default_index = 1
    for index, (model_name, description) in enumerate(OLLAMA_MODEL_OPTIONS, start=1):
        default_marker = " [predeterminado]" if model_name == DEFAULT_OLLAMA_MODEL else ""
        if default_marker:
            default_index = index
        print(f"  {index}. {model_name}{default_marker} - {description}")
    print("  4. Escribir otro modelo visual de Ollama")

    answer = input(
        f"Selecciona un modelo [{default_index}] "
        "(presiona Enter para usar el predeterminado): "
    ).strip()
    if not answer:
        return DEFAULT_OLLAMA_MODEL
    if answer.isdigit():
        selected = int(answer)
        if 1 <= selected <= len(OLLAMA_MODEL_OPTIONS):
            return OLLAMA_MODEL_OPTIONS[selected - 1][0]
        if selected == len(OLLAMA_MODEL_OPTIONS) + 1:
            custom = input("Nombre exacto del modelo visual: ").strip()
            if custom:
                return custom
    print(f"Opcion no reconocida; se usara {DEFAULT_OLLAMA_MODEL}.")
    return DEFAULT_OLLAMA_MODEL


def installed_ollama_models() -> set[str]:
    if shutil.which("ollama") is None:
        raise RuntimeError(
            "Ollama no esta instalado o no aparece en PATH. Instalalo desde ollama.com."
        )
    try:
        completed = subprocess.run(
            ["ollama", "list"],
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=30,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError) as exc:
        raise RuntimeError(
            "No fue posible consultar Ollama. Comprueba que su servicio este iniciado."
        ) from exc

    models: set[str] = set()
    for line in completed.stdout.splitlines()[1:]:
        columns = line.split()
        if columns:
            models.add(columns[0])
    return models


def model_is_installed(model_name: str, installed: set[str]) -> bool:
    if model_name in installed:
        return True
    if ":" not in model_name and f"{model_name}:latest" in installed:
        return True
    return False


def ollama_model_capabilities(model_name: str) -> set[str]:
    request = urllib.request.Request(
        f"{OLLAMA_API_URL}/api/show",
        data=json.dumps({"model": model_name}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as result:
            payload = json.loads(result.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"No fue posible inspeccionar el modelo {model_name}.") from exc
    return {str(item).lower() for item in payload.get("capabilities", [])}


def ensure_ollama_model(model_name: str) -> str:
    installed = installed_ollama_models()
    if model_is_installed(model_name, installed):
        print(f"\nModelo de Ollama instalado: {model_name}")
    else:
        print(f"\nEl modelo {model_name} no esta instalado.")
        print("Se descargara automaticamente con Ollama; esto puede tardar varios minutos.")
        try:
            subprocess.check_call(["ollama", "pull", model_name])
        except (subprocess.CalledProcessError, OSError) as exc:
            raise RuntimeError(f"No fue posible instalar el modelo {model_name}.") from exc

        if not model_is_installed(model_name, installed_ollama_models()):
            raise RuntimeError(f"Ollama termino la descarga, pero no se encontro {model_name}.")
        print(f"Modelo instalado correctamente: {model_name}")

    if "vision" not in ollama_model_capabilities(model_name):
        raise RuntimeError(
            f"El modelo {model_name} no acepta imagenes. Elige un modelo visual (VL)."
        )
    return model_name


def video_frames(video_path: Path, count: int = VIDEO_SAMPLE_FRAMES):
    import cv2
    from PIL import Image

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError("OpenCV no pudo abrir el video.")

    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    frames: list[Image.Image] = []

    try:
        if frame_count > 0:
            if count <= 1:
                fractions = [0.50]
            else:
                fractions = [0.04 + index * (0.92 / (count - 1)) for index in range(count)]
            for fraction in fractions:
                capture.set(cv2.CAP_PROP_POS_FRAMES, max(0, int((frame_count - 1) * fraction)))
                ok, frame = capture.read()
                if ok and frame is not None:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(Image.fromarray(rgb))
        else:
            sampled: list[Image.Image] = []
            index = 0
            while index < 1800:
                ok, frame = capture.read()
                if not ok:
                    break
                if index % 45 == 0:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    sampled.append(Image.fromarray(rgb))
                index += 1
            if sampled:
                if len(sampled) <= count:
                    frames = sampled
                elif count <= 1:
                    frames = [sampled[len(sampled) // 2]]
                else:
                    indexes = [round(i * (len(sampled) - 1) / (count - 1)) for i in range(count)]
                    frames = [sampled[item_index] for item_index in indexes]
    finally:
        capture.release()

    if not frames:
        raise RuntimeError("No fue posible extraer fotogramas del video.")
    return frames


def save_frames_temporarily(frames: Sequence, directory: Path) -> list[Path]:
    paths: list[Path] = []
    for index, frame in enumerate(frames, start=1):
        path = directory / f"frame-{index:02d}.jpg"
        frame.convert("RGB").save(path, "JPEG", quality=88)
        paths.append(path)
    return paths


def build_visual_prompt(media_type: str, frame_count: int) -> str:
    visual_note = (
        f"Las {frame_count} imagenes son fotogramas ordenados del mismo video. "
        "Identifica la accion repetida o dominante a lo largo de la secuencia."
        if media_type == "video"
        else "Analiza exclusivamente esta fotografia."
    )
    return f"""
Eres un catalogador visual especializado en ceramica. {visual_note}

REGLAS OBLIGATORIAS:
- Mira formas, volumenes, manos, herramientas, superficies y objetos.
- Ignora letras, subtitulos, logotipos, carteles y cualquier texto escrito.
- No deduzcas el contenido desde palabras visibles ni inventes informacion.
- OBJETO debe ser el sustantivo mas especifico que realmente se vea, por ejemplo:
  taza, bandeja ovalada, porta incienso, macetero, escultura, cuenco o jarron.
- No uses "pieza" en OBJETO salvo que sea imposible reconocer algo mas preciso.
- Si no hay una accion y se muestra un objeto terminado, usa ACCION=exhibir.
- TECNICA solo puede indicar una tecnica o herramienta que sea visualmente reconocible.
- DETALLE debe indicar material o ambiente visible, no una frase narrativa.

Responde en espanol con exactamente estas ocho lineas y nada mas:
ACCION=una a tres palabras
OBJETO=una a cuatro palabras
TECNICA=una a tres palabras
DETALLE=una a tres palabras
COLORES=dos a cinco colores
FORMAS=una a cuatro palabras
ESTILO=una a cuatro palabras
COMPOSICION=una a cuatro palabras

Si un campo no se distingue visualmente, escribe no-identificado.
""".strip()


def build_retry_prompt(media_type: str, frame_count: int) -> str:
    subject = (
        f"Revisa nuevamente los {frame_count} fotogramas del video como una sola secuencia."
        if media_type == "video"
        else "Revisa nuevamente la fotografia."
    )
    return f"""
{subject}
No leas ni transcribas palabras presentes en la imagen. Primero reconoce la silueta y
el uso probable del objeto; despues reconoce una accion o herramienta solo si se ve.
No expliques tu razonamiento y no escribas parrafos.

Devuelve exactamente:
ACCION=
OBJETO=
TECNICA=
DETALLE=
COLORES=
FORMAS=
ESTILO=
COMPOSICION=

Completa cada campo en espanol con un maximo de cuatro palabras. Usa no-identificado
cuando la evidencia visual sea insuficiente. Evita el termino generico "pieza".
""".strip()


def is_known_value(value: str) -> bool:
    normalized = ascii_slug(value).replace("-", " ").strip()
    unknown = {ascii_slug(item).replace("-", " ") for item in UNKNOWN_VALUES}
    return bool(normalized and normalized not in unknown)


def structured_field_count(fields: ModelFields) -> int:
    values = (
        fields.action, fields.obj, fields.technique, fields.detail,
        fields.colors, fields.shapes, fields.style, fields.composition,
    )
    return sum(is_known_value(value) for value in values)


def sanitize_model_value(value: str, max_words: int = 6, max_chars: int = 80) -> str:
    value = clean_whitespace(value.replace("**", "").strip(" `\"'[]{}"))
    value = re.sub(r"^(?:respuesta|descripcion|valor)\s*[:=-]\s*", "", value, flags=re.I)
    value = re.sub(r"https?://\S+|www\.\S+", "", value, flags=re.I)
    value = clean_whitespace(value)[:max_chars]
    words = value.split()
    if len(words) > max_words:
        value = " ".join(words[:max_words])
    return value


def generate_visual_response(model_name: str, image_paths: Sequence[Path], prompt: str) -> str:
    encoded_images = [
        base64.b64encode(path.read_bytes()).decode("ascii")
        for path in image_paths
    ]
    messages = [{
        "role": "user",
        "content": prompt,
        "images": encoded_images,
    }]
    payload = {
        "model": model_name,
        "messages": messages,
        "stream": False,
        "think": False,
        "options": {
            "temperature": 0,
            "num_predict": 300,
            "repeat_penalty": 1.15,
        },
    }
    # Las plantillas actuales de qwen3-vl ignoran `think: false` y pueden gastar
    # toda la salida razonando sin entregar contenido. Este prefijo fuerza el
    # modo directo y deja suficiente presupuesto para los ocho campos finales.
    if model_name.casefold().split(":", 1)[0] == "qwen3-vl":
        messages[0]["content"] = f"{prompt}\n/no_think"
        messages.append({"role": "assistant", "content": "<think>\n\n</think>\n\n"})
        payload["raw"] = True
    request = urllib.request.Request(
        f"{OLLAMA_API_URL}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=900) as result:
            response_payload = json.loads(result.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Ollama rechazo el analisis ({exc.code}): {detail}") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(
            "No fue posible obtener una respuesta de Ollama. Comprueba que siga iniciado."
        ) from exc

    response = str(response_payload.get("message", {}).get("content", "")).strip()
    if not response:
        raise RuntimeError("Ollama no devolvio contenido para este medio.")
    return response


def parse_model_fields(raw: str) -> ModelFields:
    source = raw.replace("**", "").replace("\r", "\n")
    source = re.sub(
        r"\s+(?=(?:ACCION|ACCIÓN|OBJETO|TECNICA|TÉCNICA|DETALLE|COLORES?|FORMAS?|ESTILO|COMPOSICION|COMPOSICIÓN)\s*[:=\-])",
        "\n",
        source,
        flags=re.I,
    )
    labels = {
        "accion": r"ACCION|ACCIÓN",
        "objeto": r"OBJETO",
        "tecnica": r"TECNICA|TÉCNICA",
        "detalle": r"DETALLE",
        "colores": r"COLORES?",
        "formas": r"FORMAS?",
        "estilo": r"ESTILO",
        "composicion": r"COMPOSICION|COMPOSICIÓN",
    }
    values: dict[str, str] = {key: "" for key in labels}

    # Acepta guiones o viñetas al inicio, pero cada campo debe estar etiquetado.
    for key, aliases in labels.items():
        match = re.search(
            rf"(?:^|\n)\s*[-*•]?\s*(?:{aliases})\s*[:=\-]\s*([^\n]*)",
            source,
            flags=re.I,
        )
        if match:
            values[key] = sanitize_model_value(match.group(1))

    cleaned = clean_whitespace(source)[:600]
    return ModelFields(
        action=values["accion"],
        obj=values["objeto"],
        technique=values["tecnica"],
        detail=values["detalle"],
        colors=values["colores"],
        shapes=values["formas"],
        style=values["estilo"],
        composition=values["composicion"],
        raw=cleaned,
    )


def meaningful_tokens(text: str) -> set[str]:
    tokens = ascii_slug(text).replace("-", " ").split()
    ignored = FIELD_STOPWORDS | {
        "accion", "objeto", "tecnica", "detalle", "colores", "formas",
        "estilo", "composicion", "documento", "metadata", "caption",
    }
    return {token for token in tokens if len(token) >= 4 and token not in ignored}


def text_contamination_ratio(response: str, context: TextContext) -> float:
    if not context.text:
        return 0.0
    response_tokens = meaningful_tokens(response)
    if len(response_tokens) < 8:
        return 0.0
    context_tokens = meaningful_tokens(context.text)
    return len(response_tokens & context_tokens) / max(1, len(response_tokens))


def context_validation(fields: ModelFields, context: TextContext) -> tuple[int, str]:
    """Solo valida conceptos visuales ya detectados; nunca completa campos."""
    if not context.text:
        return 0, "sin-textos-cercanos"
    context_normalized = normalized_search_text(context.text)
    agreements = 0
    checked = 0
    for value in (fields.obj, fields.technique, fields.detail):
        if not is_known_value(value):
            continue
        checked += 1
        value_tokens = [token for token in ascii_slug(value).split("-") if len(token) >= 4]
        if any(f" {token} " in context_normalized for token in value_tokens):
            agreements += 1
    if not checked:
        return 0, "texto-no-utilizado"
    if agreements:
        return agreements, f"coincide-{agreements}-de-{checked}"
    return 0, "sin-coincidencias-visuales"


def safe_free_slug(value: str, max_tokens: int = 4) -> str:
    if not is_known_value(value):
        return ""
    slug = ascii_slug(value)
    tokens = [token for token in slug.split("-") if token and token not in FIELD_STOPWORDS]
    suspicious = {
        "documento", "metadata", "caption", "publicacion", "instagram", "responder",
        "personas", "selecciones", "tecnologia", "pregunta", "archivo", "imagen",
    }
    tokens = [token for token in tokens if token not in suspicious and not token.isdigit()]
    if not tokens:
        return ""
    return "-".join(tokens[:max_tokens])


def specific_visual_object(fields: ModelFields) -> str:
    canonical = detect_first(fields.obj, OBJECT_RULES)
    if canonical and canonical != "pieza":
        return canonical
    free_value = safe_free_slug(fields.obj, max_tokens=4)
    if free_value not in {"", "pieza", "objeto"}:
        return free_value
    return ""


def analysis_confidence(fields: ModelFields, context: TextContext) -> tuple[int, str, str]:
    count = structured_field_count(fields)
    score = count * 7
    object_name = specific_visual_object(fields)
    if object_name:
        score += 22
    elif is_known_value(fields.obj):
        score += 6
    if is_known_value(fields.action):
        score += 7
    if is_known_value(fields.technique):
        score += 7
    if is_known_value(fields.shapes):
        score += 4
    if is_known_value(fields.colors):
        score += 3

    contamination = text_contamination_ratio(fields.raw, context)
    if contamination >= TEXT_CONTAMINATION_THRESHOLD:
        score -= 32
    elif contamination >= 0.25:
        score -= 14

    agreements, validation = context_validation(fields, context)
    score += min(6, agreements * 2)
    score = max(0, min(100, score))
    quality = "alta" if score >= 75 else "media" if score >= LOW_CONFIDENCE_THRESHOLD else "baja"
    if contamination >= TEXT_CONTAMINATION_THRESHOLD:
        validation = f"posible-contaminacion-{contamination:.0%}"
    return score, quality, validation


def extract_color_palette(images: Sequence, color_count: int = 5) -> list[str]:
    """Calcula colores HEX dominantes usando los pixeles reales del medio."""
    from PIL import Image

    samples = []
    for source in images:
        image = source.convert("RGB").copy()
        image.thumbnail((180, 180), Image.Resampling.LANCZOS)
        samples.append(image)
    if not samples:
        return []

    width = max(image.width for image in samples)
    height = sum(image.height for image in samples)
    combined = Image.new("RGB", (width, height), "white")
    offset = 0
    for image in samples:
        combined.paste(image, (0, offset))
        offset += image.height

    quantized = combined.quantize(colors=max(color_count * 2, 8))
    raw_palette = quantized.getpalette() or []
    ranked = sorted(quantized.getcolors() or [], reverse=True)
    selected: list[tuple[int, int, int]] = []
    for _, palette_index in ranked:
        start = palette_index * 3
        if start + 2 >= len(raw_palette):
            continue
        rgb = tuple(raw_palette[start:start + 3])
        if any(
            sum((left - right) ** 2 for left, right in zip(rgb, previous)) < 28 ** 2
            for previous in selected
        ):
            continue
        selected.append(rgb)
        if len(selected) >= color_count:
            break
    return [f"#{red:02X}{green:02X}{blue:02X}" for red, green, blue in selected]


def describe_media(
    file_path: Path,
    root: Path,
    text_context: TextContext,
    model_name: str,
) -> tuple[ModelFields, str, list[str], int, str, str]:
    from PIL import Image, ImageOps

    try:
        import pillow_heif
        pillow_heif.register_heif_opener()
    except ImportError:
        pass

    temporary_directory: tempfile.TemporaryDirectory[str] | None = None
    try:
        if file_path.suffix.lower() in VIDEO_EXTENSIONS:
            media_type = "video"
            frames = video_frames(file_path)
            palette = extract_color_palette(frames)
            temporary_directory = tempfile.TemporaryDirectory(prefix="frames-ceramica-")
            frame_paths = save_frames_temporarily(frames, Path(temporary_directory.name))
            image_paths = frame_paths
            frame_count = len(frame_paths)
        else:
            media_type = "imagen"
            with Image.open(file_path) as opened:
                normalized = ImageOps.exif_transpose(opened).convert("RGB")
                palette = extract_color_palette([normalized])
                temporary_directory = tempfile.TemporaryDirectory(prefix="imagen-ceramica-")
                normalized_path = Path(temporary_directory.name) / "imagen.jpg"
                normalized.save(normalized_path, "JPEG", quality=92)
            image_paths = [normalized_path]
            frame_count = 1

        # Primera lectura: exclusivamente visual. Los documentos cercanos no se
        # incluyen en el prompt y no pueden introducir palabras en el nombre.
        response = generate_visual_response(
            model_name,
            image_paths,
            build_visual_prompt(media_type, frame_count),
        )
        fields = parse_model_fields(response)
        confidence, quality, validation = analysis_confidence(fields, text_context)

        needs_retry = (
            structured_field_count(fields) < MODEL_RETRY_MIN_FIELDS
            or not specific_visual_object(fields)
            or text_contamination_ratio(fields.raw, text_context) >= TEXT_CONTAMINATION_THRESHOLD
        )
        if needs_retry:
            retry_response = generate_visual_response(
                model_name,
                image_paths,
                build_retry_prompt(media_type, frame_count),
            )
            retry_fields = parse_model_fields(retry_response)
            retry_confidence, retry_quality, retry_validation = analysis_confidence(
                retry_fields, text_context
            )
            if retry_confidence > confidence:
                fields = retry_fields
                confidence = retry_confidence
                quality = retry_quality
                validation = retry_validation

        return fields, media_type, palette, confidence, quality, validation
    finally:
        if temporary_directory is not None:
            temporary_directory.cleanup()


# ---------------------------------------------------------------------------
# Nombre descriptivo controlado
# ---------------------------------------------------------------------------

def normalized_search_text(text: str) -> str:
    slug = ascii_slug(text)
    return f" {slug.replace('-', ' ')} "


def contains_phrase(text: str, phrase: str) -> bool:
    normalized_phrase = normalized_search_text(phrase).strip()
    return f" {normalized_phrase} " in text


def detect_first(text: str, rules: Sequence[tuple[str, Sequence[str]]]) -> str:
    normalized = normalized_search_text(text)
    for canonical, phrases in rules:
        for phrase in phrases:
            if contains_phrase(normalized, phrase):
                return canonical
    return ""


def detect_all(text: str, rules: Sequence[tuple[str, Sequence[str]]], limit: int = 2) -> list[str]:
    normalized = normalized_search_text(text)
    result: list[str] = []
    for canonical, phrases in rules:
        if any(contains_phrase(normalized, phrase) for phrase in phrases):
            result.append(canonical)
            if len(result) >= limit:
                break
    return result


def canonical_or_free(
    value: str,
    rules: Sequence[tuple[str, Sequence[str]]],
    max_tokens: int = 3,
) -> str:
    canonical = detect_first(value, rules)
    if canonical:
        return canonical
    return safe_free_slug(value, max_tokens=max_tokens)


def choose_verb(fields: ModelFields, technique: str, scene_terms: list[str], object_name: str) -> str:
    # Solo usa campos estructurados derivados de la vision. Nunca usa fields.raw.
    detected = detect_first(f"{fields.action} {fields.technique}", VERB_RULES)
    if detected:
        return detected

    free_action = safe_free_slug(fields.action, max_tokens=2)
    accepted_actions = {
        "cortar", "dibujar", "mezclar", "limpiar", "secar", "lavar",
        "aplicar", "mostrar", "exhibir", "presentar", "sostener",
    }
    if free_action in accepted_actions:
        return "exhibir" if free_action in {"mostrar", "presentar", "sostener"} else free_action

    technique_to_verb = {
        "torno": "tornear",
        "modelado-manual": "modelar",
        "pellizco": "modelar",
        "churros": "modelar",
        "placas": "modelar",
        "laminado": "modelar",
        "esgrafiado": "decorar",
        "tallado": "decorar",
        "calado": "cortar",
        "texturizado": "decorar",
        "impresion": "decorar",
        "engobe": "decorar",
        "esmaltado": "esmaltar",
        "pintado": "pintar",
        "coccion": "hornear",
        "raku": "hornear",
        "pulido": "pulir",
        "amasado": "amasar",
        "vaciado": "verter",
        "molde": "modelar",
    }
    if technique in technique_to_verb:
        return technique_to_verb[technique]
    if "clase" in scene_terms:
        return "aprender"
    if object_name and object_name != "pieza":
        return "exhibir"
    return "revisar"


def dominant_color_name(palette: Sequence[str]) -> str:
    """Convierte el primer color HEX real en un nombre basico, como respaldo visual."""
    for color in palette:
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", color):
            continue
        red, green, blue = (int(color[index:index + 2], 16) / 255 for index in (1, 3, 5))
        hue, saturation, value = colorsys.rgb_to_hsv(red, green, blue)
        if value < 0.18:
            return "negro"
        if saturation < 0.12:
            if value > 0.88:
                return "blanco"
            return "gris"
        degrees = hue * 360
        if degrees < 18 or degrees >= 345:
            return "rojo"
        if degrees < 45:
            return "naranjo"
        if degrees < 70:
            return "amarillo"
        if degrees < 165:
            return "verde"
        if degrees < 255:
            return "azul"
        if degrees < 290:
            return "morado"
        if degrees < 345:
            return "rosado"
    return ""


def build_descriptive_slug(
    fields: ModelFields,
    media_type: str,
    palette: Sequence[str],
    confidence: int,
) -> str:
    """Construye el nombre solo desde campos visuales estructurados y pixeles reales."""
    object_name = specific_visual_object(fields) or "pieza"
    technique = canonical_or_free(fields.technique, TECHNIQUE_RULES, max_tokens=3)
    material = detect_first(f"{fields.detail} {fields.obj}", MATERIAL_RULES)
    scene_terms = detect_all(fields.detail, SCENE_RULES, limit=1)
    color = detect_first(fields.colors, COLOR_RULES) or dominant_color_name(palette)
    verb = choose_verb(fields, technique, scene_terms, object_name)

    shape = safe_free_slug(fields.shapes, max_tokens=2)
    generic_shapes = {
        "formas", "forma", "organicas", "organica", "geometricas", "geometrica",
        "redondeadas", "redondeada", "irregulares", "irregular",
    }
    if shape in generic_shapes:
        shape = ""

    tokens: list[str] = []
    if confidence < LOW_CONFIDENCE_THRESHOLD:
        tokens.append("revision")
    tokens.extend([verb, object_name])

    # No se fuerza un material inventado cuando el objeto ya es especifico.
    if material:
        tokens.append(material)
    elif object_name == "pieza":
        tokens.append("ceramica")

    redundant_techniques = {
        ("esmaltar", "esmaltado"),
        ("pintar", "pintado"),
        ("hornear", "coccion"),
        ("hornear", "raku"),
        ("pulir", "pulido"),
        ("amasar", "amasado"),
        ("verter", "vaciado"),
    }
    if technique and technique not in tokens and (verb, technique) not in redundant_techniques:
        tokens.append(technique)

    if shape and shape not in tokens and len(tokens) < 6:
        tokens.append(shape)
    for scene in scene_terms:
        if scene not in tokens and len(tokens) < 6:
            tokens.append(scene)
    if color and color not in tokens and len(tokens) < 7:
        tokens.append(color)
    if media_type == "video" and verb in {"revisar", "exhibir"} and len(tokens) < 6:
        tokens.append("video")

    deduplicated: list[str] = []
    for token in tokens:
        token = ascii_slug(token)
        if token and token not in deduplicated:
            deduplicated.append(token)

    slug = "-".join(deduplicated)[:MAX_FILENAME_LENGTH].rstrip("-")
    if slug in WINDOWS_RESERVED_NAMES:
        slug = f"archivo-{slug}"
    return slug or "revision-contenido-visual"


def fallback_slug(file_path: Path, root: Path, media_type: str) -> str:
    # El respaldo tampoco usa nombres de carpetas ni documentos como descripcion.
    suffix = "video" if media_type == "video" else "imagen"
    return f"revision-contenido-visual-{suffix}"


def classify_media(fields: ModelFields) -> str:
    """Clasifica cada archivo por separado usando solamente evidencia visual estructurada."""
    structured = " ".join([
        fields.action, fields.obj, fields.technique, fields.detail,
        fields.shapes, fields.style, fields.composition,
    ])
    if detect_first(structured, [("clase", SCENE_RULES[0][1])]):
        return "clases-y-cursos"
    if detect_first(f"{fields.action} {fields.technique}", TECHNIQUE_RULES) or detect_first(
        fields.action, VERB_RULES
    ):
        return "procesos-ceramicos"
    if specific_visual_object(fields) or detect_first(fields.obj, OBJECT_RULES):
        return "piezas-ceramicas"
    if detect_first(fields.detail, SCENE_RULES):
        return "taller"
    return "contenido-general"


def publication_identity(file_path: Path, sequence: int) -> tuple[str, str]:
    """Obtiene identificadores legibles de la publicacion y del medio original."""
    metadata_path = file_path.parent / "metadata.json"
    post_index = ""
    shortcode = ""

    if metadata_path.is_file():
        try:
            metadata_row = json.loads(metadata_path.read_text(encoding="utf-8"))
            raw_index = metadata_row.get("index")
            if isinstance(raw_index, int) or str(raw_index).isdigit():
                post_index = f"{int(raw_index):04d}"
            shortcode = ascii_slug(str(metadata_row.get("shortcode", "")))
        except (OSError, UnicodeError, ValueError, TypeError, json.JSONDecodeError):
            pass

    if not post_index:
        folder_match = re.match(r"^(\d{1,8})(?:_|-|$)", file_path.parent.name)
        if folder_match:
            post_index = f"{int(folder_match.group(1)):04d}"

    media_match = re.match(r"^(\d{1,8})(?:_|-|$)", file_path.stem)
    media_index = f"{int(media_match.group(1)):02d}" if media_match else ""

    if post_index:
        publication = f"post-{post_index}"
        if shortcode:
            publication = f"{publication}-{shortcode}"
    else:
        publication = f"grupo-{sequence:04d}"

    # El nombre conserva una identidad corta para dejar espacio a la descripcion.
    # La publicacion completa, incluido el shortcode, permanece en CSV y JSON.
    identity_parts = [f"p{post_index}" if post_index else f"g{sequence:04d}"]
    if media_index:
        identity_parts.append(f"m{media_index}")
    identity_parts.append(f"a{sequence:04d}")
    return publication, "-".join(identity_parts)


def destination_slug_limit(output_root: Path, extension: str) -> int:
    """Reduce el nombre cuando la ruta completa podria superar el limite de Windows."""
    if os.name != "nt":
        return MAX_FILENAME_LENGTH
    folder_length = len(str(output_root.resolve()))
    available = WINDOWS_SAFE_PATH_LIMIT - folder_length - 1 - len(extension)
    return max(24, min(MAX_FILENAME_LENGTH, available))


def compose_unique_slug(
    descriptive_slug: str,
    category: str,
    identity: str,
    max_length: int = MAX_FILENAME_LENGTH,
) -> str:
    """Combina categoria, descripcion e identidad sin exceder el largo permitido."""
    max_length = max(24, max_length)
    identity = ascii_slug(identity) or "archivo"
    description = ascii_slug(descriptive_slug) or "contenido"
    category = ascii_slug(category) or "contenido-general"
    prefix = f"{category}-{description}"
    available = max_length - len(identity) - 1
    if available <= 0:
        return identity[-max_length:].strip("-")
    prefix = prefix[:available].rstrip("-") or category[:available].rstrip("-")
    return f"{prefix}-{identity}"


# ---------------------------------------------------------------------------
# Salida, copia y verificacion
# ---------------------------------------------------------------------------

def prepare_clean_output(root: Path) -> tuple[Path, Path, Path | None]:
    output_root = root / OUTPUT_DIRECTORY_NAME
    media_output_root = output_root / RENAMED_MEDIA_DIRECTORY_NAME
    backup: Path | None = None

    if output_root.exists():
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup = root / f"{OUTPUT_DIRECTORY_NAME}_anterior_{stamp}"
        counter = 2
        while backup.exists():
            backup = root / f"{OUTPUT_DIRECTORY_NAME}_anterior_{stamp}_{counter:02d}"
            counter += 1
        output_root.rename(backup)

    output_root.mkdir(parents=True, exist_ok=False)
    media_output_root.mkdir(parents=True, exist_ok=False)
    return output_root, media_output_root, backup


def extended_windows_path(path: Path) -> str:
    """Usa el prefijo de ruta extendida para evitar WinError 3 por rutas largas."""
    value = str(path.resolve())
    if os.name != "nt" or value.startswith("\\\\?\\"):
        return value
    if value.startswith("\\\\"):
        return "\\\\?\\UNC\\" + value.lstrip("\\")
    return "\\\\?\\" + value


def path_exists(path: Path) -> bool:
    return os.path.exists(extended_windows_path(path))


def unique_destination(source: Path, desired: Path) -> Path:
    desired.parent.mkdir(parents=True, exist_ok=True)
    if not path_exists(desired):
        return desired

    counter = 2
    while True:
        candidate = desired.with_name(f"{desired.stem}-{counter:02d}{desired.suffix}")
        if not path_exists(candidate):
            return candidate
        counter += 1


def output_path_for(
    source: Path,
    output_root: Path,
    slug: str,
) -> Path:
    return output_root / f"{slug}{source.suffix.lower()}"


def verified_copy(source: Path, destination: Path) -> None:
    source_fs = extended_windows_path(source)
    destination_fs = extended_windows_path(destination)
    shutil.copy2(source_fs, destination_fs)
    if not os.path.exists(destination_fs):
        raise RuntimeError("La copia no aparecio en la carpeta de salida.")
    if os.path.getsize(source_fs) != os.path.getsize(destination_fs):
        raise RuntimeError("La copia tiene un tamano diferente al original.")


def write_report(output_root: Path, results: Iterable[ProcessResult]) -> Path:
    report_path = output_root / REPORT_NAME
    with report_path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.writer(file)
        writer.writerow([
            "version_programa",
            "archivo_original",
            "archivo_copiado",
            "nombre_generado",
            "tipo",
            "categoria",
            "publicacion",
            "paleta_hex",
            "formas",
            "estilo_visual",
            "composicion",
            "contexto_carpetas",
            "documentos_contexto",
            "respuesta_modelo",
            "confianza_porcentaje",
            "calidad_analisis",
            "validacion_textual",
            "estado",
            "error",
        ])
        for result in results:
            writer.writerow([
                PROGRAM_VERSION,
                result.original,
                result.copied,
                result.generated_name,
                result.media_type,
                result.category,
                result.publication,
                " | ".join(result.color_palette),
                result.shapes,
                result.visual_style,
                result.composition,
                result.folder_context,
                result.text_sources,
                result.model_response,
                result.confidence,
                result.analysis_quality,
                result.text_validation,
                result.status,
                result.error,
            ])
    return report_path


def write_catalog(output_root: Path, results: Sequence[ProcessResult]) -> Path:
    catalog_path = output_root / CATALOG_NAME
    catalog_path.write_text(
        json.dumps([asdict(result) for result in results], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return catalog_path


def design_palette(results: Sequence[ProcessResult], limit: int = 10) -> list[dict[str, object]]:
    """Agrupa colores cercanos para proponer una paleta global manejable."""
    buckets: Counter[tuple[int, int, int]] = Counter()
    for result in results:
        for color in result.color_palette:
            if not re.fullmatch(r"#[0-9A-Fa-f]{6}", color):
                continue
            rgb = tuple(int(color[index:index + 2], 16) for index in (1, 3, 5))
            bucket = tuple(min(255, round(channel / 32) * 32) for channel in rgb)
            buckets[bucket] += 1
    return [
        {
            "hex": f"#{red:02X}{green:02X}{blue:02X}",
            "apariciones": count,
        }
        for (red, green, blue), count in buckets.most_common(limit)
    ]


def frequent_descriptors(values: Iterable[str], limit: int = 12) -> list[dict[str, object]]:
    counter = Counter(
        clean_whitespace(value).lower()
        for value in values
        if value and ascii_slug(value) not in {"no-identificado", "no-identificada"}
    )
    return [
        {"descripcion": description, "apariciones": count}
        for description, count in counter.most_common(limit)
    ]


def write_design_system(output_root: Path, results: Sequence[ProcessResult]) -> Path:
    design_path = output_root / DESIGN_SYSTEM_NAME
    categories = Counter(result.category for result in results)
    payload = {
        "version_programa": PROGRAM_VERSION,
        "generado": datetime.now().isoformat(timespec="seconds"),
        "nota": (
            "Base automatica para iniciar el sistema de diseno; debe revisarse "
            "antes de definir colores y componentes definitivos."
        ),
        "paleta_global_sugerida": design_palette(results),
        "formas_frecuentes": frequent_descriptors(result.shapes for result in results),
        "estilos_frecuentes": frequent_descriptors(result.visual_style for result in results),
        "composiciones_frecuentes": frequent_descriptors(
            result.composition for result in results
        ),
        "categorias": dict(categories.most_common()),
        "calidad_analisis": dict(Counter(result.analysis_quality for result in results)),
    }
    design_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return design_path


def count_output_media(output_root: Path) -> int:
    supported = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS
    total = 0
    for _, _, filenames in os.walk(extended_windows_path(output_root)):
        total += sum(Path(filename).suffix.lower() in supported for filename in filenames)
    return total


def write_summary(
    output_root: Path,
    model_name: str,
    input_count: int,
    output_count: int,
    report_path: Path,
    catalog_path: Path,
    design_path: Path,
    media_output_root: Path,
    backup: Path | None,
    errors: int,
    review_count: int,
) -> Path:
    summary_path = output_root / SUMMARY_NAME
    lines = [
        f"ORGANIZADOR MULTIMEDIA CERAMICA v{PROGRAM_VERSION}",
        "",
        f"Modelo visual de Ollama: {model_name}",
        f"Archivos multimedia encontrados: {input_count}",
        f"Archivos multimedia copiados: {output_count}",
        f"Archivos con advertencias o errores: {errors}",
        f"Archivos marcados para revision visual: {review_count}",
        f"Registro CSV: {report_path.name}",
        f"Catalogo JSON: {catalog_path.name}",
        f"Sistema de diseno sugerido: {design_path.name}",
        f"Copias con nombres nuevos: {media_output_root.name}",
        "",
        "Los archivos originales no fueron modificados.",
        "Los textos cercanos solo validaron resultados; no generaron nombres.",
    ]
    if backup is not None:
        lines.append(f"La salida anterior fue conservada en: {backup.name}")
    if input_count == output_count:
        lines.append("VERIFICACION: CORRECTA. La salida contiene todos los medios encontrados.")
    else:
        lines.append("VERIFICACION: ATENCION. La cantidad de salida no coincide con la entrada.")
    summary_path.write_text("\n".join(lines), encoding="utf-8")
    return summary_path


# ---------------------------------------------------------------------------
# Programa principal
# ---------------------------------------------------------------------------

def main() -> int:
    print("=" * 78)
    print(f"ORGANIZADOR MULTIMEDIA CERAMICA v{PROGRAM_VERSION}")
    print(f"MODO: COPIAR A {OUTPUT_DIRECTORY_NAME} SIN MODIFICAR LOS ORIGINALES")
    print("=" * 78)

    raw_folder = parse_root_argument()
    if not raw_folder:
        raw_folder = input("\nCarpeta principal que se debe analizar: ")

    root = normalize_path_input(raw_folder)
    if not root.exists():
        print(f"\nError: la carpeta no existe:\n{root}")
        return 1
    if not root.is_dir():
        print(f"\nError: la ruta no corresponde a una carpeta:\n{root}")
        return 1

    files = media_files(root)
    if not files:
        print("\nNo se encontraron imagenes o videos compatibles.")
        return 0

    print(f"\nArchivos multimedia encontrados: {len(files)}")
    print("Se recorreran todas las subcarpetas.")
    print("Los originales permaneceran intactos.")
    print(f"Resultado final: {root / OUTPUT_DIRECTORY_NAME}")

    try:
        ensure_dependencies(root)
        selected_model = choose_ollama_model()
        selected_model = ensure_ollama_model(selected_model)
        print(f"Modelo visual seleccionado: {selected_model}")
    except Exception as exc:
        print(f"\nError al preparar el modelo: {exc}")
        return 1

    try:
        output_root, media_output_root, backup = prepare_clean_output(root)
    except Exception as exc:
        print(f"\nError al preparar la carpeta de salida: {exc}")
        return 1

    if backup is not None:
        print(f"\nSalida anterior conservada en: {backup}")
    print(f"Nueva salida creada en: {output_root}")
    print(f"Copias renombradas en: {media_output_root}")

    results: list[ProcessResult] = []

    for index, file_path in enumerate(files, start=1):
        relative_original = str(file_path.relative_to(root))
        folder_text = folder_context(file_path, root)
        media_type = "video" if file_path.suffix.lower() in VIDEO_EXTENSIONS else "imagen"
        text_context = TextContext(text="", sources=[])
        fields = parse_model_fields("")
        color_palette: list[str] = []
        confidence = 0
        quality = "baja"
        text_validation = "no-ejecutada"
        analysis_error = ""

        print(f"\n[{index}/{len(files)}] {relative_original}")

        try:
            # Los textos se recopilan para contrastar la lectura visual despues.
            # No se envian al modelo ni se usan para construir el nombre.
            text_context = collect_text_context(file_path, root)
            if text_context.sources:
                print(f"  Textos disponibles para validacion: {', '.join(text_context.sources)}")
            else:
                print("  Textos disponibles para validacion: no encontrados")

            (
                fields,
                media_type,
                color_palette,
                confidence,
                quality,
                text_validation,
            ) = describe_media(
                file_path,
                root,
                text_context,
                selected_model,
            )
            print(f"  Lectura visual: {fields.raw}")
            print(f"  Confianza: {confidence}% ({quality}); validacion: {text_validation}")
            slug = build_descriptive_slug(
                fields,
                media_type,
                color_palette,
                confidence,
            )
        except Exception as exc:
            analysis_error = str(exc)
            confidence = 0
            quality = "baja"
            text_validation = "analisis-fallido"
            slug = fallback_slug(file_path, root, media_type)
            print(f"  Advertencia de analisis: {analysis_error}")
            print("  El archivo igualmente sera copiado con un nombre de revision.")

        publication, identity = publication_identity(file_path, index)
        # Cada archivo recibe su propia categoria; no hereda la de la publicacion.
        category = classify_media(fields)
        slug = compose_unique_slug(
            slug,
            category,
            identity,
            max_length=destination_slug_limit(media_output_root, file_path.suffix.lower()),
        )
        desired = output_path_for(
            file_path,
            media_output_root,
            slug,
        )
        destination = unique_destination(file_path, desired)

        try:
            verified_copy(file_path, destination)
            if analysis_error:
                status = "copiado_con_advertencia"
            elif quality == "baja":
                status = "copiado_para_revision"
            else:
                status = "copiado"
            print(f"  COPIADO COMO: {destination.name}")
            copied_relative = str(destination.relative_to(root))
            copy_error = analysis_error
        except Exception as exc:
            status = "error_copia"
            copied_relative = ""
            copy_error = f"{analysis_error} | {exc}".strip(" |")
            print(f"  ERROR DE COPIA: {exc}")

        results.append(ProcessResult(
            original=relative_original,
            copied=copied_relative,
            generated_name=destination.name,
            media_type=media_type,
            category=category,
            publication=publication,
            color_palette=color_palette,
            shapes=fields.shapes,
            visual_style=fields.style,
            composition=fields.composition,
            folder_context=folder_text,
            text_sources=" | ".join(text_context.sources),
            model_response=fields.raw,
            confidence=confidence,
            analysis_quality=quality,
            text_validation=text_validation,
            status=status,
            error=copy_error,
        ))

    report_path = write_report(output_root, results)
    catalog_path = write_catalog(output_root, results)
    design_path = write_design_system(output_root, results)
    output_count = count_output_media(media_output_root)
    errors = sum(result.status not in {"copiado", "copiado_para_revision"} for result in results)
    review_count = sum(result.analysis_quality == "baja" for result in results)
    summary_path = write_summary(
        output_root,
        selected_model,
        len(files),
        output_count,
        report_path,
        catalog_path,
        design_path,
        media_output_root,
        backup,
        errors,
        review_count,
    )

    print("\n" + "=" * 78)
    print("PROCESO FINALIZADO")
    print(f"Medios encontrados: {len(files)}")
    print(f"Medios presentes en {RENAMED_MEDIA_DIRECTORY_NAME}: {output_count}")
    print(f"Carpeta final: {output_root}")
    print(f"Copias con nombres nuevos: {media_output_root}")
    print(f"Registro: {report_path}")
    print(f"Catalogo para web/app: {catalog_path}")
    print(f"Base del sistema de diseno: {design_path}")
    print(f"Resumen: {summary_path}")
    if len(files) == output_count:
        print("VERIFICACION CORRECTA: todos los medios fueron copiados.")
    else:
        print("ATENCION: la cantidad copiada no coincide con la encontrada.")
    print("Los originales no fueron modificados.")
    print("=" * 78)

    return 0 if len(files) == output_count else 2


if __name__ == "__main__":
    raise SystemExit(main())
