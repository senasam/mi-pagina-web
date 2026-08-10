import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { AI_TOOL_IDS } from '../../../platform/ai/contracts.js';
import { isProviderConfigured } from '../../../platform/ai/providerRegistry.js';
import { normalizeChatGptUrl } from '../../aiProviders.js';
import {
  AI_ASSISTANT_CASES, addFrameworkCorrespondence, applyAiProposal, buildFrameworkMatrix,
  clarificationForAiCase, parseAiDraft, removeFrameworkCorrespondence, updateFrameworkCorrespondence,
} from '../phase5Engine.js';
import { buildManualNarrativePrompt, requestNarrativeDraft } from '../narrativeAssistant.js';
import { resolveCodexEntry, selectCharacters, selectStructureCatalog } from '../selectors.js';
import AiRequestErrorDialog from '../../AiRequestErrorDialog.jsx';

const ids = (event) => [...event.target.selectedOptions].map((option) => option.value);

function FrameworkComparison({ structure, codex, narrative, setNarrative, readOnly }) {
  const frameworks = narrative.frameworkInstances || [];
  const catalog = useMemo(() => selectStructureCatalog(structure), [structure]);
  const [chosen, setChosen] = useState(frameworks.slice(0, 2).map((item) => item.id));
  const [filters, setFilters] = useState({ actId: '', plotId: '', characterId: '' });
  const rows = buildFrameworkMatrix(narrative, structure, chosen, filters);
  const add = () => {
    const [a, b] = frameworks.filter((item) => chosen.includes(item.id));
    if (!a || !b) return;
    setNarrative(addFrameworkCorrespondence(narrative, { frameworkAId: a.id, stageAId: a.stages?.[0]?.id, frameworkBId: b.id, stageBId: b.stages?.[0]?.id }));
  };
  const sceneName = (id) => catalog.scenes.find((item) => item.id === id)?.title || id;
  const beatName = (id) => narrative.storyBeats?.find((item) => item.id === id)?.title || id;
  return <><section className="studio-panel"><p className="studio-kicker">Comparación transversal</p><h2>Correspondencias entre marcos y evidencia real</h2><p>Las coincidencias derivadas solo se muestran. Las correspondencias manuales se guardan aparte y nunca alteran las asignaciones de una etapa.</p><div className="studio-form-grid"><label>Marcos (elige al menos dos)<select multiple size="5" value={chosen} onChange={(event) => setChosen(ids(event))}>{frameworks.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Filtrar por acto<select value={filters.actId} onChange={(event) => setFilters({ ...filters, actId: event.target.value })}><option value="">Todos</option>{catalog.acts.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label>Filtrar por trama<select value={filters.plotId} onChange={(event) => setFilters({ ...filters, plotId: event.target.value })}><option value="">Todas</option>{(narrative.plots || []).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Filtrar por personaje<select value={filters.characterId} onChange={(event) => setFilters({ ...filters, characterId: event.target.value })}><option value="">Todos</option>{selectCharacters(codex).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div></section>
    <section className="studio-panel"><div className="studio-panel-heading"><div><h2>Matriz</h2><p>{rows.length} correspondencias visibles.</p></div><button type="button" className="studio-button studio-button--secondary" disabled={readOnly || chosen.length !== 2} onClick={add}><Plus size={15} /> Correspondencia manual</button></div>{rows.length ? <div className="table-scroll" tabIndex="0"><table className="studio-design-compare"><thead><tr><th>Marco y etapa A</th><th>Marco y etapa B</th><th>Momentos reales</th><th>Escenas reales</th><th>Origen</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.frameworkA.name}</strong><br />{row.stageA.name}</td><td><strong>{row.frameworkB.name}</strong><br />{row.stageB.name}</td><td>{row.sharedBeatIds.map(beatName).join(', ') || '—'}</td><td>{row.sharedSceneIds.map(sceneName).join(', ') || '—'}</td><td>{row.manual ? 'Manual' : 'Derivada de asignaciones'}</td></tr>)}</tbody></table></div> : <div className="studio-empty"><h3>Sin coincidencias visibles</h3><p>Asigna una misma escena o momento a dos marcos, o crea una correspondencia manual.</p></div>}</section>
    <section className="studio-panel"><h2>Correspondencias manuales</h2><div className="studio-design-correspondences">{(narrative.frameworkCorrespondences || []).map((item) => { const a = frameworks.find((entry) => entry.id === item.frameworkAId); const b = frameworks.find((entry) => entry.id === item.frameworkBId); return <article key={item.id}><label>Marco A<select value={item.frameworkAId || ''} disabled={readOnly} onChange={(event) => setNarrative(updateFrameworkCorrespondence(narrative, item.id, { frameworkAId: event.target.value, stageAId: null }))}>{frameworks.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label><label>Etapa A<select value={item.stageAId || ''} disabled={readOnly} onChange={(event) => setNarrative(updateFrameworkCorrespondence(narrative, item.id, { stageAId: event.target.value || null }))}><option value="">Elegir…</option>{(a?.stages || []).map((stage) => <option value={stage.id} key={stage.id}>{stage.name}</option>)}</select></label><label>Marco B<select value={item.frameworkBId || ''} disabled={readOnly} onChange={(event) => setNarrative(updateFrameworkCorrespondence(narrative, item.id, { frameworkBId: event.target.value, stageBId: null }))}>{frameworks.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label><label>Etapa B<select value={item.stageBId || ''} disabled={readOnly} onChange={(event) => setNarrative(updateFrameworkCorrespondence(narrative, item.id, { stageBId: event.target.value || null }))}><option value="">Elegir…</option>{(b?.stages || []).map((stage) => <option value={stage.id} key={stage.id}>{stage.name}</option>)}</select></label><label>Nota<input value={item.note || ''} disabled={readOnly} onChange={(event) => setNarrative(updateFrameworkCorrespondence(narrative, item.id, { note: event.target.value }))} /></label><button type="button" className="studio-icon-button" disabled={readOnly} onClick={() => setNarrative(removeFrameworkCorrespondence(narrative, item.id))}><Trash2 size={15} /></button></article>; })}</div></section></>;
}

function EntitySelector({ task, narrative, structure, codex, selection, setSelection }) {
  const catalog = selectStructureCatalog(structure);
  if (task === 'arc-beats') return <label>Arco<select value={selection.arcId || ''} onChange={(event) => setSelection({ arcId: event.target.value })}><option value="">Elegir…</option>{(narrative.characterArcs || []).map((item) => <option value={item.id} key={item.id}>{resolveCodexEntry(codex, item.codexId)?.name || 'Arco sin personaje'}</option>)}</select></label>;
  if (task === 'causal-gap') return <label>Relación causal<select value={selection.causalId || ''} onChange={(event) => setSelection({ causalId: event.target.value })}><option value="">Elegir…</option>{(narrative.causalLinks || []).map((item) => <option value={item.id} key={item.id}>{item.action || 'Acción sin título'}</option>)}</select></label>;
  if (task === 'frameworks') return <label>Dos marcos<select multiple size="4" value={selection.frameworkIds || []} onChange={(event) => setSelection({ frameworkIds: ids(event).slice(0, 2) })}>{(narrative.frameworkInstances || []).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>;
  if (task === 'scene-review') return <label>Escena<select value={selection.sceneId || ''} onChange={(event) => setSelection({ sceneId: event.target.value })}><option value="">Elegir…</option>{catalog.scenes.filter((item) => narrative.sceneDesigns?.[item.id]).map((item) => <option value={item.id} key={item.id}>{item.chapterTitle} · {item.title}</option>)}</select></label>;
  if (task === 'chapter-review') return <label>Capítulo<select value={selection.chapterId || ''} onChange={(event) => setSelection({ chapterId: event.target.value })}><option value="">Elegir…</option>{catalog.chapters.filter((item) => narrative.chapterDesigns?.[item.id]).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>;
  if (task === 'reveal-continuity') return <label>Revelación<select value={selection.revealId || ''} onChange={(event) => setSelection({ revealId: event.target.value })}><option value="">Elegir…</option>{(narrative.reveals || []).map((item) => <option value={item.id} key={item.id}>{item.title || item.info}</option>)}</select></label>;
  return null;
}

function AiAssistant({ structure, codex, narrative, setNarrative, readOnly, aiSettings }) {
  const [task, setTask] = useState('compass'); const [selection, setSelection] = useState({});
  const [draft, setDraft] = useState(null); const [manualText, setManualText] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const configured = isProviderConfigured({ toolId: AI_TOOL_IDS.NOVEL_STUDIO, settings: aiSettings });
  const clarification = clarificationForAiCase(task, narrative, selection);
  const params = { narrative, structure, codex, selection };
  const generate = async () => {
    setError(''); setDraft(null);
    if (clarification) { setError(clarification); return; }
    if (!configured) { setError('Configura un proveedor de IA en Configuración. Todas las herramientas manuales siguen disponibles sin IA.'); return; }
    if (aiSettings.provider === 'chatgpt-manual') {
      const prompt = buildManualNarrativePrompt(task, params); await navigator.clipboard.writeText(prompt); window.open(normalizeChatGptUrl(aiSettings.manualUrl), '_blank', 'noopener,noreferrer'); return;
    }
    if (aiSettings.provider === 'openai' && !confirm('Se enviará a OpenAI únicamente el contexto seleccionado que se muestra en esta herramienta. Puede generar costos en tu cuenta API. ¿Continuar?')) return;
    setBusy(true); try { setDraft(await requestNarrativeDraft({ task, ...params, settings: aiSettings })); } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  };
  const parseManual = () => { try { setDraft(parseAiDraft(manualText)); setError(''); } catch (cause) { setError(cause.message); } };
  const reject = (id) => setDraft((current) => ({ ...current, proposals: current.proposals.filter((item) => item.id !== id) }));
  const accept = (proposal) => { const next = applyAiProposal(narrative, proposal, { task, selection, provider: aiSettings?.provider }); if (next === narrative) { setError('El destino de esta propuesta no es válido para la tarea elegida o ya no existe. No se aplicó ningún cambio.'); return; } setNarrative(next); reject(proposal.id); };
  return <><section className="studio-panel"><p className="studio-kicker"><Sparkles size={15} /> IA opcional</p><h2>Borradores con aceptación individual</h2><p>La IA solo recibe el contexto de la tarea elegida. Las propuestas no son contenido canónico hasta que aceptas una por una.</p><div className="studio-form-grid"><label>Caso<select value={task} onChange={(event) => { setTask(event.target.value); setSelection({}); setDraft(null); }}>{AI_ASSISTANT_CASES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label><EntitySelector task={task} narrative={narrative} structure={structure} codex={codex} selection={selection} setSelection={setSelection} /></div>{clarification && <p className="studio-notice">{clarification}</p>}<div className="studio-row"><button type="button" className="studio-button" disabled={busy || Boolean(clarification)} onClick={generate}><Sparkles size={15} /> {busy ? 'Preparando borrador…' : aiSettings?.provider === 'chatgpt-manual' ? 'Copiar y abrir ChatGPT' : 'Generar borrador'}</button><span className="studio-design-badge">{configured ? `Proveedor: ${aiSettings.provider}` : 'IA no configurada'}</span></div></section>
    {error && <AiRequestErrorDialog message={error} onClose={() => setError('')} />}
    {aiSettings?.provider === 'chatgpt-manual' && <section className="studio-panel"><h2>Pegar respuesta estructurada</h2><textarea rows="8" value={manualText} placeholder='Pega aquí el JSON devuelto por ChatGPT.' onChange={(event) => setManualText(event.target.value)} /><div className="studio-row"><button type="button" className="studio-button studio-button--secondary" onClick={parseManual}><Copy size={15} /> Revisar propuestas</button><a className="studio-text-link" href={aiSettings.manualUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Abrir ChatGPT</a></div></section>}
    {draft?.needsClarification && <section className="studio-panel studio-warning"><strong>La IA necesita una decisión:</strong> {draft.needsClarification}</section>}
    {draft?.proposals?.length > 0 && <section className="studio-panel"><h2>Cambios propuestos</h2><div className="studio-ai-proposals">{draft.proposals.map((item) => <article key={item.id}><header><div><strong>{item.label}</strong><code>{item.target} · {item.operation}</code></div><div><button type="button" className="studio-icon-button" title="Rechazar" onClick={() => reject(item.id)}><X size={15} /></button><button type="button" className="studio-button" disabled={readOnly} onClick={() => accept(item)}><Check size={15} /> Aceptar</button></div></header><p>{typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}</p>{item.reason && <small>{item.reason}</small>}<footer>Fuentes: {item.sourceIds.join(', ') || 'contexto seleccionado'} · Destino: {item.target}</footer></article>)}</div></section>}
    <section className="studio-panel"><h3>Privacidad y control</h3><ul><li>No se envía la novela completa ni expedientes completos del Codex.</li><li>Rechazar o cancelar no modifica narrative.json.</li><li>Aceptar solo puede escribir en una lista cerrada de campos de Diseño; nunca en Codex, estructura o prosa.</li></ul></section></>;
}

export default function AdvancedTab(props) {
  const [view, setView] = useState('frameworks');
  return <><div className="studio-segmented studio-design-view-switch">{[['frameworks', 'Comparar marcos'], ['dialogue', 'Diálogo'], ['ai', 'Asistente IA']].map(([id, label]) => <button type="button" className={view === id ? 'active' : ''} onClick={() => setView(id)} key={id}>{label}</button>)}</div>{view === 'frameworks' && <FrameworkComparison {...props} />}{view === 'dialogue' && <section className="studio-panel studio-design-empty"><h2>Diálogo y persuasión por escena</h2><p>La lente vive dentro de cada ficha narrativa para mantener una sola fuente de verdad.</p><button type="button" className="studio-button" onClick={() => props.onTab('escenas')}><ExternalLink size={15} /> Abrir escenas</button></section>}{view === 'ai' && <AiAssistant {...props} />}</>;
}
