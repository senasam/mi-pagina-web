import { Download, HardDriveDownload, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatBytes } from "./formatters.js";

const TERMINAL = new Set(["completed", "cancelled", "failed"]);

export default function AudioEngineInstaller({
  client,
  connected,
  onInstalled,
  onError,
}) {
  const [status, setStatus] = useState(null);
  const [install, setInstall] = useState(null);
  const [installEvents, setInstallEvents] = useState([]);
  const installLastEventId = useRef(0);
  const installController = useRef(null);
  const refresh = useCallback(async () => {
    if (!connected) return;
    try {
      setStatus(await client.getEngine());
    } catch (cause) {
      onError(cause.message);
    }
  }, [client, connected, onError]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (!install?.id || TERMINAL.has(install.state)) return undefined;
    if (installController.current) {
      installController.current.abort();
    }
    installController.current = new AbortController();
    installLastEventId.current = 0;

    const consume = async () => {
      try {
        await client.streamEngineInstallEvents({
          installId: install.id,
          lastEventId: installLastEventId.current,
          signal: installController.current.signal,
          onEvent: (event) => {
            installLastEventId.current = Number(event.id) || installLastEventId.current;
            if (event.data?.task) {
              const task = event.data.task;
              setInstall((current) => ({
                ...current,
                state: task.status,
                phase: task.phase,
                percentage: task.progress,
                message: task.message,
              }));
              setInstallEvents((current) => {
                const next = [...current];
                if (!next.some((item) => item.id === event.id)) {
                  next.unshift({
                    id: event.id,
                    type: event.type,
                    state: task.status,
                    phase: task.phase,
                    message: task.message,
                    timestamp: new Date().toISOString(),
                  });
                  return next.slice(0, 8);
                }
                return current;
              });
              if (TERMINAL.has(task.status)) {
                if (task.status === "completed") {
                  refresh();
                  onInstalled?.();
                }
              }
            }
          },
        });
      } catch (cause) {
        if (cause.name !== "AbortError") {
          onError(cause.message);
        }
      }
    };

    consume();
    return () => {
      installController.current?.abort();
      installController.current = null;
    };
  }, [client, install?.id, refresh, onInstalled, onError]);

  async function start() {
    try {
      const response = await client.startEngineInstall();
      setInstall(response);
    } catch (cause) {
      onError(cause.message);
    }
  }

  if (!connected) return null;
  return (
    <section
      className="music-panel engine-installer"
      aria-labelledby="engine-installer-title"
    >
      <div className="music-section-heading">
        <div>
          <p className="eyebrow">Componentes de procesamiento</p>
          <h2 id="engine-installer-title">Audio Engine Pack</h2>
        </div>
        <span
          className={`model-state model-state--${status?.state || "not-installed"}`}
        >
          {status?.available ? `Instalado · ${status.version}` : "No instalado"}
        </span>
      </div>
      {status?.available ? (
        <p className="music-callout">
          Python, FFmpeg, Torch, Demucs y Librosa estan disponibles en un
          entorno aislado.
        </p>
      ) : (
        <div className="engine-install-action">
          <HardDriveDownload />
          <div>
            <strong>Instala el motor desde esta pagina</strong>
            <p>
              {status?.downloadBytes
                ? `Descarga: ${formatBytes(status.downloadBytes)}. `
                : ""}
              El paquete se verifica con SHA-256 antes de instalarse.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={start}
            disabled={
              !status?.installable || (install && !TERMINAL.has(install.state))
            }
          >
            <Download size={16} />{" "}
            {status?.installable
              ? "Instalar motor"
              : "Paquete aun no publicado"}
          </button>
        </div>
      )}
      {install && (
        <div className="model-pull">
          <span>
            {!TERMINAL.has(install.state) && <LoaderCircle className="spin" />}
            <strong>{install.message}</strong>
          </span>
          <div className="model-pull__meta">
            <span>{install.phase ? `Fase: ${install.phase}` : null}</span>
            <span>{install.percentage != null ? `${Math.round(install.percentage)}%` : null}</span>
          </div>
          <progress max="100" value={install.percentage || 0} />
          {!TERMINAL.has(install.state) && (
            <button
              type="button"
              className="track-icon"
              aria-label="Cancelar instalacion"
              onClick={() =>
                client
                  .cancelEngineInstall(install.id)
                  .then(setInstall)
                  .catch((cause) => onError(cause.message))
              }
            >
              <X />
            </button>
          )}
          {installEvents.length > 0 && (
            <div className="install-events">
              <div className="install-events__header">
                <strong>Eventos en vivo</strong>
                <span className="install-events__badge">Actualizado</span>
              </div>
              <ul>
                {installEvents.map((event) => (
                  <li key={event.id} className="install-events__item">
                    <span className="install-events__type">{event.type.replace("task.", "")}</span>
                    <span className="install-events__detail">
                      {event.state ? `${event.state} · ${event.phase}` : event.phase}
                    </span>
                    <span className="install-events__message">{event.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
