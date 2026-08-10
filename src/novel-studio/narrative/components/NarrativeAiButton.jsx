import { LoaderCircle, Sparkles } from 'lucide-react';

export default function NarrativeAiButton({ ai, id, label, instruction, currentValue, context, characterIds, sceneIds, onApply }) {
  if (!ai) return null;
  const busy = ai.busyId === id;
  const title = !ai.configured
    ? 'Configura la IA para habilitar esta sugerencia'
    : busy ? `Generando ${label.toLocaleLowerCase()}…` : `Sugerir ${label.toLocaleLowerCase()} con IA`;
  return <button
    type="button"
    className="studio-design-ai-trigger"
    disabled={!ai.configured || Boolean(ai.busyId)}
    title={title}
    aria-label={title}
    onClick={() => ai.suggest({ id, label, instruction, currentValue, context, characterIds, sceneIds, onApply })}
  >{busy ? <LoaderCircle className="studio-spin" size={14} /> : <Sparkles size={14} />}</button>;
}
