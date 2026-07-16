export const marketingBase = "/aprende/marketing-digital";
export const marketingLastReviewed = "2026-07-16";

const lesson = (order, slug, title, description, outcomes, sections, relatedTools = []) => ({
  order, slug, title, description, outcomes, sections, relatedTools,
  href: `${marketingBase}/${slug}`, level: order < 5 ? "Introductorio" : "Intermedio",
  readingTime: `${10 + (order % 5)} minutos`, updatedAt: marketingLastReviewed,
  lastReviewed: marketingLastReviewed, status: "published",
});

const exercise = (title, prompt, help) => ({ title, prompt, help });
const framework = (...items) => items.map(([title, text]) => ({ title, text }));

export const marketingLessons = [
  lesson(1, "fundamentos", "Cómo funciona un sistema de marketing digital", "Conecta objetivos, audiencias, oferta, experiencia, canales y medición antes de elegir tácticas.", ["Distinguir estrategia, canal, táctica y herramienta", "Relacionar actividad digital con un resultado", "Aplicar CONECTA sin asumir un recorrido lineal"], [
    { title: "Un sistema de decisiones", paragraphs: ["El marketing digital coordina experiencias, contenidos y acciones para contribuir a objetivos concretos. Abrir cuentas o publicar con frecuencia no constituye una estrategia si no existe una audiencia relevante, una oferta clara y una decisión que medir.", "CONECTA organiza siete preguntas: Contexto, Objetivo, Necesidad, Experiencia, Canales, Tácticas y contenido, y Aprendizaje. Es un modelo creado para esta ruta; no es un estándar ni garantiza resultados."], framework: framework(["Contexto", "Oferta, recursos y restricciones."], ["Objetivo", "Cambio que importa al negocio."], ["Necesidad", "Problema o motivación respaldada por evidencia."], ["Experiencia", "Recorrido y puntos de contacto."], ["Canales", "Medios apropiados para una función."], ["Tácticas", "Acciones y contenido sostenibles."], ["Aprendizaje", "Métricas, pruebas y decisiones."]) },
    { title: "No confundas niveles", bullets: ["Estrategia: elecciones coordinadas para alcanzar un objetivo.", "Canal: entorno de distribución o interacción.", "Táctica: acción concreta dentro del plan.", "Campaña: conjunto limitado de acciones con objetivo y periodo.", "Contenido: pieza que cumple una función en la experiencia.", "Herramienta: tecnología que facilita una tarea.", "Métrica: medida definida; no es el resultado por sí misma."], exercise: exercise("Desarmar una actividad", "Elige una acción digital y separa objetivo, audiencia, canal, táctica, contenido, herramienta, métrica y decisión.", "Si no puedes nombrar la decisión, la métrica todavía no está conectada al plan.") },
    { title: "Cuatro formas de llegar", paragraphs: ["Los canales propios ofrecen mayor control relativo; los ganados dependen de terceros; los compartidos combinan comunidad y reglas de plataforma; los pagados compran distribución. Incluso una cuenta administrada por la organización depende de infraestructura y políticas ajenas."], bullets: ["Propios: sitio, lista con permiso y recursos controlados.", "Ganados: recomendaciones, cobertura o referencias no compradas.", "Compartidos: conversación y distribución en comunidades o plataformas.", "Pagados: publicidad, patrocinios u otras inserciones contratadas."], callout: { title: "El recorrido no es un embudo universal", text: "Una persona puede descubrir, explorar, decidir, usar, regresar o recomendar en secuencias distintas. Modela la experiencia real y sus retrocesos." } },
    { title: "Seis sistemas, seis decisiones", scenarios: [
      { id: "fund-1", title: "Archivo Andén", situation: "Un servicio documental ficticio depende de recomendaciones y quiere mejorar consultas calificadas.", question: "¿Qué resultado y línea base necesita?", action: "Definir consulta calificada y registrar origen.", constraint: "Una persona atiende marketing." },
      { id: "fund-2", title: "Taller Niebla", situation: "Un fabricante ficticio tiene tráfico, pero información técnica incompleta.", question: "¿Conviene comprar más distribución?", action: "Corregir la experiencia de evaluación primero.", constraint: "Catálogo pequeño y ciclo largo." },
      { id: "fund-3", title: "Aula Cobalto", situation: "Un programa ficticio publica a diario sin objetivo común.", question: "¿Qué rol cumple el contenido?", action: "Elegir una pregunta y un siguiente paso.", constraint: "Producción insostenible." },
      { id: "fund-4", title: "Estudio Junco", situation: "Una consultora ficticia recibe visitas locales y remotas con necesidades distintas.", question: "¿Cómo separar recorridos?", action: "Investigar contexto y segmentar por necesidad.", constraint: "Datos de origen incompletos." },
      { id: "fund-5", title: "Mercado Linde", situation: "Una tienda ficticia celebra seguidores, pero desconoce recompra.", question: "¿Qué métrica apoya una decisión?", action: "Definir cohortes y periodo de repetición.", constraint: "No existe identificador consistente." },
      { id: "fund-6", title: "Fundación Umbral", situation: "Una organización ficticia necesita registros para un evento accesible.", question: "¿Qué canales y experiencia importan?", action: "Mapear descubrimiento, registro y confirmación.", constraint: "Presupuesto pagado mínimo." },
    ] },
  ], ["diagnostico"]),

  lesson(2, "estrategia-y-posicionamiento", "Cómo definir una estrategia y un posicionamiento digital", "Convierte una intención comercial en elecciones, evidencia y una promesa defendible.", ["Formular un objetivo META", "Separar propuesta de valor y posicionamiento", "Investigar alternativas sin copiar"], [
    { title: "Del objetivo del negocio al objetivo de marketing", paragraphs: ["Un objetivo útil indica qué debe cambiar, desde qué línea base, en qué periodo y para apoyar qué resultado. Puede enfocarse en ingresos, adquisición, retención, conocimiento, experiencia, capacidad o aprendizaje.", "Un objetivo técnicamente específico puede seguir siendo irrelevante. META pregunta Magnitud, Evidencia, Tensión y Aporte para hacer visibles el cambio esperado, la medición, el costo de oportunidad y la contribución al negocio."], framework: framework(["Magnitud", "Cambio esperado y horizonte."], ["Evidencia", "Línea base, métrica y fuente."], ["Tensión", "Recursos, riesgos y renuncias."], ["Aporte", "Contribución al objetivo del negocio."]) },
    { title: "Posicionamiento que se pueda sostener", bullets: ["Para quién es relevante la oferta.", "En qué situación aparece la necesidad.", "Qué problema ayuda a resolver.", "Qué alternativas considera la audiencia.", "Qué valor distintivo se propone.", "Qué evidencia permite respaldar la afirmación."], callout: { title: "Una frase no crea una posición", text: "La experiencia, el precio, el servicio, el producto y la prueba disponible deben sostener el mensaje." } },
    { title: "Competir también es ser comparado con no hacer nada", paragraphs: ["Investiga competidores directos, indirectos, sustitutos y soluciones internas. Observa oferta, precio, experiencia, lenguaje, pruebas, reseñas y vacíos, sin reproducir expresiones ni diseño."], exercise: exercise("Mapa de alternativas", "Compara tres alternativas desde la decisión del cliente y registra evidencia, incertidumbres y una diferencia que podrías demostrar.", "Incluye la opción de postergar o resolver el problema de otra manera.") },
    { title: "Diez prácticas de elección estratégica", questionGroups: [{ title: "Objetivo y evidencia", items: ["Reconstruye una línea base incompleta.", "Convierte aumentar visibilidad en una META.", "Compara un objetivo de adquisición con uno de retención.", "Explica por qué un objetivo específico puede ser irrelevante.", "Define una condición para abandonar una táctica."] }, { title: "Valor y posición", items: ["Identifica la alternativa de no hacer nada.", "Reescribe una promesa sin prueba.", "Separa característica, beneficio y evidencia.", "Compara dos posiciones válidas para audiencias distintas.", "Documenta qué investigación cambiaría el posicionamiento."] }] },
  ], ["strategy"]),

  lesson(3, "clientes-y-recorrido", "Cómo entender a tus clientes y diseñar su recorrido", "Construye segmentos y recorridos desde evidencia, no desde personajes inventados.", ["Crear una ficha de audiencia basada en evidencia", "Reconocer sesgos y vacíos", "Mapear preguntas, fricciones y responsables"], [
    { title: "Evidencia antes que certeza", paragraphs: ["Entrevistas, observación, conversaciones comerciales, búsquedas, soporte, reseñas, encuestas, analítica y compras aportan señales diferentes. Ninguna fuente representa por sí sola a toda la audiencia.", "Registra consentimiento, procedencia, fecha, sesgos posibles y nivel de confianza. No conviertas una anécdota en una persona ficticia presentada como hecho."], bullets: ["Situación y objetivo", "Problema, detonante y barrera", "Alternativas y criterios de decisión", "Preguntas y canales preferidos", "Fuente, confianza y aspectos desconocidos"] },
    { title: "Segmentar por utilidad", paragraphs: ["Necesidad, contexto, comportamiento, etapa, valor, geografía y preferencias pueden ser más accionables que una descripción demográfica. En B2B también importan el tipo de organización, la función y el proceso de compra."], callout: { title: "Evita estereotipos", text: "Usa atributos personales solo cuando sean pertinentes, proporcionales y lícitos. Un segmento es una hipótesis operativa que debe revisarse." } },
    { title: "Un recorrido con dueños y decisiones", ordered: ["Detonante", "Descubrimiento", "Evaluación", "Decisión", "Uso", "Continuidad"], paragraphs: ["En cada etapa documenta pregunta, resultado deseado, punto de contacto, fricción, necesidad de contenido, métrica y responsable. La secuencia es una ayuda de diseño, no una descripción universal."], exercise: exercise("Buscar la evidencia faltante", "Marca cada afirmación de tu recorrido como observada, inferida o desconocida.", "Prioriza una pregunta cuya respuesta cambiaría una decisión de canal o contenido.") },
  ], ["journey"]),

  lesson(4, "auditoria-y-canales", "Cómo auditar tu presencia digital y elegir canales", "Detecta fricciones y asigna una función clara a cada canal antes de expandirte.", ["Auditar una presencia sin prometer una revisión técnica", "Aplicar CANAL", "Postergar canales que no pueden sostenerse"], [
    { title: "La auditoría comienza con tareas reales", bullets: ["Facilidad para encontrar información correcta", "Consistencia de marca y oferta", "Uso móvil, accesibilidad y rendimiento", "Confianza, contacto y ruta de conversión", "Medición, enlaces, contenido y avisos de privacidad", "Visibilidad de búsqueda, reseñas y captura con permiso"], paragraphs: ["Una revisión manual registra observaciones; no equivale a una auditoría automática de seguridad, rendimiento, accesibilidad o cumplimiento."] },
    { title: "Elegir un canal es aceptar un costo operativo", paragraphs: ["CANAL compara Cliente, Acción, Necesidad de recursos, Aprendizaje medible y Límite. Evalúa audiencia, etapa, contenido, tiempo, dinero, control, dependencia, privacidad y capacidad de responder."], framework: framework(["Cliente", "¿Es alcanzable la audiencia pertinente?"], ["Acción", "¿Qué función cumplirá?"], ["Necesidad", "¿Qué recursos exige?"], ["Aprendizaje", "¿Qué conducta o resultado se medirá?"], ["Límite", "¿Qué dependencia o riesgo existe?"]) },
    { title: "Menos canales, mejor atendidos", paragraphs: ["Un canal se posterga cuando no existe una función diferenciada, capacidad de producción, respuesta, medición o mantenimiento. La ausencia deliberada puede ser una decisión estratégica."], exercise: exercise("Portafolio mínimo", "Asigna a cada canal una función, un responsable, una frecuencia viable y una condición de salida.", "Elimina el canal cuya contribución no puedas explicar.") },
  ], ["audit", "channels"]),

  lesson(5, "contenidos", "Cómo crear un sistema de contenidos sostenible", "Planifica piezas que respondan preguntas y puedan producirse, distribuirse y revisarse.", ["Asignar un rol a cada contenido", "Crear un calendario sostenible", "Mantener consistencia sin repetir"], [
    { title: "El contenido cumple un trabajo", bullets: ["Atraer atención pertinente", "Aclarar un problema", "Enseñar", "Demostrar", "Reducir incertidumbre", "Apoyar una decisión", "Ayudar después de la compra", "Mantener una relación"], paragraphs: ["Define audiencia, pregunta, etapa, formato, canal, siguiente paso, esfuerzo, distribución, reutilización y métrica antes de producir."] },
    { title: "Calidad y marca", bullets: ["Relevante, claro y verificable", "Distintivo sin afirmaciones exageradas", "Accesible y adecuado al canal", "Ético, revisado y conectado a un siguiente paso", "Coherente en voz, tono, vocabulario, visuales y evidencia"], callout: { title: "Publicar más no corrige una estrategia débil", text: "Un calendario sostenible protege la calidad y la capacidad de responder." } },
    { title: "Calendario como sistema de trabajo", paragraphs: ["Registra fecha, audiencia, pregunta, objetivo, tema, formato, canal, responsable, estado, CTA, revisión, métrica y oportunidad de reutilización."], exercise: exercise("Semana mínima viable", "Diseña una semana con dos piezas que puedan derivarse de una misma investigación.", "Incluye tiempo de revisión, distribución e interacción.") },
  ], ["content"]),

  lesson(6, "ia-para-marketing", "Cómo utilizar inteligencia artificial en marketing sin perder criterio", "Usa IA para asistir tareas delimitadas con datos aprobados, revisión humana y trazabilidad.", ["Aplicar BRIEF", "Reconocer usos inadecuados", "Diseñar una revisión humana"], [
    { title: "Asistencia, no delegación de responsabilidad", paragraphs: ["La IA puede ayudar a idear, crear borradores, variar formatos, resumir, clasificar, organizar investigación, apoyar traducción, explicar datos o revisar accesibilidad. También puede fabricar hechos y fuentes, reproducir sesgos, exponer información y escalar contenido pobre."], bullets: ["No introduzcas datos personales ni confidenciales sin autorización y controles.", "Verifica cada afirmación y fuente.", "Revisa derechos, divulgación, marca y accesibilidad.", "No uses inferencias sensibles para excluir audiencias."] },
    { title: "BRIEF", paragraphs: ["BRIEF define Base aprobada, Resultado esperado, Intención, Estándares y Formato. Es una plantilla creada para esta ruta; no garantiza una salida correcta."], framework: framework(["Base", "Información verificada permitida."], ["Resultado", "Entrega y criterio de éxito."], ["Intención", "Objetivo y audiencia."], ["Estándares", "Marca, calidad, ética y límites."], ["Formato", "Estructura de la respuesta."]) },
    { title: "Flujo de control", ordered: ["Delimitar la tarea", "Retirar información sensible", "Aportar contexto aprobado", "Generar alternativas", "Verificar afirmaciones", "Revisar marca y accesibilidad", "Revisar derechos y divulgación", "Aprobar", "Medir", "Registrar aprendizaje"], exercise: exercise("Semáforo de tareas", "Clasifica tres tareas como asistibles, restringidas o no delegables y explica la revisión necesaria.", "Considera impacto, detectabilidad del error y reversibilidad.") },
  ], ["ai"]),

  lesson(7, "sitios-web-y-conversion", "Cómo crear una experiencia digital clara y orientada a la acción", "Revisa arquitectura, confianza, accesibilidad y fricción alrededor de una acción valiosa.", ["Definir una conversión contextual", "Diagnosticar fricciones", "Priorizar mejoras verificables"], [
    { title: "El sitio forma parte de la experiencia", bullets: ["Propósito y propuesta comprensibles", "Arquitectura y navegación previsibles", "Diseño adaptable, accesible y eficiente", "Pruebas de confianza y contacto", "Formularios proporcionados y recuperación de errores", "Privacidad, medición y siguientes pasos claros"] },
    { title: "Conversión no significa siempre compra", paragraphs: ["Una conversión puede ser una reserva, contacto, cotización, registro, descarga, donación, postulación o lead calificado. Debe representar valor real y contar con un denominador definido."], bullets: ["Relevancia del tráfico", "Claridad de la oferta", "Confianza", "Fricción y fallas técnicas", "Experiencia móvil y accesibilidad", "Precio, información y siguiente paso"] },
    { title: "Diagnóstico antes de rediseño", exercise: exercise("Recorrido crítico", "Completa una tarea en móvil y teclado; registra dónde dudas, retrocedes o abandonas.", "Separa observación, posible causa y prueba propuesta.") },
  ], ["website"]),

  lesson(8, "seo-y-busqueda", "Cómo mejorar la visibilidad orgánica en buscadores", "Alinea intención, contenido útil y fundamentos técnicos sin prometer posiciones.", ["Distinguir rastreo, indexación y posicionamiento", "Crear un brief por intención", "Evitar atajos de palabras clave"], [
    { title: "Ser publicado no implica ser encontrado", paragraphs: ["Los sistemas de búsqueda descubren recursos, procesan su contenido y deciden cuándo mostrarlos. El acceso para rastreo, la indexación y la posición son procesos distintos; ninguna optimización garantiza visibilidad."], bullets: ["Título y encabezados descriptivos", "URL e enlaces internos comprensibles", "Contenido original y respaldado", "Imágenes con alternativas adecuadas", "Datos estructurados solo cuando describen contenido real", "Usabilidad móvil y rendimiento"] },
    { title: "La intención puede superponerse", bullets: ["Aprender", "Comparar", "Encontrar", "Actuar", "Volver"], paragraphs: ["Una consulta puede combinar intenciones. Diseña la página para la pregunta principal y ofrece rutas claras a las siguientes decisiones."] },
    { title: "Un brief, no una fórmula de ranking", exercise: exercise("Brief de búsqueda", "Define tema, audiencia, intención, pregunta principal, preguntas de apoyo, evidencia, propósito, CTA, enlaces internos y fecha de revisión.", "No inventes volumen de búsqueda ni repitas términos de forma artificial.") },
  ], ["seo"]),

  lesson(9, "redes-sociales", "Cómo construir una estrategia útil de redes sociales", "Define el papel del canal, la capacidad de interacción y las reglas de comunidad.", ["Diseñar un rol de canal", "Medir más allá de seguidores", "Evaluar colaboraciones responsables"], [
    { title: "Una cuenta necesita una función", bullets: ["Objetivo y audiencia", "Rol de la plataforma", "Pilares de contenido", "Capacidad de publicación e interacción", "Moderación, tiempos y escalación", "Métricas, seguridad y revisión"], paragraphs: ["La distribución depende de reglas y algoritmos que cambian. Conserva activos esenciales y no construyas toda la relación sobre una plataforma."] },
    { title: "Comunidad y atención", paragraphs: ["Escuchar, responder, moderar y escalar forman parte del trabajo. Define qué puede responder el equipo, qué requiere soporte y qué debe retirarse por seguridad sin silenciar crítica legítima."], callout: { title: "Alcance no es relación", text: "Seguidores e impresiones necesitan contexto de audiencia, interacción pertinente y resultados posteriores." } },
    { title: "Creadores y contenido de usuarios", bullets: ["Relevancia y autenticidad", "Divulgación clara de la relación comercial", "Derechos de uso y compensación", "Ajuste de marca y seguridad", "Medición y señales de fraude", "Revisión contractual según jurisdicción"], exercise: exercise("Colaboración limitada", "Define entregables, divulgación, derechos, revisión, métricas y una condición de salida.", "No uses el número de seguidores como único criterio.") },
  ], ["social"]),

  lesson(10, "email-marketing", "Cómo crear campañas de correo útiles y respetuosas", "Construye una relación basada en permiso, expectativas claras y medición prudente.", ["Distinguir correo transaccional y promocional", "Planificar una campaña con permiso", "Interpretar métricas con cautela"], [
    { title: "Permiso y valor esperado", paragraphs: ["Explica qué recibirá la persona, con qué finalidad y cómo puede dejar de recibirlo. Las obligaciones dependen de la jurisdicción; revisa la normativa aplicable antes de captar o reutilizar contactos."], bullets: ["Formulario claro y proporcional", "Segmentación pertinente", "Frecuencia y remitente reconocibles", "Baja accesible", "Higiene y protección de la lista"] },
    { title: "Una campaña completa", bullets: ["Bienvenida", "Boletín", "Secuencia educativa", "Actualización de producto o servicio", "Evento", "Recordatorio permitido", "Retención o reactivación"], paragraphs: ["Distingue mensajes de servicio necesarios de promociones. Asunto, texto previo, cuerpo, CTA, diseño móvil y accesibilidad deben trabajar como una experiencia."] },
    { title: "Métricas con limitaciones", bullets: ["Entrega y rebote", "Apertura, afectada por mecanismos de privacidad", "Clic y clic sobre apertura", "Conversión", "Baja y queja", "Valor por destinatario cuando sea apropiado"], exercise: exercise("Decidir con una campaña", "Elige una métrica primaria, dos señales de control y la decisión asociada.", "No concluyas éxito solo por aperturas.") },
  ], ["email"]),

  lesson(11, "publicidad-digital", "Cómo comprender y planificar publicidad digital", "Define objetivo, audiencia, creatividad, destino, presupuesto y medición antes de comprar distribución.", ["Distinguir formatos pagados", "Calcular métricas con denominadores claros", "Separar ROAS y rentabilidad"], [
    { title: "Pagar por distribución no corrige la oferta", paragraphs: ["Búsqueda, social, display, video, patrocinios, afiliación y retargeting cumplen funciones diferentes. El plan debe incluir objetivo, audiencia, creatividad, página de destino, presupuesto, seguimiento, frecuencia, seguridad de marca, fraude, privacidad y prueba."], callout: { title: "Retargeting requiere revisión", text: "No asumas anonimato ni permiso. Evalúa finalidad, consentimiento, expectativas y normativa aplicable." } },
    { title: "Métricas y fórmulas", formulas: [{ label: "CTR", formula: "clics ÷ impresiones" }, { label: "Conversión", formula: "conversiones ÷ visitas o clics elegibles" }, { label: "CPA", formula: "costo ÷ adquisiciones" }, { label: "ROAS", formula: "ingreso atribuido ÷ costo publicitario" }, { label: "ROI simple", formula: "(contribución incremental − costo) ÷ costo" }], paragraphs: ["Especifica periodo, moneda, atribución y denominador. ROAS usa ingreso atribuido y no incorpora necesariamente margen, operación, devoluciones ni incrementalidad; no equivale a beneficio."] },
    { title: "Un primer test puede concluir no continuar", exercise: exercise("Plan de campaña", "Define hipótesis, presupuesto máximo, conversión, control de calidad y criterios para detener, revisar o ampliar.", "Configura medición antes de optimizar.") },
  ], ["metrics"]),

  lesson(12, "analitica-y-experimentacion", "Cómo convertir datos en decisiones de marketing", "Separa datos, observaciones e interpretaciones y diseña aprendizaje proporcional.", ["Construir un plan de medición", "Detectar métricas de vanidad", "Diseñar un experimento con límites"], [
    { title: "De registro a decisión", framework: framework(["Dato", "Información registrada."], ["Métrica", "Medida cuantificada y definida."], ["Observación", "Lo que aparece en los datos."], ["Insight", "Interpretación respaldada y útil."], ["Hipótesis", "Explicación o expectativa comprobable."], ["Decisión", "Acción tomada bajo incertidumbre."]), paragraphs: ["Una explicación plausible no se convierte automáticamente en insight. Debe conectarse con evidencia suficiente, alternativas y una decisión."] },
    { title: "Plan de medición", bullets: ["Objetivo y línea base", "KPI y métricas de apoyo", "Fuente, definición y dueño", "Frecuencia y segmento", "Umbral de decisión", "Limitaciones y calidad"], paragraphs: ["Seguidores sin audiencia relevante, tráfico sin comportamiento, leads sin calificación o descargas sin uso pueden ser métricas de vanidad cuando no apoyan una decisión."] },
    { title: "Experimentar con honestidad", bullets: ["Hipótesis y variable", "Comparación y asignación", "Muestra y duración", "Métrica primaria y salvaguardas", "Factores externos y decisión"], callout: { title: "No toda prueba identifica causalidad", text: "Sin asignación adecuada, tamaño suficiente y control de factores externos, interpreta el resultado como evidencia limitada." }, exercise: exercise("Diseño mínimo", "Escribe qué cambiarás, qué mantendrás, cómo compararás y qué resultado modificaría tu decisión.", "Incluye una razón para detener la prueba.") },
  ], ["measurement"]),

  lesson(13, "comercio-electronico", "Cómo diseñar una experiencia de comercio electrónico", "Reduce incertidumbre desde el catálogo hasta soporte, devoluciones y recompra.", ["Mapear fricciones del recorrido", "Definir métricas de comercio", "Evitar benchmarks universales"], [
    { title: "La tienda es una operación completa", bullets: ["Oferta, catálogo e información de producto", "Imágenes, búsqueda y filtros", "Precio, disponibilidad y confianza", "Carrito, pago y experiencia móvil", "Envío, devoluciones y soporte", "Retención y recomendaciones pertinentes"] },
    { title: "Medir el recorrido", bullets: ["Vistas de producto", "Adición al carrito", "Inicio del pago", "Compra y valor medio", "Recompra", "Reembolsos y devoluciones", "Adquisición y valor del cliente", "Abandono"], paragraphs: ["Los valores esperables cambian por sector, mercado, dispositivo, fuente y oferta. Compara primero con tu propia línea base y segmentos pertinentes."] },
    { title: "Fricción observada, causa por probar", exercise: exercise("Mapa de fricciones", "Registra etapa, evidencia, impacto posible, grupo afectado, hipótesis y corrección reversible.", "No ingreses pedidos ni datos de clientes reales.") },
  ]),

  lesson(14, "marketing-local", "Cómo mejorar la visibilidad digital de un negocio local", "Facilita que una persona encuentre información precisa, evalúe confianza y complete una acción cercana.", ["Auditar información local", "Responder reseñas con cuidado", "Diseñar un plan geográfico"], [
    { title: "Precisión antes que promoción", bullets: ["Nombre, dirección, teléfono y horarios consistentes", "Mapas y directorios pertinentes", "Páginas locales útiles", "Contacto móvil, reserva y accesibilidad", "Reseñas y respuestas", "Alianzas, eventos y contenido local"] },
    { title: "Relevancia geográfica sin saturación", paragraphs: ["Describe áreas atendidas, condiciones y disponibilidad con precisión. No crees páginas repetitivas para lugares donde no operas. Las plataformas locales son ejemplos de distribución, no el centro de la estrategia."], callout: { title: "Las reseñas no son un guion", text: "No incentives testimonios engañosos ni reveles información personal al responder. Establece escalación para incidentes." } },
    { title: "Plan local medible", exercise: exercise("Una tarea cercana", "Elige encontrar, llamar, reservar o visitar; revisa el recorrido desde móvil y define una métrica.", "Incluye corrección de información y una acción comunitaria sostenible.") },
  ]),

  lesson(15, "internacionalizacion", "Cómo evaluar una expansión digital internacional", "Comprueba demanda, adaptación, reglas y operación antes de traducir campañas.", ["Distinguir traducción, localización e internacionalización", "Aplicar CRUZA", "Diseñar un piloto reversible"], [
    { title: "Traducir no prepara una operación", paragraphs: ["La traducción cambia el idioma; la localización adapta contenido y experiencia; la internacionalización prepara sistemas y procesos para varios mercados. La expansión también exige revisar moneda, precio, pago, impuestos, publicidad, datos, logística, devoluciones, soporte y husos horarios."], callout: { title: "Revisión especializada", text: "Las obligaciones legales, fiscales y de datos varían. Esta ruta no entrega aprobación jurídica ni tributaria." } },
    { title: "CRUZA", framework: framework(["Cliente", "Evidencia de demanda y problema."], ["Reglas", "Revisión legal, fiscal, publicitaria y de datos."], ["Uso y cultura", "Idioma, expectativas y adaptación."], ["Zona operativa", "Pago, soporte, logística y devoluciones."], ["Aprendizaje", "Prueba limitada y decisión."]), paragraphs: ["CRUZA es un marco educativo original; no sustituye investigación local ni asesoría especializada."] },
    { title: "Probar la preparación, no solo la demanda", exercise: exercise("Mercado piloto", "Formula evidencia mínima para cliente, reglas, cultura, operación y aprendizaje.", "Incluye una condición explícita para no lanzar.") },
  ]),

  lesson(16, "carrera-y-habilidades", "Cómo desarrollar una carrera en marketing digital", "Construye evidencia de habilidades transferibles y elige una familia de práctica.", ["Comparar familias de capacidades", "Diseñar un proyecto de portafolio", "Crear una secuencia de aprendizaje"], [
    { title: "Los cargos cambian; las capacidades viajan", bullets: ["Estrategia y planificación", "Investigación de clientes y mercado", "Contenido y marca", "Búsqueda y descubrimiento", "Social y comunidad", "Email y ciclo de vida", "Adquisición pagada", "Analítica y experimentación", "Ecommerce y conversión", "Tecnología y operaciones", "Marketing asistido por IA", "Liderazgo y coordinación"] },
    { title: "Habilidades transferibles", bullets: ["Escritura e investigación", "Análisis y experimentación", "Gestión de proyectos", "Comunicación y criterio comercial", "Empatía con clientes", "Interpretación de datos", "Aprendizaje de herramientas", "Juicio ético y colaboración"], paragraphs: ["Los nombres y límites de los roles varían por organización. Evalúa el trabajo real, las decisiones y la evidencia requerida."] },
    { title: "Portafolio como evidencia", exercise: exercise("Proyecto de cuatro semanas", "Elige una organización ficticia y produce investigación, una decisión, un artefacto y una retrospectiva.", "No prometas empleo; muestra razonamiento, límites y aprendizaje.") },
  ]),

  lesson(17, "caso-integrador", "Caso práctico: construir una estrategia de marketing digital completa", "Integra investigación, canales, contenido, medición y decisiones para una empresa ficticia de formación.", ["Producir un brief ejecutivo", "Comparar estrategias válidas", "Definir qué no hacer todavía"], [
    { title: "Caso ficticio creado con fines educativos", paragraphs: ["Impulso Directivo es una pequeña empresa ficticia de formación que prepara un programa en línea para personas que lideran por primera vez. Las ventas provienen sobre todo de referencias; el sitio describe a la empresa, pero no explica bien el programa.", "Publica de forma irregular en dos redes, mantiene una lista pequeña obtenida con permiso, nunca ha comprado publicidad y tiene analítica sin conversiones configuradas. El equipo no puede producir contenido diario y dispone de un presupuesto limitado para un trimestre."], bullets: ["Entrevistas ficticias señalan dificultad con conversaciones y priorización.", "La experiencia de facilitación es sólida, pero la prueba pública es limitada.", "La compra puede involucrar a participante y empleador.", "La dirección quiere IA para acelerar contenido y luego explorar otro mercado hispanohablante."] },
    { title: "Evidencia y tensiones", paragraphs: ["Datos ficticios: 1.800 visitas trimestrales, 42 consultas sin fuente uniforme y 18 matrículas, de las cuales 12 llegaron por referencias. La calidad del etiquetado es insuficiente para atribuir ventas. Tres alternativas competidoras enfatizan precio, comunidad o certificación; ninguna prueba cuál argumento explica la compra."], bullets: ["Comercial quiere lanzar anuncios inmediatamente.", "Operaciones teme no poder responder más consultas.", "Facilitación prioriza contenido profundo.", "Finanzas exige un límite de gasto y una condición de parada."] },
    { title: "Ruta de resolución", ordered: ["Definir objetivo y línea base", "Aplicar CONECTA y META", "Crear fichas de audiencia y recorrido", "Aclarar posicionamiento", "Auditar presencia y elegir canales con CANAL", "Diseñar contenido y uso de IA con BRIEF", "Mejorar conversión y búsqueda", "Definir social, email y posible prueba pagada", "Crear medición y un experimento", "Evaluar expansión futura con CRUZA"], exercise: exercise("Recomendación ejecutiva", "Propón una estrategia de doce semanas con tres prioridades, dos renuncias, métricas y riesgos.", "Distingue datos, supuestos y decisiones reversibles.") },
    { title: "Una estrategia modelo, no la única", paragraphs: ["Una respuesta defendible prioriza explicar la oferta y configurar conversiones; usa entrevistas adicionales y correo con permiso; produce una pieza central reutilizable; posterga contenido diario y una expansión completa. Una prueba pagada pequeña solo tendría sentido después de corregir el destino y definir seguimiento.", "También sería válido posponer medios pagados y concentrarse en referencias estructuradas y búsqueda, si la capacidad de atención es la restricción dominante."], modelAnswers: [{ title: "Guía de facilitación", text: "Pide primero hechos y desconocidos. Acepta estrategias alternativas si conectan evidencia, capacidad y decisión. Cuestiona causalidad, atribución, uso de datos, afirmaciones y todo plan que ignore la capacidad de atención." }, { title: "Plan ejecutivo", text: "Objetivo META: aumentar consultas calificadas del programa durante doce semanas respecto de una línea base reconstruida, sin superar la capacidad semanal de respuesta. Prioridades: página clara, medición y secuencia de correo; después, prueba limitada de búsqueda o alianzas. Salvaguardas: revisión humana de IA, permiso, accesibilidad y condición de parada." }, { title: "Plan de medición", text: "KPI: consultas calificadas con definición acordada. Apoyos: finalización de página, fuente declarada, asistencia a sesión informativa y matrícula. Registrar calidad y capacidad; no atribuir causalidad a un solo contacto." }, { title: "Calendario", text: "Semana 1: guía sobre conversaciones difíciles; semana 2: caso breve; semana 3: sesión y correo; semana 4: preguntas frecuentes. Reutilizar investigación, revisar afirmaciones y medir acciones posteriores." }] },
  ], ["strategy", "measurement"]),
];

export const marketingPath = {
  title: "Marketing digital", slug: "marketing-digital", href: marketingBase,
  description: "Aprende a entender a tus clientes, elegir canales, crear contenido y medir resultados con una estrategia conectada al negocio.",
  definition: "El marketing digital es la planificación y coordinación de experiencias, contenidos y acciones en canales digitales para atraer, convertir y mantener relaciones con audiencias relevantes, midiendo su contribución a objetivos concretos.",
  audience: "Emprendedores, profesionales independientes, equipos pequeños y personas que comienzan en marketing",
  format: "Ruta práctica", level: "Introductorio a intermedio", readingTime: "17 módulos",
  updatedAt: marketingLastReviewed, status: "published",
  outcomes: ["Conectar marketing y negocio", "Investigar audiencias con evidencia", "Elegir canales y contenido sostenibles", "Medir para decidir", "Crear un plan integrado"],
};

export const marketingToolLinks = {
  diagnostic: { title: "Diagnóstico de marketing digital", href: "/herramientas/diagnostico-marketing-digital" },
  strategy: { title: "Crear estrategia de marketing", href: "/herramientas/crear-estrategia-marketing-digital" },
  journey: { title: "Mapa del recorrido del cliente", href: "/herramientas/mapa-recorrido-cliente" },
  audit: { title: "Auditoría de presencia digital", href: "/herramientas/auditoria-presencia-digital" },
  channels: { title: "Selector de canales", href: "/herramientas/seleccionar-canales-marketing" },
  content: { title: "Plan de contenidos", href: "/herramientas/plan-contenidos-marketing" },
  measurement: { title: "Plan de medición", href: "/herramientas/plan-medicion-marketing" },
  metrics: { title: "Calculadora de métricas", href: "/herramientas/calculadora-metricas-marketing" },
};

const scenarioRows = [
  ["Objetivo de negocio", "Cooperativa Nexo quiere estabilizar renovaciones", "Distingue retención de adquisición"],
  ["Objetivo de marketing", "Taller Brújula recibe visitas pero pocas consultas", "Formula una META vinculada a consultas calificadas"],
  ["Línea base", "Estudio Ladera no registra el origen de contactos", "Diseña una línea base antes de comparar"],
  ["Posicionamiento", "Aula Prisma se describe como solución integral", "Reescribe la promesa con audiencia, situación y evidencia"],
  ["Propuesta de valor", "Archivo Norte enumera funciones sin resultado", "Conecta capacidades con una necesidad"],
  ["Competencia", "Laboratorio Umbral quiere copiar el mensaje líder", "Investiga alternativas sin imitar"],
  ["Evidencia de audiencia", "Colectivo Marea tiene tres entrevistas", "Separa hallazgos, hipótesis y desconocidos"],
  ["Segmentación", "Nodo Claro divide solo por edad", "Propón segmentos por necesidad o etapa"],
  ["Recorrido", "Consultora Albor pierde personas entre propuesta y firma", "Mapea preguntas y fricciones"],
  ["Canales", "Casa Trama quiere abrir cinco redes", "Aplica CANAL y posterga canales"],
  ["Auditoría", "Proyecto Álamo tiene información contradictoria", "Prioriza correcciones por tarea"],
  ["Rol de contenido", "Escuela Vértice publica noticias internas", "Asigna un trabajo al contenido"],
  ["Calendario", "Equipo Senda solo dispone de seis horas al mes", "Diseña una cadencia viable"],
  ["Marca", "Fundación Cauce cambia de tono por canal", "Define principios y excepciones"],
  ["Contenido con IA", "Agencia Faro quiere generar cincuenta artículos", "Define usos, controles y límites"],
  ["Afirmación ética", "Marca Horizonte promete resultados inevitables", "Reformula y exige evidencia"],
  ["Derechos de autor", "Boletín Delta quiere reutilizar una ilustración", "Identifica permiso, atribución y alternativa"],
  ["Conversión web", "Clínica ficticia Lumen recibe tráfico no calificado", "Separa claridad, tráfico y fricción"],
  ["Intención de búsqueda", "Biblioteca Orilla mezcla aprender y comprar", "Elige una intención primaria"],
  ["SEO", "Editorial Puente repite una frase en cada párrafo", "Prioriza utilidad y estructura"],
  ["Interacción social", "Comunidad Lazo recibe una queja pública", "Define respuesta y escalación"],
  ["Divulgación", "Creadora ficticia recomienda una beca patrocinada", "Diseña divulgación clara"],
  ["Permiso de email", "Academia Ruta posee contactos de un evento", "Decide si puede reutilizarlos"],
  ["Métrica de email", "Boletín Círculo celebra muchas aperturas", "Busca clic, acción y límites"],
  ["Campaña pagada", "Estudio Pórtico no configuró conversiones", "Define medición antes del gasto"],
  ["Atribución", "Tienda ficticia Mimbre atribuye todo al último clic", "Expón límites y fuentes"],
  ["Insight", "Centro Alba ve una caída semanal", "Distingue observación de explicación"],
  ["Experimento", "Programa Estela cambia precio y mensaje a la vez", "Aísla variable o limita inferencia"],
  ["Fricción ecommerce", "Tienda Río informa envío al final", "Prioriza transparencia temprana"],
  ["Marketing local", "Taller ficticio Cerro tiene horarios distintos", "Corrige precisión y mide llamadas"],
  ["Expansión", "Plataforma Vía recibe visitas de otro país", "Aplica CRUZA antes de lanzar"],
  ["Carrera", "Analista ficticia Vega quiere pasar a contenido", "Diseña un proyecto de evidencia"],
];

export const marketingScenarios = scenarioRows.map(([category, title, task], index) => ({
  slug: `escenario-${index + 1}`, title, category, difficulty: index % 3 === 0 ? "introductorio" : index % 3 === 1 ? "intermedio" : "avanzado",
  businessContext: `Organización ficticia que debe tomar una decisión sobre ${category.toLowerCase()}.`,
  objective: "Mejorar una decisión de marketing sin prometer resultados.", audience: "Audiencia hipotética definida para la práctica",
  evidence: ["Una señal cualitativa ficticia", "Un registro incompleto", "Una restricción operativa"],
  constraint: "Recursos limitados y evidencia parcial", learnerTask: task,
  modelReasoning: "Separar hechos, supuestos y vacíos; elegir una acción reversible; definir evidencia y una próxima decisión.",
  nextAction: "Documentar la línea base y revisar el resultado en un periodo definido.", skills: [category, "criterio", "medición"], fictional: true,
}));

const resourceRows = [
  ["conecta", "Canvas CONECTA", ["Contexto", "Objetivo", "Necesidad", "Experiencia", "Canales", "Tácticas y contenido", "Aprendizaje"]],
  ["meta", "Hoja de objetivo META", ["Magnitud", "Evidencia y línea base", "Tensión", "Aporte al negocio"]],
  ["posicionamiento", "Hoja de posicionamiento", ["Audiencia", "Situación", "Problema", "Alternativas", "Valor distintivo", "Evidencia"]],
  ["competidores", "Plantilla de alternativas competitivas", ["Alternativa", "Oferta", "Experiencia", "Prueba", "Vacío", "Fuente"]],
  ["audiencia", "Ficha de audiencia basada en evidencia", ["Situación", "Objetivo", "Problema", "Detonante", "Barrera", "Criterios", "Fuente", "Confianza", "Desconocidos"]],
  ["recorrido", "Mapa del recorrido del cliente", ["Etapa", "Pregunta", "Punto de contacto", "Fricción", "Contenido", "Métrica", "Responsable"]],
  ["auditoria", "Auditoría de presencia digital", ["Tarea", "Observación", "Impacto", "Evidencia", "Prioridad", "Próxima acción"]],
  ["canal", "Tarjeta CANAL", ["Cliente", "Acción", "Necesidad de recursos", "Aprendizaje medible", "Límite"]],
  ["contenido", "Canvas de estrategia de contenidos", ["Audiencia", "Pregunta", "Rol", "Canal", "CTA", "Distribución", "Métrica"]],
  ["calendario", "Calendario de contenidos", ["Fecha", "Audiencia", "Tema", "Formato", "Canal", "Responsable", "CTA", "Revisión", "Métrica"]],
  ["voz", "Checklist de voz de marca", ["Voz", "Tono", "Vocabulario", "Afirmaciones", "Evidencia", "Accesibilidad", "Aprobación"]],
  ["brief", "Plantilla BRIEF para IA", ["Base", "Resultado", "Intención", "Estándares", "Formato", "Verificación humana"]],
  ["ia-responsable", "Checklist de contenido asistido por IA", ["Datos permitidos", "Hechos verificados", "Derechos", "Sesgos", "Divulgación", "Accesibilidad", "Aprobación"]],
  ["conversion", "Checklist de conversión web", ["Relevancia", "Claridad", "Confianza", "Fricción", "Móvil", "Accesibilidad", "Medición"]],
  ["seo-brief", "Brief de página SEO", ["Tema", "Audiencia", "Intención", "Pregunta", "Evidencia", "Propósito", "CTA", "Enlaces", "Revisión"]],
  ["intencion", "Hoja de intención de búsqueda", ["Consulta", "Intención", "Pregunta", "Respuesta", "Siguiente paso"]],
  ["social", "Plan de redes sociales", ["Objetivo", "Rol", "Pilares", "Capacidad", "Interacción", "Moderación", "Métricas"]],
  ["comunidad", "Guía de respuesta comunitaria", ["Tipo de mensaje", "Respuesta", "Tiempo", "Escalación", "Registro"]],
  ["creadores", "Checklist de colaboración con creadores", ["Relevancia", "Divulgación", "Derechos", "Compensación", "Seguridad", "Medición"]],
  ["email", "Brief de campaña de email", ["Permiso", "Objetivo", "Segmento", "Mensaje", "CTA", "Frecuencia", "Baja", "Métrica"]],
  ["email-metricas", "Guía de métricas de email", ["Métrica", "Numerador", "Denominador", "Periodo", "Limitación", "Decisión"]],
  ["paid", "Brief de medios pagados", ["Objetivo", "Audiencia", "Creatividad", "Destino", "Presupuesto", "Conversión", "Condición de parada"]],
  ["formulas", "Hoja de fórmulas de marketing", ["Fórmula", "Numerador", "Denominador", "Unidad", "Periodo", "Interpretación", "Límite"]],
  ["medicion", "Plan de medición", ["Objetivo", "Línea base", "KPI", "Fuente", "Dueño", "Frecuencia", "Umbral", "Limitación"]],
  ["experimento", "Brief de experimento", ["Hipótesis", "Variable", "Comparación", "Muestra", "Duración", "Métrica", "Salvaguarda", "Decisión"]],
  ["ecommerce", "Mapa de fricciones ecommerce", ["Etapa", "Fricción", "Evidencia", "Impacto", "Hipótesis", "Prueba"]],
  ["local", "Checklist de marketing local", ["Información", "Mapa", "Página", "Reseñas", "Contacto", "Accesibilidad", "Medición"]],
  ["cruza", "Canvas CRUZA", ["Cliente", "Reglas", "Uso y cultura", "Zona operativa", "Aprendizaje"]],
  ["carrera", "Mapa de capacidades de carrera", ["Familia", "Habilidad", "Evidencia actual", "Brecha", "Proyecto de práctica"]],
  ["plan", "Plan integrado de marketing digital", ["Objetivo", "Audiencia", "Posicionamiento", "Recorrido", "Canales", "Contenido", "Medición", "Riesgos"]],
  ["ejecutivo", "Resumen ejecutivo de marketing", ["Decisión", "Evidencia", "Prioridades", "Renuncias", "Métricas", "Riesgos", "Próxima revisión"]],
];

export const marketingResources = resourceRows.map(([id, title, fields]) => ({
  id: `marketing-${id}`, title, fields, contentType: "worksheet", status: "published",
  description: "Recurso original y editable para estructurar una decisión sin almacenar información.",
  reminder: "Trabaja con datos ficticios o no sensibles. Copia el resultado antes de cerrar la página.",
}));

export const getMarketingLesson = (slug) => marketingLessons.find((item) => item.slug === slug);
export const getMarketingResource = (id) => marketingResources.find((item) => item.id === id || item.id === `marketing-${id}`);
