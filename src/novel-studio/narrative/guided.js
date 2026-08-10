// Recomendaciones progresivas para el resumen de Diseño Narrativo.
// Es lógica pura y deliberadamente orientativa: ningún paso es obligatorio.

import { normalizeNarrative } from "./model.js";

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

function activeFramework(narrative) {
  const instances = narrative.frameworkInstances || [];
  return instances.find((instance) => instance.id === narrative.activeFrameworkId)
    || instances.find((instance) => instance.active)
    || instances[0]
    || null;
}

function hasStructuralAssignment(narrative, framework) {
  if (!framework) return false;
  const stageIds = new Set((framework.stages || []).map((stage) => stage.id));
  return (narrative.assignments || []).some((assignment) => {
    const stageId = assignment?.stageId || assignment?.stageInstanceId;
    if (!stageIds.has(stageId)) return false;
    return (assignment.storyBeatIds || []).length > 0
      || (assignment.sceneIds || []).length > 0
      || (assignment.chapterIds || []).length > 0
      || (assignment.actIds || []).length > 0;
  });
}

/**
 * Devuelve una única acción pequeña y útil para continuar diseñando la novela.
 * La función acepta datos parciales o antiguos y nunca modifica la entrada.
 */
export function nextBestStep(value, { structure } = {}) {
  const narrative = normalizeNarrative(value);
  const foundation = narrative.foundation;

  if (!hasText(foundation.idea)) {
    return {
      id: "definir-idea",
      title: "Anota la semilla de la historia",
      description: "Escribe la idea que te hizo querer contarla. No tiene que ser una premisa completa todavía.",
      tab: "brujula",
    };
  }

  if (!hasText(foundation.premisa)) {
    return {
      id: "definir-premisa",
      title: "Dale una premisa a tu historia",
      description: "Resume quién quiere qué y qué fuerza se lo impide. Una frase provisional es suficiente.",
      tab: "brujula",
    };
  }

  if (!hasText(foundation.protagonistaId)) {
    return {
      id: "elegir-protagonista",
      title: "Elige quién conduce la historia",
      description: "Vincula un personaje del Codex como protagonista para orientar las decisiones de la novela.",
      tab: "brujula",
    };
  }

  if (!hasText(foundation.objetivoGlobal)) {
    return {
      id: "definir-objetivo",
      title: "Aclara qué persigue tu protagonista",
      description: "Anota el objetivo que mantiene la historia en movimiento. Puede cambiar mientras escribes.",
      tab: "brujula",
    };
  }

  if (!hasText(foundation.conflictoCentral)) {
    return {
      id: "definir-conflicto",
      title: "Nombra la principal fuerza de oposición",
      description: "Describe qué hace difícil alcanzar el objetivo global y por qué no puede resolverse enseguida.",
      tab: "brujula",
    };
  }

  const framework = activeFramework(narrative);
  if (!framework) {
    return {
      id: "elegir-estructura",
      title: "Prueba una lente estructural",
      description: "Aplica una plantilla para explorar el recorrido de la historia. Tus ideas no quedarán atadas a ella.",
      tab: "estructura",
    };
  }

  if ((narrative.storyBeats || []).length === 0) {
    return {
      id: "crear-momento-clave",
      title: "Anota un primer momento clave",
      description: "Registra un giro, decisión o revelación importante. Después podrás situarlo en cualquier estructura.",
      tab: "estructura",
    };
  }

  const usableStages = (framework.stages || []).filter((stage) =>
    !stage.omitted && !stage.notApplicable && stage.status !== "no-aplica");
  if (usableStages.length > 0 && !hasStructuralAssignment(narrative, framework)) {
    return {
      id: "relacionar-estructura",
      title: "Relaciona una idea con la estructura",
      description: "Asigna un momento clave o una escena a la etapa que mejor describa su función.",
      tab: "estructura",
    };
  }

  const availableSceneIds = new Set(Object.values(structure?.scenes || {})
    .filter((scene) => !scene?.archived)
    .map((scene) => scene.id));
  const hasSceneConnection = (narrative.storyBeats || []).some((beat) =>
    (beat.sceneIds || []).some((id) => availableSceneIds.has(id)))
    || (narrative.assignments || []).some((assignment) =>
      (assignment.sceneIds || []).some((id) => availableSceneIds.has(id)));
  if (availableSceneIds.size > 0 && !hasSceneConnection) {
    return {
      id: "vincular-escena",
      title: "Lleva el mapa a una escena",
      description: "Vincula un momento clave o una etapa con una escena existente para conectar planificación y manuscrito.",
      tab: "estructura",
    };
  }

  return null;
}
