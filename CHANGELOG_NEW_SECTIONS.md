# Cambios — Aprende y Herramientas (Fase 1)

## Marketing digital — 2026-07-16

- Se añadió `/aprende/marketing-digital`, 17 módulos sustantivos y un caso integrador ficticio.
- Se crearon CONECTA, META, CANAL, BRIEF y CRUZA como marcos educativos originales, flexibles y sin promesa de resultados.
- Se incorporaron 32 escenarios ficticios y 31 recursos editables e imprimibles.
- Se publicaron ocho herramientas locales: diagnóstico, estrategia, recorrido, auditoría, canales, contenido, medición y calculadora con 17 métricas.
- Se reutilizaron shell, navegación, cards, lecciones, recursos, formularios, copia, impresión, SEO, analítica y CTA.
- Se integró una tarjeta activa en Aprende, rutas con carga diferida, 26 entradas de sitemap y schema `LearningResource`/`WebApplication`.
- Se revisaron fuentes oficiales de búsqueda, accesibilidad, divulgación y marketing directo; las afirmaciones legales conservan alcance jurisdiccional y fecha de revisión.
- Privacidad: no hay API externa, login, scraping, almacenamiento remoto, listas, credenciales ni texto libre en analítica.
- Accesibilidad: labels, errores vinculados, `aria-live`, foco, teclado, alternativas textuales, diseño adaptable e impresión.
- Validación final: 159 pruebas aprobadas, revisión visual de hub/lección/herramienta en escritorio y lección en móvil, sitemap XML válido y build de producción completado con 1.752 módulos transformados.
- El repositorio no configura scripts separados de formatter, linter, type checker o E2E; no se desactivó ningún control existente.
- No se implementaron once herramientas opcionales para evitar rutas superficiales; sus temas están cubiertos mediante lecciones, recursos y las ocho herramientas prioritarias completas.

## Corrección de renderizado de rutas avanzadas — 2026-07-16

- Corregido el contrato entre las páginas nuevas y `LessonMetadata`, `LessonContent`, `LessonNavigation` y `RelatedContent`.
- Reparadas las lecciones de Escalamiento y adopción, Pensamiento computacional e Inteligencia artificial y deep learning que quedaban en blanco por intentar leer metadatos desde una propiedad inexistente.
- Corregidos el total de módulos y el destino de recursos relacionados en esas familias.
- Verificación: 149 pruebas aprobadas, build correcto y DOM real renderizado con Chrome headless para hubs y módulos representativos.

## Archivos creados

### Inteligencia artificial y deep learning — 2026-07-16

- Hub, nueve módulos, caso ficticio integrado, seis escenarios, glosario, siete recursos y tres herramientas deterministas.
- Redes, entrenamiento, visión, lenguaje, embeddings, recuperación, transformers, adaptación, difusión y sistemas multimodales con límites explícitos.
- Herramientas locales: pase hacia adelante, curvas sintéticas reproducibles y estrategia de adaptación sin texto libre ni puntuación.
- Validación final: 148 pruebas aprobadas, 0 fallidas; build de producción correcto; smoke HTTP sin fallas en las 13 rutas nuevas.
- Sitemap: 245 URL únicas. Auditorías sin llamadas externas, persistencia, API de modelos o referencias específicas excluidas.
- Revisión técnica con fuentes primarias: artículo original de transformers para atención escalada; artículo original DDPM para difusión; OWASP para inyección en contenido no confiable y límites de RAG; W3C WCAG 2.2 para accesibilidad.
- Accesibilidad declarativa: HTML semántico, labels, resumen de errores, `role="alert"`, `aria-live`, tabla accesible de curvas, teclado nativo e impresión.
- El repositorio no ofrece auditor automático de accesibilidad, E2E, formatter, linter o type checker; no se desactivó ningún control y no se declara conformidad WCAG completa.
- Vite conserva una advertencia no bloqueante por el chunk principal de 504,78 kB sin comprimir (148,80 kB gzip).
- No quedó contenido obligatorio diferido; una auditoría automática de accesibilidad requiere infraestructura actualmente ausente.

### Pensamiento computacional y decisiones con datos — 2026-07-16

- Hub, ocho módulos, caso ficticio integrado, siete recursos y tres herramientas deterministas.
- Contenido original sobre formulación, optimización, grafos, simulación, muestreo, regresión, aprendizaje automático y comunicación analítica.
- Cálculos locales: enumeración, heurística y programación dinámica; simulación reproducible; estadísticos muestrales e intervalo t.
- Validación final: 138 pruebas aprobadas, 0 fallidas; build de producción correcto; smoke HTTP sin fallas en las 12 rutas nuevas.
- Sitemap: 232 URL únicas. Auditorías sin llamadas externas, persistencia o referencias específicas excluidas en la sección y su build.
- Revisión matemática: denominador muestral `n-1`, error estándar, valores críticos t, semilla reproducible, límites de probabilidad, cuantiles, desempate estable y equivalencia exacta/dinámica en casos conocidos.
- Accesibilidad: HTML semántico, labels, resumen de errores, `role="alert"`, `aria-live`, teclado nativo, tablas/listas alternativas e impresión; WCAG 2.2 fue la fuente primaria oficial.
- No existe Lighthouse, axe, pa11y, E2E, formatter, linter o type checker configurado en el repositorio; por ello no se ejecutó un escaneo automatizado adicional ni se desactivó control alguno.
- Vite mantiene una advertencia no bloqueante por el chunk principal de 502,94 kB sin comprimir (148,45 kB gzip).
- No quedó contenido obligatorio diferido; una auditoría automatizada de accesibilidad requeriría incorporar infraestructura que actualmente no existe.

### Escalamiento y adopción de inteligencia artificial — 2026-07-16

- Hub, doce módulos y caso integrador sobre evidencia, liderazgo, modelo operativo, portafolio, reutilización, dominio, democratización, aprendizaje, medición, agentes y hoja de ruta.
- Nueve marcos originales; 24 casos ficticios; 22 recursos; 11 herramientas deterministas.
- Sin productos, estadísticas laborales, precios, licencias o afirmaciones regulatorias; fecha editorial 2026-07-16.
- Entradas efímeras sin API, persistencia o analítica libre; metadata, schema, sitemap, carga diferida, labels, errores, `aria-live`, copia e impresión.
- Validación final: 130 pruebas aprobadas, 0 fallidas; build de producción correcto; smoke HTTP sin fallas en las 24 rutas nuevas.
- Sitemap: 220 URL únicas. Auditorías sin llamadas externas, persistencia o referencias específicas excluidas en la nueva sección y el build.
- Accesibilidad contrastada con la recomendación vigente WCAG 2.2: estructura semántica, labels, errores asociados, teclado, estado anunciado, alternativas textuales e impresión.
- No hubo errores preexistentes. Vite conserva una advertencia no bloqueante: el chunk principal es 501,11 kB sin comprimir y 148,08 kB gzip.
- El repositorio no define scripts separados de formatter, linter, type checker o E2E; no se desactivó ningún control.
- No se difirió contenido obligatorio. Se omitieron deliberadamente productos y estadísticas laborales por no ser necesarios para el aprendizaje evergreen.

### IA responsable y gobernanza — 2026-07-16

- Hub, once módulos y caso integrador sobre impactos, sensibilidad, equidad, protección, inclusión, transparencia, responsabilidad, evaluación, gobierno y operación.
- Nueve marcos originales: CUIDADO, ALERTA, PARES, ESCUDO, ABARCA, VISIBLE, RESPALDO, HUELLA y TRAMA; 24 escenarios ficticios y 22 recursos prácticos.
- Once herramientas deterministas para impactos, usos sensibles, equidad, protección, evaluación, supervisión, gobierno, inventario, inclusión, transparencia y proveedores.
- Revisión factual con fuentes oficiales de NIST, OECD y W3C; sin conclusiones jurídicas, clasificación regulatoria, umbrales universales o certificaciones.
- Privacidad y seguridad: entradas efímeras, advertencia contra datos reales, sin API, almacenamiento, cuentas o contenido libre en analítica.
- SEO y accesibilidad: metadata, canonical, breadcrumbs, schema, sitemap, carga diferida, labels, errores asociados, `aria-live`, teclado, copia e impresión.
- Validación final: 120 pruebas aprobadas, 0 fallidas; build de producción correcto; smoke HTTP sin fallas en las 23 rutas nuevas.
- Sitemap: 196 URL únicas. Auditorías sin llamadas de red o persistencia, referencias específicas excluidas ni afirmaciones de aprobación en la nueva sección o el build.
- No se observaron errores preexistentes. El repositorio no define scripts de formatter, linter, type checker o E2E; no se desactivó ningún control.
- No se difirió contenido obligatorio: se implementaron once herramientas, incluidos inventario, inclusión, transparencia y proveedor.

### Preparación organizacional para la IA — 2026-07-16

- Hub, once módulos y caso integrador sobre preparación contextual, estrategia, portafolio, fundamentos, entrega, capacidades, adopción, gobierno, monitoreo y hoja de ruta.
- Cuatro marcos originales: PREPARA organizacional, NORTE, IMPULSO y CUSTODIA; 20 organizaciones ficticias y 20 recursos.
- Diez herramientas deterministas para preparación, estrategia, portafolio, fundamentos, capacidades, gobierno, roadmap, entrega, adopción y monitoreo.
- Revisión factual con fuentes oficiales de una agencia de estándares; sin productos, precios, reglas regulatorias o duraciones universales. Fecha editorial: 2026-07-16.
- Privacidad: entradas efímeras, advertencia contra información organizacional real, sin API, persistencia o contenido en analítica.
- SEO y accesibilidad: metadata, canonical, breadcrumbs, schema, sitemap, carga diferida, labels, errores, `aria-live`, teclado, listas alternativas e impresión.
- Validación final: 110 pruebas aprobadas, 0 fallidas; build correcto con 1.733 módulos transformados; smoke HTTP correcto en 22 rutas.
- Sitemap: 173 URLs únicas. Sin llamadas de red o persistencia, slogans prohibidos, puntuaciones globales o referencias específicas excluidas en la nueva sección o build.
- No se observaron errores preexistentes. El repositorio no define scripts de formatter, linter, type checker o E2E; no se desactivó ningún control.
- No se difirió contenido obligatorio: se implementaron también las herramientas opcionales de entrega, adopción y monitoreo.

### Sistemas de IA confiables — 2026-07-16

- Hub, once módulos y caso integrador sobre confiabilidad, prompts, grounding, RAG, datos, seguridad, métodos, ciclo de vida, evaluación y operación.
- Seis marcos originales: FUENTE, NORMA, VIGENTE, PREPARA, ELIGE y RESPONDE; 20 sistemas ficticios; 18 recursos.
- Diez herramientas deterministas: confiabilidad, prompt, fuentes, RAG, datos, seguridad, método, evaluación, ciclo de vida y operación.
- Revisión técnica contra fuentes primarias de una agencia de estándares, el artículo original de RAG y una organización de seguridad de aplicaciones; fecha editorial 2026-07-16.
- Seguridad y privacidad: enfoque defensivo, mínimo privilegio, permisos, interrupción e incidentes; sin API, persistencia, credenciales o contenido en analítica.
- SEO y accesibilidad: metadata, canonical, breadcrumbs, `LearningResource`, `WebApplication`, sitemap, carga diferida, labels, errores, `aria-live`, teclado, texto alternativo de diagramas e impresión.
- Validación final: 100 pruebas aprobadas, 0 fallidas; build correcto con 1.729 módulos transformados; smoke HTTP sin fallas en 22 rutas.
- Sitemap: 151 URLs únicas. Auditorías sin llamadas de red o persistencia, afirmaciones prohibidas ni referencias específicas excluidas en la nueva sección o el build.
- No se observaron errores preexistentes. El repositorio no ofrece scripts de formatter, linter, type checker o E2E; no se desactivó ningún control.
- No se difirió contenido obligatorio: también se implementaron las tres herramientas señaladas como opcionales.

### IA generativa para negocios — 2026-07-16

- Hub, once módulos y caso integrador sobre oportunidad, modelos, casos, selección, agentes, economía, gobierno, pilotos, adopción y operación.
- VALORA, AUTORIZA y GUARDA; 18 casos ficticios; 17 recursos; nueve herramientas locales.
- Sin productos, precios, licencias ni afirmaciones volátiles de proveedores; no fue necesaria una página de hechos con `lastReviewed` visible.
- Costo total con escenarios y cautelas, permisos y reversibilidad, gobierno sin certificación y condiciones de parada.
- Inputs efímeros, sin API externa o persistencia; analítica sin contenido introducido por usuarios.
- Sitemap, metadata social, canonical, breadcrumbs, schema educativo/aplicación y controles accesibles.
- Validación final: 90 pruebas aprobadas, 0 fallidas; build de producción correcto con 1.725 módulos transformados; smoke HTTP correcto en 21 rutas nuevas.
- Auditorías: 129 URLs únicas; sin llamadas de red o persistencia en la sección; sin referencias específicas excluidas en código público o build generado.
- Hechos de proveedor: no se publicaron nombres, precios, licencias, disponibilidad ni compromisos; por ello no hubo afirmaciones actuales que verificar o una fecha editorial de proveedor que mostrar.
- No se observaron errores preexistentes durante las comprobaciones. El repositorio no define scripts de formatter, linter, type checker o E2E; no se desactivó ningún control.
- Diferido intencionalmente: el apéndice opcional de proveedor. No quedó diferida ninguna ruta, módulo o herramienta obligatoria.

- Modelos y utilidades: `src/contentData.js`, `src/messageGenerator.js`, `src/analytics.js`, `src/seo.js`.
- UI y páginas: `src/LearningComponents.jsx`, `src/LearningPages.jsx`, `src/MessageGeneratorPage.jsx`.
- Pruebas: `tests/messageGenerator.test.js`.
- SEO/documentación: `public/sitemap.xml`, `IMPLEMENTATION_PLAN.md`, `CONTENT_GUIDE.md` y este registro.

## Archivos modificados

- `src/App.jsx`: rutas nuevas, navegación y sección “Aprende y aplica”, sin retirar secciones comerciales.
- La navegación compartida se actualizó sin alterar los contenidos educativos.
- `src/index.css`: estilos responsive, accesibles y coherentes con los tokens existentes.
- `vite.config.js`: entradas de build para preservar los HTML históricos.
- `package.json`: script de prueba nativo, sin nueva dependencia.
- `robots.txt` y `public/robots.txt`: referencia al sitemap.

## Rutas añadidas

- `/aprende`
- `/aprende/networking`
- `/aprende/networking/por-que-importa`
- `/aprende/networking/como-construir-una-red`
- `/aprende/networking/entrevistas-informativas`
- `/aprende/networking/conversaciones-informales`
- `/aprende/networking/barreras`
- `/herramientas`
- `/herramientas/generador-mensajes-networking`

## Componentes y funcionalidad

- Navegación y shell compartidos, topic/tool/resource/lesson cards, badges, breadcrumbs, metadatos, estados editoriales, relacionados, navegación anterior/siguiente, CTA contextual, copia con fallback y checklist interactivo.
- Modelo para diez formatos de contenido y relaciones.
- Generador local con validación, tres canales, tres tonos, tres duraciones y tres variaciones; copiar, regenerar y limpiar. No usa API, almacenamiento ni analytics con texto personal.
- Metadatos/canonical/Open Graph/Twitter dinámicos, BreadcrumbList, LearningResource y WebApplication. Las cinco lecciones completas son indexables y aparecen en el sitemap.
- Eventos seguros para vistas, inicio de ruta, módulos, uso/copia de herramienta y CTA de servicio. Solo se emiten si el sitio ya expone una integración compatible; no se añadió un segundo proveedor.

## Preservación

La homepage, todas sus secciones comerciales, CTA de agenda, contactos, datos, activos y HTML históricos siguen presentes. El build confirma explícitamente la emisión de las seis páginas HTML secundarias.

## Validación ejecutada

- `npm test`: 8/8 pruebas aprobadas. Cubre obligatorios, salida no vacía, duración, canales, tono, variaciones, cinco lecciones sustantivas, ocho recursos publicados y ausencia de solicitudes directas de empleo.
- `npm run build`: aprobado con Vite 5.4.20; 1.697 módulos transformados y sin errores. Generó `index.html`, los seis HTML históricos, sitemap, robots y assets.
- Búsqueda estática de privacidad: no hay `fetch`, API, `localStorage` ni `sessionStorage` en el generador; analytics recibe solo canal/tono y otros valores categóricos controlados.
- Smoke test con Vite Preview y Microsoft Edge headless: hubs, lecciones y herramienta renderizaron con H1, títulos, canonical y robots dinámicos correctos y cero errores de consola detectados. Las rutas principales y HTML históricos respondieron HTTP 200.

## Decisiones y tradeoffs

- Se mantuvo el routing manual para no cambiar framework ni añadir dependencias.
- Se mantuvo contenido en JavaScript porque es el mecanismo editorial actual y permite editar lecciones sin tocar sus layouts.
- Las lecciones se indexaron únicamente después de incorporar contenido sustantivo y schema educativo.
- El repositorio no incluía linter, type checker, E2E ni navegador automatizado; no se introdujeron dependencias solo para esta fase.

## Contenido de Networking completado

- Se añadió `src/networkingContent.js` con cinco lecciones completas, objetivos, ejercicios, ejemplos y enlaces internos.
- Se activaron cinco plantillas copiables, un checklist interactivo y dos hojas de trabajo efímeras.
- El generador incorpora contexto específico en los tres canales y usa el objetivo en el asunto del email.
- Se retiraron los estados temporales, mensajes provisionales y `noindex` de las cinco lecciones.
- Se añadieron tiempos de lectura, fecha real de actualización, schema `LearningResource` y las cinco URLs al sitemap.
- Se omitieron cifras no verificadas, garantías de resultados y generalizaciones sobre jerarquía o conducta.

## Pendiente

- Las herramientas futuras de la página `/herramientas` continúan indicadas como áreas planificadas.
- No se añadieron estadísticas ni citas externas porque el material proporcionado no incluía referencias suficientes para respaldarlas.

## Ampliación de la lección de barreras

- Se amplió `/aprende/networking/barreras` con una estructura pedagógica centrada en incertidumbre, confianza mediante práctica, reciprocidad, mérito, capacidad relacional, diversidad de perspectivas, preparación anticipada y autonomía profesional.
- Se crearon casos ficticios sobre una transición hacia producto, el valor de una perspectiva de inicio de carrera y la exploración anticipada de una nueva industria.
- Se añadieron ejercicios de reflexión, un marco de cuatro habilidades, una comparación relacional/transaccional, aplicaciones por objetivo y un diagnóstico de nueve barreras con primera acción.
- Se activaron cuatro recursos: autodiagnóstico interactivo, plan de siete días, hoja de reciprocidad y primera acción de bajo riesgo.
- Se actualizó el tiempo de lectura de la lección a 14 minutos y el total aproximado de la ruta a 39 minutos.
- El generador admite un aporte opcional, aclara que no es necesario ofrecer un intercambio y recuerda que el silencio no equivale automáticamente a rechazo.
- Se actualizó el título y la descripción SEO de la lección, manteniendo canonical, schema educativo e indexación.
- Se conservaron rutas, layouts, navegación, servicios, recursos anteriores, privacidad y analytics.
- `npm test`: 11/11 pruebas aprobadas, incluidas estructura sustantiva, casos, diagnóstico, plan, recursos y aporte opcional del generador.
- `npm run build`: aprobado con Vite 5.4.20; 1.697 módulos transformados y sin errores.
- Smoke test en Edge: lección, hub, generador y homepage respondieron HTTP 200 sin errores de consola; la lección mantiene `index,follow` y schema `LearningResource`.

## Biblioteca de Consultoría

- Nueva ruta indexable `/aprende/consultoria` con ocho módulos completos y navegación anterior/siguiente.
- Nuevas lecciones sobre trabajo y encaje, investigación de firmas, CV, entrevistas de caso, market sizing, entrevistas conductuales, networking y planificación.
- Catorce recursos publicados: diagnósticos, matrices, inventario, checklist, bancos, trackers, plantillas, hoja de estimación y dashboard.
- Nueva herramienta `/herramientas/constructor-bullets-consultoria`, con validación accesible, tres borradores, regeneración, copia y limpieza. Es local, no persiste datos y no inventa métricas.
- La tarjeta Consultoría se activó en Aprende y la herramienta aparece en Herramientas; Networking y el generador anterior se preservaron.
- Se añadieron títulos, descripciones, canonical, Open Graph, BreadcrumbList, LearningResource, WebApplication y diez URLs al sitemap.
- Analytics utiliza únicamente identificadores controlados de módulo, recurso, herramienta y destino; no recibe texto de formularios.
- Se añadieron ocho pruebas específicas. La suite completa queda en 19 pruebas.
- Se excluyeron referencias específicas de las fuentes y afirmaciones variables sin respaldo. Los datos de procesos se remiten a verificación oficial.
- Se conserva como planificada la segunda herramienta de planificación más amplia; no se publica una tarjeta o ruta falsa.

## Ruta de Entrevistas de caso

- Se amplió `/aprende/consultoria/entrevistas-de-caso` como hub y se añadieron doce rutas de aprendizaje, preservando el enlace del módulo general.
- Se reutilizaron shell, breadcrumbs, tarjetas, layouts de lección, navegación, recursos, checklist, worksheets, metadata, analytics y CTA.
- Se añadieron mapa interactivo, fórmulas, respuestas modelo desplegables, drills, rúbrica cualitativa, banco conductual filtrable y exhibits con resumen textual.
- Se crearon quince mini-casos ficticios en rentabilidad, crecimiento, entrada, inversión, operaciones, pricing, retención, tecnología, experimentación, sector social, capacidad y alianza.
- Se activaron quince recursos de casos y cuatro herramientas: market sizing, experimentos, estructuras editables y seguimiento efímero.
- La experimentación incluye cuatro casos completos y enseña decisión, comparación, incrementalidad, guardrails, economía, sesgos y escala sin afirmar validez estadística.
- Se añadieron doce `LearningResource`, cuatro `WebApplication`, metadata única, canonicals, breadcrumbs y diecisiete entradas de sitemap.
- Analytics recibe solo identificadores controlados; inputs, cálculos, notas e historias no salen del navegador.
- Se añadieron doce pruebas específicas; la suite completa alcanza 31 pruebas aprobadas.
- No se incorporaron dependencias, cuentas, almacenamiento remoto, logos reales, casos propietarios ni material personal de preparación.

## Ruta de Adaptabilidad y resiliencia

- Nueva ruta `/aprende/adaptabilidad-resiliencia` con seis módulos publicados e integración en Liderazgo y ejecución.
- Se añadieron definiciones, comparación, Aprender–Ajustar–Sostener, OPA, HECA, hábitos, feedback y plan de cuatro semanas.
- Se crearon doce escenarios ficticios con pregunta, acción y restricción, además de clasificación interactiva y respuesta modelo desplegable.
- Se añadieron once recursos: diagnóstico, worksheets, tarjetas, biblioteca de preguntas, checklist, plantillas y guía de equipo.
- Se activaron cinco herramientas: intención de aprendizaje, reencuadre, hábito, plan de cuatro semanas y diario efímero.
- Se reutilizaron shell, breadcrumbs, lecciones, recursos, checklists, copy, metadata, analytics, navegación y CTA; escenarios y clasificación son componentes genéricos nuevos.
- No se incluyeron estadísticas, plazos universales, diagnósticos, consejos médicos, causalidades neurológicas ni promesas de adaptación.
- Las herramientas son deterministas, no usan API, almacenamiento, cuentas ni analytics con texto libre.
- Se añadieron doce pruebas; la suite completa alcanza 43 pruebas aprobadas.
- Se añadieron doce URLs al sitemap y schema educativo/aplicación. La ruta se carga bajo demanda para preservar el bundle inicial.

## Ruta de Resolución de problemas

- Se añadió el hub y ocho módulos: clasificación, definición, hipótesis y estructura, priorización, plan y análisis, síntesis, colaboración y caso integrador.
- Se crearon doce problemas ficticios, un caso integrador con evidencia contradictoria y catorce recursos móviles y copiables.
- Se incorporaron CLARO, VERA, HIA y DECIR como modelos prácticos originales de la guía.
- Se activaron siete herramientas locales: diagnóstico, definición, árbol lógico, priorización, plan, recomendación y revisión de decisión.
- Se reutilizaron shell, breadcrumbs, lecciones, recursos, checklists, formularios, metadata, analítica, navegación, copia, impresión y CTA.
- Se añadieron dieciséis URLs, schema educativo/aplicación, metadata social y carga diferida.
- Accesibilidad: controles etiquetados, errores asociados, `aria-live`, flujo por teclado, árbol sin arrastre, tablas desplazables, foco existente y estilos de impresión.
- Privacidad: sin API, cuentas, almacenamiento remoto ni texto libre en analítica.
- Validación añadida para contenido, relaciones, herramientas, rutas, sitemap, privacidad, regresión y build.
- Resultado final: 55 pruebas aprobadas, 0 fallidas; build de producción completado con 1.713 módulos transformados.
- No se difieren rutas ni herramientas obligatorias; la exportación JSON opcional del árbol no se implementó porque copia e impresión cubren el flujo sin persistencia.

## Ruta de Comunicación profesional

- Se añadió un hub y nueve módulos sobre audiencia, escucha, propósito, insights, estructura, narrativa, visuales, presentación, facilitación y aplicación integrada.
- Se incorporaron MAREA, CAPTA, FIN, DICA, NÚCLEO, CAMBIO, VIVA y AFO como modelos prácticos originales.
- Se crearon quince escenarios ficticios completos, un caso integrador y quince recursos reutilizables.
- Se activaron ocho herramientas locales: audiencia, escucha, propósito, insights, mensajes, narrativa, presentación y reuniones.
- Se reutilizaron componentes de shell, navegación, lecciones, escenarios, modelos desplegables, recursos, checklists, formularios, copia, impresión, SEO, analítica y CTA.
- Se añadieron dieciocho URLs al sitemap, `LearningResource`, `WebApplication`, metadata social, canonical e indexación.
- Accesibilidad: etiquetas y errores asociados, `aria-live`, controles nativos, teclado, resúmenes textuales, reduced motion heredado y estilos de impresión.
- Privacidad: sin API externa, cuentas, almacenamiento, audio, video ni analítica con texto libre.
- Resultado final: 68 pruebas aprobadas, 0 fallidas; build de producción completado con 1.717 módulos transformados.
- No se difirieron herramientas solicitadas; también se completaron las herramientas opcionales de narrativa y presentación.

## Ruta de Relaciones y bienestar

- Se añadió un hub y nueve módulos sobre contexto, energía, recuperación, prácticas sostenibles, límites, relaciones, conversaciones difíciles, seguridad psicológica, condiciones de equipo y plan integrado.
- Se incorporaron CUIDA, PASO, LÍMITE, CERCA, HABLAR, VOCES y EQUIPO como modelos prácticos originales y no clínicos.
- Se crearon quince escenarios ficticios completos, un caso integrado y quince recursos.
- Se activaron nueve herramientas locales: contexto, energía, práctica sostenible, límites, relación, conversación difícil, seguridad de equipo, prácticas de equipo y plan de acción.
- Se reutilizaron shell, cards, lecciones, casos, recursos, checklists, formularios, copia, impresión, SEO, analítica, navegación y CTA.
- Se añadieron avisos visibles de salud y seguridad, advertencias de escalamiento y restricciones para no pedir datos médicos o identificables.
- Se añadieron diecinueve URLs, metadata social, canonical, breadcrumbs, `LearningResource` y `WebApplication`, sin schema médico.
- Accesibilidad: teclado, labels, errores asociados, `aria-live`, accordions, impresión y ausencia de cámara, audio, arrastre o divulgación obligatoria.
- Privacidad: sin API, cuentas, persistencia, puntuaciones diagnósticas ni texto libre en analítica.
- Resultado final: 81 pruebas aprobadas, 0 fallidas; build de producción completado con 1.721 módulos transformados.
- No se difirieron herramientas: también se completaron los planificadores opcionales de relación y acción integrada.

## Ruta de Prospección B2B

- Se añadieron /aprende/prospeccion-b2b, catorce módulos y ocho rutas de herramientas.
- Se crearon REUNIÓN, FOCO, PISTA, CAMBIO, CLAVE, RITMO, ESCUCHA, PUERTA y DATOS con alcance y cautelas explícitos.
- Se incorporaron un caso integrador ficticio, 35 escenarios ficticios y 28 recursos imprimibles.
- Herramientas: diagnóstico, ICP, propuesta de valor, mensaje, secuencia, objeciones, calculadora y tablero; todas locales, deterministas, validables, copiables, reiniciables e imprimibles.
- Se reutilizaron shell, header, footer, breadcrumbs, cards, contenido de lección, modelos desplegables, worksheets, navegación, formularios, metadata, schema, analítica y CTA.
- Revisión actual al 16 de julio de 2026: condiciones y políticas oficiales de LinkedIn; guías oficiales de correo y marketing B2B por jurisdicción. No se publicaron benchmarks ni una regla legal universal.
- Privacidad: sin APIs, envío, llamadas, scraping, conexión de plataforma, cuentas, persistencia ni texto libre en analítica; avisos para excluir datos identificables y confidenciales.
- SEO: metadata española única, canonical, Open Graph, Twitter, breadcrumbs, LearningResource, WebApplication, indexación y 23 URLs de sitemap.
- Analítica: eventos de hub, lección, modelo, generación, copia, impresión y CTA con dimensiones controladas.
- Accesibilidad: etiquetas, errores asociados, aria-live, teclado, listas ordenadas para secuencias, interpretación textual de cálculos, impresión y diseño responsive.
- Se añadió tests/prospecting.test.js para arquitectura, contenido, ética, herramientas, fórmulas, división por cero, privacidad, SEO, sitemap y fechas.
- Resultado final: 170 pruebas aprobadas, 0 fallidas; build de producción completado con 1.752 módulos transformados. Permanece una advertencia no bloqueante por el chunk principal mayor a 500 kB.
- Diferido intencionalmente: siete herramientas opcionales del brief; sus prácticas están cubiertas dentro de lecciones y recursos, mientras las ocho herramientas obligatorias están completas.

## Ruta de Entrevistas informativas

- Se añadió `/aprende/entrevistas-informativas`, diez módulos, una biblioteca de 24 casos ficticios, una biblioteca de 12 recursos y diez rutas de herramientas.
- Se publicaron el Mapa de conversación con propósito, la Escala de profundidad de preguntas y Contexto, motivo y salida fácil con cautelas explícitas.
- El caso integrado Proyecto Umbral recorre 16 etapas e incluye diálogo ficticio, perspectivas en conflicto, conversación en evento, experimento, señales observables, notas de facilitación, razonamiento modelo y rúbrica.
- Se reutilizaron shell, navegación, breadcrumbs, cards, lecciones, metadata, datos estructurados, analítica y CTA; se añadieron páginas de bibliotecas y un formulario común para las diez herramientas.
- Las herramientas son deterministas, locales, validables, copiables, reiniciables e imprimibles; no usan APIs, cuentas, scraping, automatización, persistencia ni texto libre en analítica.
- Se integró la ruta en Aprende, Carrera y habilidades profesionales, catálogo de herramientas, enlaces internos y sitemap sin modificar rutas publicadas.
- SEO: títulos y descripciones únicos, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication` y 23 URL con `lastmod` 2026-07-16.
- Accesibilidad: estructura semántica, listas reales, labels, errores asociados, `aria-live`, teclado, foco, resultados textuales, responsive e impresión.
- Información actual revisada al 16 de julio de 2026 con WCAG 2.2, documentación oficial de Google/Schema.org y políticas oficiales de LinkedIn; no se añadieron estadísticas ni afirmaciones universales.
- Originalidad auditada frente a **owner-provided research notes on informational interviews and professional learning conversations**; excluded source-specific references.
- Se añadió `tests/informationalInterviews.test.js` para arquitectura, modelos, contenido, casos, herramientas, validación, privacidad, accesibilidad estructural, SEO y sitemap.
- Verificación final: 184 pruebas aprobadas, 0 fallidas; build de producción completado con 1.755 módulos transformados; sitemap XML con 316 URL y 0 duplicados; revisión visual de hub, módulo y herramienta en escritorio y viewport móvil.
- Permanece una advertencia no bloqueante y preexistente: el chunk principal minificado supera 500 kB. La nueva sección se carga de forma diferida en un chunk independiente.
- No se difirió ningún requisito funcional. El repositorio no configura linter, typechecker, E2E ni auditor automático de accesibilidad; se documentan como límites de verificación, no como funciones pendientes.

## Ruta de Marca profesional

- Se añadieron el hub `/aprende/marca-profesional`, diez módulos, biblioteca de 26 casos ficticios, biblioteca de 14 recursos y diez herramientas locales.
- Módulos: definición; dirección y audiencias; evidencia; narrativa; CV; perfil público; coherencia; revisión por pares; mantenimiento; práctica integrada.
- Modelos originales: Sistema de señales profesionales, Cadena afirmación–prueba–contexto, Origen–patrón–aporte–dirección, Mapa de coherencia y ciclo de mantenimiento basado en desencadenantes.
- El caso integrado Proyecto Trama incluye objetivo, descripciones en conflicto, evidencia, afirmaciones sin respaldo, confidencialidad, audiencias, narrativa, CV, perfil, presentación oral, tres revisiones, coherencia, mantenimiento y decisión de no publicación.
- Recursos: dirección, audiencias, evidencia, contribución, narrativa, CV, perfil, coherencia, feedback, privacidad, actualización, autoevaluación, facilitación y consistencia bilingüe.
- Herramientas: diagnóstico, inventario, contribuciones, narrativa, lenguaje genérico, coherencia, perfil, revisión por pares, actualización y comparación de canales.
- Se reutilizaron shell, breadcrumbs, lecciones, cards, worksheets, navegación, formularios, copia, impresión, metadata, schema, analítica y CTA; se añadieron páginas y lógica especializadas cargadas de forma diferida.
- Integración: tarjeta publicada en Carrera y habilidades profesionales, catálogo de herramientas, router, interenlaces y 23 entradas de sitemap.
- Privacidad: entradas efímeras y anónimas; sin API, IA externa, scraping, almacenamiento, documentos completos ni texto libre en analítica.
- SEO: metadata única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication`, sitemap y revisión 2026-07-16.
- Analítica: hub, módulo, caso, herramienta, generación, copia, impresión y CTA; payloads limitados a slugs controlados.
- Accesibilidad: semántica, listas, labels, errores asociados, `aria-live`, foco, teclado, responsive, impresión y equivalentes textuales.
- Verificación actual: WCAG 2.2, políticas de datos estructurados y configuración/privacidad de perfiles profesionales revisadas en fuentes primarias el 16 de julio de 2026. No se publicaron afirmaciones de algoritmo o ATS.
- Originalidad auditada frente a **owner-provided research notes on professional identity, evidence, career narratives, CVs, and public profiles**; excluded source-specific references.
- Pruebas nuevas: `tests/professionalBrand.test.js` cubre módulos, conceptos, modelos, casos, recursos, herramientas, determinismo, validación, privacidad, rutas, sitemap y accesibilidad estructural.
- Verificación final: 198 pruebas aprobadas, 0 fallidas; build de producción con 1.758 módulos transformados; sitemap XML con 339 URL, 23 de esta ruta y 0 duplicados; revisión visual de hub, lección y herramienta en escritorio y móvil.
- Permanece una advertencia no bloqueante y preexistente por el chunk principal mayor a 500 kB. La ruta nueva se carga de forma diferida en un chunk independiente de 59,69 kB minificado.
- No se difirió funcionalidad. No existen scripts configurados de formatter, linter, typechecker, E2E o auditor automático de accesibilidad; estas son limitaciones de verificación del repositorio, no funciones pendientes.

## Ruta de Escucha, curiosidad y feedback

- Se añadieron `/aprende/escucha-curiosidad-feedback`, diez módulos, biblioteca de 28 casos, biblioteca de 15 recursos y diez herramientas.
- Módulos: significado de escuchar; atención; observación e inferencia; curiosidad; clarificación; reacción; evaluación; entrega de feedback; reparación; práctica integrada.
- Modelos: Ciclo de comprensión antes de respuesta, Filtro de feedback útil, Tres destinos de la atención, Fuentes de fricción y Situación–conducta–efecto–conversación.
- Exclusión explícita: no se reprodujo ni aproximó una evaluación de escucha; no hay cuestionario total, escala, rango, nivel, diagnóstico, rasgo o certificación.
- Proyecto Nexo recorre 15 etapas con relatos incompatibles, diferencia de poder, presión temporal, demora remota, subtítulos, prueba conductual y más de una resolución válida.
- Se publicaron 28 casos ficticios sobre interrupción, defensa, consejo, mensajes escritos, jerarquía, clientes, sesgo, acceso, comunicación remota, límites, escalamiento y reparación.
- Recursos: 15 fichas HTML editables/imprimibles para atención, distinción, preguntas, clarificación, resumen, fricción, evidencia, feedback, respuesta, reparación, límites, observación, facilitación, práctica y asincronía.
- Herramientas: observador, separador, constructor de preguntas, preparador, filtro, revisor, planificador de respuesta, simulador, reparación y práctica deliberada; todas locales y deterministas.
- Privacidad: sin audio, cámara, API, IA externa, almacenamiento, transcripciones o texto libre en analítica; avisos para excluir datos identificables, de salud y RR. HH.
- Seguridad: límites visibles para abuso, acoso, discriminación, amenaza, represalia y procesos formales; comunicación no sustituye canales formales o apoyo calificado.
- Accesibilidad: alternativas escritas y asincrónicas, semántica, listas, labels, errores, `aria-live`, foco, teclado, responsive e impresión; sin requisitos de mirada, postura, audio o cámara.
- Integración: tarjeta de Aprende, router, catálogo de herramientas, interenlaces, CTA real y 23 entradas de sitemap.
- SEO: metadata única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication` y revisión 2026-07-16.
- Analítica: eventos genéricos con `module`, `tool`, `category` o `destination`; nunca contenido del usuario.
- Verificación actual: WCAG 2.2, alternativas textuales, políticas de structured data y referencia laboral oficial revisadas el 16 de julio de 2026.
- Originalidad auditada frente a **owner-provided research notes on listening, curiosity, feedback, and workplace conversations**; excluded source-specific references.
- Pruebas nuevas: `tests/listeningFeedback.test.js` cubre contenido, modelos, exclusión de evaluación, accesibilidad, seguridad, casos, recursos, herramientas, rutas, sitemap y privacidad.
- Regresión final: 212 pruebas aprobadas y 0 fallidas; build de producción correcto con 1.761 módulos transformados.
- Sitemap final: 362 URL, 23 pertenecientes a esta sección y 0 duplicadas.
- Revisión visual completada en el hub, una lección integrada y una herramienta en escritorio y viewport móvil de 500 px, sin desbordes observados.
- Tamaño del build: chunk de la sección 57,40 kB minificado (18,46 kB gzip); chunk principal 523,01 kB (152,43 kB gzip), con la advertencia no bloqueante preexistente de Vite por superar 500 kB.
- No se difirió funcionalidad. El repositorio no configura scripts de formatter, linter, typechecker, E2E o auditor automático de accesibilidad; son limitaciones de verificación, no funciones pendientes.
# Ruta de Investigación de empresas

- Se añadió `/aprende/investigacion-de-empresas` con diez módulos, biblioteca de 22 casos ficticios, 15 recursos HTML y diez herramientas locales.
- Modelos originales: Mapa de evidencia empresarial e Interés, evidencia, acceso y momento; ninguna dimensión produce una puntuación universal.
- Módulos: pregunta, universo organizacional, fuentes, funcionamiento, cambios, rol, comparación, redes con límites, próximos pasos y mantenimiento.
- Proyecto Horizonte integra 15 etapas con fuentes conflictivas, marca empleadora, modelos distintos, privacidad y más de una decisión válida.
- Herramientas: pregunta de investigación, universo, fuentes, mapa empresarial, rol, comparación, contradicciones, próximos pasos, registro y privacidad.
- El comparador acepta hasta seis alternativas, pesos opcionales, estado de evidencia insuficiente y prueba de sensibilidad sin ganador automático.
- Integración: tarjeta de Aprende, router manual, catálogo de herramientas, enlaces a rutas existentes, CTA real y 23 entradas de sitemap.
- Privacidad: sin IA externa, scraping, red, audio, cámara, autenticación o almacenamiento; ningún texto libre se envía a analítica.
- Límites: no predice contratación, no califica empleadores y no ofrece asesoría legal, migratoria, financiera o de inversión.
- Accesibilidad: semántica, listas, labels, errores asociados, `aria-live`, foco heredado, teclado, controles táctiles, responsive, copia, reinicio e impresión.
- SEO: metadata única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication`, fechas y `lastReviewed`.
- Fuentes técnicas verificadas el 16 de julio de 2026: WCAG 2.2, políticas de datos estructurados de Google y vocabulario LearningResource de Schema.org.
- Originalidad auditada sobre contenido, estructura, casos, herramientas, código, pruebas, metadata, documentación, sitemap y build; excluded source-specific references.
- Pruebas específicas: 15 aprobadas, 0 fallidas. Build inicial: correcto con 1.764 módulos transformados; chunk de la sección de 61,15 kB minificado (19,02 kB gzip).
- Analítica documentada: eventos de vista, lección, caso, herramienta, finalización, copia, impresión y CTA; payloads limitados a `module`, `tool`, `category` o `destination`, nunca texto libre.
- Regresión final: 227 pruebas aprobadas y 0 fallidas. Build de producción correcto con 1.764 módulos transformados.
- Sitemap final: 385 URL, 23 de esta sección y 0 duplicadas.
- Revisión visual completada en hub, lección y comparador, en escritorio y viewport móvil de 500 px; listas visibles, jerarquía estable y sin desbordes horizontales observados.
- Build: chunk de la sección 61,15 kB minificado (19,02 kB gzip); chunk principal 526,98 kB (153,20 kB gzip), con advertencia no bloqueante de Vite al superar 500 kB.
- No se difirió funcionalidad. El repositorio no configura formatter, linter, typechecker, E2E o auditor automático de accesibilidad; son limitaciones de verificación, no funciones pendientes.

## Ruta de Trabajo en equipo

- Se añadieron el hub `/aprende/trabajo-en-equipo`, diez módulos, una biblioteca de 28 casos ficticios, 16 recursos y diez herramientas locales.
- Módulos: equipo e interdependencia; propósito y criterios; roles, dependencias y decisiones; diferencias sin etiquetas; desacuerdo; compromiso; responsabilidad compartida; aprendizaje; dinámicas difíciles; práctica integrada.
- Modelos originales: Sistema de coordinación del equipo; Preferencia, necesidad y acuerdo; Resultado, evidencia y límite; Tema, evidencia, tensión y opción.
- Proyecto Umbral recorre 16 etapas con trabajo remoto, presión temporal, poder desigual, necesidades de acceso, información incompleta, riesgos, alternativas, notas de facilitación y más de una resolución defendible.
- Los 28 casos cubren configuraciones permanentes, temporales, remotas, híbridas y multiculturales; autoridad, objetivos, carga, desacuerdo, documentación, crédito, acceso, escalamiento y cierre.
- Los 16 recursos son fichas HTML editables e imprimibles con alternativa escrita, asincrónica o remota.
- Herramientas: propósito, dependencias, derechos de decisión, acuerdos, desacuerdo, registro de decisiones, compromisos, revisión de ciclo, dinámica situacional y experimento de equipo.
- Las herramientas son deterministas, efímeras, copiables, reiniciables e imprimibles. Detectan entradas vacías o extensas, dependencias sin dueño, ciclos directos y situaciones de alto riesgo que requieren apoyo o evaluación de escalamiento.
- Integración: router manual, tarjeta publicada en Carrera y habilidades profesionales, catálogo de herramientas, interenlaces, CTA real y 23 entradas de sitemap.
- Privacidad: sin IA externa, red, grabación, audio, cámara, cuentas, persistencia ni texto libre en analítica.
- Seguridad: se distinguen desacuerdos de situaciones que pueden requerir RR. HH., canales formales, asesoría jurídica, mediación, atención clínica o protocolos de seguridad.
- Accesibilidad: semántica, listas reales, labels, errores asociados, `aria-live`, teclado, foco heredado, responsive, impresión y alternativas escritas o asincrónicas; sin contacto visual, respuesta verbal inmediata, audio o cámara obligatorios.
- SEO: títulos y descripciones únicos, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication`, fecha de revisión e indexación por sitemap.
- Analítica: eventos de hub, lección, caso, herramienta, generación, copia, impresión y CTA con dimensiones controladas; nunca se transmite contenido ingresado.
- Información actual revisada el 16 de julio de 2026 en WCAG 2.2, principios de accesibilidad W3C, Convenio 190 de la OIT y políticas de datos estructurados de Google. No se publicaron estadísticas ni asesoría jurídica local.
- Originalidad auditada sobre contenido, secuencia, modelos, casos, herramientas, código, pruebas, metadata y documentación; `excluded source-specific references`.
- Pruebas nuevas: `tests/teamwork.test.js` cubre estructura, modelos, diferencias situadas, seguridad, accesibilidad, casos, recursos, herramientas, determinismo, validación, privacidad, rutas, SEO y sitemap.
- Regresión final: 242 pruebas aprobadas y 0 fallidas. Build de producción correcto con 1.767 módulos transformados.
- Sitemap final: 408 URL, 23 pertenecientes a esta sección y 0 duplicadas.
- Revisión visual completada en hub, lección y herramienta en escritorio y viewport móvil de 500 px; bullets visibles, jerarquía estable y sin desbordes observados. También se comprobó el 404 heredado con una ruta inexistente.
- Build: chunk de la sección 59,05 kB minificado (18,24 kB gzip); chunk principal 530,64 kB (153,90 kB gzip), con la advertencia no bloqueante preexistente de Vite por superar 500 kB.
- No se difirió funcionalidad solicitada. El repositorio no configura formatter, linter, typechecker, E2E o auditor automático de accesibilidad; son límites de verificación, no funciones pendientes.
