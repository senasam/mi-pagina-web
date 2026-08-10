import { Download, LoaderCircle, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatBytes } from "./formatters.js";

export default function ModelManager({
  client,
  connected,
  selectedModel,
  onError,
}) {
  const [models, setModels] = useState([]);
  const [pull, setPull] = useState(null);
  const timer = useRef(null);
  const refresh = useCallback(async () => {
    if (!connected) return;
    try {
      setModels((await client.listModels()).models || []);
    } catch (cause) {
      onError(cause.message);
    }
  }, [client, connected, onError]);

  useEffect(() => {
    refresh();
    return () => clearTimeout(timer.current);
  }, [refresh]);
  useEffect(() => {
    if (!pull || ["completed", "cancelled", "failed"].includes(pull.state)) {
      if (pull?.state === "completed") refresh();
      return undefined;
    }
    const poll = async () => {
      try {
        const next = await client.getModelPull(pull.id);
        setPull(next);
        if (!["completed", "cancelled", "failed"].includes(next.state))
          timer.current = setTimeout(poll, 800);
      } catch (cause) {
        onError(cause.message);
      }
    };
    timer.current = setTimeout(poll, 500);
    return () => clearTimeout(timer.current);
  }, [client, onError, pull?.id, pull?.state, refresh]);

  async function install(modelId) {
    try {
      const response = await client.pullModel(modelId);
      setPull(response.pull);
    } catch (cause) {
      onError(cause.message);
    }
  }

  async function remove(modelId) {
    if (!window.confirm(`Eliminar ${modelId} de este equipo?`)) return;
    try {
      await client.deleteModel(modelId);
      await refresh();
    } catch (cause) {
      onError(cause.message);
    }
  }

  return (
    <section
      className="music-panel model-manager"
      aria-labelledby="model-manager-title"
    >
      <div className="music-section-heading">
        <div>
          <p className="eyebrow">Modelos locales</p>
          <h2 id="model-manager-title">Centro de modelos</h2>
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={refresh}
          disabled={!connected}
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>
      {pull && (
        <div className="model-pull">
          <span>
            {pull.state === "downloading" && <LoaderCircle className="spin" />}
            <strong>{pull.message}</strong>
          </span>
          <progress max="100" value={pull.percentage || 0} />
          {pull.state === "downloading" && (
            <button
              type="button"
              className="track-icon"
                onClick={() =>
                  client
                    .cancelModelPull(pull.id)
                    .then(setPull)
                  .catch((cause) => onError(cause.message))
              }
            >
              <X />
            </button>
          )}
        </div>
      )}
      <div className="model-list">
        {models.map((model) => (
          <article
            key={model.id}
            className={model.id === selectedModel ? "is-selected" : ""}
          >
            <div>
              <strong>{model.name}</strong>
              <small>{model.description}</small>
              <small>
                {model.state === "installed"
                  ? `${formatBytes(model.sizeBytes)} instalados`
                  : `Descarga aproximada: ${formatBytes(model.downloadBytesApprox)}`}
              </small>
            </div>
            <span className={`model-state model-state--${model.state}`}>
              {model.state === "installed" ? "Instalado" : "No instalado"}
            </span>
            {model.state === "installed" ? (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => remove(model.id)}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            ) : (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => install(model.id)}
                disabled={pull?.state === "downloading"}
              >
                <Download size={16} /> Descargar
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
