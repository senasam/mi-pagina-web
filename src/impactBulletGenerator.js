const clean = (value) => String(value || "").trim().replace(/\s+/g, " ");
const lowerFirst = (value) => value ? value.charAt(0).toLocaleLowerCase("es") + value.slice(1) : "";
const finish = (value) => value.replace(/[.;:,\s]+$/, "");

export function validateImpactBullet(values) {
  const errors = {};
  if (!clean(values.context)) errors.context = "Describe brevemente el contexto o desafío.";
  if (!clean(values.action)) errors.action = "Indica la acción que realizaste personalmente.";
  if (!clean(values.result)) errors.result = "Describe un resultado o evidencia verificable.";
  return errors;
}

export function generateImpactBullets(values, version = 0) {
  const errors = validateImpactBullet(values);
  if (Object.keys(errors).length) return { bullets: [], errors };

  const context = finish(clean(values.context));
  const action = finish(clean(values.action));
  const method = finish(clean(values.method));
  const result = finish(clean(values.result));
  const metric = finish(clean(values.metric));
  const skill = finish(clean(values.skill));
  const target = finish(clean(values.target));
  const evidence = metric ? `${result}, ${lowerFirst(metric)}` : result;
  const how = method ? ` mediante ${lowerFirst(method)}` : "";
  const why = target ? ` para ${lowerFirst(target)}` : "";
  const signal = skill ? `; demostró ${lowerFirst(skill)}` : "";

  const sets = [
    [
      `${action}${how}${why}, logrando ${lowerFirst(evidence)} en ${lowerFirst(context)}${signal}.`,
      `En ${lowerFirst(context)}, ${lowerFirst(action)}${how}, lo que permitió ${lowerFirst(evidence)}${signal}.`,
      `${action} para abordar ${lowerFirst(context)}${how}; obtuvo ${lowerFirst(evidence)}${skill ? ` y aplicó ${lowerFirst(skill)}` : ""}.`,
    ],
    [
      `${action}${how} ante ${lowerFirst(context)}, alcanzando ${lowerFirst(evidence)}${signal}.`,
      `Abordó ${lowerFirst(context)} al ${lowerFirst(action)}${how}${why}; el resultado fue ${lowerFirst(evidence)}.`,
      `${action}${why}${how}, con ${lowerFirst(evidence)} como resultado verificable${signal}.`,
    ],
  ];
  return { bullets: sets[Math.abs(version) % sets.length], errors: {} };
}
