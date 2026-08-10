# Plan de continuación: Diseño narrativo, fases 2 a 5

Estado de referencia: 9 de agosto de 2026.

Este documento continúa la Fase 1 ya implementada en Novel Studio. Su propósito es permitir retomar el desarrollo por entregas pequeñas sin duplicar el Codex, sin romper novelas existentes y sin convertir los marcos narrativos en reglas obligatorias.

## 1. Estado actual que debe conservarse

La aplicación es una SPA React 19 + Vite. No usa backend para Novel Studio. Los datos se guardan mediante File System Access API en la carpeta local elegida por el usuario.

Cada novela dispone ahora de:

```text
novels/<novelId>/design/narrative.json
```

La Fase 1 ya incluye:

- modo principal `Diseño`;
- subpestañas funcionales `Resumen`, `Brújula`, `Estructura` y `Diagnóstico`;
- Brújula con estados por campo y protagonista enlazado por ID al Codex;
- momentos narrativos independientes (`storyBeats`);
- marcos Truby 22, Viaje del héroe/Vogler, Tres actos y marcos personalizados;
- duplicación, edición, omisión, reordenación, fusión y comparación de etapas;
- asignaciones many-to-many entre etapas, momentos, actos, capítulos y escenas;
- guiado básico y diagnósticos iniciales;
- persistencia de `narrative.json`, autoguardado y guardado desde el encabezado;
- recuperación de IDs de entradas antiguas del Codex desde el nombre del archivo;
- normalización retrocompatible y pruebas de modelo, motor, guiado, diagnóstico y repositorio.

Las subpestañas `Personajes`, `Arcos`, `Tramas`, `Capítulos`, `Escenas` y `Tema` todavía son marcadores de posición.

Los modelos iniciales para esas áreas ya existen en `src/novel-studio/narrative/model.js`, pero no deben conectarse a una interfaz sin revisar primero la propiedad de cada dato.

## 2. Principios que gobiernan las fases siguientes

### 2.1 Una fuente de verdad para cada dato

- El **Codex** es la fuente canónica de identidad, nombre, alias, biografía, apariencia, personalidad, voz, cronología personal, relaciones generales y expediente documental.
- `manuscript/structure.json` es la fuente canónica de actos, capítulos, escenas, POV, participantes, estado y metadatos editoriales existentes.
- Los archivos de escena son la fuente canónica de la prosa.
- `design/narrative.json` guarda exclusivamente interpretación y planificación narrativa: funciones dramáticas, transformaciones, enlaces, conflictos activos, patrones, consecuencias, temas y diagnósticos descartados.

No se copiarán nombres ni fichas completas dentro de `narrative.json`. Las referencias usarán `codexId`, `sceneId`, `chapterId`, `actId`, `storyBeatId` o `stageId`.

### 2.2 Diseño es una capa aditiva

- Plan, Escribir, Libro, Codex y Relaciones deben seguir funcionando aunque Diseño esté vacío.
- Ningún diagnóstico impedirá guardar.
- Ningún marco será obligatorio.
- Cambiar o borrar una lente estructural no borrará escenas, personajes ni momentos narrativos.
- La IA nunca sobrescribirá contenido automáticamente.

### 2.3 Edición en el lugar propietario

Cuando Diseño muestre un dato del Codex, será de solo lectura y ofrecerá `Abrir en Codex`. Cuando muestre un capítulo o una escena, podrá abrir su editor propietario. Diseño editará solamente su capa narrativa.

### 2.4 Compatibilidad y seguridad

- Cada ampliación deberá normalizar archivos antiguos sin descartar campos desconocidos.
- Los enlaces rotos se mostrarán como advertencias y podrán repararse; no se eliminarán silenciosamente.
- Las entradas archivadas conservarán sus enlaces.
- Antes de una migración destructiva deberá crearse una revisión o copia recuperable.
- Autoguardado y botón `Guardar` deberán persistir exactamente el mismo estado actual.

## 3. Preparación técnica antes de la Fase 2

Esta preparación es parte de la Fase 2, no una fase de producto separada.

1. Dividir gradualmente `DesignPage.jsx` en componentes por subpestaña, manteniendo la página como coordinadora:

```text
narrative/components/DesignTabs.jsx
narrative/pages/CharactersTab.jsx
narrative/pages/ArcsTab.jsx
narrative/pages/PlotsTab.jsx
narrative/pages/ChaptersTab.jsx
narrative/pages/ScenesTab.jsx
narrative/pages/ThemeTab.jsx
```

2. Incorporar operaciones puras al motor en vez de construir objetos complejos directamente en componentes React.
3. Revisar el esquema inicial de `characterProfiles` y `themeAxis`, porque actualmente contiene campos que podrían duplicar Codex y Brújula.
4. Aumentar `NARRATIVE_SCHEMA_VERSION` únicamente cuando exista una transformación real, con normalización no destructiva.
5. Añadir selectores reutilizables para resolver IDs contra Codex y estructura.
6. Añadir pruebas de regresión para el flujo: editar → autoguardar → cambiar de subpestaña → volver → recargar desde disco.

## 4. Fase 2 — Planificación narrativa

Objetivo: habilitar `Personajes`, `Arcos`, `Tramas` y el asistente de inicio sin repetir las fichas existentes.

### 4.1 Personajes: lente narrativa sobre el Codex

La subpestaña mostrará únicamente entradas `type: "character"` del Codex.

Interfaz:

- buscador y lista de personajes activos/archivados;
- identidad, alias y resumen del Codex en modo lectura;
- botón `Abrir ficha en Codex`;
- indicador si la entrada enlazada no existe o está archivada;
- formulario de datos exclusivos de esta historia;
- enlaces a arco, tramas, momentos y escenas del personaje.

Datos editables en Diseño:

- importancia: principal, secundario, episódico;
- funciones narrativas con rango opcional de escenas;
- objetivo dramático de esta novela;
- oposición principal;
- dilema activo;
- lo que arriesga;
- secreto o información que oculta en la historia;
- promesa narrativa al lector;
- tipo de arco previsto;
- IDs de momentos, tramas y escenas relacionados.

No se editarán ni duplicarán:

- nombre, alias o descripción física;
- biografía, pasado o cronología personal;
- personalidad general;
- voz y vocabulario canónicos;
- relaciones generales del personaje;
- expediente extenso del Codex.

El modelo `CharacterNarrativeProfile` deberá reducirse a una proyección de historia. Los campos antiguos de `motor`, `conflicto`, `capacidades` y `expresion` se conservarán al normalizar, pero la interfaz nueva no los tratará como segunda ficha canónica. Si alguna novela ya tiene contenido allí, se mostrará como `Notas heredadas` hasta que el usuario decida trasladarlo o conservarlo.

### 4.2 Arcos: transformación demostrada por la historia

Cada arco estará enlazado mediante `codexId`, sin copiar la identidad.

Campos:

- tipo: positivo, negativo, plano o personalizado;
- estado y creencia inicial;
- punto ciego;
- deseo y necesidad dentro de la historia;
- resistencia al cambio;
- estado y creencia final;
- qué gana y qué pierde;
- notas de intención.

Los hitos del arco permitirán:

- título, descripción y orden;
- tipo opcional: detonante, resistencia, prueba, punto medio, caída, crisis, revelación, decisión o resolución;
- enlaces opcionales a escena, capítulo, momento narrativo y etapa estructural;
- navegación al elemento enlazado;
- reordenar sin cambiar la estructura del manuscrito.

Vista principal:

- línea temporal superpuesta al orden real de actos/capítulos/escenas;
- filtro por personaje;
- comparación de dos arcos;
- aviso suave para hitos sin evidencia o escenas enlazadas fuera de orden;
- aviso de arco huérfano si desaparece la entrada del Codex.

### 4.3 Asistente de inicio

Habilitar el modelo `opening` existente como panel dentro de Brújula o como subpestaña `Inicio`.

Debe contener:

- `De quién venimos`: pasado relevante, heridas, capacidades, miedo, contradicción, qué mostrar y qué ocultar;
- `De qué situación venimos`: normalidad, incidente, ruptura, reacción, objetivo, primera decisión y primera pregunta;
- checklist informativo y no obligatorio;
- enlaces al protagonista, primera escena y primer momento narrativo.

No debe copiar el expediente del protagonista: las preguntas se refieren únicamente a lo que la apertura necesita comunicar.

### 4.4 Tramas y patrones

La subpestaña permitirá:

- crear trama principal, secundaria o asociada a personaje;
- enlazar opcionalmente una subtrama existente del Codex mediante `codexId`;
- elegir un patrón de la biblioteca como lente opcional;
- crear una trama sin patrón;
- registrar objetivo, conflicto, progresión y resolución;
- vincular personajes, momentos, capítulos y escenas;
- visualizar presencia y pausas de cada trama en la cronología;
- cambiar de patrón sin borrar los enlaces ni la planificación.

Si una entrada `subplot` ya existe en Codex, Codex conserva su nombre y descripción canónica; Diseño guarda su despliegue narrativo. La trama principal puede existir solo en Diseño.

### 4.5 Entregables técnicos de la Fase 2

- modelo revisado y normalización retrocompatible;
- motores puros para perfiles, arcos, hitos y tramas;
- componentes de Personajes, Arcos, Inicio y Tramas;
- navegación `Abrir en Codex`, `Abrir escena` y `Abrir capítulo`;
- diagnósticos de referencias rotas;
- estilos responsivos y estados vacíos explicativos;
- pruebas unitarias y de repositorio.

### 4.6 Criterios de cierre de la Fase 2

- Rainiero se selecciona por ID y su nombre procede siempre del Codex.
- Editar Diseño no modifica ningún archivo del Codex.
- Renombrar un personaje en Codex se refleja en Diseño sin migración manual.
- Un arco conserva sus hitos al cambiar de framework.
- Una trama puede cruzar varios actos y compartir escenas con otra trama.
- Cambiar de subpestaña o recargar no pierde contenido.
- Una referencia ausente produce una advertencia reparable, no un fallo de renderizado.

## 5. Fase 3 — Arquitectura de capítulos y escenas

Objetivo: conectar la planificación narrativa con el manuscrito real sin duplicar la estructura ni la prosa.

### 5.1 Escenas

La subpestaña `Escenas` usará `structure.scenes` como catálogo y `sceneDesigns[sceneId]` como capa narrativa.

Para cada escena:

- mostrar título, capítulo, estado, POV y participantes desde la estructura;
- editar objetivo, oposición, tácticas, giro, resultado y consecuencia;
- registrar estado inicial y final;
- registrar pregunta narrativa;
- definir objetivo/táctica/conocimiento/ocultamiento por personaje mediante `codexId`;
- enlazar tramas, arco, momentos y etapas;
- abrir la escena en Plan o Escribir.

Aplicar el esquema OOTGR como ayuda, no como obligación:

```text
Objetivo → Oposición → Tácticas → Giro → Resultado
```

Los campos de Diseño no reemplazarán `scene.summary`, `scene.beats`, `povId` ni la prosa.

Integración opcional pero recomendada:

- panel plegable de Diseño desde la tarjeta de Plan;
- panel plegable desde el editor de escena;
- ambos editan el mismo `sceneDesigns[sceneId]`.

### 5.2 Capítulos

La subpestaña `Capítulos` resolverá capítulos desde los actos de `structure.json` y guardará su capa en `chapterDesigns[chapterId]`.

Campos:

- función principal;
- pregunta del capítulo;
- estado inicial y final;
- objetivo, stakes, giro y consecuencia;
- nueva pregunta que impulsa la lectura;
- funciones cumplidas: trama, personaje, relación, información, tema y ritmo;
- modelo opcional de organización;
- prueba de necesidad del capítulo.

Debe mostrar las escenas reales del capítulo y resumir sus objetivos, cambios y tramas. Las sugerencias de dividir, unir o reordenar serán explicaciones; nunca mutaciones automáticas.

### 5.3 Acción y consecuencia

Crear una vista cronológica derivada de escenas y revelaciones:

- acción o decisión;
- consecuencia inmediata;
- consecuencia diferida;
- escena donde se paga;
- personajes y tramas afectados.

Las acciones sin consecuencia y las consecuencias sin causa visible aparecerán como preguntas de revisión, no como errores.

### 5.4 Integridad ante cambios de estructura

- Archivar una escena no elimina su diseño.
- Eliminar definitivamente una escena deja un enlace huérfano reparable hasta confirmación explícita.
- Mover una escena de capítulo conserva su `sceneId` y todo su diseño.
- Duplicar una escena no copia el diseño salvo acción explícita del usuario.
- Reordenar capítulos recalcula las visualizaciones, no los IDs.

### 5.5 Criterios de cierre de la Fase 3

- La misma ficha narrativa se ve desde Diseño, Plan y Escribir.
- Una edición desde cualquier acceso se guarda en el mismo `narrative.json`.
- Mover escenas no rompe enlaces de arco, trama o framework.
- Los capítulos sin ficha siguen funcionando normalmente.
- No se modifica la prosa ni la estructura al editar campos narrativos.
- Las vistas manejan novelas grandes sin renderizados o escrituras por cada elemento no editado.

## 6. Fase 4 — Tema, conflicto, revelaciones y análisis

Objetivo: convertir los datos de planificación en análisis explicable y navegable.

### 6.1 Tema sin duplicar Brújula

Brújula será la fuente canónica para:

- tema;
- pregunta temática;
- premisa y contrapremisa;
- valores inicial y final;
- idea controladora.

La subpestaña `Tema` mostrará esos datos y permitirá abrir Brújula para editarlos. `themeAxis` guardará únicamente la elaboración adicional:

- valores o posiciones en tensión;
- personajes que encarnan cada posición mediante IDs;
- decisiones donde chocan los valores;
- clímax temático;
- conclusión o ambigüedad final;
- enlaces a escenas y momentos.

Los campos duplicados que ya existen en `themeAxis` se normalizarán como compatibilidad heredada, sin sobrescribir Brújula automáticamente.

### 6.2 Símbolos y motivos

Permitir crear símbolos, imágenes, metáforas, objetos, lugares, gestos, sonidos o frases con:

- significado previsto;
- entradas del Codex relacionadas;
- primera aparición;
- repeticiones enlazadas a escenas;
- evolución;
- transformación o pago final.

Si el símbolo es también un objeto o lugar del Codex, se enlaza por ID y no se vuelve a describir como entidad.

### 6.3 Mapa de conflicto

Para cada hilo de conflicto:

- protagonista y adversario enlazados al Codex;
- objetivos incompatibles;
- planes, recursos, debilidades y ventajas;
- estrategia del adversario;
- escalada ordenada;
- enlaces a escenas, tramas y momentos.

Debe admitir fuerzas no personales mediante una etiqueta local, sin obligar a crear un personaje falso en el Codex.

### 6.4 Escalera de revelaciones

Cada revelación podrá registrar:

- información revelada;
- quién la descubre y quién ya la sabía;
- qué se creía antes y qué se sabe después;
- escena o momento;
- decisión provocada;
- cambio de plan resultante.

La vista cronológica detectará revelaciones sin efecto narrativo y personajes que actúan con conocimiento que todavía no adquirieron.

### 6.5 Diagnósticos completos

Ampliar `runDiagnostics` con reglas puras, identificadores estables y explicación visible.

Grupos mínimos:

- Brújula: protagonista/objetivo/conflicto incompletos;
- personajes: referencias rotas, función sin presencia, objetivo sin oposición;
- arcos: hitos sin enlace, cambio final no preparado, orden temporal inconsistente;
- tramas: tramas abandonadas o sin resolución indicada;
- escenas: sin objetivo, oposición, giro, resultado o cambio cuando el usuario sí creó una ficha;
- capítulos: no avanzan trama, personaje, información, tema o ritmo según sus propias fichas;
- causalidad: acción sin consecuencia o consecuencia sin causa;
- revelaciones: sin decisión o conocimiento adelantado;
- símbolos: motivo anunciado sin repetición o pago, solo si fue marcado para seguimiento;
- frameworks: etapas activas vacías, respetando omitidas y `no-aplica`.

Cada diagnóstico deberá incluir:

- qué observó;
- por qué podría importar;
- enlace al lugar relevante;
- severidad informativa, revisión o atención;
- `Ignorar una vez` cuando corresponda;
- `No volver a mostrar`, persistido mediante ID estable.

### 6.6 Criterios de cierre de la Fase 4

- Tema reutiliza Brújula y no crea una segunda premisa.
- Los diagnósticos no aparecen para módulos que el usuario nunca empezó a usar.
- Cada advertencia explica sus datos de origen y permite navegar a ellos.
- Descartar diagnósticos no modifica la novela.
- Las visualizaciones se recalculan desde IDs y orden real de estructura.

## 7. Fase 5 — Herramientas avanzadas e IA opcional

Objetivo: añadir asistencia sofisticada sin convertir sugerencias en contenido canónico.

### 7.1 Comparación transversal de frameworks

- matriz de correspondencias entre etapas de varios frameworks;
- comparación contra momentos y escenas reales;
- filtros por acto, trama y personaje;
- correspondencias manuales editables;
- ninguna equivalencia automática altera asignaciones existentes.

### 7.2 Diálogo y persuasión

Añadir una herramienta opcional por escena para registrar:

- objetivo conversacional de cada personaje;
- táctica y cambio de táctica;
- información explícita, implícita y ocultada;
- subtexto;
- cambio de poder;
- resultado de la conversación;
- ethos, pathos y logos solo cuando el usuario active esa lente.

No analizar ni reescribir prosa automáticamente sin solicitud expresa.

### 7.3 Asistencia con IA

Reutilizar la infraestructura existente de proveedores OpenAI/Ollama/manual.

Reglas obligatorias:

- enviar solo el contexto necesario y visible para el usuario;
- distinguir hechos del Codex, texto de manuscrito y planificación;
- pedir aclaración cuando falte una decisión central;
- devolver propuestas estructuradas como borradores;
- aceptar o rechazar cada propuesta individualmente;
- mostrar qué campos cambiarían antes de aplicar;
- nunca guardar una propuesta rechazada;
- nunca sobrescribir Codex, prosa o Diseño completo;
- registrar procedencia y fecha de una propuesta aceptada si resulta útil;
- funcionar plenamente sin IA configurada.

Casos iniciales:

- preguntas para completar Brújula;
- detectar tensiones entre objetivo y conflicto;
- proponer hitos de arco a partir de datos seleccionados;
- sugerir escenas ausentes entre causa y consecuencia;
- comparar dos marcos;
- formular preguntas de revisión de capítulos y escenas;
- revisar continuidad de revelaciones.

### 7.4 Criterios de cierre de la Fase 5

- La aplicación conserva todas las funciones con IA desactivada.
- Cada propuesta muestra fuentes y destino.
- Aceptar una sugerencia modifica solamente los campos seleccionados.
- Rechazar o cancelar no modifica archivos.
- No se envían expedientes completos o toda la novela cuando basta un fragmento.

## 8. Estrategia de pruebas

Cada bloque debe incluir pruebas antes de habilitar su subpestaña.

### 8.1 Pruebas puras

- factories y normalización de cada modelo;
- operaciones crear/editar/eliminar/reordenar sin mutación accidental;
- resolución de referencias por ID;
- perfiles narrativos sin copia de identidad;
- arcos e hitos enlazados a varias clases de elemento;
- tramas superpuestas;
- diseño de capítulo y escena;
- diagnósticos positivos y ausencia de falsos positivos;
- estabilidad de IDs de diagnósticos;
- migraciones retrocompatibles.

### 8.2 Repositorio

- lectura de novela sin `narrative.json`;
- escritura y recarga real;
- cola de varias escrituras consecutivas;
- botón Guardar durante autoguardado;
- duplicación de novela sin compartir referencias;
- conservación de campos futuros desconocidos;
- comportamiento con Codex, capítulo o escena ausente/archivado.

### 8.3 Integración de interfaz

Lista mínima manual o automatizada:

1. Escribir en un campo y verlo inmediatamente.
2. Cambiar de subpestaña y regresar.
3. Esperar autoguardado y recargar la aplicación.
4. Pulsar Guardar inmediatamente después de escribir.
5. Renombrar en Codex y comprobar el nuevo nombre en Diseño.
6. Mover una escena y comprobar todos sus enlaces.
7. Abrir una novela antigua.
8. Probar estados vacío, lectura y permiso perdido.
9. Revisar consola sin excepciones ni ciclos de renderizado.

Al cerrar cada entrega deben ejecutarse:

```text
npm test
npm run build
git diff --check
```

Debe distinguirse cualquier fallo preexistente y documentarse; no se oculta ni se atribuye a la fase sin comprobarlo.

## 9. Orden de implementación recomendado

No implementar una fase completa en una sola operación. El orden recuperable es:

1. Fase 2A: propiedad de datos, esquema y selectores.
2. Fase 2B: Personajes enlazados al Codex.
3. Fase 2C: Arcos y línea temporal.
4. Fase 2D: Inicio y Tramas.
5. Fase 3A: Escenas dentro de Diseño.
6. Fase 3B: acceso a la misma ficha desde Plan y Escribir.
7. Fase 3C: Capítulos y causalidad.
8. Fase 4A: Tema y símbolos.
9. Fase 4B: conflicto y revelaciones.
10. Fase 4C: diagnósticos completos.
11. Fase 5A: comparación avanzada y diálogo.
12. Fase 5B: sugerencias con IA.

Cada bloque debe quedar utilizable, probado y guardable antes de comenzar el siguiente.

## 10. Definición global de terminado

El sistema se considera completo cuando:

- todas las subpestañas dejaron de ser marcadores de posición;
- ninguna duplica datos canónicos del Codex, Brújula o estructura;
- todos los enlaces usan IDs estables;
- las novelas antiguas abren sin intervención;
- autoguardado y Guardar persisten el estado visible;
- los marcos siguen siendo lentes intercambiables;
- los diagnósticos son explicables, opcionales y descartables;
- Plan, Escribir, Libro, Codex y Relaciones conservan su comportamiento;
- toda sugerencia de IA requiere aceptación explícita;
- la suite relevante, la compilación y la verificación manual de persistencia pasan.

## 11. Fuera de alcance salvo nueva decisión

- backend o base de datos remota;
- colaboración multiusuario;
- sincronización en la nube;
- reescritura automática de prosa;
- modificación automática de fichas del Codex desde Diseño;
- imposición de un método narrativo como validación obligatoria;
- borrado automático de datos huérfanos.

