import { findMentions } from "./model.js";

self.onmessage = ({ data }) => {
  const result = {};
  for (const entry of data.entries || []) {
    result[entry.id] = [];
    for (const scene of data.scenes || []) {
      const matches = findMentions(`${scene.title}\n${scene.summary}\n${scene.prose}`, entry);
      if (matches.length) result[entry.id].push({
        sceneId: scene.id,
        sceneTitle: scene.summary?.slice(0, 80) || "Escena sin resumen",
        actId: scene.actId,
        actTitle: scene.actTitle,
        chapterId: scene.chapterId,
        chapterTitle: scene.chapterTitle,
        count: matches.length,
        matches,
      });
    }
  }
  self.postMessage(result);
};
