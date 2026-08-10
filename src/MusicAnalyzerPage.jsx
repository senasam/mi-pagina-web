import { Music2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Breadcrumbs, PageShell } from "./LearningComponents";
import MusicJobProgress from "./music-analyzer/MusicJobProgress.jsx";
import AudioEngineInstaller from "./music-analyzer/AudioEngineInstaller.jsx";
import AgentInstaller from "./agent/AgentInstaller.jsx";
import ModelManager from "./music-analyzer/ModelManager.jsx";
import MusicProcessingForm from "./music-analyzer/MusicProcessingForm.jsx";
import MusicResults from "./music-analyzer/MusicResults.jsx";
import MusicSetupPanel from "./music-analyzer/MusicSetupPanel.jsx";
import MusicSourceSelector from "./music-analyzer/MusicSourceSelector.jsx";
import {
  applyMusicEvent,
  buildMusicJobRequest,
  DEFAULT_MUSIC_OPTIONS,
} from "./music-analyzer/model.js";
import { useAgent } from "./platform/local-agent/AgentProvider.jsx";
import {
  createMusicClient,
  LOCAL_TOOLS_INSTALLER_URL,
} from "./platform/local-agent/capabilities/music.js";
import { TERMINAL_JOB_STATES } from "./platform/local-agent/contracts.js";
import { usePageMetadata } from "./seo";
import "./music-analyzer/musicAnalyzer.css";

const JOB_KEY = "music-analyzer-active-job";

export default function MusicAnalyzerPage() {
  usePageMetadata({
    title: "Analizador musical local",
    description: "Separa instrumentos y detecta acordes sin subir tu audio.",
    path: "/herramientas/analizador-musical",
    noindex: true,
  });
  const {
    client,
    connected,
    checking,
    pairing,
    token,
    details: capabilities,
    connect,
  } = useAgent();
  const music = useMemo(() => createMusicClient(client), [client]);
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [options, setOptions] = useState({ ...DEFAULT_MUSIC_OPTIONS });
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastEventId = useRef(0);

  const check = useCallback(async () => {
    try {
      await connect();
      setError("");
    } catch (cause) {
      if (cause.code !== "AGENT_REQUEST_ABORTED") setError(cause.message);
    }
  }, [connect]);

  useEffect(() => {
    const controller = new AbortController();
    connect({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [connect]);

  const recover = useCallback(
    async (jobId) => {
      if (!jobId || !token) return;
      try {
        const recovered = await music.getJob(jobId);
        setJob(recovered);
        if (TERMINAL_JOB_STATES.has(recovered.state))
          sessionStorage.removeItem(JOB_KEY);
      } catch (cause) {
        sessionStorage.removeItem(JOB_KEY);
        setError(cause.message);
      }
    },
    [music, token],
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(JOB_KEY);
    if (saved && token && !job) recover(saved);
  }, [token]);

  useEffect(() => {
    if (!job?.id || !token || TERMINAL_JOB_STATES.has(job.state))
      return undefined;
    const controller = new AbortController();
    let stopped = false;
    const consume = async () => {
      while (!stopped && !controller.signal.aborted) {
        try {
          await music.streamJobEvents({
            jobId: job.id,
            lastEventId: lastEventId.current,
            signal: controller.signal,
            onEvent: (event) => {
              lastEventId.current = Number(event.id) || lastEventId.current;
              setJob((current) => applyMusicEvent(current, event));
              if (event.type === "error")
                setError(event.data?.error?.message || "El analisis fallo.");
              if (
                event.data?.job &&
                TERMINAL_JOB_STATES.has(event.data.job.state)
              ) {
                sessionStorage.removeItem(JOB_KEY);
                controller.abort();
              }
            },
          });
        } catch {
          if (controller.signal.aborted) break;
          await recover(job.id);
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    };
    consume();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [job?.id, music, token]);

  async function selectSource() {
    setBusy(true);
    setError("");
    try {
      setSource(await music.selectSource());
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function selectDestination() {
    setBusy(true);
    setError("");
    try {
      setDestination(await music.selectDestination());
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function start(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    lastEventId.current = 0;
    try {
      const payload = buildMusicJobRequest(source, destination, options);
      const created = await music.createJob(payload);
      setJob(created.job);
      sessionStorage.setItem(JOB_KEY, created.id);
      setDestination(null);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      setJob(await music.cancelJob(job.id));
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  function launchAgent() {
    window.location.href = "felipe-tools://start";
    setTimeout(check, 1800);
  }

  const active = job && !TERMINAL_JOB_STATES.has(job.state);
  return (
    <PageShell>
      <main id="main-content" className="content-page music-analyzer-page">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: "Herramientas", href: "/herramientas" },
            {
              label: "Analizador musical",
              href: "/herramientas/analizador-musical",
            },
          ]}
        />
        <header className="page-hero page-hero--compact">
          <p className="eyebrow">
            <Music2 size={17} /> Herramienta local
          </p>
          <h1>Analizador musical</h1>
          <p className="page-hero__lead">
            Separa instrumentos, detecta acordes y estudia una cancion sin
            subirla.
          </p>
          <div className="local-privacy">
            <ShieldCheck />
            <span>
              <strong>Procesamiento local</strong> Tu audio permanece en este
              equipo.
            </span>
          </div>
        </header>
        <div className="music-workflow">
        <MusicSetupPanel
          checking={checking}
          pairing={pairing}
          connected={connected}
            capabilities={capabilities}
            onRetry={check}
            onLaunch={launchAgent}
            installerUrl={LOCAL_TOOLS_INSTALLER_URL}
          />
          <AudioEngineInstaller
            client={music}
            connected={connected}
            onInstalled={check}
            onError={setError}
          />
          <AgentInstaller
            client={client}
            connected={connected}
            onInstalled={check}
            onError={setError}
          />
          <ModelManager
            client={music}
            connected={connected}
            selectedModel={options.model}
            onError={setError}
          />
          <MusicSourceSelector
            source={source}
            destination={destination}
            disabled={!connected || busy || active}
            onSelectSource={selectSource}
            onSelectDestination={selectDestination}
          />
          <MusicProcessingForm
            options={options}
            onChange={setOptions}
            onSubmit={start}
            disabled={!connected || !source || busy || active}
          />
          {job && <MusicJobProgress job={job} busy={busy} onCancel={cancel} />}
          {job?.state === "completed" && (
            <MusicResults
              client={music}
              job={job}
              onError={setError}
              onNewAnalysis={() => {
                setJob(null);
                setError("");
                sessionStorage.removeItem(JOB_KEY);
              }}
            />
          )}
          {job?.state === "failed" && (
            <p className="music-callout music-callout--error">
              {job.error?.message || job.message}
            </p>
          )}
          {error && (
            <p className="music-callout music-callout--error" role="alert">
              {error}
            </p>
          )}
        </div>
      </main>
    </PageShell>
  );
}
