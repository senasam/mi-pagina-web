# Guía de contenido

## Mantener Marketing digital

- Añadir una lección en `marketingContent.js` con slug único, descripción, resultados, tres o más secciones sustantivas, ejercicio, relaciones y `lastReviewed`; registrar la ruta en sitemap y pruebas.
- Crear casos siempre ficticios con contexto, objetivo, audiencia hipotética, evidencia, restricción, tarea, razonamiento, siguiente acción, dificultad y habilidades. No presentar una persona o segmento inferido como hecho.
- Añadir etapas de recorrido con pregunta, resultado deseado, punto de contacto, fricción, contenido, métrica y responsable; conservar una alternativa textual y no imponer una secuencia universal.
- Añadir canales por categoría y función. Registrar audiencia, etapa, recursos, medición, control, dependencia, privacidad y condición para postergar.
- Crear ejercicios de contenido, SEO, social, email, medios pagados, analítica, ecommerce, local o internacional desde decisiones; evitar tutoriales de interfaz y funciones de plataforma no verificadas.
- Incorporar fórmulas en `marketingMetricDefinitions` con nombre, fórmula, numerador, denominador, unidad, periodo esperado, interpretación, límite y ejemplo ficticio. Manejar cero y no equiparar ingreso atribuido con incrementalidad o beneficio.
- Actualizar hechos de plataforma solo desde documentación oficial. Para privacidad, publicidad, derechos y consumo, registrar jurisdicción, vigencia y fuente primaria; nunca convertir orientación en aprobación legal.
- Mantener `lastReviewed` en páginas sensibles y revisar búsqueda, accesibilidad, divulgación, consentimiento, retargeting e IA antes de actualizar la fecha.
- Proteger entradas: no pedir contactos, listas, credenciales, campañas confidenciales ni datos personales; no añadir red, persistencia o texto libre a analítica.
- Mantener enlaces internos con Estrategia, Resolución de problemas, Comunicación, Datos/IA, Consultoría y servicios reales.
- Antes de publicar, auditar similitud frente a **owner-provided research notes on digital marketing fundamentals** y retirar coincidencias de estructura, definición, perfil, caso, cifra, evaluación, secuencia o conclusión.

La arquitectura editorial general vive en `src/contentData.js`. El contenido final de Networking está en `src/networkingContent.js`; su presentación está separada en `LearningComponents.jsx` y `LearningPages.jsx`. El generador mantiene su lógica en `messageGenerator.js`.

## Estados y campos

### Mantener Inteligencia artificial y deep learning

- Añadir módulos, escenarios, glosario y recursos en `deepLearningContent.js`; registrar rutas, metadata, sitemap y pruebas.
- Mantener ejemplos ficticios y de bajo impacto. Enlazar RAG técnico, gobernanza y negocio a sus rutas canónicas en vez de duplicarlas.
- Conservar los cálculos puros en `deepLearningTools.js`: máximo 3 entradas, 4 unidades ocultas y una salida; validar dimensiones y números finitos.
- Curvas: 5–200 épocas, semilla reproducible, ruido acotado y reglas de interpretación visibles. Nunca diagnosticar un modelo real.
- Planificador: solo selecciones cerradas, sin texto libre, puntuación o aprobación; debe incluir reglas y no automatizar como resultados posibles.
- No publicar productos, cifras, benchmarks, precios, licencias o arquitecturas propietarias sin verificación primaria y `lastReviewed`.
- No transmitir valores, selecciones o resultados; sin modelo externo, persistencia o estado en URL. Auditar frente a `owner-provided research material`.

### Mantener Pensamiento computacional y decisiones con datos

- Añadir módulos en `computationalContent.js`; conservar ejemplos sintéticos de bajo impacto y registrar ruta, metadata, sitemap y pruebas.
- Mantener cálculo puro en `computationalTools.js`. Probar fórmulas, límites, redondeo y desempates antes de modificar la UI.
- Optimización: 3–12 elementos, capacidad entera 1–500, valores positivos; no afirmar garantías para la heurística.
- Monte Carlo: 100–100.000 ensayos, semilla entera y supuestos explícitos; más ensayos no corrigen un modelo incorrecto.
- Intervalos: 2–1.000 valores, desviación muestral con `n-1`, intervalo t y advertencias; nunca inferir representatividad o causalidad.
- No ingresar ni transmitir datos personales, financieros u operativos. Auditar originalidad frente a `owner-provided research material`.

### Mantener Escalamiento y adopción de IA

- Añadir módulos en `adoptionAIContent.js` con etapa, evidencia, decisión, `timeSensitive` y `lastReviewed`; registrar rutas, metadata, sitemap y pruebas.
- Crear iniciativas completamente ficticias con resultado, etapa, evidencia, adopción, riesgo, esfuerzo operativo y próxima decisión.
- Mantener AMPLÍA, ACUERDO, NEXO, RUMBO, PIEZA, PUENTE, ABRE, PRÁCTICA y MANDO como ayudas descriptivas, nunca como puntuación o aprobación.
- Separar acceso, uso, adopción, resultado, calidad, riesgo, esfuerzo y economía. Permitir consolidar, pausar, detener y retirar.
- Añadir componentes compartidos solo cuando exista repetición estable, variación entendida, dueño, soporte, versionado y retiro.
- En creación asistida, declarar nivel, datos, conexiones, catálogo aprobado, revisión, soporte e inventario. Los expertos de dominio no aprueban seguridad o despliegue.
- Para agentes, documentar misión, accesos, herramientas, acciones, autonomía, aprobaciones, reversibilidad, costo, monitoreo y parada.
- No pedir estrategia, nombres, métricas, contratos, arquitectura, permisos o incidentes reales; sin red, persistencia o analítica de contenido.
- Auditar similitud frente a **owner-provided research notes on AI scaling, organizational adoption, and distributed enablement**.

### Mantener IA responsable y gobernanza

- Añadir lecciones en `responsibleAIContent.js` con resultados, secciones, recursos, herramientas, `timeSensitive` y `lastReviewed`; registrar rutas, metadata, sitemap y pruebas.
- Mantener CUIDADO, ALERTA, PARES, ESCUDO, ABARCA, VISIBLE, RESPALDO, HUELLA y TRAMA como marcos descriptivos. Nunca convertirlos en una certificación, puntaje agregado o conclusión legal.
- Describir impactos sobre personas directas, indirectas y excluidas; separar beneficios esperados de evidencia y registrar cargas, daños, poder y usos secundarios.
- En usos sensibles, permitir revisión habitual, reforzada, especializada, rediseño, restricción y no despliegue. No asignar categorías regulatorias universales.
- En equidad, declarar población, decisión, tipos de error y costos contextuales. Ninguna métrica o umbral aislado demuestra ausencia de discriminación.
- Exigir supervisión con evidencia, tiempo, competencia y autoridad real; incluir aviso, impugnación accesible, corrección, reparación y aprendizaje.
- Mantener inventario, cambios de proveedor, monitoreo, incidentes, suspensión y retiro durante el ciclo de vida.
- Actualizar hechos actuales solo con fuentes primarias; registrar fecha y alcance. Evitar nombres, precios, legislación específica o afirmaciones comerciales si no son imprescindibles.
- Proteger entradas: usar datos ficticios, sin nombres, casos reales, información sensible, incidentes o contratos; sin red, persistencia o analítica de contenido.
- Auditar similitud frente a **owner-provided research notes on responsible AI and governance**.

### Mantener Preparación organizacional para la IA

- Añadir lecciones en `orgAIContent.js` con resultados, secciones, recursos, herramientas, `timeSensitive` y `lastReviewed`; registrar ruta, metadata, sitemap y pruebas.
- Crear organizaciones completamente ficticias con capacidad actual, brecha, paso seguro, iniciativa a retrasar y evidencia. No usar clientes o empleadores reales.
- Mantener PREPARA descriptivo y contextual; nunca sumar dimensiones en un puntaje global o certificar madurez.
- En NORTE, exigir problema, usuarios, línea base, resultado, alternativa sin IA, tensión, evidencia y dueño.
- En IMPULSO, usar niveles cualitativos y documentar impacto, medición, preparación, urgencia, límites, sinergia y operabilidad; permitir pausar y detener.
- Añadir fundamentos solo cuando varias iniciativas justifiquen identidad, datos, evaluación, monitoreo o incidentes compartidos. Evitar plataformas anticipadas.
- Diseñar pilotos según frecuencia, riesgo y ciclo de evidencia; nunca imponer una duración universal. Vincular cada señal con decisión y dueño.
- En capacidades, declarar quién propone, aprueba, entrega, opera, monitorea y tiene autoridad para detener. Crear aprendizaje específico por rol.
- Actualizar hechos actuales solo con fuentes primarias; registrar categoría y fecha, revisar privacidad y regulación, y actualizar `lastReviewed`.
- Proteger inputs: no pedir organizaciones, estrategia, arquitectura, proveedores, costos, preocupaciones o incidentes reales; sin red, persistencia o analítica de contenido.
- Auditar similitud frente a **owner-provided research notes on organizational AI readiness, portfolio governance, shared foundations, and adoption capabilities**.

### Mantener Sistemas de IA confiables

- Añadir lecciones en `reliableAIContent.js` con orden, resultados, secciones, recursos, herramientas, `timeSensitive` y `lastReviewed`; registrar ruta, metadata, sitemap y pruebas.
- Crear prompts empresariales con NORMA, ejemplos sintéticos, versión, dueño, fuentes, negativa, escalación y casos de prueba. No almacenar prompts reales.
- Para grounding, declarar fuente, autoridad, dueño, fecha, permiso, conflicto y comportamiento sin evidencia. No reducir grounding a RAG.
- En casos RAG, separar ingestión, identidad, permisos, recuperación, contexto, generación, citas, evaluación y feedback. No afirmar que recuperar entrena el modelo.
- Añadir ejercicios PREPARA con propósito, linaje, calidad, permisos, representación, retención y borrado; nunca emitir una puntuación universal.
- En seguridad, mantener orientación defensiva: mínimo privilegio, separación de instrucciones y datos, validación, registro, interrupción e incidentes. No incluir pasos de explotación.
- Comparar generación, búsqueda, reglas, métodos predictivos e híbridos con ELIGE. Añadir ciclo de vida, señal de cambio, diagnóstico, dueño, respuesta y retiro.
- Actualizar afirmaciones técnicas solo tras revisar fuentes primarias actuales; registrar categoría, fecha y alcance en documentación y actualizar `lastReviewed`.
- Proteger entradas: sin credenciales, documentos, nombres, incidentes, permisos reales o datos sensibles; sin red, persistencia o analítica de texto libre.
- Auditar similitud frente a **owner-provided research notes on reliable AI systems, grounding, retrieval, data readiness, security, and model operations** y reemplazar coincidencias de estructura, ejemplo, tabla, diagrama, checklist o evaluación.

### Mantener IA generativa para negocios

- Contenido: `src/aiBusinessContent.js`; páginas: `src/AIBusinessPages.jsx`; lógica: `src/aiBusinessTools.js`; formularios: `src/AIBusinessToolsPage.jsx`.
- Añadir lecciones con slug, orden, resultados, secciones, recursos y herramientas; actualizar rutas, metadata, sitemap y pruebas.
- Crear casos ficticios con problema, línea base, uso, valor como hipótesis, riesgo, rol humano, métrica y condición de parada.
- Mantener VALORA, AUTORIZA y GUARDA consistentes y presentarlos como ayudas, nunca como estándares o certificaciones.
- Registrar costos como supuestos con moneda, periodo y fuente; actualizar fórmula y prueba juntas. No convertir toda capacidad liberada en ahorro.
- En agentes, documentar datos, herramientas, acción, permiso, aprobación, registro, interrupción, reversión y dueño humano.
- Preferir categorías neutrales. Si se añade un producto, verificar nombre, alcance, disponibilidad, precio o licencia, datos y privacidad en fuentes primarias; registrar fuente y `lastReviewed`.
- Mantener inputs efímeros y analítica con slugs cerrados. Nunca enviar problemas, nombres, cifras, riesgos o planes.
- Auditar similitud frente a **owner-provided research notes on generative AI strategy and adoption** y reemplazar coincidencias de secuencia, tabla, evaluación, roadmap, ejemplo o conclusión.

Cada pieza puede usar `title`, `slug`, `description`, `contentType`, `topic`, `level`, `readingTime`, `updatedAt`, `featured`, `order`, `status`, `relatedResources`, `relatedTools` y `relatedServices`.

- `published`: pieza realmente disponible y revisada.
- `content-pending`: estructura cuyo cuerpo todavía no permite publicación sustantiva.
- `planned`: área futura sin ruta activa.

Tipos disponibles: `guide`, `lesson`, `framework`, `template`, `checklist`, `case`, `exercise`, `tool`, `glossary-entry` y `learning-path`.

## Añadir contenido general

- Tema: agregarlo al grupo correspondiente en `topicGroups`. Asignar `href` y `published` solo cuando exista una página útil.
- Ruta de aprendizaje: crear un registro equivalente a `networkingPath` y una lista ordenada de módulos.
- Lección: agregar título, slug, descripción, metadatos, relaciones y estado. Registrar su página en la tabla de rutas de `App.jsx`.
- Herramienta: crear su lógica separada de la UI, registrarla en `tools` y añadir pruebas.
- SEO: llamar `usePageMetadata` con título, descripción, canonical y schema veraz. Una página incompleta no debe presentarse como recurso terminado.

## Editar una lección de Networking

1. Buscar el slug de la lección en `networkingLessonContent`.
2. Editar `description`, `outcomes`, `readingTime`, `relatedResources` o `sections`.
3. Dentro de una sección se pueden usar párrafos, listas, pasos numerados, callouts, ejercicios, ejemplos, timeline, grupos de preguntas, checklist y enlaces.
4. Mantener una jerarquía clara: el título de página es H1 y cada sección de datos se representa como H2.
5. Si cambia el alcance, actualizar también la descripción del módulo en `contentData.js` y revisar el tiempo total del hub.

## Mantener la lección de barreras

La lección `/aprende/networking/barreras` corresponde a la entrada `barreras` de `networkingLessonContent`.

- Autodiagnóstico dentro de la lección: editar el arreglo `diagnostic`. Cada registro debe contener una barrera y una primera acción realizable.
- Autodiagnóstico interactivo: editar el recurso `barrier-self-assessment`. Cada opción necesita `label` y `action`.
- Plan de siete días: mantener sincronizados el `timeline` de la lección y el recurso `seven-day-plan`.
- Casos originales: añadir `caseStudy` con título y párrafos. Usar personajes ficticios, cambiar contexto, decisión y secuencia, y evitar resultados garantizados.
- Marco de habilidades: el arreglo `framework` representa preparar, contactar, conversar y cuidar la relación.
- Enlaces: los recursos usan `/aprende/networking#resource-[id]`. Verificar que cada `id` exista en `networkingResourceContent`.

Al modificar el diagnóstico, comprobar teclado, etiquetas, anuncio del resultado y comportamiento sin almacenamiento.

## Añadir o editar un recurso

Los recursos están en `networkingResourceContent` y usan un `id` estable.

- Plantilla: añadir `template`, `description` y `reminder`. El componente habilita copia con feedback accesible.
- Checklist: añadir `groups`, cada uno con título e ítems. El estado vive solo durante la sesión de página.
- Hoja de trabajo: añadir `fields`. La información es efímera y puede copiarse como resumen; no se guarda ni se transmite.
- Relacionar un recurso: añadir su `id` a `relatedResources` en la lección correspondiente.

No crear enlaces de descarga sin un archivo real ni afirmar que la información se conserva cuando no existe persistencia.

## Actualizar el generador de mensajes

- Reglas y validación: `src/messageGenerator.js`.
- Formulario y feedback: `src/MessageGeneratorPage.jsx`.
- Mantener las variaciones locales, la adaptación por canal/tono y la duración seleccionada.
- No incluir solicitudes directas de empleo, elogios inventados, supuestos de género ni datos personales en analytics.
- Actualizar las pruebas al cambiar frases, campos o canales.

## Tiempo de lectura y relaciones

Estimar el tiempo sobre el texto público final, incluyendo listas y ejercicios, y redondear a minutos completos. Tras editar una lección, revisar `readingTime` del módulo y el total aproximado de `networkingPath`.

Los enlaces relacionados deben resolver identificadores existentes y tener un texto descriptivo. Evitar enlazar repetidamente al mismo destino dentro de una sección.

## Revisión de integridad factual

Antes de publicar:

- separar observaciones prácticas de afirmaciones verificables;
- eliminar porcentajes o causalidades sin una fuente confiable;
- evitar garantías sobre empleo, admisión, referencias o respuestas;
- no generalizar conductas según cargo o seniority;
- no diagnosticar emociones o condiciones psicológicas;
- registrar una referencia solo cuando respalde una afirmación concreta;
- volver a ejecutar pruebas, build, revisión móvil y comprobaciones de exclusión.

## Revisión de originalidad y riesgo editorial

- Reorganizar conceptos alrededor de un objetivo pedagógico propio, no alrededor del orden de notas de investigación.
- Reescribir desde las ideas y no mediante sustitución de palabras.
- Crear casos con personas, sectores, decisiones y secuencias nuevas.
- Evitar conservar preguntas retóricas, metáforas, cierres o estructuras distintivas de materiales externos.
- Revisar que títulos, metadata, ejemplos y conclusión sean independientes.
- No guardar notas de investigación completas dentro del repositorio de producción.
- Describir afirmaciones generales con cautela y eliminar cualquier cifra sin respaldo verificable.

## Editar la ruta de Consultoría

- Lecciones, módulos, ruta y recursos: `src/consultingContent.js`.
- Hub y layout de lección: `src/ConsultingPages.jsx`.
- Constructor: reglas en `src/impactBulletGenerator.js` e interfaz en `src/ImpactBulletBuilderPage.jsx`.
- Mantener los ocho slugs estables; si cambia una ruta, actualizar `App.jsx`, sitemap, breadcrumbs, enlaces internos y pruebas.
- Cada `relatedResources` debe resolver un identificador publicado. Los recursos con campos son efímeros y deben conservar el recordatorio de copia y privacidad.
- Presentar prácticas de selección como posibilidades, no reglas universales. Pedir verificación oficial para fechas, elegibilidad, formatos, viajes y políticas de nueva postulación.
- En casos numéricos, declarar qué cifras son supuestos del ejercicio. No convertirlas en estimaciones reales de mercado.
- En CV e historias, diferenciar la acción individual del resultado del equipo. No inventar métricas ni convertir participación en liderazgo.
- Mantener vínculos con la ruta general de Networking y su generador cuando ayuden a ampliar una habilidad, sin duplicar su contenido.

## Mantener el constructor de bullets

- Contexto, acción y resultado son obligatorios; método, métrica, habilidad y objetivo son opcionales.
- Una métrica solo puede aparecer si está presente en la entrada. Las variantes cambian redacción, no hechos.
- El texto del formulario nunca debe enviarse a analytics, almacenamiento o servicios externos.
- Al modificar plantillas, probar salida con y sin métrica, validación, regeneración, copia y limpieza.

## Mantener Entrevistas de caso

- Ruta, capítulos, casos y recursos: `src/caseInterviewContent.js`.
- Hub y lecciones: `src/CaseInterviewPages.jsx`.
- Lógica de herramientas: `src/caseTools.js`; formularios: `src/CaseToolsPage.jsx`.
- Añadir un capítulo con el helper `lesson`: orden, slug, título, descripción única, tiempo, objetivos, secciones y recursos existentes. Actualizar sitemap y pruebas.
- Añadir un caso con `practiceCase`: organización inventada, objetivo, prompt, hechos, estructura posible, exhibit, cálculo, brainstorming, recomendación, insights y habilidades. Mantener `fictional: true` y la etiqueta pública obligatoria.
- Añadir un exhibit con título, columnas, filas y un resumen textual que comunique el insight sin depender de la tabla.
- Añadir un cálculo con prompt, respuesta y explicación auditable. Mostrar fórmula, unidades, redondeo e implicación; no usar falsa precisión.
- Añadir una fórmula en `formulas` con etiqueta y expresión. Documentar definición y limitación cuando ROI, payback, margen o incrementalidad puedan variar.
- Añadir un drill de brainstorming con pregunta, categorías posibles y criterio de prioridad; evitar listas planas tratadas como solución.
- Añadir una pregunta conductual dentro de `behavioralQuestions` y asignarla a una competencia. No incorporar respuestas autobiográficas ni historias reales identificables.
- Añadir prompts de herramientas en `caseTools.js`; deben ser originales, deterministas y no depender de APIs externas.
- Actualizar la rúbrica con dimensiones observables y niveles cualitativos. Nunca producir probabilidad de contratación.
- Actualizar metadata mediante el registro del capítulo; comprobar título único, descripción, canonical, schema y sitemap.
- Revisar afirmaciones variables con lenguaje condicional. Los formatos de selección deben confirmarse en fuentes oficiales vigentes.
- Auditar originalidad cambiando organización, industria, geografía, cifras, secuencia y decisión; no usar casos propietarios o recuerdos de entrevistas reales.
- No almacenar guiones privados, fechas de entrevistas, notas personales, nombres de empleadores o información confidencial.

## Mantener Adaptabilidad y resiliencia

- Contenido y recursos: `src/adaptabilityContent.js`; páginas: `src/AdaptabilityPages.jsx`; lógica de herramientas: `src/adaptabilityTools.js`; formularios: `src/AdaptabilityToolsPage.jsx`.
- Añadir una lección con `makeLesson`: orden, slug, título, descripción, tiempo, objetivos, secciones, recursos y herramientas. Actualizar sitemap y pruebas.
- Añadir un escenario con persona y organización ficticias, situación, pregunta, acción posible y restricción. Evitar respuestas simples o la idea de una mentalidad correcta.
- Añadir una reflexión mediante `exercise`, `questionGroups`, `modelAnswers`, `classification` o `scenarios`; conservar una acción observable y reconocer límites.
- Añadir preguntas de reencuadre por contexto. No convertir una interpretación alternativa en hecho ni usarla para minimizar riesgos.
- Mantener OPA como Observar, Pausar y Ajustar. Si cambia, revisar tarjeta, herramienta, lección, plan personal, casos, metadata y pruebas.
- Mantener HECA como Hecho, Explicación, Consecuencia y Ajuste. Diferenciar hechos de atribuciones y evitar diagnósticos.
- Actualizar el planificador de hábitos en `buildHabitPlan`; no afirmar un plazo universal ni tratar interrupciones como fracaso personal.
- Añadir herramientas con lógica pura y testeable, UI accesible, privacidad explícita, reset, copia e impresión. Nunca enviar texto libre.
- Revisar afirmaciones psicológicas, médicas, neurológicas, de sueño o desempeño. Eliminar cifras sin una fuente primaria actual y no ofrecer tratamiento.
- Auditar similitud con **owner-provided research notes on adaptability and learning**: cambiar arquitectura, terminología, personajes, escenarios, preguntas, ejercicios y conclusiones.
- Mantener privacidad: sin nombres reales, empleadores, salud, feedback identificable, diarios persistentes o secretos.
- Actualizar metadata, schema, sitemap y enlaces internos al cambiar slugs o alcance.

## Mantener Resolución de problemas

- Contenido: `src/problemSolvingContent.js`; páginas: `src/ProblemSolvingPages.jsx`; lógica pura: `src/problemSolvingTools.js`; formularios: `src/ProblemSolvingToolsPage.jsx`.
- Añadir una lección con slug, orden, título, descripción, resultados, al menos seis secciones, recursos y herramientas. Registrar ruta, metadata, sitemap y prueba.
- Crear casos ficticios con decisión, contexto, restricciones, actores, hechos, incógnitas, hipótesis rivales, estructura posible, evidencia, priorización, síntesis y recomendación. Etiquetarlos siempre como ficticios.
- Añadir árboles con una pregunta principal y una lógica explícita; ofrecer una alternativa válida y no declarar una estructura automáticamente correcta.
- Diseñar ejercicios de hipótesis con evidencia a favor, en contra y una prueba capaz de cambiar la conclusión. Usar confianza cualitativa.
- Mantener VERA, CLARO, HIA y DECIR sincronizados entre lección, recurso, herramienta y pruebas. Presentarlos como modelos prácticos.
- Añadir frentes del plan con pregunta, hipótesis, análisis, fuente, responsable, dependencia, salida y regla de parada. Etiquetar hechos, supuestos, estimaciones, interpretaciones e incógnitas.
- Incorporar reducción de sesgos mediante conductas observables: explicación rival, evidencia en contra, vista independiente, revisión de fracaso y registro de decisión. No diagnosticar personas.
- Mantener lógica determinista, sin red, persistencia o texto libre en analítica; conservar validación, `aria-live`, teclado, copia, reset e impresión.
- Revisar metadata única, canonical, schema, sitemap e interenlaces con Consultoría, Casos, Adaptabilidad y Networking.
- Auditar similitud contra **owner-provided research notes on structured problem solving** y reemplazar cualquier coincidencia de historia, secuencia, diálogo, pregunta, cifra, organización o plantilla.
- Revisar afirmaciones: evitar garantías, consejo especializado, cifras sin respaldo o reglas universales. En riesgos urgentes, priorizar protocolos aplicables.

## Mantener Comunicación profesional

- Contenido y escenarios: `src/communicationContent.js`; páginas: `src/CommunicationPages.jsx`; lógica: `src/communicationTools.js`; formularios: `src/CommunicationToolsPage.jsx`.
- Añadir una lección con slug, orden, descripción, resultados, secciones, recursos y herramientas; actualizar rutas, metadata, sitemap y pruebas.
- Crear escenarios ficticios con audiencia, propósito, canal, restricciones, evidencia, borrador, tarea, modelo, explicación y habilidades. No usar situaciones reconocibles de clientes o empleadores.
- Diseñar ejercicios de audiencia separando lo conocido, lo supuesto y la verificación. No perfilar emociones o personalidad.
- Crear diálogos breves con lo oído, lo asumido, lo que debe aclararse, una respuesta posible y una siguiente pregunta. Evitar respuestas supuestamente perfectas.
- En síntesis, etiquetar datos, hallazgos, interpretaciones, consecuencias, recomendaciones e incertidumbre. No presentar causalidad sin evidencia.
- En estructura y narrativa, mantener mensaje, razones, evidencia, objeciones y acción; no fabricar emoción ni ocultar información relevante.
- En presentación, revisar afirmaciones sobre postura, gestos, mirada, atención, memoria o persuasión. No imponer un acento, cámara, micrófono o forma corporal.
- En facilitación, incluir propósito, autoridad, participación, preguntas, decisiones y registro. No prometer eliminar poder o conflicto.
- Mantener cada herramienta local, determinista, copiable, imprimible y usable con teclado; nunca enviar texto libre a analítica.
- Actualizar metadata, schema, sitemap e interenlaces con Networking, Consultoría, Casos, Adaptabilidad y Resolución de problemas.
- Auditar similitud contra **owner-provided research notes on professional communication** y reemplazar coincidencias de marco, secuencia, historia, personaje, diálogo, ejercicio, cifra o plantilla.
- Proteger confidencialidad: pedir a usuarios que eviten nombres, empresas, reuniones sensibles, mensajes privados y datos personales.

## Mantener Relaciones y bienestar

- Contenido: `src/wellbeingContent.js`; páginas: `src/WellbeingPages.jsx`; lógica: `src/wellbeingTools.js`; formularios: `src/WellbeingToolsPage.jsx`.
- Añadir lecciones con resultados, seis o más secciones, recursos, herramientas, aviso de alcance y enlaces internos; actualizar rutas, metadata, sitemap y pruebas.
- Crear escenarios ficticios con hechos observables, incógnitas, actores, poder, respuestas alternativas, razonamiento, seguridad y habilidades. No usar casos identificables.
- Diseñar prácticas personales como opciones pequeñas y reiniciables; nunca prometer beneficios médicos, emocionales o de productividad.
- Escribir límites con situación, impacto, necesidad, margen, alternativa, revisión y escalamiento. No recomendar conversación directa ante amenaza, acoso, discriminación, represalia o abuso.
- En conversaciones, separar hecho, interpretación, emoción, necesidad y petición. Incluir poder, privacidad, apoyo y criterio para detener o escalar.
- En relaciones, evitar amistad, intimidad, contacto visual, vulnerabilidad o confidencialidad como obligaciones universales.
- En seguridad psicológica, distinguir apertura de comodidad y responsabilidad. Una señal no diagnostica un equipo; la experiencia puede variar.
- Revisar afirmaciones de salud, sueño, movimiento, neurociencia, fisiología, estrés, agotamiento, productividad y longevidad. Omitir cifras y causalidad no respaldadas.
- Mantener avisos de alcance y escalamiento visibles. No ofrecer terapia, tratamiento, consejo legal o clínico.
- Mantener herramientas deterministas, efímeras, accesibles, sin puntuación o texto libre en analítica. No pedir información médica o identificable.
- Actualizar interenlaces con Comunicación, Adaptabilidad, Networking y Resolución de problemas.
- Auditar similitud contra **owner-provided research notes on relationships, workplace wellbeing, and team dynamics** y reemplazar coincidencias de marco, metáfora, historia, personaje, diálogo, cuestionario, cifra o plantilla.

## Mantener Prospección B2B

- Contenido: src/prospectingContent.js; presentación y formularios: src/ProspectingPages.jsx; lógica determinista: src/prospectingTools.js; pruebas: tests/prospecting.test.js.
- Añadir una lección mediante el constructor lesson: slug único, título, descripción, resultados, cuatro o más secciones, herramientas relacionadas, fecha y estado. Integrar ruta, metadata, sitemap y prueba.
- Añadir un escenario ficticio con cuenta genérica, rol, evidencia disponible, hipótesis, restricción, tarea, razonamiento, siguiente paso, dificultad, habilidades y fictional: true.
- Los perfiles de cuenta describen industria, modelo, tamaño o complejidad, proceso, señal, encaje y exclusiones; nunca incluyen una empresa o persona real.
- Los roles de compra son hipótesis de responsabilidad. Una persona puede ocupar varios.
- Registrar una señal como hecho, fuente, fecha e incertidumbre. PISTA debe convertirla en pregunta; nunca tratarla como prueba automática de necesidad.
- En propuestas de valor, separar capacidad, beneficio, resultado, evidencia, afirmación e incertidumbre. CAMBIO no autoriza causalidad ni cifras sin permiso.
- En ejercicios de correo, teléfono o LinkedIn, usar casos ficticios, identidad clara, razón legítima, salida respetuosa y ninguna instrucción de envío, llamada, scraping o automatización.
- Una secuencia declara objetivo, segmento, señal, función por paso, criterio temporal, valor nuevo y regla de parada. No publicar un número universal de contactos.
- Un seguimiento añade contexto, pregunta, evidencia, recurso o cierre. Un rechazo claro, una exclusión o una preferencia incompatible terminan el contacto.
- Una objeción puede llevar a aclarar, aportar, derivar, pausar o cerrar. ESCUCHA nunca se presenta como técnica para superar toda negativa.
- Una referencia PUERTA debe ser específica, fácil de rechazar, reenviable y limitada al respaldo realmente concedido.
- Cada métrica declara nombre, numerador, denominador, fórmula, periodo, interpretación y limitación. Las tasas con denominador cero se muestran como no calculables.
- Un experimento define línea base, audiencia, cambio principal, métrica de decisión, periodo, riesgo y limitación de muestra. No afirmar significancia sin cálculo adecuado.
- Para IA, aplicar DATOS: información autorizada, acción acotada, tono, objetivo y salvaguardas. Prohibir datos confidenciales o sensibles, hechos inventados, envío automático y uso sin revisión humana.
- Revisar afirmaciones de plataformas, privacidad, consentimiento, exclusión, llamadas, grabación y productos con fuentes primarias. Registrar categoría de fuente y actualizar lastReviewed; evitar asesoría jurídica universal.
- Proteger entradas: no pedir nombres, empresas, perfiles, correos, teléfonos, listas, credenciales, metas sensibles o evidencia confidencial; no persistir ni enviar texto libre a analítica.
- Mantener enlaces hacia Networking, Comunicación profesional, Marketing digital, Consultoría, Resolución de problemas e IA responsable.
- Auditar similitud contra **owner-provided research notes on B2B prospecting and first-meeting generation** y reemplazar cualquier coincidencia de estructura, ejemplo, cifra, mensaje, llamada, objeción, secuencia, FAQ, conclusión o CTA.

## Mantener Entrevistas informativas

- Contenido: `src/informationalInterviewContent.js`; páginas: `src/InformationalInterviewPages.jsx`; reglas de herramientas: `src/informationalInterviewTools.js`; pruebas: `tests/informationalInterviews.test.js`.
- Mantener exactamente diez módulos salvo una decisión de arquitectura. Cada módulo requiere objetivo, resultados, cuatro o más secciones, práctica o ejemplo ficticio, enlaces pertinentes, metadata y `lastReviewed` verificable.
- Una entrevista informativa sirve para aprender: no debe presentarse como selección, solicitud encubierta de empleo, referencia, mentoría obligatoria o garantía de acceso.
- Conservar los nombres y cautelas del Mapa de conversación con propósito, la Escala de profundidad de preguntas y Contexto, motivo y salida fácil. Si cambian, actualizar contenido, herramientas, documentación y pruebas conjuntamente.
- Identificar todos los casos con “Caso ficticio creado con fines educativos.” No usar personas, organizaciones, perfiles, conversaciones o resultados reales sin consentimiento y revisión editorial.
- Diferenciar observación, interpretación, asunto por verificar y decisión. Consejos incompatibles se contextualizan; no se resuelven por mayoría, jerarquía o prestigio.
- Una invitación debe declarar contexto y motivo legítimos, acotar el pedido y permitir declinar. Una negativa, exclusión o límite explícito termina el contacto.
- Las herramientas deben seguir siendo locales y deterministas. No añadir IA externa, scraping, automatización de contacto, almacenamiento, puntuación de personas ni transmisión de texto libre.
- No pedir datos identificables, confidenciales o sensibles. La analítica usa únicamente valores controlados; nunca copia entradas, resultados o notas del usuario.
- Mantener labels, errores asociados, `aria-live`, controles de teclado, listas semánticas, texto alternativo cuando corresponda, impresión legible y diseño responsive.
- Antes de publicar cambios temporales o de plataforma, revisar fuentes primarias y actualizar `lastReviewed`. No convertir política de plataforma en asesoría jurídica universal.
- Añadir o retirar rutas de manera coordinada en `App.jsx`, `contentData.js`, sitemap, interenlaces y pruebas. Las rutas desconocidas deben conservar el 404 existente.
- Auditar similitud contra **owner-provided research notes on informational interviews and professional learning conversations** y reemplazar coincidencias de orden, marco, ejemplo, diálogo, plantilla, cifra, metadata o CTA.

## Mantener Marca profesional

- Propósito: ayudar a convertir experiencia y criterio en señales comprensibles, verificables, coherentes y revisables; no enseñar autopromoción, apariencia, popularidad o manipulación de plataformas.
- Archivos: contenido y casos en `src/professionalBrandContent.js`; páginas en `src/ProfessionalBrandPages.jsx`; reglas locales en `src/professionalBrandTools.js`; pruebas en `tests/professionalBrand.test.js`.
- Definiciones: identidad es autocomprensión; reputación son expectativas externas; posicionamiento selecciona una contribución relevante; narrativa organiza señales; evidencia las respalda; visibilidad determina exposición. No tratarlas como sinónimos.
- Voz: español claro, calmado y basado en ejemplos. Evitar “venderse”, adjetivos sin prueba, jerga, promesas, estereotipos, apariencia como requisito y reglas universales.
- Lecciones: usar el constructor `lesson`; incluir slug único, objetivo, resultados, cuatro o más secciones, ejemplo ficticio, ejercicio, límites, recurso, herramienta, enlaces válidos y fecha de revisión.
- Casos: usar organizaciones y personas genéricas; incluir dificultad, objetivo, contexto, evidencia, ambigüedad, decisión, acciones, riesgos, retroalimentación, relaciones y la etiqueta exacta de ficción educativa.
- Evidencia: distinguir responsabilidad, contribución, efecto y causalidad. Declarar autoría colectiva, contexto, prueba disponible y límite de confidencialidad. No inventar números ni rellenar datos ausentes.
- Modelos: mantener Sistema de señales profesionales y Cadena afirmación–prueba–contexto como ayudas flexibles. Origen, patrón, aporte y dirección, Mapa de coherencia y el ciclo de mantenimiento tampoco son evaluaciones ni certificaciones.
- CV: explicar convenciones como dependientes de país, sector, experiencia y proceso. No publicar reglas de extensión, formato o sistemas de selección como universales.
- Perfil público y LinkedIn: enseñar primero conceptos neutrales. Verificar campos, visibilidad, privacidad y funciones en ayuda oficial; fechar la revisión; eliminar detalles obsoletos y no afirmar resultados algorítmicos.
- Revisión: preguntar qué se comprendió y qué evidencia se observó; separar observación, interpretación y recomendación. No decidir por votación ni copiar el estilo del revisor.
- Privacidad: no solicitar nombres, empleadores, contactos, documentos completos, clientes o datos sensibles. Anonimizar, limitar o retirar evidencia cuando corresponda. No persistir entradas ni enviarlas a analítica.
- Coherencia: permitir adaptación por canal, pero comparar fechas, cargos, autoría, alcance, nivel de dominio, pruebas y dirección. En versiones bilingües, revisar significado y no solo palabras.
- Mantenimiento: actualizar por desencadenantes reales; una revisión puede concluir sin cambios. Retirar señales antiguas o demasiado expuestas.
- Interenlaces: coordinar `App.jsx`, `contentData.js`, sitemap y pruebas. Enlazar solo rutas publicadas de Entrevistas informativas, Networking, Comunicación, Adaptabilidad, Consultoría y Coaching.
- Fechas: actualizar `brandLastReviewed`, metadata, notas temporales, sitemap, documentación y pruebas solo después de una revisión real.
- Originalidad: auditar contenido, estructura, modelos, casos, ejercicios, herramientas, variables, metadata, documentación y build frente a **owner-provided research notes on professional identity, evidence, career narratives, CVs, and public profiles**.

## Mantener Escucha, curiosidad y feedback

- Propósito: mejorar atención, clarificación, criterio ante feedback y reparación mediante situaciones observables; no evaluar personalidad, obediencia, inteligencia emocional o salud.
- Archivos: contenido en `src/listeningFeedbackContent.js`; páginas en `src/ListeningFeedbackPages.jsx`; lógica en `src/listeningFeedbackTools.js`; pruebas en `tests/listeningFeedback.test.js`.
- Definiciones: escuchar dirige atención y comprueba significado; curiosidad explora incertidumbre con límites; feedback aporta una perspectiva situada. Comprensión no implica acuerdo, aceptación o acción.
- Evaluación prohibida: no añadir cuestionarios totales, escalas, inversión de ítems, rangos, niveles, etiquetas o grados generales de escucha. Toda reflexión debe referirse a una situación y conducta concreta.
- Lecciones: mantener diez módulos con cuatro o más secciones, ejemplo ficticio, ejercicio, reflexión, recurso, herramienta, interenlace, accesibilidad, poder y límites.
- Casos: incluir observaciones, interpretaciones, información faltante, poder, acceso, acciones, riesgos y varias resoluciones defendibles. Usar siempre la etiqueta exacta de ficción educativa.
- Observaciones: escribir qué ocurrió, momento, alcance y fuente. Separar interpretación, intención inferida, evaluación, sensación y solicitud. No convertir tono, mirada, postura o expresividad en prueba de intención.
- Feedback: describir situación, conducta y efecto; identificar estándar y autoridad; invitar conversación solo cuando exista elección real. No diagnosticar identidad, motivos, personalidad o salud.
- Poder: distinguir consejo opcional, expectativa gerencial, evaluación, disciplina formal y coerción. Una diferencia jerárquica puede volver ilusoria una invitación a declinar.
- Seguridad: abuso, amenaza, represalia, discriminación, acoso o proceso formal pueden requerir documentación, canal interno, apoyo calificado, asesoría o salida. Las técnicas de reparación no reemplazan esos recursos.
- Accesibilidad: no exigir contacto visual, postura, quietud, expresividad, respuesta inmediata, audio o cámara. Ofrecer agenda, notas, repetición, subtítulos, pausas, turnos explícitos, menor carga sensorial, escritura y asincronía.
- Herramientas: mantener lógica local y determinista; sin grabación, cámara, IA, red, persistencia o texto libre en analítica. No solicitar transcripciones, nombres, empleadores, salud o RR. HH.
- Fuentes y fechas: revisar WCAG, alternativas multimedia, structured data y referencias laborales oficiales antes de cambiar afirmaciones temporales. Actualizar fecha solo después de revisión real.
- Interenlaces: coordinar router, catálogo, sitemap y pruebas; enlazar Comunicación, Entrevistas informativas, Marca profesional, Networking, Relaciones y bienestar, Adaptabilidad y Resolución de problemas.
- Originalidad: auditar estructura, modelos, casos, preguntas, herramientas, variables, metadata, documentación y build frente a **owner-provided research notes on listening, curiosity, feedback, and workplace conversations**.
# Mantenimiento: Investigación de empresas

## Propósito y definiciones

Esta ruta enseña a construir hipótesis corregibles sobre organizaciones para decisiones profesionales. “Evidencia” es información fechada y atribuible; “afirmación” es lo que una fuente sostiene; “inferencia” es la interpretación que todavía necesita contraste; “desconocido” es una ausencia que debe permanecer visible.

La voz editorial es clara, estratégica, calmada y no promocional. Habla de organizaciones, no de “empresas perfectas”; de decisiones, no de garantías; de evidencia e incertidumbre, no de rankings.

## Añadir una lección

Incorpora la lección en `companyResearchContent.js` con propósito, distinciones, errores, caso ficticio, reflexión, ejercicio, recurso, herramienta, enlaces y límite editorial. Usa una ruta única, metadata fechada y al menos cuatro secciones sustantivas. No conviertas el orden en una receta rígida.

## Añadir un caso ficticio

Usa una organización y personas inventadas, y muestra siempre “Caso ficticio creado con fines educativos.” Incluye dificultad, objetivo, contexto, fuentes ficticias, evidencia, incertidumbre, punto de decisión, acciones, riesgos, devolución, lección y herramienta. Debe admitir más de una decisión razonable.

## Fuentes, fechas y ejemplos

- Prioriza registros, informes, políticas y documentación oficiales; explica su propósito y sus límites.
- Registra fecha de publicación cuando exista y fecha real de revisión editorial.
- Separa visual y verbalmente evidencia, afirmación, inferencia, contradicción y desconocido.
- Si se incorpora una organización real, usa únicamente hechos pertinentes y primarios, fecha cada afirmación, evita rankings y elimina el ejemplo cuando deje de ser mantenible.
- Nunca presentes una salida de IA, un fragmento de buscador, un rumor o una reseña anónima como hecho.

## Información desactualizada y comparación

Revisa cambios de liderazgo, propiedad, productos, resultados, ubicación, contratación, trabajo remoto, permisos, regulación y plataformas. Elimina lo que no pueda verificarse. Mantén criterios de comparación separados, calidad de evidencia visible, pesos opcionales y una prueba de sensibilidad. Nunca generes una recomendación universal.

## Privacidad y conversaciones

La investigación se concentra en organizaciones, roles y evidencia pública. Evita scraping, bases compradas, expedientes personales, características protegidas, rumores, datos sensibles, información confidencial y contacto masivo. Separa notas organizacionales de cualquier nota mínima de conversación y elimina esta última cuando deja de ser necesaria.

## Auditoría de originalidad

Revisa contenido visible, estructura pedagógica, casos, modelos, herramientas, lógica, nombres internos, pruebas, metadata, documentación, sitemap y build. No basta una búsqueda textual: compara secuencia, tablas, cantidades, conclusiones y lógica de decisión. Para el material excluido usa únicamente `excluded source-specific references`.

## Mantener Trabajo en equipo

- Propósito: enseñar a coordinar trabajo interdependiente mediante acuerdos observables, decisiones explícitas, seguimiento y aprendizaje. Un grupo comparte contexto; un equipo coordina contribuciones para producir un resultado común.
- Archivos: contenido en `src/teamworkContent.js`; páginas en `src/TeamworkPages.jsx`; reglas locales en `src/teamworkTools.js`; pruebas en `tests/teamwork.test.js`.
- Voz editorial: español claro, sereno y práctico. Hablar de situaciones, conductas, necesidades y acuerdos; evitar diagnósticos, etiquetas personales, estereotipos y promesas de armonía.
- Lecciones: mantener diez módulos con objetivo, resultados, cuatro o más secciones, práctica, caso ficticio, recurso, herramienta, límites, interenlaces, metadata y fecha de revisión verificable.
- Casos: usar personas, proyectos y organizaciones inventados e incluir siempre “Caso ficticio creado con fines educativos.” Deben mostrar contexto, evidencia, dependencia, poder, incertidumbre, opciones, riesgos y más de una respuesta defendible.
- Diferencias: describir una preferencia situada, la necesidad que intenta proteger y el acuerdo que permitiría coordinar. No inferir rasgos estables ni convertir una conducta aislada en identidad.
- Modelos: conservar Sistema de coordinación del equipo; Preferencia, necesidad y acuerdo; Resultado, evidencia y límite; y Tema, evidencia, tensión y opción como ayudas flexibles, no como evaluaciones.
- Acuerdos observables: declarar quién hace qué, dependencia, evidencia esperada, momento de revisión, autoridad de decisión, límite y procedimiento ante cambios. Evitar formulaciones como “comunicar mejor” sin conducta verificable.
- Poder y conflicto: distinguir desacuerdo de acoso, discriminación, represalia, amenaza, humillación, sobrecarga, exclusión, apropiación de crédito, manipulación, conflicto de interés y procesos formales. Las técnicas educativas no sustituyen RR. HH., canales formales, asesoría jurídica, mediación, atención clínica ni protocolos de seguridad.
- Accesibilidad: no exigir contacto visual, respuesta verbal inmediata, audio o cámara. Ofrecer agenda, notas, turnos explícitos, subtítulos, pausas, escritura, asincronía y alternativas remotas.
- Herramientas: mantener procesamiento local, efímero y determinista; sin IA externa, red, grabación, persistencia, puntuación general ni texto libre en analítica. Conservar validación, copia, reinicio, impresión y resultados textuales.
- Privacidad: no pedir nombres, empleadores, contactos, expedientes, evaluaciones formales, información confidencial ni datos sensibles. Los ejemplos de riesgo deben poder completarse con descripciones anónimas y mínimas.
- Fuentes y fechas: antes de cambiar accesibilidad, seguridad laboral o SEO, revisar fuentes primarias vigentes y actualizar `teamworkLastReviewed` solo después de una revisión real.
- Integración: coordinar `App.jsx`, `contentData.js`, sitemap, enlaces internos, metadata, analítica y pruebas. Enlazar solo rutas publicadas.
- Originalidad: auditar contenido, orden, modelos, casos, ejercicios, herramientas, variables, metadata, pruebas y documentación. Registrar el material excluido exclusivamente como `excluded source-specific references`.
