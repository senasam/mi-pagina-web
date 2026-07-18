# Plan de implementación — Aprende, Herramientas y Networking

## Ruta de Marketing digital (2026-07-16)

- Arquitectura: extensión aditiva de React 19/Vite y del enrutamiento manual existente. `MarketingPages.jsx` reutiliza `PageShell`, breadcrumbs, metadata, lecciones, recursos, formularios, copia, impresión, navegación y CTA; no se añadieron dependencias.
- Información: `/aprende/marketing-digital`, 17 módulos y un caso integrador. El orden parte del sistema y la evidencia, pasa por canales y operación, y termina en medición, expansión y carrera.
- Originalidad: CONECTA, META, CANAL, BRIEF y CRUZA organizan decisiones sin reproducir secuencias, perfiles, evaluaciones ni casos de las **owner-provided research notes on digital marketing fundamentals**.
- Datos: `marketingContent.js` separa 17 lecciones, 32 escenarios ficticios, 31 recursos, relaciones y `lastReviewed`. `marketingTools.js` centraliza ocho herramientas y 17 definiciones de métricas.
- Herramientas: diagnóstico, estrategia, recorrido, auditoría, canales, contenidos, medición y calculadora. Toda lógica es determinista y local; no hay cuentas, API, almacenamiento remoto, scraping ni publicación.
- Neutralidad: se enseñan categorías de canal y capacidades, no interfaces ni catálogos de proveedores. Se evita afirmar que rankings, tráfico, seguidores, CTR, ROAS o IA garantizan resultados.
- Actualidad: las afirmaciones inestables se redujeron a principios; la revisión primaria cubre documentación oficial de búsqueda, W3C WCAG 2.2, divulgación comercial de FTC y guía de marketing directo de ICO. Toda obligación se presenta como dependiente de jurisdicción.
- Privacidad: formularios piden descripciones generales o ficticias, advierten contra datos personales/confidenciales y no envían texto libre a analítica. Los eventos solo registran identificadores permitidos.
- Accesibilidad: HTML semántico, jerarquía, labels, errores asociados, foco existente, `aria-live`, alternativas textuales, tablas responsivas heredadas, teclado, reducción de movimiento e impresión.
- SEO: metadata única, canonical, Open Graph/Twitter, `BreadcrumbList`, `LearningResource`, `WebApplication`, indexación y 26 entradas nuevas en sitemap.
- Pruebas: rutas, modelos, marcos, escenarios, recursos, herramientas, fórmulas, división por cero, privacidad, sitemap y regresión; build de producción obligatorio.

## Arquitectura actual

### Plan previo: Inteligencia artificial y deep learning (2026-07-16)

- Arquitectura confirmada: React 19, Vite 5, JavaScript/JSX, SPA con routing por `pathname`, npm, datos estructurados, componentes educativos compartidos y pruebas nativas de Node.
- Destino canónico nuevo: `/aprende/inteligencia-artificial-y-deep-learning`, con nueve módulos. Complementa pensamiento computacional; enlaza sistemas confiables para RAG/operación, IA responsable para impacto y IA generativa para negocio.
- Reutilización: shell, breadcrumbs, metadata, lecciones, navegación, recursos imprimibles, formularios, carga diferida, eventos cerrados y CTA real `/#services`.
- Estructuras nuevas: ruta, glosario, seis escenarios, caso integrado, siete recursos, dos marcos originales y tres herramientas con lógica pura separada.
- Herramientas: pase hacia adelante con red pequeña; curvas sintéticas reproducibles con reglas transparentes; planificador de adaptación sin texto libre ni puntuación.
- Sin dependencias ni inferencia externa. Diagramas y curvas se representarán con listas/tablas accesibles y HTML ligero; el repositorio no tiene biblioteca de gráficos activa.
- Hechos actuales: se evitaron productos, versiones, cifras, licencias y arquitecturas propietarias. Se contrastaron atención y difusión con artículos originales, seguridad de RAG con OWASP y accesibilidad con WCAG 2.2.
- Pruebas: activaciones y cálculo lineal conocidos, dimensiones, parámetros, patrones de curvas, reglas de escalación, privacidad, rutas, SEO, sitemap, suite completa, build y smoke.
- Riesgos: el routing manual exige registro explícito; no existen scripts separados de formatter, linter, tipos, E2E o auditor automático de accesibilidad. Se documentará sin desactivar controles.
- Originalidad: arquitectura, ejemplos, escenarios, marcos, recursos y lógica creados desde cero; auditoría frente a `owner-provided research material`.

### Plan previo: Pensamiento computacional y decisiones con datos (2026-07-16)

- Arquitectura descubierta: React 19 y Vite 5 en JavaScript/JSX; renderizado SPA, routing por `pathname`, npm, contenido estático estructurado, componentes educativos compartidos y herramientas deterministas con pruebas nativas de Node.
- Rutas propuestas: hub `/aprende/pensamiento-computacional-y-datos`, ocho módulos bajo el mismo prefijo y tres herramientas bajo `/herramientas` para optimización, Monte Carlo y muestreo.
- Reutilización: `PageShell`, breadcrumbs, metadata, `LessonContent`, navegación, tarjetas, recursos imprimibles, formularios, eventos cerrados, carga diferida y CTA real `/#services`.
- Modelos nuevos: ruta, módulos, glosario, caso integrado y siete recursos en datos separados; cálculo puro separado de las tres interfaces.
- Sin dependencias nuevas: la visualización se resolverá con HTML, tablas y alternativas textuales; no existe una biblioteca de gráficos activa que sea necesario incorporar.
- Límites: optimización con 3–12 elementos y capacidad entera acotada; simulación con ensayos acotados y generador seudorrandom reproducible; intervalo t con niveles aprobados y advertencias de supuestos.
- Validación prevista: casos matemáticos conocidos, desempate estable, semillas reproducibles, estadísticos muestrales, privacidad, rutas, SEO, sitemap, accesibilidad declarativa, suite completa, build y smoke HTTP.
- Riesgos: routing manual exige registrar cada familia; no hay scripts separados de formatter, linter, type checker, E2E o auditor automático de accesibilidad. Se documentarán estas ausencias sin desactivar controles.
- Originalidad: estructura, ejemplos, datos, caso, ejercicios y herramientas creados desde cero; auditoría frente a `owner-provided research material`.

### Extensión: Escalamiento y adopción de inteligencia artificial (2026-07-16)

- Ruta avanzada `/aprende/escalamiento-y-adopcion-de-ia`: continúa desde preparación organizacional hacia ejecución repetible, operación, participación distribuida, medición y retiro.
- Doce módulos, 24 casos ficticios, 22 recursos y 11 herramientas; contenido, presentación, lógica y formularios permanecen separados.
- AMPLÍA, ACUERDO, NEXO, RUMBO, PIEZA, PUENTE, ABRE, PRÁCTICA y MANDO son marcos originales y cualitativos, no una escala o certificación.
- El portafolio admite prueba, rediseño, preparación, expansión, consolidación, pausa, detención y retiro. El modelo operativo combina núcleo compartido, responsabilidad local y excepciones.
- No se publican productos, estadísticas laborales, precios, licencias, plazos ni normas específicas; no fue necesaria una afirmación actual de proveedor o regulación. La accesibilidad se contrastó con la recomendación oficial vigente WCAG 2.2.
- Herramientas locales, efímeras y sin API, persistencia o analítica de texto libre. Originalidad revisada frente a **owner-provided research notes on AI scaling, organizational adoption, and distributed enablement**.

### Extensión: IA responsable y gobernanza (2026-07-16)

- Ruta independiente `/aprende/ia-responsable-y-gobernanza` con once módulos sobre impactos, usos sensibles, equidad, privacidad, seguridad, inclusión, transparencia, supervisión, evaluación de impacto, gobierno y operación.
- Contenido en `responsibleAIContent.js`, páginas en `ResponsibleAIPages.jsx`, lógica determinista en `responsibleAITools.js` y formularios en `ResponsibleAIToolsPage.jsx`.
- CUIDADO, ALERTA, PARES, ESCUDO, ABARCA, VISIBLE, RESPALDO, HUELLA y TRAMA son marcos originales y cualitativos; no son normas, clasificaciones legales, puntuaciones ni certificaciones.
- Veinticuatro escenarios ficticios, veintidós recursos y once herramientas locales cubren desde el mapa de afectados hasta inventario, proveedor, incidentes, reparación, suspensión y retiro.
- La revisión factual usa fuentes oficiales de NIST, OECD y W3C. El contenido no formula conclusiones jurídicas, umbrales universales ni garantías de ausencia de daño.
- Los formularios son efímeros: no usan API, persistencia, cuentas ni analítica de texto libre. Las alertas pueden recomendar revisión especializada, rediseño o no despliegue.
- Originalidad revisada frente a **owner-provided research notes on responsible AI and governance**.

### Extensión: Preparación organizacional para la IA (2026-07-16)

- Ruta independiente `/aprende/preparacion-organizacional-para-ia` para portafolio, capacidades compartidas, gobierno y hoja de ruta. Complementa IA para negocios y Sistemas de IA confiables sin repetir casos individuales o arquitectura técnica.
- Once módulos y caso integrador; contenido en `orgAIContent.js`, páginas en `OrgAIPages.jsx`, lógica determinista en `orgAITools.js` y formularios en `OrgAIToolsPage.jsx`.
- PREPARA organiza dimensiones sin puntaje; NORTE conecta estrategia; IMPULSO estructura conversaciones de portafolio; CUSTODIA define gobierno proporcional. Son marcos originales, no estándares.
- El diagnóstico es descriptivo por acción y caso. El portafolio usa niveles cualitativos, dependencias y estados Explorar, Preparar, Pilotear, Operar, Expandir, Pausar o Detener.
- La revisión factual usa recursos oficiales de NIST sobre gobierno continuo, responsabilidades y ciclo de vida. No se publican productos, precios, regulaciones específicas, plataformas ni duraciones universales.
- Herramientas locales y efímeras, sin API, persistencia o analítica de texto libre. Reutiliza shell, lecciones, casos, recursos, formularios, SEO y navegación.
- Originalidad revisada frente a **owner-provided research notes on organizational AI readiness, portfolio governance, shared foundations, and adoption capabilities**.

### Extensión: Sistemas de IA confiables (2026-07-16)

- Ruta especializada `/aprende/sistemas-ia-confiables`, complementaria a IA generativa para negocios: profundiza en instrucciones, fuentes, RAG, datos, seguridad, evaluación y operación sin repetir valor, costo o adopción.
- Once módulos y un caso integrador; contenido en `reliableAIContent.js`, páginas en `ReliableAIPages.jsx`, lógica determinista en `reliableAITools.js` y formularios en `ReliableAIToolsPage.jsx`.
- FUENTE organiza el sistema; NORMA las instrucciones; VIGENTE las fuentes; PREPARA los datos; ELIGE el método; RESPONDE la operación. Son marcos prácticos originales, no estándares.
- Arquitectura RAG: identidad y permisos, ingestión, recuperación, contexto, generación, verificación, registro y feedback; recuperación y generación se evalúan por separado.
- Revisión factual: recursos oficiales de NIST sobre riesgo y ciclo de vida, artículo de investigación original de RAG y guía defensiva de OWASP sobre prompt injection. Última revisión: 2026-07-16.
- Seguridad: orientación defensiva, sin instrucciones de explotación, credenciales, certificaciones o conclusiones regulatorias. Privacidad: estado efímero, sin red, cuenta, almacenamiento o texto libre en analítica.
- Reutiliza shell, breadcrumbs, lecciones, escenarios, recursos, formularios, copia, impresión, SEO y analítica; añade carga diferida, metadata, schema y sitemap.
- Originalidad revisada frente a **owner-provided research notes on reliable AI systems, grounding, retrieval, data readiness, security, and model operations**.

### Extensión: IA generativa para negocios (2026-07-16)

- React 19/Vite, rutas por `pathname`, carga diferida, contenido y lógica separados, shell y componentes educativos compartidos.
- Hub, once módulos y caso integrador bajo `/aprende/ia-generativa-para-negocios`; nueve herramientas bajo `/herramientas`.
- VALORA organiza oportunidades; AUTORIZA revisa autonomía; GUARDA estructura gobierno. Son ayudas prácticas, no estándares.
- La ruta se concentra en valor, selección, costo total, gobierno, piloto, adopción y operación; no duplica una futura ruta de alfabetización y uso personal.
- Neutralidad: categorías genéricas, sin productos, precios, licencias o compromisos de proveedor. Auditoría frente a **owner-provided research notes on generative AI strategy and adoption**.
- Herramientas deterministas sin API, secretos, cuentas, persistencia o texto libre en analítica. Economía con inversión, operación, beneficio incremental, tres escenarios y cautelas.
- Metadata española, canonical, breadcrumbs, `LearningResource`, `WebApplication`, sitemap, labels, errores asociados, `aria-live`, teclado e impresión.

- React 19 con Vite 5 y JavaScript/JSX.
- Enrutamiento manual basado en `window.location.pathname`; no existe React Router.
- Estilos globales en `src/index.css`, con variables CSS y componentes visuales propios. Tailwind está instalado, pero la interfaz principal usa CSS convencional.
- Contenido principal y rutas educativas almacenados como objetos JavaScript; no existe CMS.
- SEO base en `index.html` y metadatos por efecto para artículos. No se detectó una integración activa de analytics en la aplicación React.
- Despliegue Vercel como SPA. El repositorio también conserva páginas HTML Bootstrap históricas.

## Páginas y rutas existentes

- `/`: página comercial React con servicios, enfoque, evidencia, credenciales, coaching, finanzas, recomendaciones y contacto.
- HTML históricos: `/about.html`, `/services.html`, `/experience.html`, `/projects.html`, `/testimonials.html` y `/contact.html`.

## Componentes y contenido reutilizables

- Navegación, botones, encabezados de sección, tarjetas de servicio, footer y tokens de color/espaciado.
- Datos de perfil, servicios, credenciales, casos y recomendaciones.
- Patrón compartido de metadatos dinámicos para las páginas educativas.

## Riesgos y restricciones

- El routing manual requiere mantener una tabla explícita y un fallback 404.
- Las rutas profundas dependen del rewrite de Vercel.
- Las páginas HTML históricas no estaban declaradas como entradas de build; se incluirán explícitamente para preservar su publicación.
- No hay infraestructura de tests ni analytics. Se añadirán pruebas con el runner nativo de Node, sin dependencias, y una capa de eventos que solo usa una integración ya presente si existe.
- La primera etapa publicó las lecciones con estados temporales para evitar indexar páginas delgadas. Esos estados fueron retirados al completar el contenido.

## Estrategia

1. Mantener la homepage y todas sus secciones y CTA; añadir una sección compacta “Aprende y aplica”.
2. Extender la navegación con Servicios, Aprende, Herramientas, Sobre mí y Contacto.
3. Crear un modelo de contenido mantenible en JavaScript para temas, módulos, recursos, herramientas, estados y relaciones.
4. Crear componentes compartidos para navegación, breadcrumbs, tarjetas, estados pendientes, metadatos, relacionados y CTA contextual.
5. Implementar `/aprende`, el hub `/aprende/networking`, cinco layouts de lección y `/herramientas`.
6. Implementar el generador local y determinista, aislando su lógica para pruebas y sin persistencia, API ni envío de datos personales.
7. Añadir metadatos dinámicos, canonical, Open Graph, datos estructurados válidos y sitemap. Las lecciones completas son indexables; las páginas futuras sin contenido sustantivo deben usar `noindex,follow`.
8. Emitir eventos seguros únicamente si ya existe `gtag`, `dataLayer` o `plausible`, sin valores introducidos por el usuario.

## Áreas previstas de cambio

- `src/App.jsx`, `src/index.css`, `vite.config.js`, `package.json`.
- Nuevos modelos, utilidades, componentes, páginas y pruebas bajo `src/` y `tests/`.
- `public/sitemap.xml` y documentación de contenido/cambios.

## Preservación

- No se elimina ni reescribe el contenido comercial, formularios/enlaces, activos, metadatos base o páginas HTML existentes.
- La CTA primaria de agenda y la posición comercial de la homepage permanecen prominentes.
- Las nuevas áreas usan los mismos tokens, botones, tipografía y patrones visuales.

## Plan de validación

- Pruebas unitarias del modelo y generador.
- Build de producción y revisión de salidas HTML.
- Comprobación estática de rutas, metadatos, enlaces, estados pendientes y ausencia de transmisión/persistencia de datos del formulario.
- Smoke test manual con servidor local para rutas principales y profundas.

## Finalización del contenido de Networking

- Las ideas de investigación se reorganizaron en fundamentos, construcción de red, entrevistas informativas, conversaciones informales y barreras prácticas.
- Los cinco módulos incorporan lecciones originales, objetivos, ejercicios, ejemplos, checklists y enlaces relacionados en `src/networkingContent.js`.
- Se activaron cinco plantillas, un checklist y dos hojas de trabajo efímeras. No fue necesario crear nuevas rutas ni un sistema editorial paralelo.
- El generador conserva su arquitectura local y ahora incluye el contexto específico también en mensajes cortos.
- Se excluyeron porcentajes sobre contratación, garantías de referencias o empleo, generalizaciones sobre profesionales según su jerarquía, interpretaciones rígidas de lenguaje corporal y afirmaciones psicológicas.
- Las lecciones tienen tiempos de lectura estimados, fecha real de actualización, schema `LearningResource`, URLs en sitemap y estado indexable.

## Biblioteca de Consultoría

- Se incorpora como segunda ruta temática dentro de la arquitectura existente, sin crear otro sistema editorial ni alterar Networking.
- El contenido vive en `src/consultingContent.js`: ocho módulos, metadatos, relaciones y catorce recursos activos.
- La secuencia pedagógica avanza desde comprensión de la carrera y selección de firmas hacia CV, casos, estimaciones, entrevistas conductuales, networking y planificación.
- Los ejemplos, mini-casos, plantillas y ejercicios se redactaron específicamente para masanes.cl. Se excluyeron referencias específicas del material de investigación y no se conservaron su orden ni sus metadatos.
- Las condiciones de firmas, oficinas, roles, calendarios y formatos se presentan como variables que requieren verificación oficial; no se publican rankings, tasas ni promesas.
- El constructor de bullets es determinista y local. No usa API ni persistencia y solo incorpora métricas escritas por la persona.
- Cada ruta usa breadcrumbs, canonical, metadatos sociales y schema educativo. El hub, los ocho módulos y la herramienta se agregan al sitemap.
- La validación cubre estructura, relaciones, publicación, SEO único y reglas de generación; se complementa con build y smoke test de rutas profundas.

## Ruta interna de Entrevistas de caso

- La antigua lección breve conserva `/aprende/consultoria/entrevistas-de-caso`, pero ahora funciona como hub de una ruta interna con doce capítulos. El módulo general de Consultoría sigue enlazando al mismo destino.
- `src/caseInterviewContent.js` separa presentación y contenido: ruta, capítulos, recursos y casos siguen modelos estructurados en JavaScript, coherentes con el stack existente.
- `src/CaseInterviewPages.jsx` reutiliza shell, breadcrumbs, metadata, navegación de lecciones, recursos, checklists, worksheets, CTA y componentes pedagógicos. Añade mapa del caso, biblioteca ficticia y exhibits accesibles.
- Se crearon quince casos ficticios, distribuidos en doce categorías. Cada registro declara objetivo, hechos, estructura posible, exhibit con resumen textual, cálculo, brainstorming, recomendación, guía e insights.
- Los capítulos cubren definición del problema, hipótesis, issue trees, lentes, exhibits, matemática, market sizing, brainstorming, síntesis, taxonomía, experimentación, fit y práctica.
- `src/caseTools.js` mantiene lógica determinista separada de `src/CaseToolsPage.jsx`. Cuatro herramientas funcionan sin API: práctica de estimación, diseño de experimento, estructura editable y tracker efímero.
- Ningún texto libre se envía a analytics. El tracker vive únicamente en el estado de la página y lo informa antes de usarse.
- Cada capítulo tiene metadata, canonical, breadcrumbs y `LearningResource`; cada herramienta usa `WebApplication`. Las diecisiete rutas nuevas se incorporan al sitemap.
- Originalidad: las organizaciones, cifras, prompts, exhibits e insights se escribieron para esta ruta; no se almacenan documentos privados, guiones personales ni material propietario.
- Validación: pruebas de datos y lógica, build, smoke test de hub/capítulos/tools, revisión responsive, metadata, consola, privacidad y búsquedas de exclusión.

## Ruta de Adaptabilidad y resiliencia

- Se incorpora como tema publicado bajo Liderazgo y ejecución, con hub, seis módulos, doce escenarios, once recursos y cinco herramientas locales.
- `src/adaptabilityContent.js` mantiene ruta, lecciones, escenarios y recursos separados de la UI. `src/AdaptabilityPages.jsx` reutiliza shell, breadcrumbs, lecciones, metadata, navegación, recursos y CTA.
- Los modelos Aprender–Ajustar–Sostener, OPA y HECA se presentan como herramientas prácticas propias de la guía, no como verdades psicológicas universales.
- Los escenarios usan personas, organizaciones, decisiones, restricciones y acciones ficticias. La ruta no almacena notas de investigación ni material de cursos.
- Se omitieron porcentajes, plazos universales de hábitos, causalidades psicológicas, neurología y promesas de desempeño. El contenido se concentra en reflexión y conducta profesional.
- `src/adaptabilityTools.js` contiene validación y generación determinista; `src/AdaptabilityToolsPage.jsx` renderiza formularios, copia, reset, impresión y privacidad.
- Ninguna herramienta usa API, autenticación, almacenamiento o analytics con texto libre. El diario es efímero y desaparece al recargar.
- Las páginas se cargan con `React.lazy` para no aumentar innecesariamente el bundle inicial.
- Hub, seis lecciones y cinco herramientas tienen canonical, metadata social, schema, sitemap e indexación.
- La validación incluye datos, relaciones, lógica, privacidad, routing, smoke tests de navegador, visual responsive, build y auditoría de originalidad.

## Ruta de Resolución de problemas

- Arquitectura existente: React 19 con Vite, rutas por `pathname`, contenido estructurado en módulos JavaScript, componentes compartidos de aprendizaje, metadata dinámica y analítica con dimensiones permitidas.
- La ruta se incorpora en `/aprende/resolucion-de-problemas` con ocho lecciones, un caso integrador, doce problemas ficticios y catorce recursos. Reutiliza shell, breadcrumbs, navegación, contenido, recursos, checklists, formularios, copia, impresión y CTA.
- `src/problemSolvingContent.js` separa el contenido de `src/ProblemSolvingPages.jsx`. `src/problemSolvingTools.js` mantiene reglas deterministas separadas de `src/ProblemSolvingToolsPage.jsx`.
- Herramientas: diagnóstico de profundidad, definición, árbol lógico accesible, priorización VERA, plan de trabajo, recomendación y revisión de decisión. No requieren API, cuenta ni persistencia.
- Originalidad: arquitectura, redacción, casos, organizaciones, ejercicios y plantillas se construyen de forma independiente. La revisión se realiza contra **owner-provided research notes on structured problem solving**.
- Integridad factual: los marcos son ayudas prácticas; se evita prometer resultados, asignar precisión falsa o retrasar acciones urgentes. Se separan hechos, supuestos, estimaciones, interpretaciones e incógnitas.
- Privacidad: las entradas quedan en estado efímero del navegador. Analítica recibe solo identificadores cerrados de ruta, módulo, herramienta, recurso o destino.
- SEO: `LearningResource` para hub/lecciones, `WebApplication` para herramientas, metadata social, canonical, breadcrumbs, indexación y sitemap.
- Pruebas: integridad de contenido y relaciones, lógica y validación de herramientas, privacidad, rutas, sitemap, build y smoke tests de navegador.

## Ruta de Comunicación profesional

- Se integra bajo `/aprende/comunicacion-profesional` en React 19/Vite, respetando el enrutamiento por `pathname` y la carga diferida existente.
- `src/communicationContent.js` contiene nueve lecciones, quince escenarios ficticios y quince recursos; `src/CommunicationPages.jsx` reutiliza shell, breadcrumbs, lecciones, recursos, navegación, metadata y CTA.
- MAREA organiza la ruta; CAPTA, FIN, DICA, NÚCLEO, CAMBIO, VIVA y AFO se presentan como ayudas prácticas originales, flexibles y no científicas.
- `src/communicationTools.js` mantiene lógica determinista y testeable; `src/CommunicationToolsPage.jsx` comparte una UI accesible para ocho herramientas.
- Privacidad: inputs efímeros, sin API, cuentas o persistencia. Analítica recibe únicamente slugs controlados de módulo, herramienta, recurso o destino.
- Accesibilidad: formularios etiquetados, errores asociados, `aria-live`, teclado, accordions nativos, contenido textual para visuales, impresión y alternativas que no requieren cámara, micrófono ni arrastre.
- SEO: metadata española única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication`, indexación y dieciocho entradas de sitemap.
- Originalidad: estructura, marcos, ejemplos, diálogos, escenarios, ejercicios y plantillas se redactan de manera independiente. La auditoría interna usa exclusivamente **owner-provided research notes on professional communication**.
- Validación prevista: modelos, contenido, relaciones, herramientas, privacidad, sitemap, renderizado en navegador, regresión y build.

## Ruta de Relaciones y bienestar

- Se integra en React 19/Vite mediante `/aprende/relaciones-y-bienestar`, nueve lecciones y carga diferida, sin modificar el router o las rutas existentes.
- `src/wellbeingContent.js` contiene ruta, lecciones, quince escenarios ficticios, quince recursos y avisos; `src/WellbeingPages.jsx` reutiliza shell, breadcrumbs, cards, lecciones, recursos, navegación, metadata y CTA.
- CUIDA organiza la ruta; PASO, LÍMITE, CERCA, HABLAR, VOCES y EQUIPO son estructuras prácticas originales, flexibles y no clínicas.
- Salud y seguridad: avisos visibles, sin diagnóstico, tratamiento, puntaje, prescripción o promesa. Poder, represalia, acoso, discriminación y riesgo desvían hacia apoyo formal o calificado.
- Integridad factual: no se incorporan cifras universales, causalidad médica, neurociencia, productividad ni beneficios de salud sin evidencia. La responsabilidad personal, relacional y organizacional permanece separada.
- `src/wellbeingTools.js` mantiene lógica determinista; `src/WellbeingToolsPage.jsx` ofrece nueve formularios efímeros con validación, copia, impresión, advertencias y controles accesibles.
- Privacidad: no se solicitan nombres, empleadores, diagnósticos o información médica; no hay red, cuenta, almacenamiento ni analítica con texto libre.
- SEO: `LearningResource`, `WebApplication`, metadata social, canonical, breadcrumbs, indexación y diecinueve entradas de sitemap; no se usa schema médico.
- Originalidad: arquitectura, marcos, escenarios, ejercicios, casos y recursos se revisan frente a **owner-provided research notes on relationships, workplace wellbeing, and team dynamics**.
- Validación: datos, relaciones, herramientas, avisos, privacidad, accesibilidad estructural, sitemap, navegador, regresión y build.

## Ruta de Prospección B2B

- Se extiende React 19/Vite y el router manual existente con un hub, catorce módulos y ocho herramientas cargadas de forma diferida.
- prospectingContent.js separa ruta, lecciones, 35 escenarios ficticios, 28 recursos y enlaces; ProspectingPages.jsx reutiliza shell, navegación, tarjetas, lecciones, formularios, SEO y CTA.
- REUNIÓN organiza la ruta; FOCO, PISTA, CAMBIO, CLAVE, RITMO, ESCUCHA, PUERTA y DATOS sirven como ayudas prácticas, flexibles y sin garantía. CLAVE evita colisionar con un marco ABRE ya publicado.
- La prospección se limita a selección, investigación, primer contacto y creación de oportunidades; no sustituye descubrimiento, propuesta, negociación o cierre.
- Ética: relevancia antes que volumen, hipótesis antes que afirmación, datos obtenidos legítimamente, rechazo y exclusión respetados, y reglas explícitas para no contactar, pausar o terminar.
- prospectingTools.js contiene lógica determinista separada. Los formularios no envían, llaman, extraen, enriquecen, conectan plataformas, almacenan entradas ni invocan IA externa.
- La calculadora encadena meta, valor, tasas y volumen con rangos; el tablero declara cada numerador y denominador y trata la división por cero como no calculable.
- Privacidad y analítica: entradas efímeras, aviso para no usar datos identificables o confidenciales y eventos limitados a slugs controlados.
- Accesibilidad: HTML semántico, labels, errores asociados, aria-live, secuencias con representación textual, controles de teclado, copia, impresión y estilos responsive heredados.
- SEO: metadata única, canonical, Open Graph, Twitter, breadcrumbs, LearningResource, WebApplication, indexación y 23 URLs nuevas en sitemap.
- Información actual: las lecciones temporales usan lastReviewed: 2026-07-16; se revisaron políticas oficiales de LinkedIn y guías regulatorias oficiales sobre contacto comercial, evitando reglas jurídicas universales.
- Originalidad: arquitectura, marcos, casos, ejercicios, mensajes y herramientas se auditan contra **owner-provided research notes on B2B prospecting and first-meeting generation**.
- Validación: pruebas de contenido, rutas, herramientas, privacidad, fórmulas, sitemap, accesibilidad estructural, renderizado, regresión y build.

## Ruta de Entrevistas informativas

- Arquitectura: ampliar la SPA React 19/Vite y su router manual con un hub en `/aprende/entrevistas-informativas`, diez módulos, bibliotecas de casos y recursos, y diez herramientas bajo `/herramientas`.
- Integración: publicar la tarjeta dentro de Carrera y habilidades profesionales; enlazar Networking, Comunicación profesional, Adaptabilidad y Resolución de problemas; conservar las rutas y componentes existentes.
- Componentes reutilizados: `PageShell`, breadcrumbs, cards, contenido de lección, navegación anterior/siguiente, metadata, datos estructurados, analítica y CTA. Componentes nuevos: páginas especializadas de hub, lección, bibliotecas y formulario común de herramientas.
- Contenido: distinguir conversación de aprendizaje, selección y solicitud de empleo; desarrollar propósito, perspectivas, investigación, invitación, conversación, escucha, eventos, registro, práctica integrada y biblioteca.
- Modelos originales: Mapa de conversación con propósito, Escala de profundidad de preguntas y Contexto, motivo y salida fácil. Se presentan como ayudas flexibles, no estándares ni garantías.
- Práctica: 24 casos ficticios, un caso integrado de 16 etapas y 12 recursos editables o imprimibles. Cada caso está identificado como ficción educativa.
- Herramientas: diez utilidades deterministas y locales con validación, resultado textual, copia, reinicio e impresión; sin red, persistencia, cuentas ni evaluación automática de personas.
- Privacidad: no pedir nombres, empleadores, perfiles, correos, teléfonos, mensajes confidenciales ni datos sensibles. La analítica recibe solo `tool`, `module`, `category` y `destination` controlados.
- Accesibilidad: estructura semántica, títulos jerárquicos, listas reales, labels, errores asociados, `aria-live`, foco visible, teclado, salida textual y estilos responsive/impresión.
- SEO: metadata española única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication` y 23 URL nuevas en sitemap con revisión 2026-07-16.
- Información actual: verificar accesibilidad, datos estructurados y límites de automatización con documentación primaria; no publicar estadísticas, reglas universales ni promesas de contratación.
- Originalidad: auditar estructura, redacción, modelos, casos, diálogos, ejemplos, plantillas y CTA frente a **owner-provided research notes on informational interviews and professional learning conversations**. Reescribir cualquier similitud sustantiva y excluir referencias específicas de la fuente.
- Validación: pruebas de contenido, rutas, modelos, casos, recursos, herramientas, privacidad, accesibilidad estructural, SEO, sitemap, regresión y build; además, revisión visual de hub, módulo y herramienta.
- Mapa interno: hub → diez módulos; módulos → herramientas pertinentes; hub → casos, recursos y Coaching Profesional; módulo 10 → Networking, Comunicación, Adaptabilidad y Resolución de problemas; Aprende y catálogo de herramientas → nuevas entradas.

## Ruta de Marca profesional

- Arquitectura encontrada: SPA React 19/Vite 5, router manual en `App.jsx`, contenido estructurado en módulos JavaScript, páginas educativas cargadas con `lazy`, componentes compartidos en `LearningComponents.jsx`, metadata en `seo.js`, analítica filtrada en `analytics.js` y pruebas `node:test`.
- Rutas relacionadas: `/aprende/entrevistas-informativas`, `/aprende/networking`, `/aprende/comunicacion-profesional`, `/aprende/adaptabilidad-resiliencia`, `/aprende/consultoria` y `/aprende/resolucion-de-problemas`. No existen rutas publicadas específicas de búsqueda laboral o CV, por lo que no se inventarán enlaces.
- Integración: publicar `/aprende/marca-profesional` en Carrera y habilidades profesionales; añadir diez módulos, bibliotecas de casos y recursos, y diez herramientas en `/herramientas`; preservar rutas y orden general existentes.
- Componentes reutilizados: `PageShell`, breadcrumbs, cards, contenido de lección, metadata, navegación, formularios, copia, impresión, estados y CTA. Componentes nuevos: páginas de hub, módulos, casos, recursos y formulario común especializado.
- Contenido: definir identidad, reputación, posicionamiento, narrativa, evidencia, visibilidad y coherencia; cubrir dirección, evidencia, narrativa, CV, perfil público, canales, revisión, mantenimiento y práctica integrada.
- Modelos originales: Sistema de señales profesionales; Cadena afirmación–prueba–contexto; Origen, patrón, aporte y dirección; Mapa de coherencia; ciclo Capturar, verificar, seleccionar, actualizar, comparar y retirar. Todos incluirán límites de uso.
- Casos y recursos: 26 casos ficticios, un caso integrado de 15 etapas y 14 recursos HTML imprimibles con recordatorios de privacidad.
- Herramientas: diez utilidades deterministas locales, sin IA externa, red, almacenamiento o texto libre en analítica. Validación común, salida textual, copia, reinicio e impresión.
- Información actual: mantener orientación general neutral; verificar WCAG 2.2, datos estructurados y controles actuales de visibilidad/perfil con fuentes primarias. No publicar afirmaciones sobre algoritmos, ATS o resultados laborales.
- Privacidad: no solicitar nombres, empleadores, datos de contacto, documentos completos ni información confidencial; recomendar anonimización y niveles de divulgación; analítica limitada a slugs controlados.
- Accesibilidad: semántica, listas reales, labels, errores asociados, `aria-live`, teclado, foco, impresión, responsive y equivalentes textuales. El repositorio no incluye auditor automático de accesibilidad.
- SEO: metadata única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication`, sitemap, fechas reales e interenlaces válidos.
- Analítica: eventos genéricos de hub, módulo, caso, herramienta, generación, copia, impresión y CTA con `module`, `tool`, `category` o `destination`; nunca entradas ni resultados.
- Pruebas: contenido, marcos, casos, herramientas, determinismo, validación, privacidad, rutas, catálogo, SEO, sitemap y accesibilidad estructural; regresión completa y build. No hay scripts de formatter, linter, typechecker o E2E.
- Originalidad: auditar redacción, estructura, modelos, casos, ejercicios, herramientas, metadata, documentación y build frente a **owner-provided research notes on professional identity, evidence, career narratives, CVs, and public profiles**.
- Mapa interno: hub → diez módulos, casos, recursos y herramientas; módulos → herramienta y recurso pertinentes; CV/perfil → Comunicación y Consultoría; revisión → Comunicación; transición → Adaptabilidad; conversaciones → Entrevistas informativas y Networking; CTA final → servicio real de Coaching Profesional en `/#services`.

## Ruta de Escucha, curiosidad y feedback

- Arquitectura: ampliar la SPA React 19/Vite y el router manual con un hub en `/aprende/escucha-curiosidad-feedback`, diez módulos, bibliotecas y diez herramientas cargadas de forma diferida. Reutilizar `PageShell`, breadcrumbs, lecciones, cards, worksheets, formularios, SEO, analítica y CTA.
- Integración: publicar en Carrera y habilidades profesionales y enlazar Comunicación profesional, Entrevistas informativas, Marca profesional, Networking, Relaciones y bienestar, Adaptabilidad, Resolución de problemas y Coaching. No inventar rutas específicas de liderazgo, conflicto o RR. HH. que no existen.
- Arquitectura editorial: separar escucha, curiosidad y feedback; avanzar desde atención y distinción hacia clarificación, reacción, evaluación, entrega, reparación y práctica integrada.
- Modelos originales: Ciclo de comprensión antes de respuesta; Filtro de feedback útil; Tres destinos de la atención; Fuentes de fricción; Situación–conducta–efecto–conversación; secuencia de reparación. Ninguno será jerarquía, diagnóstico, certificación o regla universal.
- Exclusión de evaluación: no reproducir ni aproximar cuestionarios, escalas, puntuaciones, rangos, etiquetas de desempeño o afirmaciones del material suministrado. Las herramientas observarán situaciones y conductas sin total, nivel o rasgo.
- Contenido: diez lecciones sustantivas, 28 casos ficticios, un caso integrado de 15 etapas y 15 recursos HTML editables/imprimibles.
- Herramientas: diez utilidades deterministas para atención, observación, curiosidad, preparación, filtro, entrega, respuesta, simulación, reparación y práctica; sin audio, cámara, IA externa, red, persistencia o texto libre en analítica.
- Seguridad: escuchar no exige tolerar abuso; curiosidad no autoriza invasión; feedback no diagnostica identidad o salud. Acoso, discriminación, amenaza, represalia, disciplina formal o riesgo pueden requerir documentación, canal formal, apoyo calificado o salida.
- Accesibilidad y neurodiversidad: no equiparar escucha con mirada, postura, quietud, expresividad, velocidad o comunicación oral. Incluir notas, pausas, subtítulos, agenda, repetición, escritura, asincronía y menor carga sensorial como apoyos posibles.
- Privacidad: formularios efímeros y anónimos; no pedir transcripciones, nombres, empleadores, conflictos identificables, datos de salud o RR. HH. Analítica limitada a slugs controlados.
- Información actual: verificar WCAG 2.2, alternativas textuales, structured data y límites laborales generales con fuentes primarias; evitar doctrina legal, clínica, neurocientífica o causal.
- SEO: metadata única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication`, sitemap y revisión 2026-07-16.
- Pruebas: contenido, modelos, exclusión de evaluación, casos, herramientas, determinismo, seguridad, privacidad, rutas, catálogo, sitemap, SEO y accesibilidad estructural; regresión y build. No existen scripts de formatter, linter, typechecker, E2E o auditor automático de accesibilidad.
- Originalidad: auditar estructura, modelos, casos, preguntas, herramientas, variables, metadata, documentación y build frente a **owner-provided research notes on listening, curiosity, feedback, and workplace conversations**.
- Mapa interno: hub → módulos/casos/recursos/herramientas; escucha y curiosidad → Entrevistas informativas y Comunicación; feedback externo → Marca profesional; límites y seguridad → Relaciones y bienestar; práctica → Adaptabilidad; decisiones → Resolución de problemas; CTA final → Coaching Profesional en `/#services`.
# Plan de implementación: Investigación de empresas

## Arquitectura encontrada

- React 19 y Vite 5, SPA con resolución manual de rutas en `src/App.jsx`.
- `/aprende` se alimenta desde `src/contentData.js`; las rutas extensas separan contenido, presentación y lógica de herramientas.
- `LearningComponents.jsx` aporta shell, breadcrumbs, lecciones, recursos, navegación, copia y tarjetas; `seo.js` centraliza metadata y JSON-LD; `analytics.js` filtra eventos genéricos.
- No hay CMS, autenticación ni almacenamiento remoto. Las pruebas usan `node --test`. No existen scripts separados de formatter, linter, typechecker, E2E o auditor automático de accesibilidad.

## Integración y rutas

- Ruta elegida: `/aprende/investigacion-de-empresas`, coherente con las rutas temáticas existentes.
- Se preservan todas las rutas y se enlaza solo contenido confirmado: entrevistas informativas, marca profesional, escucha y feedback, networking, comunicación, resolución de problemas, pensamiento computacional y servicios reales en `/#services`.
- Nuevos componentes: contenido estructurado, lógica determinista de herramientas y páginas de hub, módulos, casos, recursos y herramientas.
- Mapa interno: fuentes → entrevistas informativas; implicación profesional → marca profesional; conversaciones → escucha y feedback; comparación → resolución de problemas; registro → pensamiento computacional y datos.

## Arquitectura editorial y originalidad

- Diez módulos reorganizados alrededor de una decisión profesional, evidencia, contexto organizacional, comparación y mantenimiento.
- Modelos propios: “Mapa de evidencia empresarial” e “Interés, evidencia, acceso y momento”, sin puntuación universal.
- Casos, nombres ficticios, ejercicios, plantillas, lógica de comparación y conclusiones se escribirán desde cero.
- La auditoría abarcará interfaz, código, nombres internos, pruebas, documentación, sitemap y build. Solo se usará la expresión `excluded source-specific references` para referirse al material excluido.

## Información actual y límites

- Se evitan empresas reales, rankings, vacantes, políticas laborales, productos, plataformas y afirmaciones de contratación que puedan caducar.
- Las únicas referencias actuales serán fuentes primarias para accesibilidad, privacidad, SEO y datos estructurados, con revisión real del 16 de julio de 2026.
- La investigación se limitará a organizaciones, roles y evidencia pública. Se desalientan scraping, dossiers personales, bases de contactos, engaño, rumores y solicitudes de información confidencial.
- No se ofrecerá asesoría legal, migratoria o de inversión ni predicción de contratación.

## Frameworks, casos, recursos y herramientas

- Diez módulos, un caso integrado en 15 etapas y entre 20 y 26 casos breves con etiqueta ficticia obligatoria.
- Quince recursos HTML imprimibles con fecha, confianza, minimización de datos y recordatorio de privacidad.
- Diez herramientas locales: pregunta, universo, fuentes, mapa empresarial, rol, comparación, contradicciones, próximos pasos, registro y privacidad.
- La comparación mantendrá incertidumbre, pesos opcionales y sensibilidad sin elegir automáticamente un ganador.

## Privacidad, accesibilidad, SEO y analítica

- Sin IA externa, scraping, red, autenticación, audio, cámara o almacenamiento. Ningún texto libre se enviará a analítica.
- Formularios con labels, errores asociados, `aria-live`, foco visible, controles táctiles, copia, reinicio, impresión, diseño responsive y movimiento reducido heredado.
- Metadata única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication`, fechas y sitemap.
- Eventos permitidos: vista, apertura, finalización, copia, impresión y CTA, solo con identificadores genéricos.

## Pruebas y restricciones

- Se probarán rutas, contenido, etiquetas, fechas, modelos, privacidad, resultados deterministas, estados insuficientes, pesos opcionales, sensibilidad, SEO, sitemap y regresión completa.
- Se ejecutarán `npm test` y `npm run build`, además de auditorías textuales y revisión visual responsive.
- Se documentarán por separado advertencias preexistentes y verificaciones no disponibles en el repositorio.
# Plan de implementación: Trabajo en equipo

## Arquitectura e integración encontradas

- Stack React 19 + Vite 5, SPA con resolución manual en `src/App.jsx`, catálogo de Aprende y Herramientas en `src/contentData.js` y pruebas con `node --test`.
- Se reutilizarán `PageShell`, breadcrumbs, lecciones, navegación, recursos, tarjetas, copia, metadata, JSON-LD y analítica segura. No hay CMS, autenticación ni almacenamiento remoto.
- Ruta coherente con el repositorio: `/aprende/trabajo-en-equipo`. Será aditiva y pertenecerá a “Carrera y habilidades profesionales”.
- Enlaces confirmados: escucha y feedback, comunicación profesional, relaciones y bienestar, resolución de problemas, investigación de empresas, marca profesional y entrevistas informativas. CTA real: `/#services`.

## Arquitectura editorial y exclusiones

- Diez módulos desde la interdependencia hasta la práctica integrada; cada uno tendrá propósito, distinciones, errores, caso, reflexión, ejercicio, recurso, herramienta, enlaces y límites.
- Se excluyen por completo tipologías, clasificación de personas, inferencias de rasgos, puntuaciones globales y modelos causales o visuales procedentes del material privado.
- Los modelos propios serán Sistema de coordinación del equipo; Preferencia, necesidad y acuerdo; Resultado, evidencia y límite; y Tema, evidencia, tensión y opción.
- La auditoría estructural abarcará secuencia, modelos, casos, ejercicios, herramientas, lógica, visuales, código, pruebas, metadata, documentación, sitemap y build. Solo se empleará `excluded source-specific references`.

## Casos, recursos y herramientas

- Un caso integrado en 16 etapas, 28 casos breves etiquetados y 16 recursos HTML editables e imprimibles.
- Diez herramientas deterministas: propósito, dependencias, decisión, acuerdos, desacuerdo, registro de decisión, compromisos, revisión de ciclo, dinámica situacional y experimento.
- Cada herramienta tendrá validación, vacío, error, copia, reinicio, impresión, `aria-live`, privacidad y límites. Sin IA, grabación, cámara, audio, red, autenticación, persistencia ni texto libre en analítica.
- Toda reflexión sobre diferencias mostrará el aviso obligatorio de situación concreta y nunca podrá usarse para selección, promoción o exclusión.

## Poder, seguridad, accesibilidad e información actual

- Se distinguirán desacuerdo, agresión, responsabilidad, culpa, vigilancia y procesos formales. Se explicarán opciones de reparar, documentar, escalar, pedir apoyo o salir.
- Las técnicas no sustituirán RR. HH., canales formales, asesoría legal, mediación profesional, atención clínica o protocolos de seguridad.
- Se ofrecerán alternativas escritas, asincrónicas y remotas; no se exigirá contacto visual, respuesta inmediata, revelación personal ni participación verbal.
- Se evitarán afirmaciones temporales sobre plataformas, legislación o prácticas universales. Se revisarán fuentes primarias de accesibilidad, violencia y acoso laboral y datos estructurados el 16 de julio de 2026.

## SEO, analítica, pruebas y restricciones

- Metadata única, canonical, Open Graph, Twitter, breadcrumbs, `LearningResource`, `WebApplication`, fechas reales y 23 URL de sitemap.
- Eventos genéricos limitados a `module`, `tool`, `category` o `destination`; nunca nombres, conflictos, decisiones o texto libre.
- Pruebas de contenido, casos, aviso de no clasificación, seguridad, privacidad, determinismo, estados críticos, rutas, sitemap, SEO y accesibilidad estructural; después regresión completa y build.
- El repositorio no configura scripts separados de formatter, linter, typechecker, E2E o auditor automático de accesibilidad; se documentará esta limitación y se hará revisión visual responsive.
# Calculadora hipotecaria y recurso educativo — plan de implementación (2026-07-18)

## Arquitectura descubierta antes de implementar

- Aplicación React 19 en JavaScript/JSX, compilada con Vite 5 y npm (`package-lock.json`). El despliegue principal es una SPA en Vercel, con reescritura a `index.html`; también se conservan páginas HTML históricas como entradas multipágina de Vite.
- El enrutamiento React es manual y aditivo, mediante `window.location.pathname` en `src/App.jsx`. `/herramientas` y `/aprende` son índices React; las familias temáticas usan módulos de contenido, páginas y herramientas cargadas con `lazy`/`Suspense`.
- La interfaz reutiliza `PageShell`, navegación, breadcrumbs, CTA, cards y botones de `LearningComponents.jsx`. Los estilos viven en `src/index.css`: variables CSS, tipografía sans-serif del sistema, contenedores de ancho máximo, grids adaptables, foco visible, `prefers-reduced-motion` e impresión. Tailwind está instalado pero esta interfaz usa CSS convencional.
- No hay librerías de formularios, validación, tablas, pestañas, acordeones o gráficos. Los formularios existentes usan estado React, validación propia, HTML semántico, `details`, tablas y mensajes `aria-live`. Los iconos son `lucide-react`.
- `usePageMetadata` administra title, description, canonical, Open Graph, Twitter, robots y JSON-LD; `breadcrumbSchema` crea breadcrumbs. El sitemap es XML estático en `public/sitemap.xml`.
- `trackEvent` reutiliza `window.gtag` cuando existe y limita las dimensiones a contexto no sensible. No se detectó proveedor de monitoreo de errores ni captura de sesión. La convención de privacidad es estado efímero, sin persistencia ni datos introducidos en eventos.
- La suite usa `node:test` y `node:assert`; `npm test` ejecuta pruebas unitarias/integración estructural. No existen scripts configurados de formatter, linter, type checker, E2E o auditor automático de accesibilidad.
- No existe una API de aplicación previa ni caché server-side. Vercel permite añadir una función en `api/` sin exponer secretos al bundle. Para desarrollo y preview, `vite.config.js` monta la misma resolución UF como middleware exclusivamente server-side. No se encontró integración previa de indicadores oficiales.
- El sitio ya ofrece servicios reales de “Finanzas Personales y Pymes” y contacto/agenda; el CTA final enlazará a `/services.html` o `/#contact`, sin inventar servicios hipotecarios.
- La búsqueda de `PRECIO` en el repositorio no encontró una colisión conceptual. Se usará **PRECIO — Propiedad, Recursos, Endeudamiento, Crédito, Inicio y Observación**, explicitando que es un organizador práctico propio y no un estándar.

## Enfoque de integración

- Rutas nuevas: `/herramientas/calculadora-hipotecaria` y `/aprende/finanzas-personales/como-evaluar-un-credito-hipotecario`; actualización aditiva de los índices, `App.jsx` y sitemap.
- Motor puro en `src/mortgageEngine.js`: normalización chilena, tasas efectiva/nominal, cuota de anualidad (incluido 0%), base financiable, seguros configurables, gastos editables, tabla exacta, ajuste final, agregación anual, carga del hogar, solver por bisección y TIR del flujo. Números con precisión completa, tolerancia UF `1e-6` y redondeo solo al presentar.
- UI en `src/MortgageCalculatorPage.jsx`: dos modos sobre el mismo motor, cálculo explícito, errores vinculados, supuestos editables, resultados, escenarios locales no persistentes, gráfico SVG mensual de cuota/composición con detalle por puntero y teclado, resumen anual, detalle mensual progresivo, copia, impresión y reinicio.
- Contenido en `src/MortgageLearningPage.jsx`: guía original, doce casos ficticios y un caso integrador resuelto. Reutilizará shell, breadcrumbs, CTA, SEO y analítica.
- UF en `api/indicadores/uf.js`: solicitud server-side con timeout, validación centralizada, CMF cuando exista `CMF_API_KEY`, fallback secundario documentado, contrato estable y caché HTTP diaria con `stale-while-revalidate`. La UI conserva el último valor válido solo durante la sesión y siempre permite entrada manual; nunca inventa una UF.
- La conversión CLP usa exclusivamente la UF seleccionada y se presenta como equivalencia de la simulación, no como pesos futuros fijos.

## Decisiones financieras

- La base financiable será el menor valor entre precio comercial y tasación cuando esta exista. Capital = base × financiamiento. Pie mínimo = precio comercial − capital.
- Convenciones: tasa anual efectiva ajustada a base 365/360 y convertida con `((1 + r)^(365/360))^(1/12) - 1`; tasa nominal anual con capitalización mensual convertida con `r/12`. Frecuencia mensual fija.
- La tabla tendrá exactamente `termMonths`; interés sobre saldo inicial, amortización acotada al saldo, último pago ajustado y saldo final cero dentro de tolerancia. Seguros se calculan separados: desgravamen sobre saldo inicial del período por persona asegurada y incendio/sismo sobre la base seleccionada; ambos supuestos son editables y referenciales.
- Gastos iniciales serán categorías editables (UF fija, CLP fijo o porcentaje), inicialmente en cero para no presentar coeficientes como universales. El corretaje se modelará aparte cuando corresponda.
- La capacidad usa ingreso × umbral − obligaciones existentes. El ingreso orientativo divide pago total más obligaciones por el umbral. El modo inverso emplea bisección acotada, finita y determinista.
- Se calculará, solo cuando exista una raíz válida, una **tasa anual equivalente estimada del flujo**; no se denominará CAE oficial. Se declararán flujos incluidos y exclusiones. Meses de gracia quedan diferidos hasta poder modelar reglas contractuales completas.

## Calidad, mantenimiento y límites

- Privacidad: sin autenticación, IA, almacenamiento remoto/local, parámetros financieros en URL, logs de entradas ni eventos con valores. Nombres de escenarios quedan en memoria. Campos marcados con `data-private`.
- Accesibilidad: WCAG 2.2 AA como práctica objetivo; fieldsets/legends, labels y unidades visibles, resumen de errores con enlaces, foco, controles nativos, `aria-live`, SVG con resumen y tablas alternativas, detalle mensual por año, reflujo móvil, impresión y movimiento reducido.
- SEO: metadata única, canonical, Open Graph/Twitter vía helper, breadcrumbs, `WebApplication` y `LearningResource`, fechas reales 2026-07-18 y sitemap.
- Analítica: eventos de interacción permitidos con modo/estado/sección únicamente; jamás montos, porcentajes, resultados o nombres.
- Pruebas: unidad e invariantes del motor, escenario de regresión, solver, parsing/formato, contrato UF y pruebas estructurales de rutas/contenido/privacidad. Se ejecutarán `npm test` y `npm run build`; se documentará la ausencia de herramientas no configuradas, sin simular resultados.
- Auditoría factual: solo afirmaciones necesarias, sustentadas en fuentes oficiales chilenas y WCAG; defaults de mercado no verificados se eliminan o quedan en cero/editables. Cada hecho sensible se registra con ubicación y fecha de revisión.
- Originalidad: arquitectura, textos, casos, nombres internos y presentación creados desde principios financieros independientes; auditoría en fuente, pruebas, documentación y build de **referencias específicas excluidas**.
- Límites conocidos: la función serverless depende del despliegue Vercel; en hosting puramente estático la UF pasa a modo manual. No se proyecta UF, no se modelan impuestos/beneficios personales, prepago, mora, tasas variables, gracia, subsidios ni una CAE regulatoria.

## Auditoría de información vigente — 2026-07-18

| Afirmación o decisión | Fuente primaria / categoría | Estabilidad | Ubicación | Mantenimiento |
|---|---|---|---|---|
| La API CMF ofrece UF actual o por fecha, requiere clave y entrega valor/fecha en JSON o XML | [Documentación oficial API UF de CMF](https://api.cmfchile.cl/documentacion/UF.html) | Sensible a cambios de API | Endpoint y metodología | Verificar semestralmente y al cambiar contrato |
| La UF se calcula mensualmente y contiene valores diarios publicados para el período correspondiente | Documentación oficial API UF de CMF | Sensible al procedimiento oficial | Panel y guía | Verificar semestralmente |
| Las entidades conservan autonomía para definir condiciones de otorgamiento | [CMF Educa: créditos hipotecarios](https://www.cmfchile.cl/educa/621/w3-article-27508.html) | Sensible a normativa/práctica | Avisos de tasación, carga y limitaciones | Verificar semestralmente |
| Desgravamen se relaciona con saldo insoluto; incendio protege el inmueble y puede tener coberturas adicionales | CMF Educa y [seguros asociados](https://www.cmfchile.cl/educa/621/w3-article-1753.html) | Sensible a normativa y póliza | Formulario, guía y preguntas | Verificar semestralmente; no fijar primas |
| La CAE iguala valor presente de montos recibidos y pagos, incorporando tasa, plazo y gastos asociados | [Decreto 1512, definición reglamentaria](https://www.cmfchile.cl/transparencia/documentos/Decreto_1512.pdf) | Sensible a normativa | Metodología | No usar la etiqueta oficial sin implementación completa |
| Tasaciones, estudios de títulos, gastos notariales, impuestos y comisiones pueden ser gastos asociados | Decreto 1512 | Sensible a operación/normativa | Constructor de gastos y guía | Mantener editables; verificar por operación |
| Conversión efectiva y cuota de anualidad | Matemática financiera independiente | Estable | Motor y metodología | Pruebas unitarias e invariantes |
| Umbral de carga, base financiable por el menor valor y bases de seguro de la simulación | Supuestos explícitos del producto, no afirmaciones de mercado | Configurable | Formulario y resultados | Mantener etiqueta “supuesto” |
| DFL 2, beneficios/impuestos personales, límites máximos universales, prácticas de mutuarias y valores actuales de gastos | No se publica una afirmación; se omiten por depender de hechos o verificación adicional | Sensible | Limitaciones | Investigar con fuente primaria antes de incorporar |

## Verificación ejecutada

- `npm test`: 265 pruebas aprobadas, 0 fallidas, 0 omitidas. Incluye 18 pruebas nuevas directas del motor/UF y 5 pruebas de integración estructural dentro de la suite total.
- `npm run build`: completado con Vite 5.4.20, 1.770 módulos transformados. La calculadora y la guía se emitieron como chunks diferidos. Persiste una advertencia no bloqueante preexistente por el chunk principal superior a 500 kB.
- Smoke HTTP de producción local: estado 200 para calculadora, guía, `/herramientas` y `/aprende`.
- Revisión visual con Chrome headless: escritorio 1440 px y viewport responsivo 500 px; navegación móvil, jerarquía, reflujo y avisos visibles.
- Sitemap: XML válido, 410 URLs después de añadir las dos rutas.
- `git diff --check`: sin errores. Auditorías: sin secretos en el bundle cliente, sin persistencia/URL financiera y sin **referencias específicas excluidas** en el alcance creado.
- El repositorio no configura formatter, linter, type checker, runner E2E ni auditor automático de accesibilidad. No se desactivó ni simuló ninguno; la accesibilidad se verificó con pruebas estructurales, revisión semántica y visual, no con una certificación automática.
- La conversión anual efectiva usa `((1 + tasa anual)^(365/360))^(1/12) − 1`; para 4% anual produce aproximadamente 0,331928% mensual y reconcilia el escenario de regresión solicitado.

# Integración de corretaje inmobiliario — plan previo (2026-07-18)

## Implementación existente inspeccionada

- Se mantienen las rutas `/herramientas/calculadora-hipotecaria` y `/aprende/finanzas-personales/como-evaluar-un-credito-hipotecario`; no se creará una herramienta paralela.
- La calculadora es un componente React con estado local plano (`initialForm`), construcción de entradas mediante `buildInputs`, validación propia y cálculo explícito. Los escenarios guardan una copia efímera de `form`, `mode` y `result`, sin almacenamiento local o remoto.
- El motor puro `src/mortgageEngine.js` calcula hipoteca, amortización, seguros, gastos iniciales, efectivo inicial, desembolso y capacidad. El corretaje actual es un único gasto opcional con modo porcentual, UF fija o CLP fijo; no distingue comprador/vendedor, neto/final, IVA, representación, estado ni momento de pago.
- La UF se obtiene una sola vez mediante el endpoint existente y el valor seleccionado se inyecta en el motor. Toda nueva conversión de corretaje reutilizará esa UF.
- La comparación hipotecaria admite hasta cuatro escenarios y compara resultados calculados. El resumen copiable es texto generado localmente; la impresión usa la misma página y CSS `@media print`.
- `trackEvent` filtra dimensiones mediante lista permitida. No se enviarán montos, porcentajes, servicios, hitos, textos o resultados de negociación.
- Las pruebas son `node:test` unitarias y estructurales. No existen scripts configurados de formatter, linter, TypeScript, E2E o auditor automático de accesibilidad; se ejecutarán todos los controles realmente disponibles sin simular los ausentes.

## Extensión del dominio

- Crear un módulo puro de corretaje con configuración central de IVA general, enumeraciones de participación, pagador, representación, tratamiento tributario, unidad, base, estado e hito.
- Calcular por separado comisión del comprador y del vendedor. Solo la comisión final del comprador podrá contribuir al efectivo inicial, cuando esté confirmada como pagadera, no pagada, fuera del crédito y con tratamiento tributario definido.
- Soportar porcentaje, UF fija, CLP fijo, porcentaje con tope o mínimo y tramos marginales o por valor completo. Topes netos se aplicarán antes del IVA; topes finales después de construir el total, según selección explícita.
- Para IVA desconocido devolver rango sin IVA/con IVA y ningún total falsamente preciso. La UI exigirá una hipótesis explícita antes de incorporarlo al efectivo inicial.
- Separar gastos operacionales, corretaje del comprador y otros gastos para evitar doble conteo. La comisión del vendedor y el ingreso total del intermediario serán solo informativos.

## Integración de producto

- Sustituir el control mínimo existente por un módulo accesible “Comisión de corretaje”: participación, quién contrató, obligación del comprador, representación, modo/base, neto o final, IVA, hito, estado, inclusión, pago previo, mínimos/topes y servicios documentados.
- Añadir presets que solo rellenan un escenario tras acción explícita y se rotulan como comparaciones, nunca como tarifa legal o recomendación.
- Mostrar tarjeta de resultado con neto, IVA, final, UF/CLP, tasa efectiva, estado, hito e inclusión; incorporar campos de corretaje a comparación hipotecaria, copia e impresión.
- Añadir comparador local de hasta cinco propuestas, sin ganador automático, y una ayuda de preparación con preguntas y plantillas originales copiables.
- Mantener el reinicio global actual y añadir reinicio exclusivo del corretaje que preserve los demás datos hipotecarios.

## Contenido, fuentes y mantenimiento

- Ampliar la guía existente con una secuencia original sobre encargo, pagador, tarifa contractual frente a costumbre comercial, IVA, servicios, representación, hitos, errores y efectivo inicial.
- Verificar tasa general de IVA, tratamiento de servicios de corretaje, documentos tributarios y deberes de información mediante SII, SERNAC, BCN y Ley Chile. Las referencias comerciales se presentarán únicamente como escenarios editoriales editables, no como hechos legales.
- Mantener la tasa de IVA en configuración central y las bandas comparativas en contenido editorial separado del motor.
- Actualizar `CONTENT_GUIDE.md` con reglas de mantenimiento y `CHANGELOG_NEW_SECTIONS.md` con funciones, componentes, pruebas, fuentes, accesibilidad y resultado de build.

## Privacidad, accesibilidad y pruebas

- Todo dato permanecerá en memoria; no habrá URL, persistencia, API, logs ni analítica financiera. Solo se permitirán eventos categóricos de apertura, comparación y copia.
- Usar `fieldset`/`legend`, labels y unidades visibles, descripciones tributarias, errores enlazados, `aria-live`, tabla con encabezados, alternativa móvil y confirmación de copia.
- Añadir pruebas de porcentajes netos/finales, IVA añadido/incluido, montos fijos, rangos desconocidos, mínimos, topes, tramos, comprador/vendedor, efectivo inicial y regresiones UF 5.000. Extender pruebas estructurales de integración, privacidad, copia, impresión y accesibilidad.
- Ejecutar `npm test`, `npm run build` y `git diff --check`. Documentar explícitamente controles no configurados y cualquier elemento diferido.

## Auditoría factual de corretaje ejecutada — 2026-07-18

| Afirmación | Categoría y fuente | Decisión editorial |
|---|---|---|
| La comisión entre corredor y cliente se fija libremente | Norma vigente: DL 1.953 de 1977, art. 13, Ley Chile/BCN | No publicar 2% como tarifa legal; explicar acuerdo escrito |
| El reglamento de 1944 contenía tasas | Norma histórica: Decreto 1.205 de 1944, Ley Chile/BCN | Tratarlo como antecedente histórico, no como regla actual |
| La tasa general de IVA es 19% | Regla tributaria: SII | Centralizar 19% como valor editable y revisar ante cambios |
| El IVA del corretaje depende del tipo de prestador y de si predomina trabajo personal o capital | Regla tributaria: FAQ SII actualizada en 2025 | Ofrecer agregado, incluido, no afecto según propuesta y desconocido; pedir confirmación/documento |
| El consumidor tiene derecho a información veraz y oportuna sobre precio y condiciones; el precio informado debe incluir impuestos | Protección al consumidor: SERNAC, arts. 3 y 30 | Mostrar neto, IVA y total con etiquetas explícitas |
| Existen ofertas comerciales cercanas a 2% más IVA por cada parte | Observación comercial no universal: sitios de corredores y plataformas revisados 2026-07-18 | Mantener solo como referencia calificada, editable y no recomendación |

- La revisión no encontró una ley vigente que imponga un porcentaje único. Se descartó usar el antiguo 2% del reglamento de 1944 como regla actual.
- Las referencias comerciales no sustentan conclusiones jurídicas ni garantizan que comprador y vendedor deban pagar.
- Los textos, organización pedagógica, plantillas, casos, variables y pruebas se reconstruyeron de manera original; no se incorporaron `excluded source-specific references`.

## Verificación final de la extensión

- `npm test`: 283 pruebas aprobadas, 0 fallidas, incluidas 10 pruebas directas del dominio de corretaje, 5 pruebas estructurales de integración y la regresión hipotecaria completa.
- `npm run build`: correcto con Vite 5.4.20 y 1.773 módulos transformados. Chunks diferidos: calculadora 76,51 kB y guía 22,14 kB minificados.
- `git diff --check`: sin errores; Git solo informó la normalización de fin de línea LF/CRLF en archivos ya modificados.
- Advertencia no bloqueante: el chunk principal preexistente continúa sobre 500 kB. No existen runners configurados de formatter, linter, typechecker, E2E o auditor automático de accesibilidad.
# Evaluador de inversión inmobiliaria para arriendo — 2026-07-18

## Arquitectura inspeccionada

- Aplicación React 19 sobre Vite 5, JavaScript ESM, `npm`/`package-lock.json`, router interno por `window.location.pathname` y build multipágina para las páginas HTML históricas.
- `/herramientas` y `/aprende` se construyen desde `contentData.js`, `LearningPages.jsx`, `LearningComponents.jsx` y rutas lazy en `App.jsx`.
- La calculadora hipotecaria vive en `/herramientas/calculadora-hipotecaria`. Su dominio está en `mortgageEngine.js`: conversión de tasas, cuota nivelada, seguros, amortización mensual, agregación anual, gastos iniciales y capacidad orientativa.
- La UF usa el endpoint compartido `/api/indicadores/uf`, CMF cuando hay credencial, proveedor secundario, último valor válido en memoria y entrada manual en la interfaz. El evaluador no incorpora otro proveedor.
- El corretaje está separado en `brokerageEngine.js` y `BrokerageModule.jsx`; admite porcentaje, montos fijos, IVA, límites, tramos, hitos y separación comprador/vendedor.
- No hay librería de gráficos, validación, monitoreo de errores ni router externo. Los gráficos existentes son HTML/CSS/SVG accesible; las pruebas usan `node:test` y `assert`.
- Diseño y accesibilidad: tokens CSS globales, `PageShell`, migas, formularios semánticos, tablas desplazables, alternativas textuales, impresión, foco visible y movimiento reducido.
- SEO usa `usePageMetadata`, canonical, Open Graph, Twitter y JSON-LD. Analítica usa una lista cerrada de dimensiones y descarta valores no permitidos.

## Decisiones de implementación

- Rutas nuevas: `/herramientas/evaluador-inversion-inmobiliaria` y `/aprende/finanzas-personales/evaluar-inversion-inmobiliaria`.
- Reutilización directa de `calculateMortgage`, su calendario mensual y `annualSchedule`; no se volvió a implementar ninguna fórmula hipotecaria.
- Reutilización de `calculateBrokerageCommission`, formato UF/CLP/porcentaje, parseo y convenciones hipotecarias, endpoint UF, metadatos, navegación, CTA, tablas y patrones de impresión.
- Dominio nuevo y puro en `investmentEngine.js`: renta comparable, vacancia, gastos comunes del propietario, proyección, venta neta, continuidad, VPN, TIR, MIRR, bisección, puntos de equilibrio, tasa de indiferencia, escenarios y matriz de sensibilidad.
- Convención de proyección: flujos reales en UF; la UF seleccionada solo convierte a CLP. El NOI excluye deuda y CAPEX. El servicio de deuda suma pagos del calendario real y queda en cero tras el vencimiento.
- Alternativas terminales mutuamente excluyentes: el vector de venta contiene venta neta; el de continuidad contiene el valor del negocio. Nunca se suman ambos.
- Continuidad mediante perpetuidad creciente del NOI posterior, solo válida cuando costo de oportunidad > crecimiento perpetuo. Venta neta descuenta costos, deuda y prepago ingresado una sola vez.
- Solvers centralizados, acotados y con estados explícitos; no muestran `NaN`.
- Tres modos conectados al mismo motor: propiedad, comparable y equilibrio. Tres escenarios y sensibilidad ocupación/apreciación se recalculan desde el dominio.

## Privacidad, accesibilidad, SEO y analítica

- Campos marcados como privados; sin persistencia remota/local automática, parámetros financieros en URL, logs o APIs externas. Analítica emite solo herramienta, modo y estado.
- `fieldset`/`legend`, etiquetas explícitas, unidades, errores agrupados, `aria-live`, controles de teclado, foco, tabla alternativa al gráfico, diseño móvil e impresión.
- `WebApplication`, `LearningResource`, breadcrumbs, canonical, sitemap y metadatos únicos con revisión 2026-07-18.

## Auditoría factual y mantenimiento

- Las reglas tributarias no se calculan como conclusiones individualizadas. DFL 2 permanece como estado informado por el usuario; contribuciones, IVA de corretaje, costos de venta y prepago son supuestos editables/confirmables.
- Categorías primarias que deben revisarse al mantener contenido: CMF/Banco Central para UF y condiciones financieras; SII para DFL 2, contribuciones, renta y mayor valor; BCN/LeyChile para normas vigentes; SERNAC/CMF para obligaciones de consumo y prepago; Conservadores y normativa aplicable para inscripción.
- Revisión registrada: 2026-07-18. Todo contenido tributario o legal es sensible al tiempo y requiere nueva revisión antes de introducir valores predeterminados normativos.

| Materia | Fuente primaria consultada | Hallazgo aplicado | Ubicación / mantenimiento |
| --- | --- | --- | --- |
| DFL 2 | BCN, DFL 2 y Ley 20.455: https://www.bcn.cl/leychile/Navegar?idNorma=3483 y https://www.bcn.cl/leychile/navegar?idNorma=1015783&idVersion=2022-04-01 | La calificación depende del inmueble y los beneficios tienen condiciones del propietario, incluidas restricciones por persona y cantidad. | Campo “por confirmar”; sin beneficio automático. Revisar ante cambio legal. |
| Contribuciones | SII, Impuesto Territorial: https://www.sii.cl/destacados/impuesto_territorial/ | Dependen del avalúo fiscal, destino, exenciones y valores reajustados. | Monto anual editable; no inferir desde precio comercial. Revisión semestral si se agregan defaults. |
| Arriendo y mayor valor | SII, Guía Renta 2026 y FAQ de venta: https://www.sii.cl/servicios_online/renta/guia_practica_renta_2026.pdf y https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7212.htm | La tributación varía con sujeto, inmueble, fecha, régimen y antecedentes acumulados. | Resultados antes de impuestos personales; no modelar impuesto individual sin un módulo verificado. Revisión anual. |
| IVA de corretaje | SII FAQ actualizada 2025: https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_3147.htm | El tratamiento depende de quién presta el servicio y cómo desarrolla la actividad. | Selector “agregado/incluido/sin IVA según cotización/por confirmar”; nunca asumir una tarifa universal. |
| Seguros hipotecarios | CMF Educa: https://www.cmfchile.cl/educa/621/w3-article-27508.html | Desgravamen e incendio se asocian a la operación hipotecaria y sus coberturas/costos deben confirmarse. | Se reutilizan supuestos editables del motor; no se presentan como cotización. Revisión anual. |
| Prepago | CMF Educa: https://www.cmfchile.cl/educa/621/w3-article-27382.html y https://www.cmfchile.cl/educa/621/w3-article-27379.html | El costo depende del instrumento, fecha, contrato y liquidación; no equivale de forma universal a un mes de interés. | Solo entrada confirmada, por defecto cero. Revisar normativa y escritura antes de automatizar. |

## Pruebas y elementos diferidos

- Unitarias: ingreso comparable, vacancia, gastos comunes, VPN/TIR/MIRR, terminales, venta, proyección, invariantes, solvers y sensibilidad.
- Regresión: suite hipotecaria, corretaje, UF, integración, accesibilidad estructural y build completo.
- Diferido: agenda mensual de vacancia, editor arbitrario de múltiples gastos/CAPEX, importación de cotización, persistencia opt-in, Monte Carlo y modelación tributaria individual. No se simulan hasta contar con alcance, evidencia y UX suficientes.
- Originalidad: arquitectura, texto, casos, nombres internos y fórmulas se redactaron independientemente; la auditoría busca y excluye referencias específicas de fuentes de investigación.
