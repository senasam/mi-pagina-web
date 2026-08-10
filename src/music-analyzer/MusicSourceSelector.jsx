import { FileAudio, FolderOpen } from "lucide-react";
import { formatBytes, formatDuration } from "./formatters.js";

export default function MusicSourceSelector({ source, destination, disabled, onSelectSource, onSelectDestination }) {
  return <section className="music-panel" aria-labelledby="music-source-title">
    <div className="music-section-heading"><div><p className="eyebrow">Paso 2</p><h2 id="music-source-title">Audio y destino</h2></div></div>
    <div className="music-source-grid"><div className="music-source-card"><FileAudio /><div><strong>{source?.name || "Ningun audio seleccionado"}</strong><small>{source ? `${source.extension.toUpperCase()} · ${formatBytes(source.size)} · ${formatDuration(source.duration)}` : "WAV, MP3, FLAC o M4A · maximo 200 MB"}</small></div><button type="button" className="button button--primary" onClick={onSelectSource} disabled={disabled}>{source ? "Cambiar audio" : "Seleccionar audio"}</button></div><div className="music-source-card"><FolderOpen /><div><strong>{destination?.label || "Destino predeterminado"}</strong><small>{destination ? "Autorizacion valida para el proximo analisis" : "Se guardara en el runtime local del agente"}</small></div><button type="button" className="button button--secondary" onClick={onSelectDestination} disabled={disabled}>Elegir carpeta</button></div></div>
  </section>;
}
