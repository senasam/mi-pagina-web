import { useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Search } from 'lucide-react';
import SceneDesignEditor from '../components/SceneDesignEditor.jsx';
import { resolveCodexEntry, selectStructureCatalog } from '../selectors.js';

export default function ScenesTab({ novel, structure, codex, narrative, setNarrative, readOnly, ai }) {
  const catalog = useMemo(() => selectStructureCatalog(structure), [structure]);
  const requested = new URLSearchParams(location.search).get('scene');
  const [selectedId, setSelectedId] = useState(() => requested || catalog.scenes.find((item) => !item.archived)?.id || catalog.scenes[0]?.id || Object.keys(narrative.sceneDesigns || {})[0] || '');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const scene = catalog.scenes.find((item) => item.id === selectedId) || null;
  const orphanIds = Object.keys(narrative.sceneDesigns || {}).filter((id) => !catalog.scenes.some((sceneItem) => sceneItem.id === id));
  const visible = catalog.scenes.filter((item) => (showArchived || !item.archived) && `${item.title} ${item.summary} ${item.chapterTitle} ${item.actTitle}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const pov = scene && resolveCodexEntry(codex, scene.povId);
  const participants = scene ? (scene.participantIds || []).map((id) => resolveCodexEntry(codex, id)).filter(Boolean) : [];
  return <div className="studio-design-master-detail">
    <aside className="studio-panel studio-design-side-list"><label className="studio-search"><Search size={15} /><input placeholder="Buscar escena" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="studio-design-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Mostrar archivadas</label>{visible.map((item) => <button type="button" className={item.id === selectedId ? 'active' : ''} key={item.id} onClick={() => setSelectedId(item.id)}><span>{item.title || `Escena ${item.sceneIndex + 1}`}</span><small>{item.chapterTitle} · {narrative.sceneDesigns?.[item.id] ? 'Con ficha' : 'Sin ficha'}{item.archived ? ' · archivada' : ''}</small></button>)}{orphanIds.map((id) => <button type="button" className={id === selectedId ? 'active' : ''} key={id} onClick={() => setSelectedId(id)}><span><AlertTriangle size={14} /> Diseño huérfano</span><small>{id}</small></button>)}</aside>
    <section className="studio-panel studio-design-detail">{scene ? <><header className="studio-design-owner"><div><p className="studio-kicker">Datos canónicos de structure.json</p><h2>{scene.title || `Escena ${scene.sceneIndex + 1}`}</h2><p>{scene.actTitle} · {scene.chapterTitle} · {scene.status || 'Sin estado'}{scene.archived ? ' · Archivada' : ''}</p><p>POV: {pov?.name || (scene.povId ? 'Referencia ausente' : 'Sin definir')} · Participan: {participants.map((item) => item.name).join(', ') || 'sin participantes'}</p></div><a className="studio-button studio-button--secondary" href={`/estudio-novela/${novel.id}/escribir?scene=${encodeURIComponent(scene.id)}`}><Pencil size={15} /> Abrir escena</a></header><p className="studio-design-readonly-copy">{scene.summary || 'La estructura todavía no contiene un resumen. Esta ficha no lo reemplaza.'}</p><SceneDesignEditor scene={scene} codex={codex} narrative={narrative} setNarrative={setNarrative} readOnly={readOnly} ai={ai} /></> : narrative.sceneDesigns?.[selectedId] ? <div className="studio-empty"><AlertTriangle size={28} /><h2>La escena enlazada ya no existe</h2><p>Su diseño permanece en narrative.json. No se eliminará hasta que decidas cómo repararlo.</p></div> : <div className="studio-empty"><h2>No hay escenas disponibles</h2><p>Crea escenas desde Plan; Diseño no modifica la estructura del manuscrito.</p></div>}</section>
  </div>;
}
