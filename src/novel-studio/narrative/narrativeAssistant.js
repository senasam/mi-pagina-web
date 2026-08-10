import { buildChatGptManualPrompt } from '../aiProviders.js';
import { requestSceneSuggestion } from '../sceneAssistant.js';
import { buildAiContext, parseAiDraft } from './phase5Engine.js';

function compact(value, depth = 0) {
  if (depth > 7 || value == null || value === '') return undefined;
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => compact(item, depth + 1)).filter((item) => item !== undefined);
  if (typeof value !== 'object') return typeof value === 'string' ? value.slice(0, 5000) : value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['createdAt', 'updatedAt', 'fieldStatus'].includes(key))
    .map(([key, item]) => [key, compact(item, depth + 1)])
    .filter(([, item]) => item !== undefined));
}

export function buildNarrativeFieldPrompt({ label, instruction, currentValue, foundation, context, characters, scenes }) {
  const payload = compact({
    instruccionDelCampo: instruction || `Redacta una respuesta concreta para el campo «${label}».`,
    campo: label,
    valorActual: currentValue || 'Vacío',
    brujula: foundation || {},
    contextoCercano: context || {},
    personajesRelacionados: characters || [],
    escenasRelacionadas: scenes || [],
  });
  return `Responde únicamente al campo «${label}» siguiendo su instrucción y usando la información circundante. No inventes hechos que contradigan el contexto. Devuelve solo el texto listo para aplicar, sin encabezados ni explicaciones.\n\n<contexto-narrativo>\n${JSON.stringify(payload, null, 2).slice(0, 50000)}\n</contexto-narrativo>`;
}

export function buildNarrativeAiPrompt(task, context) {
  const instructions = `Analiza solo el contexto seleccionado. Distingue Codex, metadatos del manuscrito y planificación narrativa. No inventes prosa ni identidad canónica. Devuelve JSON válido con esta forma: {"needsClarification":"","proposals":[{"id":"p1","target":"ruta permitida","operation":"replace o append","label":"cambio breve","value":"texto u objeto","reason":"por qué","sourceIds":["ids usados"]}]}. Si falta una decisión central, no propongas cambios y escribe una pregunta en needsClarification. Máximo 8 propuestas independientes. Rutas permitidas: foundation.idea|premisa|preguntaTematica|contrapremisa|objetivoGlobal|conflictoCentral|antagonismo|stakes; characterArcs.<id>.beats con append y {label,text}; storyBeats con append y {title,description}; frameworkCorrespondences con append y {frameworkAId,stageAId,frameworkBId,stageBId,note}; sceneDesigns.<id>.objetivo|oposicion|tacticas|giro|resultado|consecuencia|preguntaNarrativa; chapterDesigns.<id>.funcionPrincipal|pregunta|objetivo|stakes|giro|consecuencia|nuevaPregunta; reveals.<id>.creiaAntes|sabeDespues|decisionQueProvoca|cambioEnPlan. Usa únicamente IDs presentes.`;
  return `${instructions}\n\n<selected-context>\n${JSON.stringify({ task, ...context })}\n</selected-context>`;
}

export function buildManualNarrativePrompt(task, params) {
  const context = buildAiContext(task, params);
  return buildChatGptManualPrompt('narrative-design', buildNarrativeAiPrompt(task, context), { title: 'Asistente de diseño narrativo' });
}

export async function requestNarrativeDraft({ task, narrative, structure, codex, selection, settings, fetchImpl = fetch }) {
  const context = buildAiContext(task, { narrative, structure, codex, selection });
  const raw = await requestSceneSuggestion({ task: 'narrative-design', prose: buildNarrativeAiPrompt(task, context), metadata: { title: 'Asistente de diseño narrativo' }, settings, fetchImpl });
  return { ...parseAiDraft(raw), context };
}
