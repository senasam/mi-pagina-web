const MAX = 2000;
const clean = (value) => String(value || "").trim();
const has = (text, terms) => terms.some((term) => text.toLowerCase().includes(term));
const validate = (values, fields) => Object.fromEntries(fields.flatMap(([name, label]) => {
  const value = clean(values[name]);
  if (!value) return [[name, `Completa ${label.toLowerCase()}.`]];
  if (value.length > MAX) return [[name, `${label} no puede superar ${MAX} caracteres.`]];
  return [];
}));
const result = (errors, output = "", warnings = []) => ({ errors, output, warnings });
const section = (title, items) => `${title}\n${items.filter(Boolean).map((item) => `• ${item}`).join("\n")}`;
const config = (title, path, fields, build, event) => ({ title, path, fields, build, event });
const standard = (fields, compose, warnings = []) => (values) => {
  const errors = validate(values, fields); if (Object.keys(errors).length) return result(errors);
  return result({}, compose(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, clean(value)]))), warnings);
};

export const professionalBrandToolConfigs = {
  signals: config("Diagnóstico de señales profesionales", "/herramientas/diagnostico-senales-profesionales", [
    ["current", "Situación actual"], ["direction", "Dirección deseada"], ["channels", "Canales utilizados"], ["claims", "Afirmaciones principales"], ["evidence", "Evidencia disponible"], ["uncertainty", "Incertidumbres"],
  ], standard([["current", "Situación actual"], ["direction", "Dirección deseada"], ["channels", "Canales utilizados"], ["claims", "Afirmaciones principales"], ["evidence", "Evidencia disponible"], ["uncertainty", "Incertidumbres"]], (v) => [
    section("DIRECCIÓN", [`De: ${v.current}`, `Hacia: ${v.direction}`]), section("SEÑALES", [`Canales: ${v.channels}`, `Afirmaciones: ${v.claims}`, `Pruebas declaradas: ${v.evidence}`]), section("BRECHAS Y PRÓXIMO PASO", [`Incertidumbres: ${v.uncertainty}`, "Verifica una afirmación prioritaria con prueba y contexto; después compárala entre canales."]),
  ].join("\n\n"), ["Este diagnóstico organiza información declarada; no mide reputación ni empleabilidad."]), "brand_signals_completed"),

  evidence: config("Inventario de evidencia", "/herramientas/inventario-evidencia-profesional", [
    ["situation", "Situación"], ["problem", "Problema"], ["action", "Contribución"], ["result", "Resultado observable"], ["stakeholders", "Participantes"], ["constraints", "Restricciones"], ["skills", "Capacidades"], ["privacy", "Nivel de confidencialidad", "select", ["Pública", "Limitada", "Confidencial"]],
  ], standard([["situation", "Situación"], ["problem", "Problema"], ["action", "Contribución"], ["result", "Resultado observable"], ["stakeholders", "Participantes"], ["constraints", "Restricciones"], ["skills", "Capacidades"], ["privacy", "Nivel de confidencialidad"]], (v) => [
    section("FICHA DE EVIDENCIA", [`Situación: ${v.situation}`, `Problema: ${v.problem}`, `Contribución: ${v.action}`, `Efecto observado: ${v.result}`]), section("CONTEXTO", [`Participantes: ${v.stakeholders}`, `Restricciones: ${v.constraints}`, `Capacidades: ${v.skills}`, `Divulgación: ${v.privacy}`]), section("REVISIÓN", ["Confirma autoría, alcance y prueba disponible.", v.privacy !== "Pública" ? "Prepara una versión anonimizada o decide no publicar." : "Verifica que la información sea tuya o esté autorizada."]),
  ].join("\n\n"), ["Una ficha no demuestra por sí sola causalidad ni autoría exclusiva."]), "brand_evidence_completed"),

  contribution: config("Constructor de contribuciones", "/herramientas/constructor-contribuciones-profesionales", [
    ["responsibility", "Responsabilidad original"], ["problem", "Problema abordado"], ["contribution", "Contribución propia"], ["effect", "Efecto observable"], ["context", "Contexto"], ["metric", "Disponibilidad de métrica", "select", ["Verificada", "Parcial", "No disponible"]],
  ], standard([["responsibility", "Responsabilidad original"], ["problem", "Problema abordado"], ["contribution", "Contribución propia"], ["effect", "Efecto observable"], ["context", "Contexto"], ["metric", "Disponibilidad de métrica"]], (v) => {
    const effect = v.metric === "No disponible" ? `con un efecto cualitativo observado: ${v.effect}` : `y se observó: ${v.effect}`;
    return [section("VERSIÓN BREVE", [`Ante ${v.problem}, ${v.contribution} ${effect}.`]), section("VERSIÓN AMPLIADA", [`En ${v.context}, la responsabilidad era ${v.responsibility}. Mi contribución específica fue ${v.contribution}; ${effect}. Métrica: ${v.metric.toLowerCase()}.`]), section("COMPROBACIÓN", ["¿Puedes explicar la prueba y tu parte del trabajo?", "¿Distingues efecto observado de causalidad?", "¿La cifra, si existe, está autorizada?"])].join("\n\n");
  }, ["No añadas números que no puedas verificar ni atribuyas al individuo todo el resultado colectivo."]), "brand_contribution_completed"),

  narrative: config("Constructor de narrativa profesional", "/herramientas/constructor-narrativa-marca-profesional", [
    ["origin", "Origen relevante"], ["pattern", "Patrón profesional"], ["contribution", "Aporte actual"], ["evidence", "Evidencia"], ["direction", "Dirección futura"], ["audience", "Audiencia"],
  ], standard([["origin", "Origen relevante"], ["pattern", "Patrón profesional"], ["contribution", "Aporte actual"], ["evidence", "Evidencia"], ["direction", "Dirección futura"], ["audience", "Audiencia"]], (v) => [
    section("VERSIÓN BREVE", [`Desde ${v.origin}, he desarrollado un patrón de ${v.pattern}. Hoy aporto ${v.contribution} y exploro ${v.direction}.`]), section("VERSIÓN MEDIA", [`Mi recorrido parte de ${v.origin}. Se repite un interés por ${v.pattern}; actualmente contribuyo con ${v.contribution}, respaldado por ${v.evidence}. Para ${v.audience}, quiero hacer comprensible mi dirección hacia ${v.direction}.`]), section("VERSIÓN EXTENDIDA", [`Origen: ${v.origin}`, `Patrón: ${v.pattern}`, `Aporte y prueba: ${v.contribution} — ${v.evidence}`, `Dirección y audiencia: ${v.direction} — ${v.audience}`]), section("LISTA DE COHERENCIA", ["Conserva hechos, fechas y nivel de dominio.", "Adapta énfasis, no inventes experiencia.", "Declara exploración cuando corresponda."]),
  ].join("\n\n"), ["La herramienta reorganiza exclusivamente lo que escribes; no verifica ni fabrica hechos."]), "brand_narrative_completed"),

  language: config("Revisor de lenguaje genérico", "/herramientas/revisor-lenguaje-profesional", [["text", "Texto profesional"]], (values) => {
    const errors = validate(values, [["text", "Texto profesional"]]); if (Object.keys(errors).length) return result(errors);
    const text = clean(values.text); const warnings = [];
    if (has(text, ["estratégic", "resultados", "innovador", "experto", "líder", "excelencia", "apasionad"])) warnings.push("Hay adjetivos o afirmaciones amplias: añade una prueba y su contexto.");
    if (has(text, ["guru", "gurú", "ninja", "rockstar", "disruptiv"])) warnings.push("Hay jerga promocional que puede sustituirse por una contribución observable.");
    if ((text.match(/[,|/]/g) || []).length > 6) warnings.push("Parece una lista extensa de palabras clave; prioriza un mensaje comprensible.");
    if (text.split(/[.!?]+/).some((sentence) => sentence.trim().split(/\s+/).length > 35)) warnings.push("Hay una oración larga; separa idea, evidencia y contexto.");
    if (!/\d|proyecto|decisi|implement|diseñ|cre|redu|mejor|coordin|investig|analiz/i.test(text)) warnings.push("No se detecta una señal concreta de experiencia; considera añadir un ejemplo verificable.");
    return result({}, section("REVISIÓN BASADA EN REGLAS", warnings.length ? warnings : ["No se detectaron patrones básicos. Revisa igualmente exactitud, autoría, contexto y audiencia.", `Texto revisado: ${text}`]), ["Las reglas no comprenden intención, verdad, cultura ni calidad profesional."]);
  }, "brand_language_completed"),

  coherence: config("Mapa de coherencia", "/herramientas/mapa-coherencia-profesional", [
    ["claim", "Afirmación central"], ["cv", "Expresión en CV"], ["profile", "Expresión en perfil"], ["spoken", "Expresión oral"], ["portfolio", "Evidencia de portafolio"], ["dates", "Fechas y cargos"],
  ], standard([["claim", "Afirmación central"], ["cv", "Expresión en CV"], ["profile", "Expresión en perfil"], ["spoken", "Expresión oral"], ["portfolio", "Evidencia de portafolio"], ["dates", "Fechas y cargos"]], (v) => {
    const combined = `${v.cv} ${v.profile} ${v.spoken}`.toLowerCase();
    const risk = has(combined, ["experto", "director", "líder"]) && !has(`${v.portfolio} ${v.claim}`, ["lider", "dirig", "exper", "proyecto"]) ? "Revisa si el nivel declarado tiene evidencia suficiente." : "Compara manualmente alcance y nivel: el vocabulario distinto puede ser una adaptación válida.";
    return [section("NÚCLEO", [`Afirmación: ${v.claim}`, `Prueba: ${v.portfolio}`, `Fechas y cargos: ${v.dates}`]), section("CANALES", [`CV: ${v.cv}`, `Perfil: ${v.profile}`, `Presentación: ${v.spoken}`]), section("PRIORIDAD DE REVISIÓN", [risk, "Verifica fechas, cargo, autoría, nivel de dominio y dirección en los tres canales."])].join("\n\n");
  }, ["La comparación usa reglas simples y no determina autenticidad ni reputación."]), "brand_coherence_completed"),

  profile: config("Revisor de perfil público", "/herramientas/revisor-perfil-profesional", [
    ["objective", "Objetivo"], ["headline", "Descriptor"], ["summary", "Resumen"], ["experience", "Experiencia"], ["skills", "Capacidades"], ["privacy", "Decisiones de privacidad"],
  ], standard([["objective", "Objetivo"], ["headline", "Descriptor"], ["summary", "Resumen"], ["experience", "Experiencia"], ["skills", "Capacidades"], ["privacy", "Decisiones de privacidad"]], (v) => [
    section("PROPÓSITO", [`Objetivo declarado: ${v.objective}`]), section("REVISIÓN POR SECCIÓN", [`Descriptor: ¿comunica contribución o solo palabras clave? — ${v.headline}`, `Resumen: ¿conecta patrón, evidencia y dirección? — ${v.summary}`, `Experiencia: ¿aclara aporte y contexto? — ${v.experience}`, `Capacidades: ¿son demostradas, actuales y comprensibles? — ${v.skills}`]), section("PRIVACIDAD", [`Decisiones: ${v.privacy}`, "Revisa visibilidad pública y permisos antes de publicar."]), section("NOTA TEMPORAL", ["Orientación revisada el 16 de julio de 2026. Verifica la ayuda oficial de la plataforma antes de cambiar campos o visibilidad."]),
  ].join("\n\n"), ["No es una puntuación de perfil ni predice búsquedas, alcance o contratación."]), "brand_profile_completed"),

  peers: config("Preparador de revisión por pares", "/herramientas/preparar-revision-marca-profesional", [
    ["document", "Tipo de documento"], ["audience", "Audiencia prevista"], ["objective", "Objetivo de revisión"], ["privacy", "Límites de privacidad"], ["questions", "Preguntas específicas"],
  ], standard([["document", "Tipo de documento"], ["audience", "Audiencia prevista"], ["objective", "Objetivo de revisión"], ["privacy", "Límites de privacidad"], ["questions", "Preguntas específicas"]], (v) => [
    section("ENCARGO PARA LA PERSONA REVISORA", [`Documento: ${v.document}`, `Audiencia: ${v.audience}`, `Objetivo: ${v.objective}`, `No revisar ni compartir: ${v.privacy}`]), section("FORMULARIO DE OBSERVACIÓN", ["Sin explicación previa, ¿qué entiendes que hace esta persona?", "¿Qué evidencia concreta notaste?", "¿Qué resulta ambiguo o contradictorio?", `Preguntas del autor: ${v.questions}`]), section("SEPARA", ["Observación: lo que aparece en el documento.", "Interpretación: lo que inferiste.", "Recomendación: lo que cambiarías y por qué."]),
  ].join("\n\n"), ["Pide consentimiento antes de compartir documentos o comentarios con otra persona."]), "brand_peers_completed"),

  update: config("Plan de actualización", "/herramientas/plan-actualizacion-marca-profesional", [
    ["events", "Cambios profesionales"], ["channels", "Canales actuales"], ["lastReview", "Última revisión"], ["transitions", "Próximas transiciones"], ["privacy", "Cambios de privacidad"],
  ], standard([["events", "Cambios profesionales"], ["channels", "Canales actuales"], ["lastReview", "Última revisión"], ["transitions", "Próximas transiciones"], ["privacy", "Cambios de privacidad"]], (v) => [
    section("DESENCADENANTES", [`Cambios: ${v.events}`, `Transiciones: ${v.transitions}`, `Privacidad: ${v.privacy}`]), section("PLAN", [`Canales a comparar: ${v.channels}`, `Última revisión declarada: ${v.lastReview}`, "Captura y verifica hechos nuevos.", "Selecciona señales pertinentes.", "Actualiza solo los canales afectados.", "Compara fechas, cargos y afirmaciones.", "Retira información desactualizada o demasiado expuesta."]),
  ].join("\n\n"), ["El plan no exige una frecuencia fija; una revisión puede concluir sin cambios."]), "brand_update_completed"),

  compare: config("Comparador CV–perfil–presentación", "/herramientas/comparar-canales-profesionales", [["cv", "Resumen de CV"], ["profile", "Resumen de perfil"], ["spoken", "Presentación oral"]], (values) => {
    const fields = [["cv", "Resumen de CV"], ["profile", "Resumen de perfil"], ["spoken", "Presentación oral"]]; const errors = validate(values, fields); if (Object.keys(errors).length) return result(errors);
    const v = Object.fromEntries(Object.entries(values).map(([k,val])=>[k,clean(val)]));
    const words = (t) => new Set(t.toLowerCase().match(/[a-záéíóúñü]{5,}/g) || []); const cv=words(v.cv), profile=words(v.profile), spoken=words(v.spoken);
    const shared=[...cv].filter((w)=>profile.has(w)&&spoken.has(w)).slice(0,12);
    const unique=(set,a,b)=>[...set].filter((w)=>!a.has(w)&&!b.has(w)).slice(0,8);
    return result({}, [section("SEÑALES COMPARTIDAS", [shared.length ? shared.join(", ") : "No aparecen términos sustantivos comunes en los tres textos."]), section("DIFERENCIAS PARA REVISAR", [`Solo CV: ${unique(cv,profile,spoken).join(", ") || "ninguna detectada"}`, `Solo perfil: ${unique(profile,cv,spoken).join(", ") || "ninguna detectada"}`, `Solo presentación: ${unique(spoken,cv,profile).join(", ") || "ninguna detectada"}`]), section("COMPROBACIÓN HUMANA", ["¿Las diferencias responden a audiencia y formato?", "¿Cambian hechos, fechas, cargo o nivel de dominio?", "¿Cada afirmación importante conserva una prueba?"])].join("\n\n"), ["La coincidencia léxica no demuestra coherencia y una redacción diferente no implica contradicción."]);
  }, "brand_compare_completed"),
};

export const runProfessionalBrandTool = (kind, values) => (professionalBrandToolConfigs[kind] || professionalBrandToolConfigs.signals).build(values);
