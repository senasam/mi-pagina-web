import { Download, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const TERMINAL = new Set(["completed", "cancelled", "failed"]);

export default function AgentInstaller({ client, connected, onInstalled, onError }) {
  const [status, setStatus] = useState(null);
  const [install, setInstall] = useState(null);
  const [events, setEvents] = useState([]);
  const lastEventId = useRef(0);
  const controller = useRef(null);

  const refresh = useCallback(async () => {
    if (!connected) return;
    try {
      setStatus(await client.request("/v1/software/felipe-local-agent"));
    } catch (cause) {
      onError?.(cause.message || String(cause));
    }
  }, [client, connected, onError]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!install?.id || TERMINAL.has(install.state)) return undefined;
    if (controller.current) controller.current.abort();
    controller.current = new AbortController();
    lastEventId.current = 0;

    const consume = async () => {
      try {
        await client.stream({
          path: `/v1/software/installs/${encodeURIComponent(install.id)}/events?last_event_id=${encodeURIComponent(lastEventId.current)}`,
          signal: controller.current.signal,
          onEvent: (event) => {
            lastEventId.current = Number(event.id) || lastEventId.current;
            if (event.data?.task) {
              const task = event.data.task;
              setInstall((cur) => ({ ...cur, state: task.status, phase: task.phase, percentage: task.progress, message: task.message }));
              setEvents((cur) => {
                const next = [...cur];
                if (!next.some((i) => i.id === event.id)) {
                  next.unshift({ id: event.id, type: event.type, message: task.message, state: task.status, timestamp: new Date().toISOString() });
                  return next.slice(0, 10);
                }
                return cur;
              });
              if (TERMINAL.has(task.status) && task.status === "completed") {
                refresh();
                onInstalled?.();
              }
            }
          },
        });
      } catch (cause) {
        if (cause.name !== "AbortError") onError?.(cause.message || String(cause));
      }
    };

    consume();
    return () => { controller.current?.abort(); controller.current = null; };
  }, [client, install?.id, refresh, onError, onInstalled]);

  async function startInstall() {
    try {
      const payload = await client.request(`/v1/software/felipe-local-agent/actions/install`, { method: "POST" });
      setInstall(payload.install || payload);
    } catch (cause) {
      onError?.(cause.message || String(cause));
    }
  }

  if (!connected) return null;
  return (
    <section className="music-panel engine-installer" aria-labelledby="agent-installer-title">
      <div className="music-section-heading">
        <div>
          <p className="eyebrow">Instalador</p>
          <h2 id="agent-installer-title">Felipe Local Tools Agent</h2>
        </div>
        <span className={`model-state model-state--${status?.state || "unknown"}`}>
          {status?.state === "installed" ? "Instalado" : "No instalado"}
        </span>
      </div>
      {!status?.available && (
        <div className="engine-install-action">
          <Download />
          <div>
            <strong>Instala el agente desde esta pagina</strong>
            <p>Descarga e instala el agente local. Una vez instalado podrás gestionarlo desde esta app web.</p>
          </div>
          <button type="button" className="button button--primary" onClick={startInstall} disabled={install && !TERMINAL.has(install.state)}>
            <Download size={16} /> Iniciar instalación
          </button>
        </div>
      )}
      {install && (
        <div className="model-pull">
          <span>{!TERMINAL.has(install.state) && <LoaderCircle className="spin" />} <strong>{install.message}</strong></span>
          <div className="model-pull__meta">
            <span>{install.phase ? `Fase: ${install.phase}` : null}</span>
            <span>{install.percentage != null ? `${Math.round(install.percentage)}%` : null}</span>
          </div>
          <progress max="100" value={install.percentage || 0} />
          {!TERMINAL.has(install.state) && (
            <button type="button" className="track-icon" aria-label="Cancelar instalacion" onClick={() => client.request(`/v1/software/installs/${encodeURIComponent(install.id)}/cancel`, { method: "POST" }).then((p) => setInstall(p.install)).catch((c) => onError?.(c.message))}>
              <X />
            </button>
          )}
          {events.length > 0 && (
            <div className="install-events">
              <div className="install-events__header"><strong>Eventos</strong></div>
              <ul>{events.map((e) => (<li key={e.id}><span>{e.type.replace("task.","")}</span> <span>{e.message}</span></li>))}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
