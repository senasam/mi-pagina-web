import { Download, ExternalLink, FolderOpen, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ChordTimeline from "./ChordTimeline.jsx";
import MultitrackPlayer from "./MultitrackPlayer.jsx";
import { formatBytes } from "./formatters.js";

export default function MusicResults({ client, job, onNewAnalysis, onError }) {
  const [chords, setChords] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [busyArtifact, setBusyArtifact] = useState("");
  const [seekPlayer, setSeekPlayer] = useState(null);
  const artifacts = job.artifacts || [];
  const registerSeek = useCallback(
    (handler) => setSeekPlayer(() => handler),
    [],
  );

  useEffect(() => {
    const chordArtifact = artifacts.find(
      (artifact) => artifact.kind === "chords-json",
    );
    if (!chordArtifact) return;
    client
      .fetchArtifact(job.id, chordArtifact.id)
      .then((response) => response.json())
      .then((payload) => {
        setChords(
          payload.tracks?.find((track) => track.track === "mix")?.events || [],
        );
      })
      .catch((cause) => onError(cause.message));
  }, [artifacts, client, job.id, onError]);

  async function download(artifact) {
    setBusyArtifact(artifact.id);
    try {
      await client.downloadArtifact(job.id, artifact);
    } catch (cause) {
      onError(cause.message);
    } finally {
      setBusyArtifact("");
    }
  }

  return (
    <section
      className="music-panel music-results"
      aria-labelledby="music-results-title"
    >
      <div className="music-section-heading">
        <div>
          <p className="eyebrow">Paso 5</p>
          <h2 id="music-results-title">Resultados</h2>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={onNewAnalysis}
        >
          <RotateCcw size={16} /> Nuevo analisis
        </button>
      </div>
      <MultitrackPlayer
        client={client}
        jobId={job.id}
        artifacts={artifacts}
        onTimeChange={setCurrentTime}
        onSeekReady={registerSeek}
      />
      <ChordTimeline
        events={chords}
        currentTime={currentTime}
        onSeek={(seconds) => {
          seekPlayer?.(seconds);
          setCurrentTime(seconds);
        }}
      />
      <div className="artifact-list">
        <h3>Archivos disponibles</h3>
        {artifacts.map((artifact) => (
          <div key={artifact.id}>
            <span>
              <strong>{artifact.label}</strong>
              <small>
                {artifact.kind} · {formatBytes(artifact.size)}
              </small>
            </span>
            {artifact.downloadable && (
              <button
                type="button"
                className="button button--secondary"
                disabled={busyArtifact === artifact.id}
                onClick={() => download(artifact)}
              >
                <Download size={16} />{" "}
                {busyArtifact === artifact.id ? "Preparando..." : "Descargar"}
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="result-actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={() =>
            client
              .openOutput(job.id)
              .catch((cause) => onError(cause.message))
          }
        >
          <FolderOpen size={16} /> Abrir carpeta
        </button>
        <a className="button button--secondary" href="/herramientas">
          <ExternalLink size={16} /> Ver herramientas
        </a>
      </div>
    </section>
  );
}
