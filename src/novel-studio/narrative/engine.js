/**
 * Motor puro para estructuras narrativas.
 *
 * Las asignaciones se conservan tanto en `narrative.assignments` (el modelo
 * persistente) como en `stage.assignments` (la forma que consume la UI). Todas
 * las operaciones devuelven copias y nunca modifican plantillas ni argumentos.
 */

import {
  createFrameworkInstance,
  createFrameworkStage,
  createStoryBeat,
} from './model.js';
import { getFrameworkTemplate } from './frameworkTemplates.js';

const nowIso = () => new Date().toISOString();
const makeId = () => crypto.randomUUID();

const KIND = {
  beat: ['beats', 'storyBeatIds'],
  beats: ['beats', 'storyBeatIds'],
  storyBeat: ['beats', 'storyBeatIds'],
  storyBeats: ['beats', 'storyBeatIds'],
  scene: ['scenes', 'sceneIds'],
  scenes: ['scenes', 'sceneIds'],
  chapter: ['chapters', 'chapterIds'],
  chapters: ['chapters', 'chapterIds'],
  act: ['acts', 'actIds'],
  acts: ['acts', 'actIds'],
};

const array = (value) => Array.isArray(value) ? value : [];
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const unique = (values) => [...new Set(array(values).filter((value) => value !== null && value !== undefined))];
const touch = (narrative, changes) => ({ ...object(narrative), ...changes, updatedAt: nowIso() });

function freshStage(source = {}, position = 0) {
  const stage = createFrameworkStage(source);
  return {
    ...stage,
    ...object(source),
    id: stage.id,
    position,
    guideQuestions: [...array(source?.guideQuestions)],
    codexIds: [...array(source?.codexIds)],
    assignments: {
      beats: unique(source?.assignments?.beats),
      scenes: unique(source?.assignments?.scenes),
      chapters: unique(source?.assignments?.chapters),
      acts: unique(source?.assignments?.acts),
    },
  };
}

function freshFramework(source = {}, templateId = null) {
  const stages = array(source?.stages).map(freshStage);
  const instance = createFrameworkInstance({
    templateId,
    name: typeof source?.name === 'string' ? source.name : '',
    stages: [],
  });
  return {
    ...instance,
    description: typeof source?.description === 'string' ? source.description : '',
    stages,
    active: true,
  };
}

function assignmentForStage(frameworkId, stage) {
  const assigned = object(stage?.assignments);
  return {
    id: makeId(),
    stageInstanceId: frameworkId,
    stageId: stage.id,
    storyBeatIds: unique(assigned.beats),
    sceneIds: unique(assigned.scenes),
    chapterIds: unique(assigned.chapters),
    actIds: unique(assigned.acts),
  };
}

function hasLinks(assignment) {
  return ['storyBeatIds', 'sceneIds', 'chapterIds', 'actIds']
    .some((key) => array(assignment?.[key]).length > 0);
}

function addFramework(narrative, instance) {
  const previous = array(narrative?.frameworkInstances).map((item) => ({ ...item, active: false }));
  const generatedAssignments = instance.stages.map((stage) => assignmentForStage(instance.id, stage)).filter(hasLinks);
  return touch(narrative, {
    frameworkInstances: [...previous, instance],
    activeFrameworkId: instance.id,
    assignments: [...array(narrative?.assignments), ...generatedAssignments],
  });
}

export function instantiateFramework(narrative, templateId) {
  const template = getFrameworkTemplate(templateId);
  if (!template) return object(narrative);
  return addFramework(narrative, freshFramework(template, template.id));
}

export function createCustomFramework(narrative, definition = {}) {
  return addFramework(narrative, freshFramework(definition, null));
}

export function setActiveFramework(narrative, frameworkId) {
  const frameworks = array(narrative?.frameworkInstances);
  if (!frameworks.some((item) => item?.id === frameworkId)) return object(narrative);
  return touch(narrative, {
    activeFrameworkId: frameworkId,
    frameworkInstances: frameworks.map((item) => ({ ...item, active: item?.id === frameworkId })),
  });
}

export function removeFramework(narrative, frameworkId) {
  const frameworks = array(narrative?.frameworkInstances);
  const removed = frameworks.find((item) => item?.id === frameworkId);
  if (!removed) return object(narrative);
  const removedStageIds = new Set(array(removed.stages).map((stage) => stage?.id).filter(Boolean));
  const remaining = frameworks.filter((item) => item?.id !== frameworkId);
  const currentActiveId = narrative?.activeFrameworkId || frameworks.find((item) => item?.active)?.id || null;
  const nextActiveId = currentActiveId === frameworkId || !remaining.some((item) => item.id === currentActiveId)
    ? remaining[0]?.id || null
    : currentActiveId;
  const sceneDesigns = Object.fromEntries(Object.entries(object(narrative?.sceneDesigns)).map(([sceneId, design]) => [sceneId, {
    ...object(design), stageIds: array(design?.stageIds).filter((id) => !removedStageIds.has(id)),
  }]));
  const characterArcs = array(narrative?.characterArcs).map((arc) => ({
    ...arc,
    beats: array(arc?.beats).map((beat) => removedStageIds.has(beat?.stageId) ? { ...beat, stageId: null } : beat),
  }));
  return touch(narrative, {
    frameworkInstances: remaining.map((item) => ({ ...item, active: item.id === nextActiveId })),
    activeFrameworkId: nextActiveId,
    assignments: array(narrative?.assignments).filter((item) => item?.stageInstanceId !== frameworkId && !removedStageIds.has(item?.stageId)),
    frameworkCorrespondences: array(narrative?.frameworkCorrespondences).filter((item) => item?.frameworkAId !== frameworkId && item?.frameworkBId !== frameworkId),
    sceneDesigns,
    characterArcs,
  });
}

function updateFramework(narrative, frameworkId, updater) {
  const frameworks = array(narrative?.frameworkInstances);
  if (!frameworks.some((item) => item?.id === frameworkId)) return object(narrative);
  let changed = false;
  const nextFrameworks = frameworks.map((item) => {
    if (item?.id !== frameworkId) return item;
    const next = updater(item);
    if (next !== item) changed = true;
    return next;
  });
  if (!changed) return object(narrative);
  return touch(narrative, {
    frameworkInstances: nextFrameworks,
  });
}

export function addStage(narrative, frameworkId, values = {}) {
  return updateFramework(narrative, frameworkId, (framework) => {
    const stages = array(framework?.stages);
    return { ...framework, stages: [...stages, freshStage(values, stages.length)], updatedAt: nowIso() };
  });
}

export function updateStage(narrative, frameworkId, stageId, changes = {}) {
  const safeChanges = object(changes);
  return updateFramework(narrative, frameworkId, (framework) => {
    if (!array(framework?.stages).some((stage) => stage?.id === stageId)) return framework;
    return {
      ...framework,
      stages: array(framework?.stages).map((stage) => stage?.id === stageId
      ? {
          ...stage,
          ...safeChanges,
          id: stage.id,
          assignments: safeChanges.assignments
            ? { ...object(stage.assignments), ...object(safeChanges.assignments) }
            : stage.assignments,
        }
        : stage),
      updatedAt: nowIso(),
    };
  });
}

export function removeStage(narrative, frameworkId, stageId) {
  const frameworks = array(narrative?.frameworkInstances);
  const framework = frameworks.find((item) => item?.id === frameworkId);
  if (!framework || !array(framework.stages).some((stage) => stage?.id === stageId)) return object(narrative);
  return touch(narrative, {
    frameworkInstances: frameworks.map((item) => item?.id !== frameworkId ? item : ({
      ...item,
      stages: array(item.stages)
        .filter((stage) => stage?.id !== stageId)
        .map((stage, position) => ({ ...stage, position })),
      updatedAt: nowIso(),
    })),
    assignments: array(narrative?.assignments).filter((item) =>
      !(item?.stageId === stageId && (!item.stageInstanceId || item.stageInstanceId === frameworkId))),
  });
}

export function mergeStages(narrative, frameworkId, primaryStageId, secondaryStageId) {
  if (!primaryStageId || !secondaryStageId || primaryStageId === secondaryStageId) return object(narrative);
  const frameworks = array(narrative?.frameworkInstances);
  const framework = frameworks.find((item) => item?.id === frameworkId);
  const primary = array(framework?.stages).find((stage) => stage?.id === primaryStageId);
  const secondary = array(framework?.stages).find((stage) => stage?.id === secondaryStageId);
  if (!framework || !primary || !secondary) return object(narrative);

  const assignments = {
    beats: unique([...idsForStage(narrative, framework, primary, 'beats'), ...idsForStage(narrative, framework, secondary, 'beats')]),
    scenes: unique([...idsForStage(narrative, framework, primary, 'scenes'), ...idsForStage(narrative, framework, secondary, 'scenes')]),
    chapters: unique([...idsForStage(narrative, framework, primary, 'chapters'), ...idsForStage(narrative, framework, secondary, 'chapters')]),
    acts: unique([...idsForStage(narrative, framework, primary, 'acts'), ...idsForStage(narrative, framework, secondary, 'acts')]),
  };
  const mergedStage = {
    ...primary,
    name: [primary.name, secondary.name].filter(Boolean).join(' + '),
    description: [primary.description, secondary.description].filter(Boolean).join('\n\n'),
    objective: [primary.objective, secondary.objective].filter(Boolean).join(' / '),
    guideQuestions: unique([...array(primary.guideQuestions), ...array(secondary.guideQuestions)]),
    codexIds: unique([...array(primary.codexIds), ...array(secondary.codexIds)]),
    assignments,
  };
  const stages = array(framework.stages)
    .filter((stage) => stage.id !== secondaryStageId)
    .map((stage) => stage.id === primaryStageId ? mergedStage : stage)
    .map((stage, position) => ({ ...stage, position }));
  const rootAssignment = assignmentForStage(frameworkId, mergedStage);
  return touch(narrative, {
    frameworkInstances: frameworks.map((item) => item.id === frameworkId ? { ...item, stages, updatedAt: nowIso() } : item),
    assignments: [
      ...array(narrative?.assignments).filter((item) => !(
        (item?.stageId === primaryStageId || item?.stageId === secondaryStageId)
        && (!item.stageInstanceId || item.stageInstanceId === frameworkId)
      )),
      ...(hasLinks(rootAssignment) ? [rootAssignment] : []),
    ],
  });
}

export function reorderStages(narrative, frameworkId, fromIndex, toIndex) {
  return updateFramework(narrative, frameworkId, (framework) => {
    const stages = [...array(framework?.stages)];
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)
      || fromIndex < 0 || toIndex < 0 || fromIndex >= stages.length || toIndex >= stages.length
      || fromIndex === toIndex) return framework;
    const [stage] = stages.splice(fromIndex, 1);
    stages.splice(toIndex, 0, stage);
    return { ...framework, stages: stages.map((item, position) => ({ ...item, position })), updatedAt: nowIso() };
  });
}

export function addStoryBeat(narrative, values = {}) {
  const beats = array(narrative?.storyBeats);
  const supplied = object(values);
  const created = createStoryBeat(supplied);
  const beat = {
    ...created,
    ...supplied,
    id: supplied.id || created.id,
    order: beats.length,
    codexIds: unique(supplied.codexIds),
    sceneIds: unique(supplied.sceneIds),
    createdAt: supplied.createdAt || created.createdAt,
    updatedAt: nowIso(),
  };
  return touch(narrative, { storyBeats: [...beats, beat] });
}

export function updateStoryBeat(narrative, beatId, changes = {}) {
  const beats = array(narrative?.storyBeats);
  if (!beats.some((beat) => beat?.id === beatId)) return object(narrative);
  return touch(narrative, {
    storyBeats: beats.map((beat) => beat?.id === beatId
      ? { ...beat, ...object(changes), id: beat.id, updatedAt: nowIso() }
      : beat),
  });
}

export function removeStoryBeat(narrative, beatId) {
  const beats = array(narrative?.storyBeats);
  if (!beats.some((beat) => beat?.id === beatId)) return object(narrative);
  return touch(narrative, {
    storyBeats: beats.filter((beat) => beat?.id !== beatId)
      .map((beat, order) => ({ ...beat, order })),
    frameworkInstances: array(narrative?.frameworkInstances).map((framework) => ({
      ...framework,
      stages: array(framework?.stages).map((stage) => ({
        ...stage,
        assignments: { ...object(stage?.assignments), beats: array(stage?.assignments?.beats).filter((id) => id !== beatId) },
      })),
    })),
    assignments: array(narrative?.assignments).map((item) => ({
      ...item,
      storyBeatIds: array(item?.storyBeatIds).filter((id) => id !== beatId),
    })).filter(hasLinks),
  });
}

function changeAssignment(narrative, frameworkId, stageId, kind, targetId, add) {
  const mapping = KIND[kind];
  if (!mapping || targetId === null || targetId === undefined) return object(narrative);
  const [stageKey, rootKey] = mapping;
  const frameworks = array(narrative?.frameworkInstances);
  const framework = frameworks.find((item) => item?.id === frameworkId);
  if (!framework || !array(framework.stages).some((stage) => stage?.id === stageId)) return object(narrative);

  const nextFrameworks = frameworks.map((item) => item?.id !== frameworkId ? item : ({
    ...item,
    stages: array(item.stages).map((stage) => {
      if (stage?.id !== stageId) return stage;
      const assignments = object(stage.assignments);
      const current = unique(assignments[stageKey]);
      const next = add ? unique([...current, targetId]) : current.filter((id) => id !== targetId);
      return { ...stage, assignments: { ...assignments, [stageKey]: next } };
    }),
    updatedAt: nowIso(),
  }));

  const roots = array(narrative?.assignments);
  const index = roots.findIndex((item) => item?.stageId === stageId
    && (!item.stageInstanceId || item.stageInstanceId === frameworkId));
  let nextRoots = [...roots];
  if (index >= 0) {
    const current = unique(nextRoots[index]?.[rootKey]);
    const values = add ? unique([...current, targetId]) : current.filter((id) => id !== targetId);
    nextRoots[index] = { ...nextRoots[index], stageInstanceId: frameworkId, [rootKey]: values };
    if (!hasLinks(nextRoots[index])) nextRoots.splice(index, 1);
  } else if (add) {
    nextRoots.push({
      id: makeId(), stageInstanceId: frameworkId, stageId,
      storyBeatIds: [], sceneIds: [], chapterIds: [], actIds: [],
      [rootKey]: [targetId],
    });
  }
  return touch(narrative, { frameworkInstances: nextFrameworks, assignments: nextRoots });
}

export function assign(narrative, frameworkId, stageId, kind, targetId) {
  return changeAssignment(narrative, frameworkId, stageId, kind, targetId, true);
}

export function unassign(narrative, frameworkId, stageId, kind, targetId) {
  return changeAssignment(narrative, frameworkId, stageId, kind, targetId, false);
}

function idsForStage(narrative, framework, stage, kind) {
  const [stageKey, rootKey] = KIND[kind] || [];
  if (!stageKey) return [];
  const inline = array(stage?.assignments?.[stageKey]);
  const persisted = array(narrative?.assignments)
    .filter((item) => item?.stageId === stage?.id
      && (!item.stageInstanceId || item.stageInstanceId === framework?.id))
    .flatMap((item) => array(item?.[rootKey]));
  return unique([...inline, ...persisted]);
}

export function sceneAssignments(narrative, kind, targetId) {
  if (!KIND[kind]) return [];
  const result = [];
  for (const framework of array(narrative?.frameworkInstances)) {
    for (const stage of array(framework?.stages)) {
      if (idsForStage(narrative, framework, stage, kind).includes(targetId)) {
        result.push({
          frameworkId: framework.id,
          frameworkName: framework.name || '',
          stageId: stage.id,
          stageName: stage.name || '',
        });
      }
    }
  }
  return result;
}

export function compareFrameworks(narrative, frameworkAId, frameworkBId) {
  const frameworks = array(narrative?.frameworkInstances);
  const a = frameworks.find((item) => item?.id === frameworkAId);
  const b = frameworks.find((item) => item?.id === frameworkBId);
  if (!a || !b) return [];
  return array(narrative?.storyBeats).map((beat) => {
    const names = (framework) => array(framework.stages)
      .filter((stage) => idsForStage(narrative, framework, stage, 'beat').includes(beat.id))
      .map((stage) => stage.name || '')
      .filter(Boolean)
      .join(', ');
    const stageA = names(a);
    const stageB = names(b);
    return {
      beatId: beat.id,
      beatTitle: beat.title || '',
      beat: beat.title || '',
      a: stageA,
      b: stageB,
      stageA,
      stageB,
    };
  });
}
