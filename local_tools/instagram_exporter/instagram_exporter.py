#!/usr/bin/env python3
"""Exporta publicaciones de un perfil de Instagram mediante un navegador visible.

Uso previsto: contenido propio o contenido de clientes que hayan autorizado la
copia. No evita inicios de sesion, 2FA, CAPTCHA, bloqueos ni controles de acceso.

Instagram cambia su interfaz con frecuencia. El script intenta ser tolerante a
cambios usando el DOM visible y metadatos de la pagina, pero puede requerir
ajustes futuros en los selectores.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import html
import json
import mimetypes
import re
import sys
import unicodedata
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from playwright.async_api import BrowserContext, Page, TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright


SCRIPT_VERSION = "4.1.0"


POST_PATH_RE = re.compile(
    r"(?:(?:https?:)?//(?:www\.)?instagram\.com)?/"
    r"(?:[A-Za-z0-9._]+/)?(p|reel|reels|tv)/([A-Za-z0-9_-]+)(?:/|$)",
    re.IGNORECASE,
)
NEXT_LABELS = {
    "next",
    "next photo",
    "next video",
    "siguiente",
    "siguiente foto",
    "siguiente video",
    "seguinte",
    "avancar",
    "avançar",
    "proximo",
    "próximo",
    "suivant",
    "weiter",
}
RESERVED_PROFILE_PATHS = {
    "about",
    "accounts",
    "api",
    "challenge",
    "developer",
    "direct",
    "emails",
    "explore",
    "legal",
    "p",
    "privacy",
    "reel",
    "reels",
    "stories",
    "terms",
    "tv",
    "web",
}


@dataclass
class MediaFile:
    index: int
    kind: str
    source_url: str
    filename: str = ""
    content_type: str = ""
    bytes: int = 0
    error: str = ""


@dataclass
class PostRecord:
    index: int
    url: str
    shortcode: str
    post_type: str
    timestamp: str = ""
    caption: str = ""
    raw_article_text: str = ""
    folder: str = ""
    media: list[MediaFile] = field(default_factory=list)
    error: str = ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Descarga fotos, videos y texto de publicaciones de un perfil de "
            "Instagram usando una sesion de navegador visible."
        )
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"Instagram Exporter {SCRIPT_VERSION}",
    )
    parser.add_argument(
        "profile",
        nargs="?",
        default="",
        help=(
            "Usuario o URL del perfil que se abrira inicialmente. Es opcional: "
            "tambien puedes navegar manualmente al perfil antes de continuar."
        ),
    )
    parser.add_argument(
        "--output",
        default="",
        help=(
            "Carpeta de salida. Si se omite, se crea automaticamente como "
            "usuario_yyyymmdd (y se agrega _hhmm si ya existe)."
        ),
    )
    parser.add_argument(
        "--session-dir",
        default=".instagram_browser_session",
        help="Carpeta donde se conserva la sesion del navegador.",
    )
    parser.add_argument(
        "--max-posts",
        type=int,
        default=0,
        help="Cantidad maxima de publicaciones; 0 significa todas las detectadas.",
    )
    parser.add_argument(
        "--scroll-pause",
        type=float,
        default=1.8,
        help="Pausa entre desplazamientos del perfil, en segundos.",
    )
    parser.add_argument(
        "--post-pause",
        type=float,
        default=1.2,
        help="Pausa entre publicaciones, en segundos.",
    )
    parser.add_argument(
        "--browser",
        choices=("chrome", "chromium"),
        default="chrome",
        help="Navegador que abrira Playwright.",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Ejecutar sin ventana. No se recomienda para el primer inicio de sesion.",
    )
    parser.add_argument(
        "--confirm-permission",
        action="store_true",
        help=(
            "Opcion heredada para confirmar permiso. Ya no es necesaria en el "
            "modo interactivo; usa el programa solo con contenido autorizado."
        ),
    )
    return parser.parse_args()


def profile_url(value: str) -> str:
    value = value.strip()
    if value.startswith("http://") or value.startswith("https://"):
        parsed = urlparse(value)
        if "instagram.com" not in parsed.netloc.lower():
            raise ValueError("La URL debe pertenecer a instagram.com")
        return f"https://www.instagram.com{parsed.path.rstrip('/')}/"
    username = value.lstrip("@").strip("/")
    if not re.fullmatch(r"[A-Za-z0-9._]+", username):
        raise ValueError("El nombre de usuario contiene caracteres no validos.")
    return f"https://www.instagram.com/{username}/"


def post_reference_from_url(value: str) -> tuple[str, str] | None:
    """Extrae tipo y shortcode desde rutas directas o prefijadas por usuario."""
    value = unquote(value or "").replace("\\/", "/")
    try:
        parsed = urlparse(value)
    except ValueError:
        return None

    if parsed.netloc and "instagram.com" not in parsed.netloc.lower():
        return None

    candidate = parsed.path if parsed.scheme or parsed.netloc else value
    match = POST_PATH_RE.search(candidate)
    if not match:
        return None

    post_type = match.group(1).lower()
    if post_type == "reels":
        post_type = "reel"
    return post_type, match.group(2)


def shortcode_from_url(url: str) -> tuple[str, str]:
    reference = post_reference_from_url(url)
    return reference if reference else ("post", "sin_codigo")


def canonical_post_url(value: str) -> str:
    reference = post_reference_from_url(value)
    if not reference:
        return ""
    post_type, shortcode = reference
    return f"https://www.instagram.com/{post_type}/{shortcode}/"


def safe_slug(text: str, max_length: int = 56) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower().strip()
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return (text[:max_length].rstrip("-") or "sin-texto")


def date_prefix(timestamp: str) -> str:
    if not timestamp:
        return "sin-fecha"
    try:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return safe_slug(timestamp, 16)


def clean_caption_from_og(value: str) -> str:
    if not value:
        return ""
    # Formatos habituales: usuario en Instagram: "texto" o ...: “texto”.
    for left, right in (("\"", "\""), ("“", "”")):
        start = value.find(left)
        end = value.rfind(right)
        if start >= 0 and end > start:
            return value[start + 1 : end].strip()
    marker = ": "
    if marker in value:
        return value.split(marker, 1)[1].strip()
    return value.strip()


def profile_url_from_browser_url(value: str) -> str:
    """Devuelve la URL canonica si la pestaña esta en un perfil de Instagram."""
    try:
        parsed = urlparse(value.strip())
    except ValueError:
        return ""

    host = parsed.netloc.lower().split(":", 1)[0]
    if host not in {"instagram.com", "www.instagram.com", "m.instagram.com"}:
        return ""

    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) != 1:
        return ""

    username = parts[0]
    if username.lower() in RESERVED_PROFILE_PATHS:
        return ""
    if not re.fullmatch(r"[A-Za-z0-9._]+", username):
        return ""
    return f"https://www.instagram.com/{username}/"


def output_directory_for_profile(
    target_url: str,
    requested_output: str = "",
    *,
    now: datetime | None = None,
    base_dir: Path | None = None,
) -> Path:
    """Elige una carpeta unica basada en el usuario y la fecha de exportacion."""
    if requested_output.strip():
        return Path(requested_output).expanduser().resolve()

    canonical_url = profile_url_from_browser_url(target_url)
    if not canonical_url:
        raise ValueError("No se pudo obtener el usuario desde la URL del perfil.")

    username = urlparse(canonical_url).path.strip("/")
    current_time = now or datetime.now()
    parent = (base_dir or Path.cwd()).expanduser().resolve()
    dated_name = f"{username}_{current_time:%Y%m%d}"
    candidate = parent / dated_name
    if not candidate.exists():
        return candidate

    timed_name = f"{dated_name}_{current_time:%H%M}"
    candidate = parent / timed_name
    if not candidate.exists():
        return candidate

    sequence = 2
    while True:
        candidate = parent / f"{timed_name}_{sequence}"
        if not candidate.exists():
            return candidate
        sequence += 1


async def prompt_profile_url(initial_value: str = "") -> str:
    """Pide y valida la direccion del perfil antes de abrir el navegador."""
    candidate = initial_value.strip()
    while True:
        if not candidate:
            candidate = await asyncio.to_thread(
                input,
                "Pega la direccion del perfil de Instagram: ",
            )
            candidate = candidate.strip()
        try:
            return profile_url(candidate)
        except ValueError as exc:
            print(f"Direccion no valida: {exc}")
            candidate = ""


async def choose_post_count(total: int, requested_limit: int = 0) -> int:
    """Pregunta cuantas publicaciones descargar despues de contar el perfil."""
    if requested_limit > 0:
        selected = min(requested_limit, total)
        print(
            f"Se encontraron {total} publicaciones. "
            f"Por --max-posts se descargaran {selected}."
        )
        return selected

    while True:
        answer = await asyncio.to_thread(
            input,
            (
                f"Se encontraron {total} publicaciones. "
                "¿Cuantas quieres descargar? "
                "[Enter o 0 = todas]: "
            ),
        )
        value = answer.strip().lower()
        if value in {"", "0", "todas", "todos", "todo", "all"}:
            return total
        try:
            selected = int(value)
        except ValueError:
            print("Escribe un numero, 0 o presiona Enter para descargar todas.")
            continue
        if 1 <= selected <= total:
            return selected
        print(f"Escribe un numero entre 1 y {total}, o 0 para todas.")


async def wait_for_manual_start(
    context: BrowserContext,
    page: Page,
    suggested_target: str,
    headless: bool,
) -> tuple[Page, str]:
    """Abre el perfil y espera una confirmacion breve despues del inicio de sesion."""
    if headless:
        raise RuntimeError(
            "El inicio manual no funciona con --headless. Ejecuta sin esa opcion."
        )

    await page.goto(suggested_target, wait_until="domcontentloaded", timeout=60_000)
    await page.wait_for_timeout(1_500)

    print("\nSe abrio el perfil en Chrome.")
    print("- Si tu sesion ya estaba guardada, espera a que aparezcan las publicaciones.")
    print("- Si Instagram pide iniciar sesion, hazlo en el navegador y completa 2FA.")
    print("- Luego vuelve a PowerShell y escribe y para continuar.")

    accepted = {"y", "yes", "s", "si", "sí", "continuar", "continue", "c"}
    while True:
        command = await asyncio.to_thread(
            input,
            "Escribe y y presiona Enter para continuar: ",
        )
        if command.strip().lower() not in accepted:
            print("Orden no reconocida. Escribe y para continuar.")
            continue

        pages = [candidate for candidate in context.pages if not candidate.is_closed()]
        instagram_pages = [
            candidate
            for candidate in pages
            if "instagram.com" in (urlparse(candidate.url).netloc or "").lower()
        ]
        active_page = instagram_pages[-1] if instagram_pages else page

        current_url = active_page.url.lower()
        if "/accounts/login" in current_url or "/challenge/" in current_url:
            print(
                "Instagram todavia muestra el inicio de sesion o una verificacion. "
                "Terminala en Chrome y vuelve a escribir y."
            )
            continue

        detected_target = profile_url_from_browser_url(active_page.url)
        if detected_target != suggested_target:
            try:
                await active_page.goto(
                    suggested_target,
                    wait_until="domcontentloaded",
                    timeout=60_000,
                )
                await active_page.wait_for_timeout(2_000)
            except PlaywrightTimeoutError:
                pass

        current_url = active_page.url.lower()
        if "/accounts/login" in current_url or "/challenge/" in current_url:
            print(
                "Instagram necesita que inicies sesion o completes una verificacion. "
                "Hazlo en Chrome y vuelve a escribir y."
            )
            continue

        detected_target = profile_url_from_browser_url(active_page.url)
        if detected_target:
            print(f"Perfil listo: {detected_target}")
            return active_page, detected_target

        print(
            "No pude abrir el perfil solicitado. Revisa el navegador, cierra avisos "
            "que tapen la pagina y vuelve a escribir y."
        )


async def get_dom_links(page: Page) -> list[str]:
    """Obtiene href absolutos y relativos sin depender de un selector de ruta."""
    return await page.evaluate(
        """
        () => {
          const values = [];
          for (const anchor of document.querySelectorAll('a')) {
            const raw = anchor.getAttribute('href') || '';
            const absolute = anchor.href || '';
            if (raw) values.push(raw);
            if (absolute && absolute !== raw) values.push(absolute);
          }
          return [...new Set(values)];
        }
        """
    )


async def scroll_profile(page: Page) -> dict[str, int]:
    """Desplaza la ventana y el contenedor desplazable principal de Instagram."""
    return await page.evaluate(
        """
        () => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          const candidates = [
            document.scrollingElement,
            document.documentElement,
            document.body,
            ...document.querySelectorAll('main, div')
          ].filter(Boolean);

          let best = null;
          let bestRange = 0;
          for (const el of candidates) {
            const range = (el.scrollHeight || 0) - (el.clientHeight || 0);
            if (range < 300) continue;
            const style = getComputedStyle(el);
            const overflow = `${style.overflow} ${style.overflowY}`;
            const usable = el === document.scrollingElement || /auto|scroll/.test(overflow);
            if (usable && range > bestRange) {
              best = el;
              bestRange = range;
            }
          }
          if (best) best.scrollTop = best.scrollHeight;
          return {
            documentHeight: document.documentElement.scrollHeight || 0,
            scrollY: Math.round(window.scrollY || 0),
            containerRange: Math.round(bestRange),
          };
        }
        """
    )


async def save_profile_diagnostics(page: Page, output_dir: Path, links: list[str]) -> None:
    """Guarda evidencia para ajustar futuros cambios del DOM de Instagram."""
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        await page.screenshot(
            path=str(output_dir / "profile_debug.png"),
            full_page=False,
        )
    except Exception:  # noqa: BLE001
        pass

    try:
        html = await page.content()
        (output_dir / "profile_debug.html").write_text(html, encoding="utf-8")
    except Exception as exc:  # noqa: BLE001
        (output_dir / "profile_debug_html_error.txt").write_text(
            str(exc), encoding="utf-8"
        )

    (output_dir / "profile_links_debug.txt").write_text(
        "\n".join(links) + ("\n" if links else ""),
        encoding="utf-8",
    )


async def collect_post_urls(
    page: Page,
    target_url: str,
    max_posts: int,
    scroll_pause: float,
    output_dir: Path,
) -> list[str]:
    # Conserva la pagina preparada manualmente. Navegar de nuevo puede cambiar
    # el estado visual o dejar la grilla aun sin hidratar.
    current_profile = profile_url_from_browser_url(page.url)
    if current_profile != target_url:
        await page.goto(target_url, wait_until="domcontentloaded", timeout=60_000)
    else:
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=15_000)
        except PlaywrightTimeoutError:
            pass

    await page.wait_for_timeout(3_000)

    ordered: dict[str, None] = {}
    stagnant_rounds = 0
    last_count = 0
    all_links_seen: set[str] = set()

    while stagnant_rounds < 8:
        hrefs = await get_dom_links(page)
        all_links_seen.update(hrefs)

        for href in hrefs:
            canonical = canonical_post_url(href)
            if canonical:
                ordered.setdefault(canonical, None)

        if max_posts > 0 and len(ordered) >= max_posts:
            break

        if len(ordered) == last_count:
            stagnant_rounds += 1
        else:
            stagnant_rounds = 0
            last_count = len(ordered)
            print(f"  Detectadas {last_count} publicaciones...", flush=True)

        scroll_state = await scroll_profile(page)
        try:
            await page.keyboard.press("End")
        except Exception:  # noqa: BLE001
            pass
        await page.wait_for_timeout(int(scroll_pause * 1_000))

        # Si el DOM no contiene rutas, revisa los href serializados. Esto cubre
        # variantes donde React modifica el atributo visible tras hidratar.
        if not ordered and stagnant_rounds in {2, 5}:
            try:
                html = (await page.content()).replace("\\/", "/")
                for match in POST_PATH_RE.finditer(html):
                    post_type = match.group(1).lower()
                    if post_type == "reels":
                        post_type = "reel"
                    canonical = (
                        f"https://www.instagram.com/{post_type}/{match.group(2)}/"
                    )
                    ordered.setdefault(canonical, None)
            except Exception:  # noqa: BLE001
                pass

        if stagnant_rounds in {3, 6} and not ordered:
            print(
                "  Aun no aparecen enlaces de publicaciones en el DOM "
                f"(alto={scroll_state.get('documentHeight', 0)}, "
                f"scroll={scroll_state.get('scrollY', 0)}).",
                flush=True,
            )

    urls = list(ordered)
    if not urls:
        await save_profile_diagnostics(page, output_dir, sorted(all_links_seen))
    return urls[:max_posts] if max_posts > 0 else urls


async def wait_for_post_content(page: Page, timeout_ms: int = 30_000) -> bool:
    """Espera contenido util sin depender de que Instagram use <article>."""
    await page.locator("body").wait_for(state="attached", timeout=20_000)
    deadline = asyncio.get_running_loop().time() + (timeout_ms / 1_000)

    while asyncio.get_running_loop().time() < deadline:
        ready = await page.evaluate(
            """
            () => {
              const metaMedia = document.querySelector(
                'meta[property="og:image"], meta[property="og:video"], ' +
                'meta[property="og:video:secure_url"]'
              );
              if (metaMedia && metaMedia.getAttribute('content')) return true;

              for (const el of document.querySelectorAll('video, img')) {
                const r = el.getBoundingClientRect();
                const nw = el.tagName === 'IMG' ? (el.naturalWidth || 0) : (el.videoWidth || 0);
                const nh = el.tagName === 'IMG' ? (el.naturalHeight || 0) : (el.videoHeight || 0);
                if ((r.width >= 280 && r.height >= 280) || (nw >= 600 && nh >= 600)) {
                  return true;
                }
              }

              const ld = document.querySelector('script[type="application/ld+json"]');
              return Boolean(ld && (ld.textContent || '').trim());
            }
            """
        )
        if ready:
            return True
        await page.wait_for_timeout(700)
    return False


def _coerce_timestamp(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value)).astimezone().isoformat()
        except (ValueError, OSError, OverflowError):
            return ""
    text = str(value).strip()
    if text.isdigit() and len(text) >= 9:
        try:
            return datetime.fromtimestamp(float(text)).astimezone().isoformat()
        except (ValueError, OSError, OverflowError):
            return ""
    return text


async def page_metadata(page: Page) -> dict[str, Any]:
    """Recoge metadatos visibles, Open Graph y JSON-LD de forma generica."""
    return await page.evaluate(
        """
        () => {
          const content = selector => {
            const node = document.querySelector(selector);
            return node ? (node.getAttribute('content') || '') : '';
          };
          const jsonld = [];
          for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
            try {
              jsonld.push(JSON.parse(node.textContent || '{}'));
            } catch (_) {}
          }
          return {
            title: document.title || '',
            canonical: (() => {
              const node = document.querySelector('link[rel="canonical"]');
              return node ? (node.href || '') : '';
            })(),
            ogDescription: content('meta[property="og:description"]'),
            description: content('meta[name="description"]'),
            ogImage: content('meta[property="og:image"]'),
            ogVideo: content('meta[property="og:video:secure_url"]') ||
              content('meta[property="og:video"]'),
            jsonld,
          };
        }
        """
    )


def walk_json_values(value: Any, wanted_keys: set[str]) -> list[Any]:
    found: list[Any] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if str(key).lower() in wanted_keys:
                found.append(child)
            found.extend(walk_json_values(child, wanted_keys))
    elif isinstance(value, list):
        for child in value:
            found.extend(walk_json_values(child, wanted_keys))
    return found


async def extract_text(page: Page) -> tuple[str, str, str, dict[str, Any]]:
    metadata = await page_metadata(page)
    timestamp = ""
    caption = ""
    raw_text = ""

    # Instagram puede usar article, main o una estructura sin contenedor semantico.
    time_locator = page.locator("time[datetime]").first
    if await time_locator.count():
        timestamp = (await time_locator.get_attribute("datetime")) or ""

    for selector in ("main", '[role="main"]', "article", "body"):
        locator = page.locator(selector).first
        if not await locator.count():
            continue
        try:
            candidate = (await locator.inner_text(timeout=5_000)).strip()
        except PlaywrightTimeoutError:
            continue
        if candidate:
            raw_text = candidate
            break

    # La leyenda puede estar en h1, pero Open Graph/JSON-LD suele ser mas estable.
    for selector in ("main h1", '[role="main"] h1', "article h1", "h1"):
        locator = page.locator(selector).first
        if not await locator.count():
            continue
        try:
            candidate = (await locator.inner_text(timeout=2_500)).strip()
        except PlaywrightTimeoutError:
            continue
        if candidate:
            caption = candidate
            break

    if not caption:
        caption = clean_caption_from_og(str(metadata.get("ogDescription", "")))
    if not caption:
        caption = clean_caption_from_og(str(metadata.get("description", "")))

    jsonld = metadata.get("jsonld", [])
    if not caption:
        for candidate in walk_json_values(
            jsonld,
            {"caption", "description", "articlebody", "headline", "text"},
        ):
            if isinstance(candidate, str) and candidate.strip():
                caption = candidate.strip()
                break

    if not timestamp:
        for candidate in walk_json_values(
            jsonld,
            {"datepublished", "uploaddate", "datecreated", "taken_at", "taken_at_timestamp"},
        ):
            timestamp = _coerce_timestamp(candidate)
            if timestamp:
                break

    return timestamp, caption, raw_text, metadata


async def visible_media(page: Page) -> list[dict[str, Any]]:
    """Detecta el medio principal usando tamano, visibilidad y posicion en pantalla."""
    return await page.evaluate(
        """
        () => {
          const viewportCenterX = innerWidth / 2;
          const viewportCenterY = innerHeight / 2;
          const normalize = value => (value || '')
            .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
          const badAlt = /profile photo|foto del perfil|avatar|logo|icon|emoji/;
          const rows = [];

          for (const el of document.querySelectorAll('video, img')) {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' ||
                Number(style.opacity || 1) <= 0) continue;
            if (r.width < 220 || r.height < 220) continue;
            if (r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) continue;

            const alt = normalize(el.getAttribute('alt'));
            if (badAlt.test(alt)) continue;

            const isVideo = el.tagName === 'VIDEO';
            const src = isVideo
              ? (el.currentSrc || el.src || '')
              : (el.currentSrc || el.src || '');
            if (!src) continue;

            const naturalWidth = isVideo ? (el.videoWidth || 0) : (el.naturalWidth || 0);
            const naturalHeight = isVideo ? (el.videoHeight || 0) : (el.naturalHeight || 0);
            if (!isVideo && naturalWidth && naturalHeight && naturalWidth < 400 && naturalHeight < 400) continue;

            const centerX = r.left + r.width / 2;
            const centerY = r.top + r.height / 2;
            const distance = Math.hypot(centerX - viewportCenterX, centerY - viewportCenterY);
            let score = r.width * r.height;
            score += Math.min(naturalWidth * naturalHeight, 5000000) * 0.04;
            score -= distance * 250;
            if (isVideo) score += 10000000;

            rows.push({
              kind: isVideo ? 'video' : 'image',
              url: src,
              poster: isVideo ? (el.poster || '') : '',
              area: r.width * r.height,
              score,
              width: r.width,
              height: r.height,
            });
          }

          rows.sort((a, b) => b.score - a.score);
          const videos = rows.filter(row => row.kind === 'video');
          if (videos.length) return videos.slice(0, 2);
          return rows.filter(row => row.kind === 'image').slice(0, 3);
        }
        """
    )


async def click_next_carousel(page: Page) -> bool:
    """Pulsa la flecha siguiente aunque no exista un contenedor article."""
    return await page.evaluate(
        """
        labels => {
          const normalized = value => (value || '')
            .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
          const wanted = new Set(labels.map(normalized));
          const candidates = [];

          for (const button of document.querySelectorAll('button, [role="button"]')) {
            const nested = button.querySelector('[aria-label], svg[aria-label]');
            const values = [
              button.getAttribute('aria-label'),
              button.getAttribute('title'),
              nested && nested.getAttribute('aria-label'),
              button.textContent,
            ].map(normalized).filter(Boolean);
            if (!values.some(value => [...wanted].some(x => value === x || value.includes(x)))) {
              continue;
            }

            const r = button.getBoundingClientRect();
            const style = getComputedStyle(button);
            const visible = r.width > 0 && r.height > 0 &&
              style.display !== 'none' && style.visibility !== 'hidden' &&
              r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
            if (!visible) continue;

            // La flecha del carrusel normalmente esta en la mitad derecha.
            const centerX = r.left + r.width / 2;
            const centerY = r.top + r.height / 2;
            const score = centerX - Math.abs(centerY - innerHeight / 2) * 0.2;
            candidates.push({button, score});
          }

          candidates.sort((a, b) => b.score - a.score);
          if (!candidates.length) return false;
          candidates[0].button.click();
          return true;
        }
        """,
        sorted(NEXT_LABELS),
    )


def normalize_media_url(value: str) -> str:
    value = html.unescape((value or "").strip()).replace("\\/", "/")
    for escaped, decoded in (
        ("\\u0026", "&"),
        ("\\u003d", "="),
        ("\\u003D", "="),
        ("\\u0025", "%"),
    ):
        value = value.replace(escaped, decoded)
    return value


async def scripted_media_urls(page: Page) -> list[tuple[str, str]]:
    """Respaldo para URLs de medios incluidas en JSON-LD o metadatos de pagina."""
    metadata = await page_metadata(page)
    rows: list[tuple[str, str]] = []

    for key, kind in (("ogVideo", "video"), ("ogImage", "image")):
        url = normalize_media_url(str(metadata.get(key, "")))
        if url and not url.startswith("blob:"):
            rows.append((kind, url))

    jsonld = metadata.get("jsonld", [])
    for key, kind in (
        ("contenturl", "video"),
        ("content_url", "video"),
        ("video_url", "video"),
        ("display_url", "image"),
        ("thumbnailurl", "image"),
        ("thumbnail_url", "image"),
    ):
        for candidate in walk_json_values(jsonld, {key}):
            if isinstance(candidate, list):
                candidates = candidate
            else:
                candidates = [candidate]
            for item in candidates:
                if isinstance(item, dict):
                    item = item.get("url") or item.get("contentUrl") or ""
                url = normalize_media_url(str(item))
                if url.startswith("http") and not url.startswith("blob:"):
                    rows.append((kind, url))

    # Algunas respuestas de Instagram dejan las URLs serializadas en scripts.
    script_rows = await page.evaluate(
        """
        () => {
          const text = [...document.scripts].map(node => node.textContent || '').join('\\n');
          const specs = [
            ['video', /"video_url"\\s*:\\s*"(https?:\\\\?\\/\\\\?\\/[^"\\n]+)"/g],
            ['image', /"display_url"\\s*:\\s*"(https?:\\\\?\\/\\\\?\\/[^"\\n]+)"/g],
          ];
          const out = [];
          for (const [kind, regex] of specs) {
            let match;
            let count = 0;
            while ((match = regex.exec(text)) && count < 20) {
              out.push([kind, match[1]]);
              count += 1;
            }
          }
          return out;
        }
        """
    )
    for kind, value in script_rows:
        url = normalize_media_url(str(value))
        if url.startswith("http") and not url.startswith("blob:"):
            rows.append((str(kind), url))

    deduped: list[tuple[str, str]] = []
    seen: set[str] = set()
    for kind, url in rows:
        if url in seen:
            continue
        seen.add(url)
        deduped.append((kind, url))
    return deduped


async def collect_media_urls(page: Page) -> list[tuple[str, str]]:
    collected: list[tuple[str, str]] = []
    seen: set[str] = set()
    no_new_rounds = 0

    for _ in range(30):
        rows = await visible_media(page)
        added = False
        for row in rows:
            url = normalize_media_url(str(row.get("url", "")))
            kind = str(row.get("kind", "image"))
            if not url.startswith(("http://", "https://")) or url in seen:
                continue
            seen.add(url)
            collected.append((kind, url))
            added = True

        no_new_rounds = 0 if added else no_new_rounds + 1
        clicked = await click_next_carousel(page)
        if not clicked:
            break
        await page.wait_for_timeout(1_000)
        if no_new_rounds >= 3:
            break

    fallback = await scripted_media_urls(page)
    has_video = any(kind == "video" for kind, _ in collected)
    for kind, url in fallback:
        if url in seen:
            continue
        if kind == "video" and not has_video:
            collected.insert(0, (kind, url))
            has_video = True
            seen.add(url)
        elif not collected and kind == "image":
            collected.append((kind, url))
            seen.add(url)

    return collected


async def save_post_diagnostics(
    page: Page,
    post_dir: Path,
    metadata: dict[str, Any],
    media_rows: list[tuple[str, str]],
) -> None:
    """Guarda evidencia util si Instagram vuelve a modificar su estructura."""
    try:
        await page.screenshot(path=str(post_dir / "page_debug.png"), full_page=False)
    except Exception:  # noqa: BLE001
        pass
    try:
        (post_dir / "page_debug.html").write_text(await page.content(), encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    (post_dir / "page_metadata_debug.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (post_dir / "media_urls_debug.txt").write_text(
        "\n".join(f"{kind}\t{url}" for kind, url in media_rows) +
        ("\n" if media_rows else ""),
        encoding="utf-8",
    )

def extension_for(content_type: str, url: str, kind: str) -> str:
    clean_type = content_type.split(";", 1)[0].strip().lower()
    special = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
    }
    if clean_type in special:
        return special[clean_type]

    guessed = mimetypes.guess_extension(clean_type) if clean_type else None
    if guessed:
        return guessed

    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    return ".mp4" if kind == "video" else ".jpg"


async def download_media(
    context: BrowserContext,
    post_url: str,
    post_dir: Path,
    media_rows: list[tuple[str, str]],
) -> list[MediaFile]:
    saved: list[MediaFile] = []

    for index, (kind, url) in enumerate(media_rows, start=1):
        item = MediaFile(index=index, kind=kind, source_url=url)
        try:
            response = await context.request.get(
                url,
                headers={
                    "Referer": post_url,
                    "Accept": "image/avif,image/webp,image/apng,image/*,video/*,*/*;q=0.8",
                },
                timeout=120_000,
                fail_on_status_code=False,
            )
            if not response.ok:
                raise RuntimeError(f"HTTP {response.status}")
            body = await response.body()
            content_type = response.headers.get("content-type", "")
            clean_type = content_type.split(";", 1)[0].strip().lower()
            if clean_type and not (clean_type.startswith("image/") or clean_type.startswith("video/")):
                raise RuntimeError(f"Tipo de contenido inesperado: {content_type}")
            if len(body) < 512:
                raise RuntimeError(f"Archivo demasiado pequeno: {len(body)} bytes")
            extension = extension_for(content_type, url, kind)
            filename = f"{index:02d}_{kind}{extension}"
            path = post_dir / filename
            path.write_bytes(body)

            item.filename = filename
            item.content_type = content_type
            item.bytes = len(body)
        except Exception as exc:  # noqa: BLE001 - continuar con el resto del perfil
            item.error = str(exc)
        saved.append(item)

    return saved


async def export_post(
    page: Page,
    context: BrowserContext,
    url: str,
    index: int,
    posts_dir: Path,
) -> PostRecord:
    post_type, shortcode = shortcode_from_url(url)
    record = PostRecord(index=index, url=url, shortcode=shortcode, post_type=post_type)

    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        await page.wait_for_timeout(2_000)

        if "/accounts/login" in page.url or "/challenge/" in page.url:
            raise RuntimeError(
                "Instagram redirigio al inicio de sesion o a una verificacion. "
                "Completa ese paso en el navegador y vuelve a ejecutar el script."
            )

        ready = await wait_for_post_content(page)
        timestamp, caption, raw_text, metadata = await extract_text(page)
        record.timestamp = timestamp
        record.caption = caption
        record.raw_article_text = raw_text

        slug = safe_slug(caption)
        folder_name = f"{index:04d}_{date_prefix(timestamp)}_{shortcode}_{slug}"
        post_dir = posts_dir / folder_name
        post_dir.mkdir(parents=True, exist_ok=True)
        record.folder = str(Path("posts") / folder_name)

        media_rows = await collect_media_urls(page)
        record.media = await download_media(context, url, post_dir, media_rows)

        downloaded = sum(1 for item in record.media if item.filename)
        if not ready and not media_rows:
            record.error = (
                "La pagina cargo, pero no expuso medios reconocibles antes del tiempo limite."
            )
        elif not media_rows:
            record.error = "No se detectaron URLs de imagen o video en esta publicacion."
        elif downloaded == 0:
            details = "; ".join(item.error for item in record.media if item.error)
            record.error = f"Se detectaron medios, pero no se pudo descargar ninguno: {details}"

        (post_dir / "caption.txt").write_text(caption, encoding="utf-8")
        (post_dir / "article_text_raw.txt").write_text(raw_text, encoding="utf-8")
        (post_dir / "source_url.txt").write_text(url + "\n", encoding="utf-8")

        if record.error or downloaded < len(record.media):
            await save_post_diagnostics(page, post_dir, metadata, media_rows)

        (post_dir / "metadata.json").write_text(
            json.dumps(asdict(record), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as exc:  # noqa: BLE001
        record.error = str(exc)
        error_dir = posts_dir / f"{index:04d}_{shortcode}_ERROR"
        error_dir.mkdir(parents=True, exist_ok=True)
        record.folder = str(Path("posts") / error_dir.name)
        try:
            await page.screenshot(path=str(error_dir / "error.png"), full_page=False)
        except Exception:  # noqa: BLE001
            pass
        try:
            (error_dir / "error.html").write_text(await page.content(), encoding="utf-8")
        except Exception:  # noqa: BLE001
            pass
        (error_dir / "error.txt").write_text(record.error, encoding="utf-8")
        (error_dir / "source_url.txt").write_text(url + "\n", encoding="utf-8")

    return record

def write_manifests(output_dir: Path, records: list[PostRecord]) -> None:
    (output_dir / "posts.json").write_text(
        json.dumps([asdict(item) for item in records], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    with (output_dir / "posts.csv").open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "index",
                "shortcode",
                "post_type",
                "timestamp",
                "url",
                "folder",
                "caption",
                "media_count",
                "downloaded_count",
                "error",
            ],
        )
        writer.writeheader()
        for record in records:
            writer.writerow(
                {
                    "index": record.index,
                    "shortcode": record.shortcode,
                    "post_type": record.post_type,
                    "timestamp": record.timestamp,
                    "url": record.url,
                    "folder": record.folder,
                    "caption": record.caption,
                    "media_count": len(record.media),
                    "downloaded_count": sum(1 for media in record.media if media.filename),
                    "error": record.error,
                }
            )


async def main_async(args: argparse.Namespace) -> int:
    print(f"Instagram Exporter {SCRIPT_VERSION}")
    print("Usalo solo con contenido propio o autorizado por el cliente.\n")

    target_url = await prompt_profile_url(args.profile)
    session_dir = Path(args.session_dir).expanduser().resolve()
    session_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as playwright:
        launch_options: dict[str, Any] = {
            "user_data_dir": str(session_dir),
            "headless": args.headless,
            "viewport": {"width": 1440, "height": 1000},
            "locale": "es-CL",
        }
        if args.browser == "chrome":
            launch_options["channel"] = "chrome"

        context = await playwright.chromium.launch_persistent_context(**launch_options)
        context.set_default_timeout(20_000)
        page = context.pages[0] if context.pages else await context.new_page()

        try:
            page, target_url = await wait_for_manual_start(
                context,
                page,
                target_url,
                args.headless,
            )
            output_dir = output_directory_for_profile(target_url, args.output)
            posts_dir = output_dir / "posts"
            posts_dir.mkdir(parents=True, exist_ok=True)
            print(f"Carpeta de salida: {output_dir}")

            print(f"\nContando publicaciones de: {target_url}")
            all_urls = await collect_post_urls(
                page,
                target_url,
                0,
                args.scroll_pause,
                output_dir,
            )

            if not all_urls:
                print(
                    "No se detectaron publicaciones. Se guardaron "
                    "profile_debug.png, profile_debug.html y "
                    "profile_links_debug.txt dentro de la carpeta de salida."
                )
                return 1

            selected_count = await choose_post_count(len(all_urls), args.max_posts)
            urls = all_urls[:selected_count]
            (output_dir / "post_urls.txt").write_text(
                "\n".join(urls) + ("\n" if urls else ""),
                encoding="utf-8",
            )

            print(f"\nSe descargaran {len(urls)} publicaciones.")
            records: list[PostRecord] = []
            for index, url in enumerate(urls, start=1):
                print(f"[{index}/{len(urls)}] {url}", flush=True)
                record = await export_post(page, context, url, index, posts_dir)
                records.append(record)
                write_manifests(output_dir, records)
                downloaded = sum(1 for item in record.media if item.filename)
                if record.error:
                    print(f"  ERROR: {record.error}")
                else:
                    print(f"  Guardados {downloaded}/{len(record.media)} archivos.")
                await page.wait_for_timeout(int(args.post_pause * 1_000))

            print(f"\nExportacion terminada: {output_dir}")
            return 0
        finally:
            await context.close()


def main() -> int:
    args = parse_args()
    try:
        return asyncio.run(main_async(args))
    except KeyboardInterrupt:
        print("\nProceso cancelado.", file=sys.stderr)
        return 130
    except Exception as exc:  # noqa: BLE001
        print(f"\nError: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
