import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, Compass, Copy, Eye, EyeOff, GitCompareArrows, GitMerge,
  Layers, ListChecks, Plus, Sparkles, Stethoscope, Trash2, X,
} from "lucide-react";
import { createStoryBeat, nowIso } from "./model.js";
import {
  addStage, addStoryBeat, assign, compareFrameworks, createCustomFramework,
  instantiateFramework, mergeStages, removeFramework, removeStage, removeStoryBeat, reorderStages,
  sceneAssignments, setActiveFramework, unassign, updateStage, updateStoryBeat,
} from "./engine.js";
import { FRAMEWORK_TEMPLATES } from "./frameworkTemplates.js";
import { filterDismissed, runDiagnostics } from "./diagnostics.js";
import { nextBestStep } from "./guided.js";
import { flattenScenes } from "../model.js";
import DesignTabs from "./components/DesignTabs.jsx";
import NarrativeAiButton from "./components/NarrativeAiButton.jsx";
import CharactersTab from "./pages/CharactersTab.jsx";
import ArcsTab from "./pages/ArcsTab.jsx";
import OpeningTab from "./pages/OpeningTab.jsx";
import PlotsTab from "./pages/PlotsTab.jsx";
import ScenesTab from "./pages/ScenesTab.jsx";
import ChaptersTab from "./pages/ChaptersTab.jsx";
import ThemeTab from "./pages/ThemeTab.jsx";
import AdvancedTab from "./pages/AdvancedTab.jsx";
import { workspaceRepository as repository } from "../LocalWorkspaceRepository.js";
import { buildChatGptManualPrompt, normalizeChatGptUrl } from "../aiProviders.js";
import { requestSceneSuggestion } from "../sceneAssistant.js";
import { AI_TOOL_IDS } from "../../platform/ai/contracts.js";
import { isProviderConfigured } from "../../platform/ai/providerRegistry.js";
import { buildNarrativeFieldPrompt } from "./narrativeAssistant.js";
import AiRequestErrorDialog from "../AiRequestErrorDialog.jsx";

const FIELD_STATUS = [["sin-definir", "Sin definir"], ["borrador", "Borrador"], ["definido", "Definido"], ["revisar", "Revisar"]];

const FOUNDATION_FIELDS = [
  ["idea", "Idea", "La semilla de la historia, en una frase sencilla."],
  ["premisa", "Premisa", "Quién quiere qué, y qué se lo impide."],
  ["tema", "Tema", "El asunto humano que recorre la historia."],
  ["preguntaTematica", "Pregunta temática", "La pregunta que la historia explora, sin responder del todo."],
  ["contrapremisa", "Contrapremisa", "La idea contraria a la tuya, también defendible."],
  ["ideaControladora", "Idea controladora", "Lo que la historia demuestra al final, en una frase."],
  ["valorInicial", "Valor inicial", "Cómo está el mundo o el protagonista al comenzar."],
  ["valorFinal", "Valor final", "Cómo queda ese mismo valor al terminar."],
  ["causaCambio", "Causa del cambio", "Qué provoca que las cosas ya no puedan seguir igual."],
  ["conflictoCentral", "Conflicto central", "La fuerza principal que empuja en contra."],
  ["objetivoGlobal", "Objetivo global", "Lo que el protagonista persigue durante toda la novela."],
  ["necesidadInterna", "Necesidad interna", "Lo que necesita aprender o sanar, aunque no lo sepa."],
  ["antagonismo", "Antagonismo", "Quién o qué se opone con más fuerza."],
  ["stakes", "Lo que está en juego", "Qué se pierde si el protagonista fracasa."],
  ["estadoInicial", "Estado inicial", "La situación de partida, antes de que algo cambie."],
  ["estadoFinal", "Estado final", "La situación a la que se llega al cerrar la historia."],
  ["simbolo", "Símbolo", "Un objeto, imagen o gesto que condensa el tema."],
  ["promesa", "Promesa al lector", "La experiencia que el lector espera vivir contigo."],
];

const GUIDE_QUESTIONS = [
  "¿Qué quieres explorar con esta historia?",
  "¿Qué cree el protagonista al comenzar que podría estar equivocado?",
  "¿Qué tendría que ocurrir para demostrar la idea contraria?",
  "¿Qué debería ser diferente al final?",
  "¿Qué pierde el protagonista si fracasa?",
  "¿Qué decisión final podría demostrar lo que aprendió?",
];

function PageTitle({ kicker, title, text, children }) {
  return <header className="studio-page-title"><div><p className="studio-kicker">{kicker}</p><h1>{title}</h1>{text && <p>{text}</p>}</div><div className="studio-page-title__actions">{children}</div></header>;
}

export default function DesignPage({ novel, structure, codex, narrative, setNarrative, aiSettings, readOnly }) {
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get("tab") || "resumen");
  const [fieldAi, setFieldAi] = useState({ busyId: "", proposal: null, manual: null, error: "" });
  const openAiConfirmedRef = useRef(false);
  if (!narrative) {
    return <section className="studio-page"><div className="studio-empty"><Sparkles size={34} /><h2>Preparando el diseño narrativo…</h2><p>Estamos cargando la brújula y la estructura de tu historia.</p></div></section>;
  }
  const aiConfigured = isProviderConfigured({ toolId: AI_TOOL_IDS.NOVEL_STUDIO, settings: aiSettings });
  const suggestNarrativeField = async ({ id, label, instruction, currentValue, context, characterIds = [], sceneIds = [], onApply }) => {
    if (readOnly || !aiConfigured || fieldAi.busyId) return;
    if (aiSettings?.provider === "openai" && !openAiConfirmedRef.current) {
      const accepted = confirm("Esta acción enviará a OpenAI el campo y su contexto narrativo cercano —incluidas las fichas y escenas relacionadas— y puede generar costos en tu cuenta API. ¿Quieres continuar?");
      if (!accepted) return;
      openAiConfirmedRef.current = true;
    }
    setFieldAi({ busyId: id, proposal: null, manual: null, error: "" });
    try {
      const characters = [...new Set(characterIds)].slice(0, 20).map((characterId) => codex.find((entry) => entry.id === characterId)).filter(Boolean).map((entry) => ({ name: entry.name, description: entry.description || "" }));
      const scenes = (await Promise.all([...new Set(sceneIds)].slice(0, 8).map(async (sceneId) => {
        const structural = structure.scenes?.[sceneId];
        try {
          const saved = await repository.readScene(novel.id, sceneId);
          return { title: structural?.title || saved.metadata?.title || "Escena", summary: structural?.summary || saved.metadata?.summary || "", beats: structural?.beats || saved.metadata?.beats || [], prose: String(saved.prose || "").slice(0, 12000) };
        } catch { return structural ? { title: structural.title, summary: structural.summary || "", beats: structural.beats || [] } : null; }
      }))).filter(Boolean);
      const prompt = buildNarrativeFieldPrompt({ label, instruction, currentValue, foundation: narrative.foundation, context, characters, scenes });
      const metadata = { title: `${label} · Diseño narrativo`, summary: String(currentValue || "").slice(0, 2000), beats: [] };
      if (aiSettings.provider === "chatgpt-manual") {
        const manualPrompt = buildChatGptManualPrompt("narrative-field", prompt, metadata);
        const url = normalizeChatGptUrl(aiSettings.manualUrl);
        setFieldAi({ busyId: "", proposal: null, error: "", manual: { label, prompt: manualPrompt, url, onApply } });
        return;
      }
      const value = await requestSceneSuggestion({ task: "narrative-field", prose: prompt, metadata, settings: aiSettings });
      setFieldAi({ busyId: "", manual: null, error: "", proposal: { label, currentValue, value, onApply } });
    } catch (error) { setFieldAi({ busyId: "", proposal: null, manual: null, error: error.message }); }
  };
  const ai = { configured: aiConfigured, busyId: fieldAi.busyId, suggest: suggestNarrativeField };
  const closeFieldAi = () => setFieldAi({ busyId: "", proposal: null, manual: null, error: "" });
  const applyFieldAi = (request, value) => { request?.onApply?.(String(value || "").trim()); closeFieldAi(); };
  return (
    <section className="studio-page studio-design">
      <PageTitle kicker="Diseño narrativo" title="Diseño de la historia" text="Un mapa vivo de tu novela: qué quieres contar, cómo se sostiene y qué le falta por madurar." />
      <DesignTabs active={tab} onChange={setTab} />
      {tab === "resumen" && <ResumenTab novel={novel} structure={structure} codex={codex} narrative={narrative} setTab={setTab} />}
      {tab === "brujula" && <BrujulaTab codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} ai={ai} />}
      {tab === "inicio" && <OpeningTab novel={novel} structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} ai={ai} />}
      {tab === "personajes" && <CharactersTab novel={novel} structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} onTab={setTab} ai={ai} />}
      {tab === "arcos" && <ArcsTab novel={novel} structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} ai={ai} />}
      {tab === "tramas" && <PlotsTab novel={novel} structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} ai={ai} />}
      {tab === "capitulos" && <ChaptersTab novel={novel} structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} ai={ai} />}
      {tab === "escenas" && <ScenesTab novel={novel} structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} ai={ai} />}
      {tab === "tema" && <ThemeTab novel={novel} structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} onOpenCompass={() => setTab("brujula")} ai={ai} />}
      {tab === "estructura" && <EstructuraTab structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} ai={ai} />}
      {tab === "herramientas" && <AdvancedTab novel={novel} structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} aiSettings={aiSettings} readOnly={readOnly} onTab={setTab} />}
      {tab === "diagnostico" && <DiagnosticoTab structure={structure} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} setTab={setTab} />}
      {fieldAi.error && <AiRequestErrorDialog message={fieldAi.error} onClose={closeFieldAi} />}
      {fieldAi.proposal && <DesignFieldProposal request={fieldAi.proposal} onApply={(value) => applyFieldAi(fieldAi.proposal, value)} onCancel={closeFieldAi} />}
      {fieldAi.manual && <DesignFieldManual request={fieldAi.manual} onApply={(value) => applyFieldAi(fieldAi.manual, value)} onCancel={closeFieldAi} />}
    </section>
  );
}

function DesignFieldProposal({ request, onApply, onCancel }) {
  return <div className="studio-modal" role="dialog" aria-modal="true" aria-labelledby="design-ai-title"><div className="studio-modal__card studio-ai-dialog"><p className="studio-kicker"><Sparkles size={15} /> Sugerencia de IA</p><h2 id="design-ai-title">{request.label}</h2><p className="studio-ai-privacy">Revisa la propuesta antes de incorporarla al diseño.</p>{request.currentValue && <div className="studio-ai-comparison"><small>Actual</small><p>{request.currentValue}</p></div>}<div className="studio-ai-comparison is-proposal"><small>Propuesta</small><p>{request.value}</p></div><div className="studio-row"><button type="button" className="studio-button studio-button--secondary" onClick={onCancel}>Cancelar</button><button type="button" className="studio-button" onClick={() => onApply(request.value)}><Sparkles size={15} /> Aplicar sugerencia</button></div></div></div>;
}

function DesignFieldManual({ request, onApply, onCancel }) {
  const [value, setValue] = useState("");
  return <div className="studio-modal" role="dialog" aria-modal="true" aria-labelledby="design-manual-ai-title"><div className="studio-modal__card studio-manual-dialog"><p className="studio-kicker"><Sparkles size={15} /> ChatGPT manual</p><h2 id="design-manual-ai-title">Completa “{request.label}”</h2><ol><li>Pulsa <strong>Copiar solicitud</strong>.</li><li>Pulsa <strong>Abrir ChatGPT o proyecto</strong>; recién entonces se abrirá otra pestaña.</li><li>Pega y envía la solicitud.</li><li>Copia únicamente el resultado y pégalo abajo.</li></ol><details><summary>Ver solicitud preparada</summary><textarea readOnly rows="8" value={request.prompt} /></details><div className="studio-row"><button type="button" className="studio-button studio-button--secondary" onClick={() => navigator.clipboard?.writeText(request.prompt)}>Copiar solicitud</button><button type="button" className="studio-button studio-button--secondary" onClick={() => window.open(request.url, "_blank", "noopener,noreferrer")}>Abrir ChatGPT o proyecto</button></div><label>Resultado<textarea rows="5" value={value} onChange={(event) => setValue(event.target.value)} /></label><div className="studio-row"><button type="button" className="studio-button studio-button--secondary" onClick={onCancel}>Cancelar</button><button type="button" className="studio-button" disabled={!value.trim()} onClick={() => onApply(value)}>Aplicar resultado</button></div></div></div>;
}

/* ------------------------------ Resumen ------------------------------ */

function ResumenTab({ novel, structure, codex, narrative, setTab }) {
  const foundation = narrative.foundation || {};
  const protagonist = codex.find((entry) => entry.id === foundation.protagonistaId);
  const beats = narrative.storyBeats || [];
  const active = (narrative.frameworkInstances || []).find((item) => item.id === narrative.activeFrameworkId);
  const definedStages = (active?.stages || []).filter((stage) => !stage.omitted && !stage.notApplicable);
  const step = nextBestStep(narrative, { structure });
  const diagnostics = filterDismissed(runDiagnostics({ narrative, structure, codex }), narrative.dismissedDiagnostics || []).slice(0, 3);
  return (
    <div className="studio-design-grid">
      <section className="studio-panel studio-design-summary">
        <p className="studio-kicker"><Compass size={15} /> Tu historia en una tarjeta</p>
        <h2>{novel.title}</h2>
        <dl className="studio-design-facts">
          <div><dt>Premisa</dt><dd>{foundation.premisa || <em>Aún sin definir. La Brújula te ayuda a encontrarla.</em>}</dd></div>
          <div><dt>Protagonista</dt><dd>{protagonist ? protagonist.name : <em>Sin elegir todavía.</em>}</dd></div>
          <div><dt>Objetivo</dt><dd>{foundation.objetivoGlobal || <em>Sin definir.</em>}</dd></div>
          <div><dt>Conflicto</dt><dd>{foundation.conflictoCentral || <em>Sin definir.</em>}</dd></div>
        </dl>
      </section>
      <section className="studio-panel">
        <p className="studio-kicker"><ListChecks size={15} /> Progreso</p>
        <div className="studio-design-progress">
          <div><strong>{beats.length}</strong><span>{beats.length === 1 ? "momento clave" : "momentos clave"}</span></div>
          <div><strong>{definedStages.length}</strong><span>{definedStages.length === 1 ? "etapa definida" : "etapas definidas"}{active ? ` en «${active.name}»` : ""}</span></div>
        </div>
        {!active && <p className="studio-notice">Todavía no has aplicado ninguna estructura. Puedes hacerlo desde la pestaña Estructura.</p>}
      </section>
      {step && (
        <section className="studio-panel studio-design-next-step">
          <p className="studio-kicker"><Sparkles size={15} /> Siguiente mejor paso</p>
          <h2>{step.title}</h2>
          <p>{step.description}</p>
          <div className="studio-row"><button className="studio-button" onClick={() => setTab(step.tab || "brujula")}>Ir ahora</button></div>
        </section>
      )}
      <section className="studio-panel">
        <p className="studio-kicker"><Stethoscope size={15} /> Diagnóstico rápido</p>
        {diagnostics.length === 0 ? <p>Nada que señalar por ahora. Buen trabajo.</p> : (
          <ul className="studio-design-mini-list">
            {diagnostics.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.where || item.location || ""}</span></li>)}
          </ul>
        )}
        <div className="studio-row"><button className="studio-button studio-button--secondary" onClick={() => setTab("diagnostico")}>Ver diagnóstico completo</button></div>
      </section>
    </div>
  );
}

/* ------------------------------ Brújula ------------------------------ */

function BrujulaTab({ codex, narrative, setNarrative, readOnly, ai }) {
  const foundation = narrative.foundation || {};
  const [draftFoundation, setDraftFoundation] = useState(() => foundation);
  useEffect(() => { setDraftFoundation(foundation); }, [foundation]);
  const fieldStatus = draftFoundation.fieldStatus || {};
  const characters = codex.filter((entry) => entry.type === "character");
  const updateField = (key, value) => {
    if (readOnly) return;
    setDraftFoundation((current) => ({ ...current, [key]: value }));
    setNarrative((current) => ({
      ...current,
      foundation: { ...(current.foundation || {}), [key]: value },
      updatedAt: nowIso(),
    }));
  };
  const updateStatus = (key, value) => {
    if (readOnly) return;
    setDraftFoundation((current) => ({ ...current, fieldStatus: { ...(current.fieldStatus || {}), [key]: value } }));
    setNarrative((current) => {
      const currentFoundation = current.foundation || {};
      return {
        ...current,
        foundation: { ...currentFoundation, fieldStatus: { ...(currentFoundation.fieldStatus || {}), [key]: value } },
        updatedAt: nowIso(),
      };
    });
  };
  return (
    <div className="studio-design-brujula">
      <div className="studio-design-brujula__form">
        <p className="studio-notice">Nada aquí es obligatorio. Escribe lo que tengas claro y deja el resto para más adelante; la brújula madura contigo.</p>
        <section className="studio-panel">
          <label>Protagonista
            <select value={draftFoundation.protagonistaId || ""} disabled={readOnly} onChange={(event) => updateField("protagonistaId", event.currentTarget.value || null)}>
              <option value="">Sin elegir</option>
              {characters.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
            </select>
          </label>
          {characters.length === 0 && <p><small>Crea personajes en el Codex para poder elegir uno aquí.</small></p>}
        </section>
        {FOUNDATION_FIELDS.map(([key, label, hint]) => (
          <section className="studio-panel studio-design-field" key={key}>
            <div className="studio-design-field__heading">
              <label htmlFor={`design-field-${key}`}>{label}</label>
              <select aria-label={`Estado de ${label}`} value={fieldStatus[key] || "sin-definir"} disabled={readOnly} onChange={(event) => updateStatus(key, event.target.value)}>
                {FIELD_STATUS.map(([value, text]) => <option value={value} key={value}>{text}</option>)}
              </select>
            </div>
            <small>{hint}</small>
            <div className="studio-narrative-ai-control"><NarrativeAiButton ai={ai} id={`brujula-${key}`} label={label} instruction={hint} currentValue={draftFoundation[key]} context={{ seccion: 'Brújula', fundamentoActual: draftFoundation }} characterIds={[draftFoundation.protagonistaId].filter(Boolean)} onApply={(value) => updateField(key, value)} /><textarea id={`design-field-${key}`} rows={3} value={draftFoundation[key] || ""} disabled={readOnly} onChange={(event) => updateField(key, event.currentTarget.value)} /></div>
          </section>
        ))}
      </div>
      <aside className="studio-panel studio-design-questions">
        <p className="studio-kicker"><Compass size={15} /> Preguntas que ayudan</p>
        <ul>{GUIDE_QUESTIONS.map((question) => <li key={question}>{question}</li>)}</ul>
        <p><small>Vuelve a estas preguntas cuando un campo se resista. No hace falta responderlas todas.</small></p>
      </aside>
    </div>
  );
}

/* ------------------------------ Estructura ------------------------------ */

function EstructuraTab({ structure, codex, narrative, setNarrative, readOnly, ai }) {
  const [templateId, setTemplateId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [layers, setLayers] = useState({ actos: true, capitulos: true, beats: true, etapas: true, escenas: true });
  const [inverseSelection, setInverseSelection] = useState(null); // { kind: "beat"|"scene", id }

  const instances = narrative.frameworkInstances || [];
  const active = instances.find((item) => item.active) || instances[0] || null;
  const beats = useMemo(() => [...(narrative.storyBeats || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [narrative.storyBeats]);
  const scenes = useMemo(() => flattenScenes(structure), [structure]);
  const activeStage = (active?.stages || []).find((stage) => stage.id === selectedStageId) || null;

  const apply = (next) => { if (!readOnly && next) setNarrative(next); };
  const applyTemplate = () => { if (templateId) apply(instantiateFramework(narrative, templateId)); };
  const duplicateActive = () => {
    if (!active) return;
    apply(createCustomFramework(narrative, { ...active, name: `${active.name} (copia)` }));
  };
  const deleteFramework = (instance) => {
    if (readOnly || !instance) return;
    const confirmed = window.confirm(`¿Eliminar la lente «${instance.name || "Sin nombre"}»?\n\nSe quitarán sus etapas, asignaciones y correspondencias. Las escenas, capítulos, momentos, personajes y el manuscrito no se borrarán.`);
    if (!confirmed) return;
    apply(removeFramework(narrative, instance.id));
    if ((instance.stages || []).some((stage) => stage.id === selectedStageId)) setSelectedStageId("");
    if (compareA === instance.id) setCompareA("");
    if (compareB === instance.id) setCompareB("");
  };

  return (
    <div className="studio-design-estructura">
      <section className="studio-panel">
        <div className="studio-panel-heading">
          <div><p className="studio-kicker"><Layers size={15} /> Estructuras</p><h2>Lentes estructurales</h2></div>
        </div>
        <p className="studio-notice">Las etapas son una lente sobre tu historia, no una obligación. Puedes omitir, renombrar o reordenar libremente.</p>
        <div className="studio-row studio-design-apply">
          <select aria-label="Plantilla de estructura" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">Elige una plantilla…</option>
            {FRAMEWORK_TEMPLATES.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}
          </select>
          <button className="studio-button" disabled={readOnly || !templateId} onClick={applyTemplate}>Aplicar</button>
        </div>
        {instances.length > 0 && (
          <ul className="studio-design-instances">
            {instances.map((instance) => (
              <li key={instance.id} className={instance.id === narrative.activeFrameworkId ? "active" : ""}>
                <span>{instance.name}{instance.id === narrative.activeFrameworkId && <strong> · activa</strong>}</span>
                <span className="studio-design-instances__actions">
                  {instance.id !== narrative.activeFrameworkId && <button className="studio-button studio-button--secondary" disabled={readOnly} onClick={() => apply(setActiveFramework(narrative, instance.id))}><Check size={15} /> Activar</button>}
                  {instance.id === narrative.activeFrameworkId && <button className="studio-button studio-button--secondary" disabled={readOnly} onClick={duplicateActive}><Copy size={15} /> Duplicar como personalizada</button>}
                  <button className="studio-button studio-button--danger" disabled={readOnly} onClick={() => deleteFramework(instance)}><Trash2 size={15} /> Eliminar</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {active && (
        <section className="studio-panel">
          <p className="studio-kicker">Etapas de «{active.name}»</p>
          <StageList narrative={narrative} framework={active} selectedStageId={selectedStageId} onSelect={setSelectedStageId} apply={apply} readOnly={readOnly} ai={ai} />
        </section>
      )}

      <section className="studio-panel">
        <p className="studio-kicker">Momentos clave</p>
        <BeatList narrative={narrative} beats={beats} codex={codex} scenes={scenes} apply={apply} readOnly={readOnly} onSelect={(id) => setInverseSelection({ kind: "beat", id })} ai={ai} />
      </section>

      {active && activeStage && (
        <section className="studio-panel">
          <p className="studio-kicker">Asignaciones de «{activeStage.name}»</p>
          <StageAssignments narrative={narrative} framework={active} stage={activeStage} beats={beats} scenes={scenes} apply={apply} readOnly={readOnly} onSelectScene={(id) => setInverseSelection({ kind: "scene", id })} />
        </section>
      )}

      {inverseSelection && (
        <section className="studio-panel studio-design-inverse">
          <div className="studio-panel-heading">
            <div><p className="studio-kicker">Vista inversa</p><h2>Dónde aparece</h2></div>
            <button className="studio-icon-button" aria-label="Cerrar vista inversa" onClick={() => setInverseSelection(null)}><X size={17} /></button>
          </div>
          <InverseView narrative={narrative} selection={inverseSelection} beats={beats} scenes={scenes} />
        </section>
      )}

      {instances.length >= 2 && (
        <section className="studio-panel">
          <p className="studio-kicker"><GitCompareArrows size={15} /> Comparar estructuras</p>
          <div className="studio-row">
            <select aria-label="Estructura A" value={compareA} onChange={(event) => setCompareA(event.target.value)}>
              <option value="">Estructura A…</option>
              {instances.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
            <select aria-label="Estructura B" value={compareB} onChange={(event) => setCompareB(event.target.value)}>
              <option value="">Estructura B…</option>
              {instances.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </div>
          {compareA && compareB && compareA !== compareB && <CompareTable narrative={narrative} a={compareA} b={compareB} />}
        </section>
      )}

      <section className="studio-panel">
        <p className="studio-kicker"><Layers size={15} /> Capas</p>
        <div className="studio-row studio-design-layer-toggles">
          {[["actos", "Actos"], ["capitulos", "Capítulos"], ["beats", "Momentos clave"], ["etapas", "Etapas"], ["escenas", "Escenas"]].map(([key, label]) => (
            <label key={key} className="studio-design-toggle">
              <input type="checkbox" checked={layers[key]} onChange={(event) => setLayers({ ...layers, [key]: event.target.checked })} />
              {layers[key] ? <Eye size={14} /> : <EyeOff size={14} />} {label}
            </label>
          ))}
        </div>
        <LayersTimeline narrative={narrative} structure={structure} scenes={scenes} beats={beats} layers={layers} />
      </section>
    </div>
  );
}

function StageList({ narrative, framework, selectedStageId, onSelect, apply, readOnly, ai }) {
  const stages = framework.stages || [];
  const [newStageName, setNewStageName] = useState("");
  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= stages.length) return;
    apply(reorderStages(narrative, framework.id, index, target));
  };
  const addNew = () => {
    if (!newStageName.trim()) return;
    apply(addStage(narrative, framework.id, { name: newStageName.trim() }));
    setNewStageName("");
  };
  return (
    <div className="studio-design-stages">
      <ol>
        {stages.map((stage, index) => {
          const omitted = stage.omitted || stage.notApplicable;
          return (
            <li key={stage.id} className={`studio-design-stage ${omitted ? "studio-design-stage--omitted" : ""} ${stage.id === selectedStageId ? "active" : ""}`}>
              <div className="studio-design-stage__select">
                <input aria-label="Nombre de la etapa" value={stage.name} disabled={readOnly} onChange={(event) => apply(updateStage(narrative, framework.id, stage.id, { name: event.target.value }))} />
                <div className="studio-narrative-ai-control"><NarrativeAiButton ai={ai} id={`estructura-${framework.id}-${stage.id}-descripcion`} label={`Descripción de ${stage.name}`} instruction="¿Qué ocurre en esta etapa dentro de esta novela?" currentValue={stage.description} context={{ seccion: 'Estructura', estructura: framework, etapa: stage, momentos: (narrative.storyBeats || []).filter((item) => (stage.assignments?.beats || []).includes(item.id)) }} sceneIds={stage.assignments?.scenes || []} onApply={(value) => apply(updateStage(narrative, framework.id, stage.id, { description: value }))} /><textarea aria-label="Descripción de la etapa" rows={2} value={stage.description || ""} disabled={readOnly} placeholder="¿Qué suele ocurrir en esta etapa?" onChange={(event) => apply(updateStage(narrative, framework.id, stage.id, { description: event.target.value }))} /></div>
              </div>
              <div className="studio-design-stage__actions">
                <button className={`studio-icon-button ${stage.id === selectedStageId ? "is-on" : ""}`} aria-label={stage.id === selectedStageId ? "Cerrar asignaciones de la etapa" : "Asignar elementos a la etapa"} aria-pressed={stage.id === selectedStageId} onClick={() => onSelect(stage.id === selectedStageId ? "" : stage.id)}><Check size={15} /></button>
                <button className="studio-icon-button" aria-label="Subir etapa" disabled={readOnly || index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
                <button className="studio-icon-button" aria-label="Bajar etapa" disabled={readOnly || index === stages.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
                <button className="studio-icon-button" aria-label="Fusionar con la etapa siguiente" title="Fusionar con la etapa siguiente" disabled={readOnly || index === stages.length - 1} onClick={() => apply(mergeStages(narrative, framework.id, stage.id, stages[index + 1].id))}><GitMerge size={15} /></button>
                <button className={`studio-icon-button ${omitted ? "is-on" : ""}`} aria-label={omitted ? "Recuperar etapa" : "Marcar como omitida"} title={omitted ? "Recuperar etapa" : "No aplica a mi historia"} disabled={readOnly} onClick={() => apply(updateStage(narrative, framework.id, stage.id, { omitted: !omitted }))}><EyeOff size={15} /></button>
                <button className="studio-icon-button" aria-label="Quitar etapa" disabled={readOnly} onClick={() => apply(removeStage(narrative, framework.id, stage.id))}><Trash2 size={15} /></button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="studio-row">
        <input placeholder="Nombre de la nueva etapa" value={newStageName} disabled={readOnly} onChange={(event) => setNewStageName(event.target.value)} />
        <button className="studio-button studio-button--secondary" disabled={readOnly || !newStageName.trim()} onClick={addNew}><Plus size={15} /> Añadir etapa</button>
      </div>
    </div>
  );
}

function BeatList({ narrative, beats, codex, scenes, apply, readOnly, onSelect, ai }) {
  const [draft, setDraft] = useState(null); // { id?, title, description, codexIds, sceneIds }
  const startNew = () => setDraft({ title: "", description: "", codexIds: [], sceneIds: [] });
  const startEdit = (beat) => setDraft({ id: beat.id, title: beat.title, description: beat.description || "", codexIds: beat.codexIds || [], sceneIds: beat.sceneIds || [] });
  const toggleCodex = (id) => setDraft((current) => ({ ...current, codexIds: current.codexIds.includes(id) ? current.codexIds.filter((item) => item !== id) : [...current.codexIds, id] }));
  const toggleScene = (id) => setDraft((current) => ({ ...current, sceneIds: current.sceneIds.includes(id) ? current.sceneIds.filter((item) => item !== id) : [...current.sceneIds, id] }));
  const save = () => {
    if (!draft.title.trim()) return;
    if (draft.id) apply(updateStoryBeat(narrative, draft.id, { title: draft.title.trim(), description: draft.description, codexIds: draft.codexIds, sceneIds: draft.sceneIds }));
    else apply(addStoryBeat(narrative, { ...createStoryBeat({ title: draft.title.trim() }), description: draft.description, codexIds: draft.codexIds, sceneIds: draft.sceneIds }));
    setDraft(null);
  };
  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= beats.length) return;
    const reordered = [...beats];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    apply({ ...narrative, storyBeats: reordered.map((beat, order) => ({ ...beat, order })), updatedAt: nowIso() });
  };
  const codexName = (id) => codex.find((entry) => entry.id === id)?.name || "Entrada eliminada";
  const sceneName = (id) => scenes.find(({ scene }) => scene.id === id)?.scene.title || "Escena eliminada";
  return (
    <div className="studio-design-beats">
      {beats.length === 0 && !draft && <p>Los momentos clave son los giros que el lector recordará: una decisión, una pérdida, una revelación…</p>}
      <ol>
        {beats.map((beat, index) => (
          <li key={beat.id} className="studio-design-beat">
            <button className="studio-design-beat__main" onClick={() => onSelect(beat.id)} title="Ver en qué etapas aparece">
              <strong>{beat.title}</strong>
              {beat.description && <span>{beat.description}</span>}
              {(beat.codexIds || []).length > 0 && <span className="studio-design-beat__chips">{(beat.codexIds || []).map((id) => <em key={id}>{codexName(id)}</em>)}</span>}
              {(beat.sceneIds || []).length > 0 && <span className="studio-design-beat__chips">{(beat.sceneIds || []).map((id) => <em key={id}>Escena: {sceneName(id)}</em>)}</span>}
            </button>
            <div className="studio-design-stage__actions">
              <button className="studio-icon-button" aria-label="Subir momento" disabled={readOnly || index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
              <button className="studio-icon-button" aria-label="Bajar momento" disabled={readOnly || index === beats.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
              <button className="studio-icon-button" aria-label="Editar momento" disabled={readOnly} onClick={() => startEdit(beat)}><Sparkles size={15} /></button>
              <button className="studio-icon-button" aria-label="Eliminar momento" disabled={readOnly} onClick={() => apply(removeStoryBeat(narrative, beat.id))}><Trash2 size={15} /></button>
            </div>
          </li>
        ))}
      </ol>
      {draft ? (
        <div className="studio-design-beat-form">
          <label>Título<input value={draft.title} autoFocus onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="studio-narrative-ai-label">Descripción<NarrativeAiButton ai={ai} id={`estructura-momento-${draft.id || 'nuevo'}-descripcion`} label="Descripción del momento" instruction="¿Qué acción, decisión, revelación o giro convierte esto en un momento clave?" currentValue={draft.description} context={{ seccion: 'Estructura · momentos clave', momento: draft, estructuraActiva: (narrative.frameworkInstances || []).find((item) => item.id === narrative.activeFrameworkId) }} characterIds={draft.codexIds || []} sceneIds={draft.sceneIds || []} onApply={(value) => setDraft((current) => ({ ...current, description: value }))} /><textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
          <div className="studio-design-codex-picker">
            <span>Vincular con el Codex:</span>
            {codex.map((entry) => (
              <button key={entry.id} className={draft.codexIds.includes(entry.id) ? "active" : ""} onClick={() => toggleCodex(entry.id)}>{entry.name}</button>
            ))}
          </div>
          <div className="studio-design-codex-picker">
            <span>Vincular con escenas:</span>
            {scenes.map(({ scene }) => (
              <button key={scene.id} className={draft.sceneIds.includes(scene.id) ? "active" : ""} onClick={() => toggleScene(scene.id)}>{scene.title}</button>
            ))}
          </div>
          <div className="studio-row">
            <button className="studio-button studio-button--secondary" onClick={() => setDraft(null)}>Cancelar</button>
            <button className="studio-button" disabled={!draft.title.trim()} onClick={save}>{draft.id ? "Guardar cambios" : "Añadir momento"}</button>
          </div>
        </div>
      ) : (
        <div className="studio-row"><button className="studio-button studio-button--secondary" disabled={readOnly} onClick={startNew}><Plus size={15} /> Nuevo momento clave</button></div>
      )}
    </div>
  );
}

function StageAssignments({ narrative, framework, stage, beats, scenes, apply, readOnly, onSelectScene }) {
  const assigned = stage.assignments || {};
  const has = (kind, id) => (assigned[kind] || []).includes(id);
  const toggle = (kind, id) => apply(has(kind, id) ? unassign(narrative, framework.id, stage.id, kind, id) : assign(narrative, framework.id, stage.id, kind, id));
  const chapters = [];
  const acts = [];
  for (const { act, chapter } of scenes) {
    if (!acts.some((item) => item.id === act.id)) acts.push(act);
    if (!chapters.some((item) => item.id === chapter.id)) chapters.push(chapter);
  }
  const Group = ({ kind, label, items, renderLabel, onPick }) => (
    <fieldset className="studio-design-assign-group">
      <legend>{label}</legend>
      {items.length === 0 ? <p><small>Nada disponible todavía.</small></p> : items.map((item) => (
        <div className="studio-design-assign-item" key={item.id}>
          <label>
            <input type="checkbox" checked={has(kind, item.id)} disabled={readOnly} onChange={() => toggle(kind, item.id)} />
            {renderLabel(item)}
          </label>
          {onPick && <button type="button" className="studio-text-link" onClick={() => onPick(item.id)}>dónde aparece</button>}
        </div>
      ))}
    </fieldset>
  );
  return (
    <div className="studio-design-assign">
      <Group kind="beats" label="Momentos clave" items={beats} renderLabel={(beat) => beat.title} />
      <Group kind="scenes" label="Escenas" items={scenes.map(({ scene }) => scene)} renderLabel={(scene) => scene.title} onPick={onSelectScene} />
      <Group kind="chapters" label="Capítulos" items={chapters} renderLabel={(chapter) => chapter.title} />
      <Group kind="acts" label="Actos" items={acts} renderLabel={(act) => act.title} />
    </div>
  );
}

function InverseView({ narrative, selection, beats, scenes }) {
  const title = selection.kind === "beat"
    ? beats.find((beat) => beat.id === selection.id)?.title
    : scenes.find(({ scene }) => scene.id === selection.id)?.scene.title;
  const appearances = sceneAssignments(narrative, selection.kind, selection.id);
  return (
    <div>
      <p><strong>{title || "Elemento"}</strong> aparece en:</p>
      {appearances.length === 0 ? <p>Todavía no está vinculado a ninguna etapa.</p> : (
        <ul className="studio-design-mini-list">
          {appearances.map((item, index) => <li key={index}><strong>{item.stageName}</strong><span>{item.frameworkName}</span></li>)}
        </ul>
      )}
    </div>
  );
}

function CompareTable({ narrative, a, b }) {
  const comparison = compareFrameworks(narrative, a, b);
  const rows = comparison.rows || comparison;
  const nameA = (narrative.frameworkInstances || []).find((item) => item.id === a)?.name || "A";
  const nameB = (narrative.frameworkInstances || []).find((item) => item.id === b)?.name || "B";
  return (
    <table className="studio-design-compare">
      <thead><tr><th>Momento clave</th><th>{nameA}</th><th>{nameB}</th></tr></thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.beatId || index}>
            <td>{row.beatTitle || row.beat}</td>
            <td>{row.a || row.stageA || "—"}</td>
            <td>{row.b || row.stageB || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LayersTimeline({ narrative, structure, scenes, beats, layers }) {
  const active = (narrative.frameworkInstances || []).find((item) => item.id === narrative.activeFrameworkId);
  const stages = active?.stages || [];
  const beatStage = (beatId) => stages.filter((stage) => (stage.assignments?.beats || []).includes(beatId)).map((stage) => stage.name);
  const sceneStage = (sceneId) => stages.filter((stage) => (stage.assignments?.scenes || []).includes(sceneId)).map((stage) => stage.name);
  const beatById = Object.fromEntries(beats.map((beat) => [beat.id, beat]));
  const sceneBeatIds = new Set();
  for (const stage of stages) for (const beatId of stage.assignments?.beats || []) sceneBeatIds.add(beatId);
  const grouped = [];
  for (const item of scenes) {
    let actGroup = grouped.find((group) => group.act.id === item.act.id);
    if (!actGroup) { actGroup = { act: item.act, chapters: [] }; grouped.push(actGroup); }
    let chapterGroup = actGroup.chapters.find((group) => group.chapter.id === item.chapter.id);
    if (!chapterGroup) { chapterGroup = { chapter: item.chapter, scenes: [] }; actGroup.chapters.push(chapterGroup); }
    chapterGroup.scenes.push(item.scene);
  }
  if (grouped.length === 0) return <p>Cuando tengas actos, capítulos y escenas, aquí verás cómo se cruzan con tus etapas y momentos clave.</p>;
  return (
    <div className="studio-design-layers">
      {grouped.map(({ act, chapters }) => (
        <div key={act.id} className="studio-design-layers__act">
          {layers.actos && <h3>{act.title}</h3>}
          {chapters.map(({ chapter, scenes: chapterScenes }) => (
            <div key={chapter.id} className="studio-design-layers__chapter">
              {layers.capitulos && <h4>{chapter.title}</h4>}
              {layers.escenas && chapterScenes.map((scene) => (
                <div key={scene.id} className="studio-design-layers__scene">
                  <span>{scene.title}</span>
                  {layers.etapas && sceneStage(scene.id).map((name) => <em key={name} className="studio-design-badge studio-design-badge--stage">{name}</em>)}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      {layers.beats && beats.length > 0 && (
        <div className="studio-design-layers__beats">
          <h3>Momentos clave</h3>
          {beats.map((beat) => (
            <div key={beat.id} className="studio-design-layers__beat">
              <span>{beat.title}</span>
              {layers.etapas && beatStage(beat.id).map((name) => <em key={name} className="studio-design-badge studio-design-badge--stage">{name}</em>)}
              {layers.etapas && beatStage(beat.id).length === 0 && <em className="studio-design-badge">Sin etapa</em>}
            </div>
          ))}
        </div>
      )}
      {beatById && sceneBeatIds.size === 0 && null}
    </div>
  );
}

/* ------------------------------ Diagnóstico ------------------------------ */

function DiagnosticoTab({ structure, codex, narrative, setNarrative, readOnly, setTab }) {
  const [hidden, setHidden] = useState(() => new Set());
  const dismissed = narrative.dismissedDiagnostics || [];
  const all = runDiagnostics({ narrative, structure, codex });
  const visible = filterDismissed(all, dismissed).filter((item) => !hidden.has(item.id));
  const ignore = (id) => setHidden((current) => new Set(current).add(id));
  const neverShow = (id) => { if (!readOnly) setNarrative({ ...narrative, dismissedDiagnostics: [...dismissed, id], updatedAt: nowIso() }); };
  const navigate = (item) => {
    const involved = item.involvedIds || {}; const target = item.target || {};
    const area = `${item.where || ""} ${item.type || ""}`.toLocaleLowerCase();
    const areaTab = area.includes("brújula") || area.includes("fundamento") || area.includes("protagonista") ? "brujula" : area.includes("apertura") || area.includes("inicio") ? "inicio" : area.includes("revel") || area.includes("símbol") || area.includes("conflicto") ? "tema" : area.includes("trama") ? "tramas" : area.includes("arco") ? "arcos" : null;
    const tab = target.tab || (involved.sceneIds?.length ? "escenas" : involved.chapterIds?.length ? "capitulos" : involved.codexIds?.length ? "personajes" : involved.stageIds?.length ? "estructura" : areaTab || "resumen");
    const params = new URLSearchParams({ tab });
    const sceneId = target.sceneId || involved.sceneIds?.[0]; const chapterId = target.chapterId || involved.chapterIds?.[0];
    if (sceneId) params.set("scene", sceneId); if (chapterId) params.set("chapter", chapterId); if (target.view) params.set("view", target.view);
    history.replaceState({}, "", `${location.pathname}?${params}`); setTab(tab);
  };
  const severityLabel = { aviso: "Revisión", info: "Información", atencion: "Atención" };
  return (
    <div>
      <p className="studio-notice">Estas son observaciones heurísticas, no errores. Tú decides qué hacer con cada una.</p>
      {visible.length === 0 ? (
        <div className="studio-empty"><Stethoscope size={34} /><h2>Nada que observar por ahora</h2><p>Cuando tu diseño crezca, aquí aparecerán sugerencias para mirarlo con otros ojos.</p></div>
      ) : (
        <div className="studio-design-diagnostics">
          {visible.map((item) => (
            <article key={item.id} className="studio-panel studio-diagnostic-card">
              <header><span className={`studio-diagnostic-severity is-${item.severity}`}>{severityLabel[item.severity] || item.severity}</span><h2>{item.title}</h2></header>
              {item.observed && <p><strong>Qué observó:</strong> {item.observed}</p>}
              {item.why && <p><strong>Por qué podría importar:</strong> {item.why}</p>}
              {(item.where || item.location) && <p><strong>Dónde ocurre:</strong> {item.where || item.location}</p>}
              {(item.suggestions || []).length > 0 && (
                <div><strong>Sugerencias:</strong><ul>{item.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul></div>
              )}
              <div className="studio-row">
                <button className="studio-button" onClick={() => navigate(item)}>Abrir lugar relevante</button>
                <button className="studio-button studio-button--secondary" onClick={() => ignore(item.id)}>Ignorar una vez</button>
                <button className="studio-button studio-button--danger" disabled={readOnly} onClick={() => neverShow(item.id)}>No volver a mostrar</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
