import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardCopy, Download, FolderOpen, Instagram, LoaderCircle, Play, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Breadcrumbs, PageShell } from "./LearningComponents";
import { agentFetch, checkAgentHealth, INSTAGRAM_INSTALLER_URL, pairWithAgent, streamExportEvents } from "./instagramAgentClient";
import { usePageMetadata } from "./seo";

const TERMINAL = new Set(["completed", "cancelled", "failed"]);
const TOKEN_KEY = "instagram-agent-pairing-token";
const JOB_KEY = "instagram-agent-active-job";
const SOURCE_FOLDER = import.meta.env.VITE_INSTAGRAM_AGENT_SOURCE_PATH || "D:\\WebFelipe\\mi-pagina-web\\local_tools\\instagram_exporter";

export default function InstagramImporterPage() {
  usePageMetadata({ title: "Importar desde Instagram", description: "Exporta contenido autorizado mediante un agente que se ejecuta solamente en tu PC.", path: "/herramientas/importar-instagram", noindex: true });
  const [health, setHealth] = useState(null);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [profile, setProfile] = useState("");
  const [countMode, setCountMode] = useState("all");
  const [maximum, setMaximum] = useState("");
  const [destination, setDestination] = useState(null);
  const [organize, setOrganize] = useState(false);
  const [provider, setProvider] = useState("ollama");
  const [model, setModel] = useState("qwen3-vl:4b");
  const [openaiKey, setOpenaiKey] = useState("");
  const [job, setJob] = useState(null);
  const [selection, setSelection] = useState(0);
  const [busy, setBusy] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [copiedCommand, setCopiedCommand] = useState("");
  const streamAbort = useRef(null);
  const lastEventId = useRef(0);

  const connectAgent = useCallback(async (signal) => {
    const nextHealth = await checkAgentHealth(signal);
    const pairing = await pairWithAgent(signal);
    setHealth(nextHealth);
    setToken(pairing.token);
    setConnected(true);
    return nextHealth;
  }, []);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try { await connectAgent(); setError(""); }
    catch { setHealth(null); setConnected(false); }
    finally { setChecking(false); }
  }, [connectAgent]);

  useEffect(() => { const controller = new AbortController(); connectAgent(controller.signal).catch(() => setConnected(false)).finally(() => setChecking(false)); return () => controller.abort(); }, [connectAgent]);
  useEffect(() => { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); }, [token]);

  const recover = useCallback(async (id = job?.id) => {
    if (!id || !token) return;
    try {
      const state = await agentFetch(`/exports/${id}`, { token });
      setJob(state); setError("");
      if (TERMINAL.has(state.state)) sessionStorage.removeItem(JOB_KEY);
    } catch (cause) { setError(cause.message); }
  }, [job?.id, token]);

  useEffect(() => {
    const saved = sessionStorage.getItem(JOB_KEY);
    if (saved && token && !job) recover(saved);
  }, [token]);

  useEffect(() => {
    if (!job?.id || !token || TERMINAL.has(job.state)) return undefined;
    let stopped = false;
    const controller = new AbortController();
    streamAbort.current = controller;
    const connect = async () => {
      while (!stopped && !controller.signal.aborted) {
        try {
          await streamExportEvents({ jobId: job.id, token, lastEventId: lastEventId.current, signal: controller.signal, onEvent: (event) => {
            lastEventId.current = Number(event.id) || lastEventId.current;
            if (event.data.job) setJob(event.data.job);
            if (event.type === "warning") setWarnings((items) => [...items.slice(-9), event.data.message]);
            if (event.type === "error") setError(event.data.message || "La exportacion fallo.");
            if (event.data.job && TERMINAL.has(event.data.job.state)) controller.abort();
          } });
        } catch (cause) {
          if (controller.signal.aborted) break;
          await recover(job.id);
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    };
    connect();
    return () => { stopped = true; controller.abort(); streamAbort.current = null; };
  }, [job?.id, token]);

  async function chooseDestination() {
    setBusy(true); setError("");
    try { setDestination(await agentFetch("/destinations/select", { method: "POST", token, timeout: 120000 })); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function startExport(event) {
    event.preventDefault();
    if (busy || (job && !TERMINAL.has(job.state))) return;
    setBusy(true); setError(""); setWarnings([]); lastEventId.current = 0;
    try {
      if (organize && provider === "openai" && openaiKey) {
        await agentFetch("/credentials/openai", { method: "POST", token, body: JSON.stringify({ openaiApiKey: openaiKey }) });
        setOpenaiKey("");
      }
      const response = await agentFetch("/exports", { method: "POST", token, body: JSON.stringify({
        profile, maxPosts: 0, organizeAfterExport: organize, aiProvider: provider,
        ollamaModel: provider === "ollama" ? model : "qwen3-vl:4b",
        openaiModel: provider === "openai" ? model : "gpt-4.1-mini",
        destinationId: destination?.id || null,
      }) });
      setJob(response.job); sessionStorage.setItem(JOB_KEY, response.id);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function action(path, body) {
    setBusy(true); setError("");
    try { const result = await agentFetch(`/exports/${job.id}/${path}`, { method: "POST", token, body: body ? JSON.stringify(body) : undefined }); if (result) setJob(result); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  function launchAgent() {
    setLaunching(true); setError("");
    window.location.href = "instagram-agent://start";
    const deadline = Date.now() + 30000;
    const poll = async () => {
      try { await connectAgent(); setLaunching(false); }
      catch {
        if (Date.now() < deadline) setTimeout(poll, 1500);
        else { setLaunching(false); setError("El agente no respondio. Si no esta instalado, usa el boton de instalacion o ejecuta run-agent.ps1."); }
      }
    };
    setTimeout(poll, 2000);
  }

  async function copyCommand(command, name) {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(name);
    } catch {
      setCopiedCommand("error");
    }
  }

  const desiredSelection = countMode === "limit" ? Math.max(0, Number(maximum) || 0) : 0;
  const active = job && !TERMINAL.has(job.state);
  return <PageShell><main id="main-content" className="content-page instagram-importer">
    <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Herramientas", href: "/herramientas" }, { label: "Importar desde Instagram", href: "/herramientas/importar-instagram" }]} />
    <header className="page-hero page-hero--compact"><p className="eyebrow"><Instagram size={17} /> Herramienta local</p><h1>Importar desde Instagram</h1><p className="page-hero__lead">Chrome, la sesion y los archivos permanecen bajo control del agente instalado en este PC.</p></header>

    <section className="agent-status" aria-live="polite">
      <div>{checking ? <LoaderCircle className="spin" /> : connected ? <CheckCircle2 /> : <XCircle />}<div><strong>{checking ? "Buscando agente..." : connected ? `Agente conectado · v${health.version}` : "Agente no detectado"}</strong><small>{connected ? `Chrome: ${health.chrome ? "disponible" : "no detectado"} · Chromium: ${health.chromium ? "disponible" : "no instalado"} · Ollama: ${health.ollama ? "disponible" : "opcional"}` : "Sigue la guía de preparación que aparece justo debajo."}</small></div></div>
      <div className="instagram-actions"><button type="button" className="button button--secondary" onClick={checkHealth} disabled={checking}><RefreshCw size={16} /> Comprobar</button>{!connected && INSTAGRAM_INSTALLER_URL && <button type="button" className="button button--secondary" onClick={launchAgent} disabled={launching}>{launching ? <LoaderCircle size={16} className="spin" /> : <Play size={16} />} {launching ? "Iniciando agente..." : "Iniciar agente"}</button>}{!connected && INSTAGRAM_INSTALLER_URL && <a className="button button--primary" href={INSTAGRAM_INSTALLER_URL}><Download size={16} /> Descargar instalador</a>}</div>
      {!connected && !INSTAGRAM_INSTALLER_URL && <p className="agent-config-note">En este equipo el agente se abre desde un archivo de la carpeta del proyecto. Sigue los pasos exactos de abajo.</p>}
    </section>

    {!connected && <section className="instagram-setup" aria-labelledby="instagram-setup-title">
      <div className="setup-heading"><div><p className="eyebrow">Preparación inicial · solo la primera vez</p><h2 id="instagram-setup-title">Instala e inicia el agente</h2><p>La conexión es automática. No necesitas buscar, copiar ni pegar códigos.</p></div><span className="setup-time">3–5 min</span></div>

      {INSTAGRAM_INSTALLER_URL ? <div className="setup-path setup-path--recommended">
        <div className="setup-path__heading"><span>Recomendado</span><div><h3>Con instalador de Windows</h3><p>No necesitas escribir rutas ni instalar Python.</p></div></div>
        <ol className="setup-steps">
          <li><span className="setup-step-number">1</span><div><strong>Descarga el instalador.</strong><p>Haz clic en el botón y espera a que termine la descarga.</p><a className="button button--primary" href={INSTAGRAM_INSTALLER_URL}><Download size={16} /> Descargar instalador</a></div></li>
          <li><span className="setup-step-number">2</span><div><strong>Abre el archivo descargado.</strong><p>En Chrome, haz clic en el icono de <strong>Descargas</strong> (arriba a la derecha) y luego en <strong>InstagramExporterAgent-Setup.exe</strong>. En el asistente pulsa <strong>Siguiente → Instalar → Finalizar</strong>. Si Windows pide permiso, elige <strong>Sí</strong>.</p></div></li>
          <li><span className="setup-step-number">3</span><div><strong>Inicia y comprueba.</strong><p>Al pulsar <strong>Finalizar</strong>, el agente debería abrirse solo. Si el estado de arriba continúa en rojo, pulsa este botón y acepta <strong>Abrir Instagram Exporter Agent</strong> si Chrome lo pregunta.</p><button type="button" className="button button--secondary" onClick={launchAgent} disabled={launching}>{launching ? <LoaderCircle size={16} className="spin" /> : <Play size={16} />} {launching ? "Conectando…" : "Iniciar y conectar"}</button><p>Cuando el estado cambie a <strong>Agente conectado</strong>, ya puedes escribir el perfil de Instagram.</p></div></li>
        </ol>
      </div> : <div className="setup-path setup-path--recommended">
        <div className="setup-path__heading"><span>En este equipo</span><div><h3>Abre el archivo «INICIAR-AGENTE»</h3><p>No necesitas abrir PowerShell ni escribir comandos.</p></div></div>
        <ol className="setup-steps">
          <li><span className="setup-step-number">1</span><div><strong>Abre el Explorador de archivos.</strong><p>Presiona juntas las teclas <strong>Windows + E</strong>. Haz clic en la barra de dirección que está arriba, copia y pega esta ruta completa y presiona <strong>Enter</strong>.</p><div className="setup-command"><code>{SOURCE_FOLDER}</code><button type="button" onClick={() => copyCommand(SOURCE_FOLDER, "source-folder")}><ClipboardCopy size={16} /> {copiedCommand === "source-folder" ? "Ruta copiada" : "Copiar ruta"}</button></div></div></li>
          <li><span className="setup-step-number">2</span><div><strong>Haz doble clic en <code>INICIAR-AGENTE.cmd</code>.</strong><p>Se abrirá una ventana negra. La primera vez puede tardar varios minutos mientras prepara los componentes. <strong>No cierres esa ventana</strong> mientras uses la herramienta.</p></div></li>
          <li><span className="setup-step-number">3</span><div><strong>Vuelve a esta página y pulsa «Comprobar».</strong><p>Cuando veas <strong>Agente conectado</strong> en verde, escribe el perfil de Instagram. No tienes que copiar ningún código.</p><button type="button" className="button button--primary" onClick={checkHealth} disabled={checking}>{checking ? <LoaderCircle size={16} className="spin" /> : <RefreshCw size={16} />} {checking ? "Comprobando…" : "Comprobar conexión"}</button></div></li>
        </ol>
      </div>}
      {copiedCommand === "error" && <p className="instagram-error" role="alert">No fue posible copiar automáticamente. Selecciona la ruta con el mouse, presiona Ctrl+C y pégala en la barra de dirección del Explorador con Ctrl+V.</p>}
    </section>}

    <form className="instagram-form" onSubmit={startExport}>
      <section><h2>1. Elige el contenido</h2><label>Usuario o URL del perfil<input value={profile} onChange={(event) => setProfile(event.target.value)} maxLength={200} placeholder="nombre_de_usuario o https://instagram.com/..." required /></label><fieldset><legend>Publicaciones</legend><label className="inline-choice"><input type="radio" name="count" checked={countMode === "all"} onChange={() => setCountMode("all")} /> Todas las encontradas</label><label className="inline-choice"><input type="radio" name="count" checked={countMode === "limit"} onChange={() => setCountMode("limit")} /> Cantidad maxima</label>{countMode === "limit" && <input type="number" min="1" max="100000" value={maximum} onChange={(event) => setMaximum(event.target.value)} required />}</fieldset><div><button type="button" className="button button--secondary" onClick={chooseDestination} disabled={!connected || busy}><FolderOpen size={17} /> Seleccionar carpeta de destino</button><small>{destination ? `Carpeta seleccionada: ${destination.label}` : "Predeterminada: runtime/instagram_exporter/exports/"}</small></div></section>
      <section><h2>2. Organizacion opcional</h2><label className="inline-choice"><input type="checkbox" checked={organize} onChange={(event) => setOrganize(event.target.checked)} /> Organizar despues con IA</label>{organize && <><label>Proveedor<select value={provider} onChange={(event) => { const next = event.target.value; setProvider(next); setModel(next === "ollama" ? "qwen3-vl:4b" : "gpt-4.1-mini"); }}><option value="ollama">Ollama local</option><option value="openai">OpenAI API</option></select></label><label>Modelo<input value={model} onChange={(event) => setModel(event.target.value)} maxLength={100} /></label>{provider === "openai" && <><label>API key de OpenAI<input type="password" autoComplete="off" value={openaiKey} onChange={(event) => setOpenaiKey(event.target.value)} placeholder="Se guarda solamente en el agente local" /></label><p className="privacy-warning">OpenAI requiere enviar las imagenes seleccionadas a su API. La clave nunca pasa por el servidor de esta web.</p></>}</>}</section>
      <div className="instagram-submit"><button className="button button--primary" type="submit" disabled={!connected || !token || !profile || busy || active}>{busy ? "Preparando..." : "Exportar Instagram"}</button><p>Se abrira Chrome visible. Completa manualmente el login, 2FA o cualquier verificacion.</p></div>
    </form>

    {job && <section className="instagram-progress" aria-live="polite"><div className="progress-heading"><div><p className="eyebrow">Estado: {job.state}</p><h2>{job.message}</h2></div><strong>{Math.round(job.percentage || 0)}%</strong></div><progress max="100" value={job.percentage || 0} /><p>{job.currentPost || 0} de {job.selectedCount || job.totalFound || "?"} · {job.profile}</p>{job.currentPostUrl && <p className="current-post">Publicacion actual: <a href={job.currentPostUrl} target="_blank" rel="noreferrer">{job.currentPostUrl}</a></p>}{job.state === "awaiting_login" && <div className="login-callout"><ShieldCheck /><div><strong>Completa el login o 2FA en Chrome</strong><p>Deja Chrome exactamente en el perfil solicitado y pulsa Continuar.</p><button className="button button--primary" type="button" onClick={() => action("continue")} disabled={busy}>Continuar</button></div></div>}{job.state === "awaiting_selection" && <div className="selection-callout"><strong>Se encontraron {job.totalFound} publicaciones.</strong><label>Cuantas descargar (0 = todas)<input type="number" min="0" max={job.totalFound} value={selection || desiredSelection} onChange={(event) => setSelection(Number(event.target.value))} /></label><button type="button" className="button button--primary" onClick={() => action("selection", { count: selection || desiredSelection })} disabled={busy}>Iniciar descarga</button></div>}{active && <button type="button" className="button button--danger" onClick={() => action("cancel")} disabled={busy || job.state === "cancelling"}>Cancelar</button>}{job.state === "completed" && <div className="result-callout"><CheckCircle2 /><div><strong>Exportacion terminada</strong><p>{job.outputFolder}</p><button type="button" className="button button--secondary" onClick={() => action("open-output")}>Abrir carpeta</button></div></div>}{job.state === "failed" && <button type="button" className="button button--secondary" onClick={() => { setJob(null); sessionStorage.removeItem(JOB_KEY); }}>Reintentar</button>}</section>}
    {warnings.length > 0 && <aside className="instagram-warnings"><h2>Advertencias</h2><ul>{warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul></aside>}
    {error && <p className="instagram-error" role="alert">{error}</p>}
  </main></PageShell>;
}
