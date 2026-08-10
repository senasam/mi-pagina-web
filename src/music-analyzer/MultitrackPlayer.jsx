import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function MultitrackPlayer({
  client,
  jobId,
  artifacts,
  onTimeChange,
  onSeekReady,
}) {
  const playable = artifacts.filter(
    (artifact) => artifact.playable && artifact.kind === "audio-stem",
  );
  const fallback = artifacts
    .filter((artifact) => artifact.playable && artifact.kind !== "audio-stem")
    .slice(0, 1);
  const tracks = playable.length ? playable : fallback;
  const [urls, setUrls] = useState({});
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState({});
  const [solo, setSolo] = useState("");
  const [volumes, setVolumes] = useState({});
  const refs = useRef({});

  useEffect(() => {
    let active = true;
    Promise.all(
      tracks.map(async (artifact) => {
        const session = await client.createMediaSession(jobId, artifact.id);
        return [artifact.id, client.mediaUrl(session.url)];
      }),
    )
      .then((entries) => {
        if (active) setUrls(Object.fromEntries(entries));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [client, jobId, artifacts.map((artifact) => artifact.id).join(",")]);

  function togglePlayback() {
    const audioTracks = Object.values(refs.current).filter(Boolean);
    if (playing) audioTracks.forEach((audio) => audio.pause());
    else {
      const reference = audioTracks[0]?.currentTime || 0;
      audioTracks.forEach((audio) => {
        audio.currentTime = reference;
        audio.play().catch(() => {});
      });
    }
    setPlaying(!playing);
  }

  const seek = useCallback(
    (seconds) => {
      Object.values(refs.current).forEach((audio) => {
        if (audio) audio.currentTime = seconds;
      });
      onTimeChange(seconds);
    },
    [onTimeChange],
  );

  useEffect(() => {
    onSeekReady?.(seek);
    return () => onSeekReady?.(null);
  }, [onSeekReady, seek]);

  return (
    <section className="multitrack" aria-labelledby="mixer-title">
      <div className="mixer-heading">
        <div>
          <p className="eyebrow">Mezclador</p>
          <h3 id="mixer-title">Pistas sincronizadas</h3>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={togglePlayback}
          disabled={
            !tracks.length || Object.keys(urls).length !== tracks.length
          }
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}{" "}
          {playing ? "Pausar" : "Reproducir"}
        </button>
      </div>
      <div className="track-list">
        {tracks.map((artifact, index) => {
          const isMuted = muted[artifact.id] || (solo && solo !== artifact.id);
          return (
            <div className="track-row" key={artifact.id}>
              <audio
                ref={(node) => {
                  refs.current[artifact.id] = node;
                }}
                src={urls[artifact.id]}
                muted={isMuted}
                onTimeUpdate={
                  index === 0
                    ? (event) => onTimeChange(event.currentTarget.currentTime)
                    : undefined
                }
                onEnded={index === 0 ? () => setPlaying(false) : undefined}
              />
              <strong>{artifact.label}</strong>
              <button
                type="button"
                className="track-icon"
                onClick={() =>
                  setMuted({ ...muted, [artifact.id]: !muted[artifact.id] })
                }
                aria-label={`${muted[artifact.id] ? "Activar" : "Silenciar"} ${artifact.label}`}
              >
                {muted[artifact.id] ? <VolumeX /> : <Volume2 />}
              </button>
              <button
                type="button"
                className={`track-solo ${solo === artifact.id ? "is-active" : ""}`}
                onClick={() => setSolo(solo === artifact.id ? "" : artifact.id)}
              >
                Solo
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumes[artifact.id] ?? 1}
                aria-label={`Volumen ${artifact.label}`}
                onChange={(event) => {
                  const volume = Number(event.target.value);
                  setVolumes({ ...volumes, [artifact.id]: volume });
                  if (refs.current[artifact.id])
                    refs.current[artifact.id].volume = volume;
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
