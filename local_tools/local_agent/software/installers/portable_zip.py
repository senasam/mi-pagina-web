from __future__ import annotations

import hashlib
import hmac
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from typing import Any

from local_tools.local_agent.software.models import SoftwareInstall
from local_tools.local_agent.software.installers.base import InstallerProvider
from local_tools.local_agent.models import utc_now

ALLOWED_DOWNLOAD_HOSTS = {"github.com", "objects.githubusercontent.com"}


class PortableZipInstaller(InstallerProvider):
    def __init__(self, base_dir: Path | None = None) -> None:
        self.base_dir = base_dir or Path.cwd()

    def id(self) -> str:
        return "portable-zip"

    def install_plan(self, software_id: str, descriptor: dict[str, Any]) -> dict[str, Any]:
        if "url" not in descriptor or "sha256" not in descriptor:
            raise ValueError("Descriptor de software incompleto.")
        return {
            "softwareId": software_id,
            "provider": self.id(),
            "url": descriptor["url"],
            "sha256": descriptor["sha256"],
            "size": descriptor.get("size"),
        }

    def run_install(self, software_id: str, install: SoftwareInstall, descriptor: dict[str, Any], staging_root: Path) -> None:
        # Descarga segura del archivo ZIP al staging.
        archive = staging_root / "package.zip"
        self._download_archive(descriptor["url"], archive, install)
        self._verify_hash(archive, descriptor["sha256"])
        bundle_root = self._extract_zip(archive, staging_root, install)
        self._finalize_install(software_id, bundle_root, staging_root, install)

    def _download_archive(self, url: str, target: Path, install: SoftwareInstall) -> None:
        if install.cancel_event.is_set():
            raise RuntimeError("cancelled")
        if url.startswith("bundled:"):
            local_name = url.removeprefix("bundled:")
            source = (self.base_dir / local_name).resolve()
            if not source.is_file():
                raise RuntimeError("Paquete local no encontrado.")
            total = source.stat().st_size
            with source.open("rb") as reader, target.open("wb") as writer:
                copied = 0
                while chunk := reader.read(1024 * 1024):
                    if install.cancel_event.is_set():
                        raise RuntimeError("cancelled")
                    writer.write(chunk)
                    copied += len(chunk)
                    install.percentage = min(70.0, copied / total * 70.0) if total else 25.0
                    install.updated_at = utc_now()
            return

        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.hostname.lower() not in ALLOWED_DOWNLOAD_HOSTS:
            raise RuntimeError("Origen de descarga no permitido.")
        request = urllib.request.Request(url, headers={"User-Agent": "FelipeLocalTools/1.0"})
        with urllib.request.urlopen(request, timeout=60) as response, target.open("wb") as writer:
            total = int(response.headers.get("Content-Length", 0))
            copied = 0
            while chunk := response.read(1024 * 1024):
                if install.cancel_event.is_set():
                    raise RuntimeError("cancelled")
                writer.write(chunk)
                copied += len(chunk)
                install.percentage = min(70.0, copied / total * 70.0) if total else 25.0
                install.updated_at = utc_now()

    def _verify_hash(self, archive: Path, expected: str) -> None:
        hasher = hashlib.sha256()
        with archive.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                hasher.update(chunk)
        if not hmac.compare_digest(hasher.hexdigest().lower(), expected.lower()):
            raise RuntimeError("Hash SHA-256 inválido para el paquete.")

    def _extract_zip(self, archive: Path, root: Path, install: SoftwareInstall) -> Path:
        staging = root / "staging"
        staging.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive) as bundle:
            for item in bundle.infolist():
                if install.cancel_event.is_set():
                    raise RuntimeError("cancelled")
                target = (staging / item.filename).resolve()
                if not target.is_relative_to(staging):
                    raise RuntimeError("Ruta no permitida en ZIP.")
            bundle.extractall(staging)
        return staging

    def _finalize_install(self, software_id: str, bundle_root: Path, staging_root: Path, install: SoftwareInstall) -> None:
        destination = staging_root / "installed"
        staging_root.joinpath("installed").mkdir(parents=True, exist_ok=True)
        install.percentage = 90.0
        install.updated_at = utc_now()
        # En esta versión MVP, dejamos el contenido en staging para que el SoftwareManager
        # lo mueva o valide según la política específica del software.
        install.state = "completed"
        install.message = "Instalación completada en staging."

