"""Contratos tipados del motor musical.

Este modulo define los datos que cruzan las fronteras del motor: opciones,
artefactos, eventos de progreso y resultados. No depende de FastAPI, React
ni Gradio; el agente HTTP traduce estos contratos a JSON en la fase 3.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path

ENGINE_NAME = "music-analyzer"
ENGINE_VERSION = "0.1.0"

# Modelos Demucs permitidos. El catalogo completo vive en model_manager.py;
# esta lista es la barrera de seguridad que impide que un nombre arbitrario
# llegue a la CLI de Demucs (donde podria interpretarse como argumento).
ALLOWED_SEPARATION_MODELS = ("htdemucs", "htdemucs_6s")

ALLOWED_AUDIO_EXTENSIONS = (".wav", ".mp3", ".flac", ".m4a")

# Limites por defecto del MVP. El agente podra ajustarlos via configuracion,
# pero nunca desde la web.
DEFAULT_MAX_FILE_BYTES = 200 * 1024 * 1024  # 200 MB
DEFAULT_MAX_DURATION_SECONDS = 20 * 60.0  # 20 minutos

TERMINAL_STATES = ("completed", "cancelled", "failed")

# Estados del trabajo, alineados con la seccion 7.2 del plan.
JOB_STATES = (
    "created",
    "queued",
    "validating",
    "preparing_engine",
    "downloading_model",
    "converting",
    "separating",
    "detecting_chords",
    "detecting_stem_chords",
    "exporting",
    "cancelling",
    "cancelled",
    "completed",
    "failed",
)

# Pesos relativos de cada fase para calcular el porcentaje global.
PHASE_WEIGHTS = {
    "validating": 2,
    "converting": 5,
    "separating": 55,
    "detecting_chords": 20,
    "detecting_stem_chords": 10,
    "exporting": 8,
}

# Nombre de stem -> etiqueta en espanol para la interfaz.
STEM_LABELS = {
    "vocals": "Voz",
    "drums": "Bateria",
    "bass": "Bajo",
    "guitar": "Guitarra",
    "piano": "Piano",
    "other": "Otros",
}

# Tipos de artefacto iniciales (seccion 5.3 del plan).
ARTIFACT_KINDS = (
    "source-audio",
    "converted-audio",
    "audio-stem",
    "chords-json",
    "chords-csv",
    "archive",
    "log",
)

_MIME_BY_SUFFIX = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
    ".json": "application/json",
    ".csv": "text/csv",
    ".zip": "application/zip",
    ".log": "text/plain",
    ".txt": "text/plain",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def sanitize_filename(name: str, fallback: str = "audio") -> str:
    """Devuelve un nombre de archivo seguro, sin separadores ni controles."""
    base = Path(name).name.strip().replace(" ", "_")
    base = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", base)
    base = base.strip(". ")
    if not base:
        base = fallback
    return base[:120]


def mime_type_for(path: Path) -> str:
    return _MIME_BY_SUFFIX.get(path.suffix.lower(), "application/octet-stream")


class EngineError(Exception):
    """Error controlado del motor, con codigo estable para la interfaz."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class JobCancelled(Exception):
    """Se lanza cuando el usuario cancela el trabajo en curso."""


@dataclass(frozen=True)
class TaskSelection:
    separate_stems: bool = True
    detect_chords: bool = True
    detect_stem_chords: bool = False
    create_zip: bool = True


@dataclass(frozen=True)
class SeparationOptions:
    provider: str = "local-demucs"
    model: str = "htdemucs"
    device: str = "auto"  # auto | cpu | cuda


@dataclass(frozen=True)
class AudioOptions:
    convert_to_wav: bool = True


@dataclass(frozen=True)
class AnalysisOptions:
    """Opciones completas de un trabajo de analisis."""

    source_path: Path
    output_dir: Path
    tasks: TaskSelection = TaskSelection()
    separation: SeparationOptions = SeparationOptions()
    audio: AudioOptions = AudioOptions()
    max_file_bytes: int = DEFAULT_MAX_FILE_BYTES
    max_duration_seconds: float = DEFAULT_MAX_DURATION_SECONDS
    keep_intermediate: bool = True

    def __post_init__(self):
        if not any(
            (
                self.tasks.separate_stems,
                self.tasks.detect_chords,
                self.tasks.detect_stem_chords,
            )
        ):
            raise EngineError(
                "empty_tasks",
                "El trabajo no tiene tareas: activa separacion o deteccion de acordes.",
            )
        if self.tasks.detect_stem_chords and not self.tasks.separate_stems:
            raise EngineError(
                "stem_chords_require_separation",
                "La deteccion por pista requiere activar la separacion de pistas.",
            )
        if self.separation.provider != "local-demucs":
            raise EngineError("unsupported_provider", "El proveedor de separacion no es compatible.")
        if self.separation.model not in ALLOWED_SEPARATION_MODELS:
            raise EngineError("invalid_model", "El modelo Demucs no esta permitido.")
        if self.separation.device not in ("auto", "cpu", "cuda"):
            raise EngineError("invalid_device", "El dispositivo debe ser auto, cpu o cuda.")
        if self.max_file_bytes <= 0 or self.max_duration_seconds <= 0:
            raise EngineError("invalid_limits", "Los limites del analisis deben ser positivos.")


@dataclass(frozen=True)
class SourceInfo:
    """Resultado de la validacion de la fuente de audio."""

    path: Path
    name: str
    extension: str
    size_bytes: int
    duration_seconds: float | None
    sample_rate: int | None
    channels: int | None


@dataclass(frozen=True)
class ChordEvent:
    """Un acorde detectado en un intervalo de tiempo."""

    start: float
    end: float
    chord: str
    confidence: float = 0.0
    method: str = "chroma-template"

    def to_dict(self) -> dict:
        return {
            "start": round(self.start, 3),
            "end": round(self.end, 3),
            "chord": self.chord,
            "confidence": round(self.confidence, 3),
            "method": self.method,
        }


@dataclass(frozen=True)
class Artifact:
    """Artefacto producido por el trabajo (seccion 5.3 del plan)."""

    id: str
    kind: str
    label: str
    path: Path
    mime_type: str
    size_bytes: int
    stem: str | None = None
    downloadable: bool = True
    playable: bool = False

    def to_dict(self) -> dict:
        # La ruta nunca se expone a la web; el agente la resuelve por id.
        return {
            "id": self.id,
            "kind": self.kind,
            "stem": self.stem,
            "label": self.label,
            "mimeType": self.mime_type,
            "size": self.size_bytes,
            "downloadable": self.downloadable,
            "playable": self.playable,
        }


@dataclass(frozen=True)
class ProgressEvent:
    """Evento de progreso emitido por las fases del motor."""

    state: str
    percentage: float
    message: str
    phase_percentage: float | None = None
    updated_at: str = field(default_factory=utc_now)

    def to_dict(self, job_id: str) -> dict:
        return {
            "type": "job_progress",
            "jobId": job_id,
            "state": self.state,
            "percentage": round(self.percentage, 1),
            "message": self.message,
            "phasePercentage": (
                round(self.phase_percentage, 1) if self.phase_percentage is not None else None
            ),
            "updatedAt": self.updated_at,
        }


@dataclass(frozen=True)
class ChordAnalysis:
    """Acordes detectados sobre una pista concreta."""

    track: str  # "mix" o nombre de stem
    events: tuple[ChordEvent, ...]
    method: str


@dataclass(frozen=True)
class AnalysisResult:
    """Resultado completo del trabajo."""

    source: SourceInfo
    artifacts: tuple[Artifact, ...]
    chords: tuple[ChordAnalysis, ...]
    output_dir: Path
    archive_path: Path | None
    log_path: Path | None


class ProgressReporter:
    """Acumula progreso por fase y emite eventos con porcentaje global.

    Las fases llaman a ``phase_progress`` con su avance interno (0-100) y el
    reporter traduce a porcentaje global usando PHASE_WEIGHTS. Tambien es el
    punto unico de comprobacion de cancelacion.
    """

    def __init__(self, callback, should_cancel=None, phase_weights=None):
        self._callback = callback
        self._should_cancel = should_cancel or (lambda: False)
        self._weights = dict(phase_weights or PHASE_WEIGHTS)
        self._done_weight = 0.0
        self._current_state: str | None = None
        self._total = sum(self._weights.values()) or 1.0

    def check_cancelled(self) -> None:
        if self._should_cancel():
            raise JobCancelled()

    def phase_progress(self, state: str, phase_percentage: float, message: str) -> None:
        self.check_cancelled()
        if state != self._current_state:
            if self._current_state is not None:
                self._done_weight += self._weights.get(self._current_state, 0)
            self._current_state = state
        phase_percentage = max(0.0, min(100.0, phase_percentage))
        weight = self._weights.get(state, 0)
        global_pct = (self._done_weight + weight * phase_percentage / 100.0) / self._total * 100.0
        self._callback(
            ProgressEvent(
                state=state,
                percentage=global_pct,
                phase_percentage=phase_percentage,
                message=message,
            )
        )

    def finish_phases(self) -> None:
        self._done_weight = self._total

    def complete(self, message: str = "Analisis completado") -> None:
        """Emite el unico evento terminal del motor."""
        self.check_cancelled()
        self._done_weight = self._total
        self._current_state = None
        self._callback(
            ProgressEvent(
                state="completed",
                percentage=100.0,
                phase_percentage=100.0,
                message=message,
            )
        )
