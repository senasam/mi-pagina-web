import {
  CheckCircle2,
  Download,
  LoaderCircle,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";

export default function MusicSetupPanel({
  checking,
  pairing,
  connected,
  capabilities,
  onRetry,
  onLaunch,
  installerUrl,
}) {
  const music = capabilities?.tools?.musicAnalyzer;
  const checks = [
    ["Agente local", connected],
    ["Motor de audio", Boolean(music?.engine?.available)],
    ["FFmpeg", Boolean(music?.engine?.ffmpeg)],
  ];
  return (
    <section
      className="music-panel music-setup"
      aria-labelledby="music-setup-title"
    >
      <div className="music-section-heading">
        <div>
          <p className="eyebrow">Paso 1</p>
          <h2 id="music-setup-title">Preparacion local</h2>
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={onRetry}
          disabled={checking}
        >
          <RefreshCw size={16} /> Comprobar
        </button>
      </div>
      <div className="music-checks">
        {checks.map(([label, ready]) => (
          <div key={label}>
            {checking ? (
              <LoaderCircle className="spin" />
            ) : ready ? (
              <CheckCircle2 />
            ) : (
              <XCircle />
            )}
            <span>
              <strong>{label}</strong>
              <small>{ready ? "Disponible" : "Requiere preparacion"}</small>
            </span>
          </div>
        ))}
      </div>
      {pairing && (
        <p className="music-callout">
          Aprueba la conexión en el diálogo seguro abierto por el agente local.
        </p>
      )}
      {!connected && !pairing && (
        <div className="music-callout music-callout--error">
          <strong>Felipe Local Tools Agent no esta conectado.</strong>
          <p>
            Instalalo una vez y luego podras iniciar y preparar el motor desde
            esta pagina.
          </p>
          <div className="result-actions">
            <a className="button button--primary" href={installerUrl}>
              <Download size={16} /> Descargar agente
            </a>
            <button
              type="button"
              className="button button--secondary"
              onClick={onLaunch}
            >
              <Play size={16} /> Iniciar agente
            </button>
          </div>
        </div>
      )}
      {connected && music && !music.engine?.available && (
        <p className="music-callout">
          El agente esta conectado, pero falta el Audio Engine Pack (Demucs y
          Librosa).
        </p>
      )}
    </section>
  );
}
