const updatedAt = "2026-07-16";
const base = "/aprende/ia-generativa-para-negocios";

export const aiBusinessPath = {
  title: "IA generativa para negocios",
  description: "Aprende a evaluar oportunidades, costos, riesgos y decisiones de adopción antes de implementar inteligencia artificial en una organización.",
  audience: "Líderes, gerentes, consultores, emprendedores y responsables de producto, operaciones, tecnología o transformación",
  level: "Introductorio a intermedio",
  format: "Ruta estratégica y práctica",
  readingTime: "Aproximadamente 2 horas",
  updatedAt,
  outcomes: [
    "Conectar un problema de negocio con una capacidad tecnológica adecuada.",
    "Definir una hipótesis de valor, una línea base y métricas de piloto.",
    "Comparar configuración, integración, desarrollo y una alternativa sin IA.",
    "Estimar costo total, no solo consumo del modelo.",
    "Asignar permisos, revisión humana, gobierno y propiedad operativa.",
    "Decidir con evidencia si conviene detener, ajustar, ampliar o escalar.",
  ],
};

const frameworks = {
  valora: [
    { title: "Valor", text: "Resultado medible que podría mejorar y línea base para compararlo." },
    { title: "Alcance", text: "Proceso, personas, datos y decisiones incluidos y excluidos." },
    { title: "Límites", text: "Restricciones, usos prohibidos, consecuencias y riesgos." },
    { title: "Operación", text: "Propiedad, revisión, monitoreo, soporte y mantenimiento." },
    { title: "Recursos", text: "Datos, tecnología, capacidades, tiempo y presupuesto necesarios." },
    { title: "Aprendizaje", text: "Evidencia y umbrales para detener, ajustar, ampliar o escalar." },
  ],
  autoriza: [
    { title: "Acción", text: "Qué puede hacer el agente y qué queda expresamente fuera." },
    { title: "Usuario responsable", text: "Quién responde por el resultado y puede intervenir." },
    { title: "Trazabilidad", text: "Qué entradas, decisiones, herramientas y resultados se registran." },
    { title: "Información", text: "A qué datos accede y con qué privilegios mínimos." },
    { title: "Revisión", text: "Dónde se exige aprobación y qué evidencia recibe la persona." },
    { title: "Interrupción", text: "Cómo detener el flujo ante fallas o señales de riesgo." },
    { title: "Zona de operación", text: "Límites de usuarios, montos, sistemas, horarios y acciones." },
    { title: "Alternativa reversible", text: "Cómo deshacer una acción o continuar sin el agente." },
  ],
  guarda: [
    { title: "Gobierno", text: "Quién define política, aprueba el uso y resuelve excepciones." },
    { title: "Uso permitido", text: "Tareas autorizadas, restringidas y prohibidas." },
    { title: "Acceso", text: "Permisos sobre datos, modelos, herramientas y registros." },
    { title: "Revisión", text: "Control humano específico según consecuencia y audiencia." },
    { title: "Documentación", text: "Propósito, versión, pruebas, decisiones e incidentes registrados." },
    { title: "Auditoría", text: "Revisión periódica de desempeño, cambios, costos y daños." },
  ],
};

const common = { level: "Introductorio a intermedio", updatedAt, status: "published" };
const lesson = (order, slug, title, description, readingTime, outcomes, sections, relatedTools = [], relatedResources = []) => ({
  ...common, order, slug, title, description, readingTime, outcomes, sections, relatedTools, relatedResources,
  href: `${base}/${slug}`,
});

export const aiBusinessLessons = [
  lesson(1, "oportunidad", "Cómo identificar una oportunidad real de IA generativa", "Empieza por el problema, la línea base y una hipótesis que pueda refutarse.", "11 minutos", ["Distinguir una necesidad de una solución predeterminada", "Redactar una hipótesis de valor medible", "Reconocer cuándo no hace falta IA"], [
    { title: "La tecnología no es el punto de partida", paragraphs: ["La IA generativa puede producir texto, imágenes, código u otros contenidos a partir de patrones aprendidos. Esa capacidad no define por sí sola un caso de negocio. Primero conviene describir quién vive el problema, cómo funciona hoy el proceso y qué costo, demora, variación o riesgo importa.", "Antes de elegir un modelo, compara tres alternativas: cambiar el proceso, automatizar una regla estable o usar una capacidad generativa. Si una lista de reglas resuelve la tarea de forma confiable, añadir un modelo puede aumentar costo y variabilidad sin crear valor."], questionGroups: [{ title: "Preguntas para abrir la evaluación", items: ["¿Qué resultado se quiere cambiar y cuál es su línea base?", "¿Qué ocurriría si no se usa IA?", "¿Qué parte exige generación y cuál exige datos o reglas?", "¿Quién podría verse afectado por un error?"] }] },
    { title: "Valor como hipótesis", paragraphs: ["Tiempo liberado no equivale automáticamente a ahorro. El valor depende de que la capacidad recuperada se use, de que la calidad sea aceptable y de que los costos de revisión no consuman el beneficio."], comparison: { leftTitle: "Hipótesis débil", leftItems: ["Usar IA para ser más eficientes", "Medir impresiones generales", "Suponer adopción total"], rightTitle: "Hipótesis comprobable", rightItems: ["Reducir el tiempo mediano de preparación", "Mantener un umbral de calidad", "Medir adopción y retrabajo reales"] } },
    { title: "VALORA", paragraphs: ["VALORA es un modelo práctico creado para organizar esta ruta. No es un estándar técnico, financiero o regulatorio."], framework: frameworks.valora },
    { title: "Cinco niveles de oportunidad", ordered: ["Productividad individual: apoyo a una tarea personal.", "Flujo de equipo: coordinación entre varias personas.", "Transformación funcional: rediseño de un proceso completo.", "Producto o servicio: una capacidad que recibe un usuario externo.", "Capacidad empresarial: infraestructura o reglas compartidas."], callout: { title: "Principio de alcance", text: "Cuanto más amplio sea el nivel, mayor será la necesidad de integración, gobierno, soporte y evidencia." } },
  ], ["evaluar-oportunidad-ia"], ["lienzo-valora", "ficha-caso-negocio"]),

  lesson(2, "modelos-y-soluciones", "Cómo comprender modelos y patrones de solución", "Relaciona modalidad, escala y adaptación con una tarea evaluable.", "12 minutos", ["Reconocer categorías de modelos", "Distinguir recuperación de ajuste fino", "Evitar personalización prematura"], [
    { title: "Un modelo preentrenado es un componente", paragraphs: ["Un modelo preentrenado aprende patrones generales antes de llegar a una organización. La solución de negocio añade instrucciones, fuentes, interfaz, permisos, integraciones, evaluación y supervisión. Por eso dos aplicaciones sobre un modelo similar pueden comportarse de forma muy distinta."], examples: [
      { title: "Modelo general de lenguaje", text: "Útil para tareas variadas de texto; su amplitud no garantiza precisión en un proceso particular." },
      { title: "Modelo pequeño", text: "Puede favorecer latencia, costo o despliegue controlado cuando la tarea es estrecha y medible." },
      { title: "Modelo multimodal", text: "Procesa combinaciones como texto e imagen; exige evaluar cada modalidad y sus riesgos." },
      { title: "Modelos de código, imagen o dominio", text: "Especializan el tipo de salida o vocabulario, pero siguen necesitando pruebas sobre la tarea real." },
    ] },
    { title: "Configurar antes de personalizar", ordered: ["Rediseñar la tarea y definir una evaluación.", "Probar instrucciones y ejemplos.", "Recuperar fuentes autorizadas cuando se necesita información actual u organizacional.", "Integrar herramientas solo con permisos claros.", "Considerar ajuste fino si existe un patrón estable y datos de calidad."], callout: { title: "No es una secuencia obligatoria", text: "La escalera ayuda a evitar complejidad prematura; una restricción técnica o de riesgo puede cambiar el orden." } },
    { title: "Recuperación y ajuste fino resuelven problemas distintos", comparison: { leftTitle: "Recuperación", leftItems: ["Aporta contenido vigente o interno", "Debe preservar permisos", "Permite inspeccionar fuentes", "No garantiza respuestas verdaderas", "Puede introducir instrucciones maliciosas desde documentos"], rightTitle: "Ajuste fino", rightItems: ["Puede estabilizar formato o conducta repetida", "No es una base de conocimiento actualizable", "Requiere datos y evaluación consistentes", "Añade mantenimiento y operación del modelo", "No corrige una tarea mal definida"] } },
    { title: "Práctica de selección", scenarios: ["Asistente de políticas internas", "Inspección basada en imágenes", "Revisión de código", "Soporte multilingüe", "Clasificación de baja latencia", "Borradores de marketing", "Extracción contractual", "Flujo local sensible", "Normativa cambiante", "Informe estructurado repetido"].map((title, index) => ({ id: `modelo-${index}`, title, situation: "Selecciona modalidad, fuentes y nivel de adaptación antes de elegir un producto.", question: "¿Qué patrón mínimo permitiría evaluar la tarea?", action: "Define un conjunto de prueba y compara una alternativa sin personalización.", constraint: "No uses tamaño del modelo como sustituto de calidad." })) },
  ], ["seleccionar-enfoque-ia"], ["guia-modelos-soluciones"]),

  lesson(3, "casos-de-uso", "Casos de uso de IA generativa por función", "Explora oportunidades y riesgos sin convertir una lista de ideas en una estrategia.", "12 minutos", ["Clasificar usos por función y consecuencia", "Definir rol humano y condición de parada", "Separar productividad de transformación"], [
    { title: "Una idea se convierte en caso cuando tiene límites", paragraphs: ["Generar un borrador interno y publicar una respuesta al cliente pueden usar una capacidad parecida, pero no comparten el mismo riesgo. Un caso completo especifica problema, usuario, línea base, salida, revisión, métrica y condición de parada."], applications: [
      { title: "Marketing y comercial", contacts: ["Responsable de marca", "Equipo comercial"], questions: ["Borradores, localización, síntesis de feedback", "Riesgos: afirmaciones inventadas, derechos y publicación no aprobada"], links: [{ label: "Preparar comunicación ejecutiva", href: "/aprende/comunicacion-profesional" }] },
      { title: "Atención al cliente", contacts: ["Agentes", "Propietario de políticas"], questions: ["Búsqueda interna, resúmenes, respuestas sugeridas", "Riesgos: compromisos incorrectos, datos y mala escalación"], links: [{ label: "Revisar conversaciones", href: "/aprende/comunicacion-profesional" }] },
      { title: "Finanzas y control", contacts: ["Dueño del proceso", "Especialista de riesgo"], questions: ["Organización de evidencia y borradores", "Riesgos: cálculos erróneos e interpretación sin respaldo"], links: [{ label: "Definir el problema", href: "/aprende/resolucion-de-problemas" }] },
      { title: "Producto y aprendizaje", contacts: ["Usuarios", "Diseño o formación"], questions: ["Síntesis, ejercicios y prototipos", "Riesgos: falsa evidencia, material incorrecto y evaluación automatizada"], links: [{ label: "Diseñar experimentos", href: "/herramientas/disenador-experimentos-negocio" }] },
      { title: "Analítica y software", contacts: ["Analistas", "Ingeniería y seguridad"], questions: ["Narrativas, consultas, pruebas y documentación", "Riesgos: causalidad inventada, secretos, licencias y código vulnerable"], links: [{ label: "Convertir datos en insight", href: "/herramientas/convertir-datos-en-insight" }] },
    ] },
    { title: "Biblioteca para practicar", paragraphs: ["Los casos del hub son ficticios y deliberadamente incompletos. Su objetivo es practicar decisiones, no recomendar una implementación."], links: [{ label: "Abrir los 18 casos ficticios", href: `${base}#casos-ia` }] },
  ], ["evaluar-oportunidad-ia"], ["biblioteca-casos-ia"]),

  lesson(4, "seleccion-de-enfoque", "Cómo elegir entre una solución general, personalizada o no basada en IA", "Compara control, integración, capacidad interna y costo total.", "11 minutos", ["Distinguir asistente general y solución personalizada", "Comparar configurar, integrar, construir y diferir", "Preparar preguntas para proveedores"], [
    { title: "La importancia estratégica no decide la arquitectura", paragraphs: ["Evalúa precisión, consistencia, latencia, volumen, sensibilidad, vigencia, integración, explicación, reversibilidad, experiencia, mantenimiento, dependencia y capacidad interna. Una tarea importante puede requerir una regla convencional; una tarea secundaria puede necesitar integración compleja." ] },
    { title: "General o personalizada", comparison: { leftTitle: "Asistente general", leftItems: ["Puesta en marcha más rápida", "Interfaz conocida", "Menor especificidad de proceso", "Control y licencias dependientes del producto"], rightTitle: "Solución personalizada", rightItems: ["Integración y experiencia a medida", "Mayor control del flujo", "Más costo, seguridad y mantenimiento", "Responsabilidad operativa permanente"] } },
    { title: "Cuatro decisiones posibles", framework: [
      { title: "Configurar", text: "Usar un producto aprobado con ajustes, instrucciones y controles." },
      { title: "Integrar", text: "Conectar un servicio gestionado con datos y flujo organizacional." },
      { title: "Construir", text: "Crear una aplicación propia cuando la diferenciación lo justifica." },
      { title: "Diferir", text: "Resolver sin IA o esperar hasta contar con datos, control o evidencia." },
    ] },
    { title: "Preguntas que un proveedor debe poder responder", checklist: ["Datos procesados, residencia, retención y borrado", "Uso o no de datos del cliente para entrenamiento", "Permisos, autenticación y registros", "Modelos utilizados y gestión de cambios", "Incidentes, controles y compromisos contractuales", "Cálculo de costos, portabilidad y salida", "Soporte de accesibilidad"] },
  ], ["elegir-solucion-ia", "seleccionar-enfoque-ia"], ["matriz-enfoque", "preguntas-proveedor"]),

  lesson(5, "agentes", "Cómo evaluar agentes de IA en una organización", "Define autonomía, permisos, aprobación, trazabilidad e interrupción.", "12 minutos", ["Reconocer el espectro de autonomía", "Asignar un nivel de permiso", "Aplicar AUTORIZA"], [
    { title: "Agente describe un patrón, no una garantía", paragraphs: ["Un sistema agéntico puede interpretar un objetivo, proponer pasos, recuperar información, utilizar herramientas, observar resultados y revisar su plan. El término continúa evolucionando y la autonomía existe en un espectro. Lo decisivo es qué acción concreta puede ejecutar dentro de qué permisos." ] },
    { title: "Preconfigurado o personalizado", comparison: { leftTitle: "Agente preconfigurado", leftItems: ["Flujo común", "Despliegue más rápido", "Personalización acotada", "Suele vivir dentro de una plataforma"], rightTitle: "Agente personalizado", rightItems: ["Datos y herramientas organizacionales", "Flujo especializado", "Arquitectura y permisos propios", "Más monitoreo y mantenimiento"] } },
    { title: "AUTORIZA", paragraphs: ["AUTORIZA es un modelo original de revisión de negocio creado para esta ruta. No certifica seguridad ni cumplimiento."], framework: frameworks.autoriza },
    { title: "Escalera de permisos", ordered: ["Sugerir", "Redactar", "Preparar una acción", "Solicitar aprobación", "Ejecutar una acción estrecha y reversible", "Ejecutar un flujo conectado", "Operar con autonomía más amplia"], callout: { title: "Aumentar autonomía aumenta la exigencia", text: "Los niveles finales requieren límites, pruebas, registro, detección de fallas, interrupción y propiedad humana mucho más fuertes." } },
    { title: "Diez decisiones de permiso", scenarios: ["Redactar seguimiento de reunión", "Preparar actualización de CRM", "Proponer horarios", "Preparar un reembolso", "Redactar comunicación a proveedor", "Preparar publicación de marketing", "Solicitar cambio de cuenta", "Proponer compra de inventario", "Escalar un caso de soporte", "Recuperar un documento interno"].map((title,index)=>({id:`agente-${index}`,title,situation:"Un equipo propone conectar un agente a datos y herramientas para completar este flujo.",question:"¿Debe sugerir, preparar, pedir aprobación o ejecutar? Define datos, herramientas y dueño.",action:"Especifica permiso, registro, parada y reversión antes de probar.",constraint:"No amplíes autonomía por conveniencia; relaciónala con consecuencia y control."})) },
  ], ["evaluar-agente-negocio"], ["revision-autoriza"]),

  lesson(6, "costos-y-economia", "Cómo estimar el costo y la economía de una iniciativa de IA", "Construye escenarios transparentes que incluyan implementación, revisión y operación.", "13 minutos", ["Reconocer componentes del costo total", "Distinguir beneficio bruto, incremental y realizable", "Interpretar ROI y recuperación con cautela"], [
    { title: "El costo del modelo es solo una partida", bullets: ["Licencias y consumo", "Datos, recuperación, almacenamiento y redes", "Integración y desarrollo", "Seguridad, evaluación, monitoreo y registros", "Gobierno, soporte, formación y cambio", "Incidentes, mantenimiento y retiro"], callout: { title: "Costo total de propiedad", text: "Incluye inversión inicial, operación recurrente y salida. El consumo de tokens no representa por sí solo el costo de la solución." } },
    { title: "Suscripción y consumo", comparison: { leftTitle: "Suscripción", leftItems: ["Costo por usuario potencialmente más predecible", "Infraestructura gestionada", "Menor control o personalización en algunos productos", "Puede depender de licencias empresariales"], rightTitle: "Consumo", rightItems: ["Varía por modelo, volumen y arquitectura", "Facilita soluciones personalizadas", "Exige monitoreo y límites", "Puede crecer por pasos, reintentos y salidas largas"] } },
    { title: "Beneficios sin doble conteo", paragraphs: ["Distingue beneficio bruto, incremental, efectivo, capacidad liberada y valor de opción. No conviertas cada hora ahorrada en dinero: pregunta si la capacidad será utilizada, si se reducirá gasto real y qué retrabajo permanece."], formulas: [
      { label: "Costo operativo anual", formula: "licencias + uso + infraestructura + soporte + gobierno + mantenimiento" },
      { label: "Beneficio neto anual", formula: "beneficio incremental − costo operativo anual" },
      { label: "ROI simple", formula: "beneficio neto ÷ inversión inicial" },
      { label: "Recuperación", formula: "inversión inicial ÷ beneficio neto periódico" },
    ] },
    { title: "Tres escenarios", paragraphs: ["Cambia adopción, tiempo, errores, volumen, revisión y costo en escenarios conservador, esperado y optimista. ROI y recuperación son aproximaciones: no capturan toda la incertidumbre, el momento de los flujos ni el valor estratégico." ] },
  ], ["calculadora-economia-ia"], ["hoja-costo-total", "tabla-escenarios"]),

  lesson(7, "riesgos-y-gobernanza", "Cómo gestionar los riesgos de la IA generativa", "Diseña usos permitidos, accesos, revisión y rendición de cuentas desde el inicio.", "14 minutos", ["Relacionar riesgo con el uso", "Definir roles de revisión humana", "Aplicar GUARDA"], [
    { title: "El riesgo depende de la consecuencia", paragraphs: ["Un mismo modelo puede ser aceptable para explorar ideas, requerir revisión para un borrador interno, ser de alto riesgo frente a clientes y resultar inapropiado para una decisión irreversible. Conectar datos de negocio tampoco garantiza exactitud."], bullets: ["Inexactitud, fabricación y variabilidad", "Sesgo, accesibilidad y falta de recurso", "Privacidad, confidencialidad y seguridad", "Propiedad intelectual y trazabilidad", "Dependencia, cambios del modelo y sostenibilidad", "Permisos excesivos, sobreconfianza y daño reputacional"] },
    { title: "GUARDA", paragraphs: ["GUARDA es un modelo práctico original para ordenar responsabilidades. No es una norma ni demuestra cumplimiento."], framework: frameworks.guarda },
    { title: "Revisión humana con autoridad definida", paragraphs: ["Nombrar a una persona no basta. Define si puede rechazar la salida, detener el sistema, acceder a la evidencia y escalar un incidente. Según el caso pueden participar usuario revisor, especialista, dueño de proceso, riesgo, tecnología, datos, seguridad, patrocinio e incidentes." ] },
    { title: "Controles por diseño", questionGroups: [
      { title: "Verificación", items: ["Fuentes aprobadas y citables", "Inspección de afirmaciones", "Negativa cuando falta evidencia", "Escalación a una persona"] },
      { title: "Privacidad y seguridad", items: ["Clasificación, mínimo privilegio y herramientas aprobadas", "Retención, borrado, registro y autenticación", "Protección frente a inyección de instrucciones", "Respuesta a incidentes y gestión de secretos"] },
      { title: "Equidad y derechos", items: ["Personas afectadas y grupos subrepresentados", "Posibilidad de impugnar el resultado", "Atributos protegidos o variables sustitutas", "Monitoreo de trato y resultados"] },
      { title: "Propiedad intelectual", items: ["Derechos sobre entradas y revisión de salidas", "Licencias de código y atribución", "Términos contractuales", "Revisión legal cuando corresponda"] },
    ] },
  ], ["disenar-gobernanza-ia"], ["checklist-guarda", "registro-riesgos"]),

  lesson(8, "disenar-piloto", "Cómo diseñar un piloto que genere evidencia", "Prueba valor, operación, costo y riesgo con alcance limitado y usuarios reales.", "12 minutos", ["Distinguir demo, prueba técnica y piloto", "Definir métricas y condiciones de parada", "Tomar una decisión al cierre"], [
    { title: "Una demostración no es un piloto", framework: [
      { title: "Demostración", text: "Muestra una capacidad en condiciones preparadas." },
      { title: "Prueba de concepto", text: "Comprueba factibilidad técnica." },
      { title: "Piloto", text: "Produce evidencia con usuarios reales y alcance limitado." },
      { title: "Despliegue", text: "Opera con propiedad, controles y soporte establecidos." },
    ] },
    { title: "Brief mínimo", checklist: ["Problema, usuarios y línea base", "Hipótesis, alcance y exclusiones", "Solución, datos y revisión humana", "Métricas de negocio, calidad, adopción, riesgo y costo", "Duración, condiciones de parada y decisión final"] },
    { title: "Métricas que se explican entre sí", questionGroups: [
      { title: "Negocio", items: ["Tiempo, calidad, error, resolución, capacidad o conversión"] },
      { title: "Salida", items: ["Corrección, completitud, relevancia, consistencia y afirmaciones sin respaldo"] },
      { title: "Adopción y riesgo", items: ["Uso, repetición, abandono, anulación, incidentes y escalaciones"] },
      { title: "Economía", items: ["Costo por tarea, salida aceptada, resultado incremental y revisión humana"] },
    ] },
    { title: "La decisión no siempre es escalar", comparison: { leftTitle: "Detener o ajustar", leftItems: ["No hay valor", "El riesgo no es aceptable", "Falta un modelo operativo", "Cambiar flujo, datos, modelo o control"], rightTitle: "Ampliar o escalar", rightItems: ["Probar con otro grupo aún limitado", "Valor repetible", "Controles demostrados", "Propiedad y capacidad operativa"] } },
    { title: "Ocho pilotos para diseñar", scenarios: ["Resúmenes para soporte", "Borradores de propuestas", "Consulta de políticas internas", "Narrativa de variaciones", "Pruebas de software", "Localización de contenidos", "Clasificación de solicitudes", "Síntesis de feedback"].map((title,index)=>({id:`piloto-${index}`,title,situation:"Caso ficticio: el equipo tiene una demostración prometedora, pero aún no cuenta con evidencia operacional.",question:"¿Qué línea base, usuarios, comparación y métricas convertirían la demostración en piloto?",action:"Define alcance, revisión, costo, duración y una condición de parada.",constraint:"El objetivo es aprender; el piloto no obliga a escalar."})) },
  ], ["disenar-piloto-ia"], ["brief-piloto"]),

  lesson(9, "adopcion-organizacional", "Cómo impulsar adopción y cambio organizacional", "Alinea proceso, habilidades, incentivos, confianza y acompañamiento.", "10 minutos", ["Mapear actores y capacidades", "Diseñar experimentos de adopción", "Evitar medir éxito solo por accesos"], [
    { title: "Acceso no equivale a adopción", paragraphs: ["Una licencia disponible no cambia un flujo. Las personas necesitan saber cuándo usar la solución, cómo verificarla, qué no introducir, quién responde por el resultado y cómo reportar problemas. También deben poder expresar preocupaciones sobre carga, calidad y cambios de rol." ] },
    { title: "Cuatro capacidades conectadas", framework: [
      { title: "Negocio", text: "Caso, proceso, métricas y propiedad del resultado." },
      { title: "Técnica", text: "Arquitectura, datos, evaluación, integración y operación." },
      { title: "Riesgo", text: "Política, seguridad, privacidad, revisión e incidentes." },
      { title: "Personas", text: "Participación, habilidades, soporte, incentivos y rediseño del trabajo." },
    ] },
    { title: "Formación situada", bullets: ["Tareas reales y ejemplos aprobados", "Práctica de verificación y escalación", "Guías por rol y consecuencia", "Canal de soporte y aprendizaje entre pares", "Evaluación de comportamiento, no solo asistencia"] },
    { title: "Experimentos de adopción", paragraphs: ["Prueba acompañamiento en horario de trabajo, clínicas de casos, referentes locales y sesiones de observación. Mide uso pertinente, calidad, carga de revisión, confianza calibrada y barreras; no premies volumen de uso sin contexto."], links: [{ label: "Revisar adaptabilidad y cambio", href: "/aprende/adaptabilidad-resiliencia" }, { label: "Revisar relaciones y bienestar", href: "/aprende/relaciones-y-bienestar" }] },
  ], ["crear-plan-adopcion-ia"], ["plan-adopcion"]),

  lesson(10, "escalar-y-operar", "Cómo escalar y operar una iniciativa de IA", "Convierte un piloto validado en un servicio observable, mantenible y reversible.", "11 minutos", ["Definir un modelo operativo", "Monitorear cambios y resultados", "Preparar salida y reversión"], [
    { title: "Escalar cambia el sistema", paragraphs: ["Más usuarios, datos, integraciones y casos extremos pueden cambiar calidad, costo y riesgo. La evidencia de un grupo pequeño no se extrapola automáticamente. Amplía por etapas y conserva comparaciones con la línea base." ] },
    { title: "Propiedad operativa", checklist: ["Dueño de producto y proceso", "Responsables técnicos, datos, seguridad y riesgo", "Soporte a usuarios y gestión de incidentes", "Presupuesto y control de proveedores", "Autoridad para cambiar o retirar la solución"] },
    { title: "Operación de aplicaciones con modelos", paragraphs: ["A veces se usa GenAIOps o LLMOps para describir evaluación, despliegue, observabilidad y cambios de soluciones basadas en modelos. La etiqueta importa menos que las prácticas: versionar instrucciones y fuentes, probar cambios, vigilar calidad, latencia, costo, deriva, abuso e incidentes." ] },
    { title: "Salida y reversión", bullets: ["Exportar datos y configuraciones permitidas", "Mantener una ruta manual o convencional", "Revocar permisos y credenciales", "Conservar registros según política", "Comunicar el cambio a usuarios", "Definir condiciones de retiro por costo, riesgo o desempeño"] },
  ], ["evaluar-escala-ia"], ["lienzo-operacion", "checklist-escala"]),

  lesson(11, "caso-integrador", "Caso integrador: decidir con evidencia", "Aplica VALORA, AUTORIZA y GUARDA a una iniciativa ficticia con información incompleta.", "15 minutos", ["Construir una recomendación ejecutiva", "Reconocer evidencia faltante", "Definir un piloto y sus límites"], [
    { title: "Caso ficticio: Brújula Logística", caseStudy: { title: "Respuestas sugeridas para incidencias de entrega", paragraphs: ["Brújula Logística recibe consultas por retrasos mediante tres canales. Los agentes buscan políticas en documentos distintos y redactan respuestas manualmente. La dirección propone un agente que consulte datos del envío, interprete políticas, responda al cliente y emita compensaciones.", "La línea base disponible mide tiempo medio de atención, pero no correcciones, compromisos equivocados ni diferencias entre canales. Algunas políticas cambian cada mes. Las compensaciones tienen impacto financiero y la información contiene datos personales."] } },
    { title: "Tu encargo", ordered: ["Formula el problema sin asumir que un agente autónomo es la respuesta.", "Completa VALORA e identifica evidencia ausente.", "Compara reglas, asistente general, recuperación e integración.", "Define el nivel máximo de permiso mediante AUTORIZA.", "Diseña controles GUARDA y responsables con autoridad.", "Propón línea base, métricas, escenarios de costo y condiciones de parada.", "Recomienda detener, ajustar, ampliar o escalar." ] },
    { title: "Razonamiento modelo", modelAnswers: [
      { title: "Alcance inicial", text: "Empezaría con borradores internos para un solo canal y políticas aprobadas. La persona revisa evidencia y envía; el sistema no promete plazos ni ejecuta compensaciones." },
      { title: "Evidencia necesaria", text: "Mediría tiempo, correcciones, afirmaciones sin respaldo, escalaciones, aceptación, costo por respuesta aceptada y resultados por tipo de consulta." },
      { title: "Gobierno", text: "El dueño de atención responde por el proceso; políticas por las fuentes; tecnología por integración; privacidad y seguridad por accesos; incidentes tiene autoridad para detener." },
      { title: "Decisión", text: "Solo ampliaría si mejora el resultado frente a la línea base, preserva permisos, mantiene errores bajo umbrales acordados y existe capacidad operativa. El éxito del borrador no justificaría automatizar compensaciones." },
    ] },
    { title: "Memo ejecutivo", exercise: { title: "Recomendación en una página", prompt: "Resume decisión, evidencia, riesgos, costo, responsables y próximo experimento.", help: "Incluye una condición explícita que haría detener la iniciativa." }, links: [{ label: "Construir una recomendación", href: "/herramientas/constructor-recomendaciones" }] },
  ], ["evaluar-oportunidad-ia", "disenar-piloto-ia"], ["memo-decision-ejecutiva"]),
];

export const aiBusinessCases = [
  ["catalogo-local", "Catálogo regional", "Marketing", "Borradores tardan 6 horas por colección", "Generar primeras versiones desde fichas aprobadas", "Afirmaciones de producto inventadas", "Editor valida cada afirmación", "Tiempo y correcciones por pieza", "Más de 2 afirmaciones sin respaldo por lote"],
  ["feedback-ventas", "Síntesis de objeciones", "Comercial", "Notas dispersas y revisión mensual", "Agrupar temas sin identificar clientes", "Pérdida de matices", "Líder comercial inspecciona muestras", "Cobertura de notas y utilidad", "Se omiten temas críticos"],
  ["resumen-soporte", "Resumen de atención", "Servicio", "Traspasos requieren 9 minutos", "Preparar resumen interno", "Datos sensibles u omisiones", "Agente corrige antes de guardar", "Tiempo, correcciones y exposición", "Incidente de datos"],
  ["respuesta-politicas", "Respuesta basada en políticas", "Servicio", "Búsqueda en cinco documentos", "Recuperar fuentes y sugerir respuesta", "Política desactualizada", "Especialista aprueba fuentes y salida", "Citas válidas y resolución", "Respuesta sin fuente"],
  ["variaciones-finanzas", "Narrativa de variaciones", "Finanzas", "Comentario mensual toma dos días", "Borrador desde cifras ya calculadas", "Causalidad inventada", "Analista verifica números y explicación", "Tiempo y correcciones causales", "Cifra modificada por el modelo"],
  ["evidencia-control", "Organización de evidencia", "Control", "Documentos se clasifican manualmente", "Etiquetar para revisión", "Clasificación equivocada", "Especialista decide inclusión", "Precisión y tiempo", "Evidencia crítica omitida"],
  ["requisitos-producto", "Borrador de requisitos", "Producto", "Notas tardan una semana en consolidarse", "Proponer estructura desde notas autorizadas", "Convertir opiniones en hechos", "Product manager valida con usuarios", "Tiempo y trazabilidad", "Afirmación no atribuible"],
  ["pruebas-prototipo", "Casos de prueba", "Producto", "Cobertura irregular", "Sugerir casos límite", "Falsa sensación de cobertura", "QA selecciona y ejecuta", "Defectos hallados y duplicados", "Baja utilidad incremental"],
  ["ejercicios-formacion", "Prácticas de formación", "Aprendizaje", "Crear variantes consume 4 horas", "Generar ejercicios con rúbrica", "Contenido incorrecto o sesgado", "Diseñador instruccional aprueba", "Correcciones y logro", "Daño pedagógico recurrente"],
  ["ayuda-analistas", "Ayuda de consulta", "Analítica", "Consultas simples esperan un día", "Sugerir consultas sin ejecutar", "Código incorrecto o acceso indebido", "Analista revisa y ejecuta", "Consultas aceptadas y errores", "Intento de acceso no autorizado"],
  ["resumen-tablero", "Resumen de tablero", "Analítica", "Actualización ejecutiva tarda 90 minutos", "Borrador desde métricas verificadas", "Explicación causal falsa", "Dueño de métrica aprueba", "Tiempo y afirmaciones corregidas", "Conclusión material sin evidencia"],
  ["documentar-codigo", "Documentación de código", "Tecnología", "Módulos críticos carecen de guía", "Proponer documentación desde repositorio permitido", "Secretos o API inventada", "Ingeniería revisa cambios", "Aceptación y hallazgos", "Secreto expuesto"],
  ["pruebas-codigo", "Pruebas unitarias sugeridas", "Tecnología", "Cobertura de módulo en 45 %", "Sugerir pruebas en rama aislada", "Pruebas superficiales", "Desarrollador ejecuta y revisa", "Defectos y cobertura útil", "Vulnerabilidad introducida"],
  ["traduccion-interna", "Localización de guías", "Operaciones", "Actualización multilingüe demora semanas", "Borradores por idioma", "Cambio de sentido", "Revisor nativo especializado", "Correcciones y tiempo", "Instrucción insegura traducida"],
  ["clasificar-solicitudes", "Clasificación de solicitudes", "Operaciones", "20 % llega al equipo equivocado", "Sugerir categoría y confianza", "Enrutamiento desigual", "Coordinador corrige casos dudosos", "Precisión por categoría", "Brecha persistente entre grupos"],
  ["propuesta-consultoria", "Estructura de propuesta", "Consultoría", "Primer esquema tarda un día", "Generar índice desde requisitos", "Compromisos no autorizados", "Responsable comercial valida", "Tiempo y compromisos corregidos", "Término contractual inventado"],
  ["agenda-publica", "Síntesis de comentarios", "Sector público", "Revisión de aportes tarda tres semanas", "Agrupar temas con trazabilidad", "Voces minoritarias ocultas", "Equipo revisa muestras y excepciones", "Cobertura por tema", "Pérdida no explicable de aportes"],
  ["mantenimiento-campo", "Guía para mantenimiento", "Operaciones", "Técnicos consultan manuales extensos", "Recuperar pasos con citas", "Instrucción insegura", "Técnico conserva autoridad y procedimiento", "Citas y escalaciones", "Paso sin respaldo o incidente"],
].map(([slug, title, category, baseline, proposedUse, risk, humanRole, metric, stopCondition]) => ({ slug, title, category, baseline, proposedUse, expectedValue: "Hipótesis por comprobar durante un piloto limitado.", risk, humanRole, metric, stopCondition, fictional: true }));

export const aiBusinessResources = [
  ["lienzo-valora", "Lienzo VALORA", "Plantilla", ["Valor y línea base", "Alcance y exclusiones", "Límites", "Operación", "Recursos", "Evidencia de aprendizaje"]],
  ["ficha-caso-negocio", "Ficha de caso de negocio", "Hoja de trabajo", ["Problema", "Alternativas sin IA", "Beneficio incremental", "Costos", "Riesgos", "Decisión"]],
  ["guia-modelos-soluciones", "Guía de modelos y soluciones", "Guía", ["Modalidad", "Escala", "Fuentes", "Adaptación", "Evaluación"]],
  ["matriz-enfoque", "Matriz configurar, integrar, construir o diferir", "Matriz", ["Tiempo", "Control", "Integración", "Capacidad", "Costo", "Salida"]],
  ["preguntas-proveedor", "Preguntas para proveedores", "Checklist", ["Datos", "Permisos", "Cambios", "Incidentes", "Costos", "Portabilidad"]],
  ["revision-autoriza", "Revisión AUTORIZA", "Checklist", frameworks.autoriza.map((item) => item.title)],
  ["hoja-costo-total", "Hoja de costo total", "Calculadora manual", ["Inversión", "Operación", "Revisión", "Gobierno", "Mantenimiento", "Retiro"]],
  ["beneficio-incremental", "Hoja de beneficios", "Hoja de trabajo", ["Línea base", "Cambio", "Adopción", "Capacidad realizable", "Doble conteo"]],
  ["tabla-escenarios", "Tabla de escenarios", "Plantilla", ["Conservador", "Esperado", "Optimista", "Sensibilidades"]],
  ["checklist-guarda", "Checklist GUARDA", "Checklist", frameworks.guarda.map((item) => item.title)],
  ["registro-riesgos", "Registro de riesgos", "Plantilla", ["Evento", "Afectados", "Control", "Responsable", "Señal", "Respuesta"]],
  ["brief-piloto", "Brief de piloto", "Plantilla", ["Problema", "Línea base", "Alcance", "Métricas", "Duración", "Parada"]],
  ["plan-adopcion", "Plan de adopción", "Plantilla", ["Actores", "Cambios", "Formación", "Soporte", "Señales", "Aprendizaje"]],
  ["lienzo-operacion", "Lienzo de operación", "Plantilla", ["Propiedad", "Monitoreo", "Soporte", "Cambios", "Incidentes", "Retiro"]],
  ["checklist-escala", "Checklist de escala", "Checklist", ["Valor", "Riesgo", "Costo", "Capacidad", "Portabilidad", "Reversión"]],
  ["memo-decision-ejecutiva", "Memo de decisión ejecutiva", "Plantilla", ["Recomendación", "Evidencia", "Alternativas", "Riesgos", "Recursos", "Próximo paso"]],
  ["biblioteca-casos-ia", "Biblioteca de casos ficticios", "Práctica", ["Problema", "Línea base", "Uso", "Riesgo", "Rol humano", "Parada"]],
].map(([id, title, type, fields]) => ({ id, title, type, description: `Recurso práctico para trabajar ${fields.join(", ").toLowerCase()}.`, fields }));

export const getAIBusinessLesson = (slug) => aiBusinessLessons.find((item) => item.slug === slug);
export const getAIBusinessResource = (id) => aiBusinessResources.find((item) => item.id === id);
