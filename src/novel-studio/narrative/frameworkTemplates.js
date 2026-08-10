/**
 * Plantillas de marcos narrativos (estructuras de etapas).
 * Lógica pura, sin dependencias de React.
 *
 * Convención: los templates son INMUTABLES. Quien cree una instancia
 * a partir de un template debe copiarlo (structuredClone o similar).
 */

export const FRAMEWORK_TEMPLATES = [
  {
    id: 'truby-22',
    name: 'Los 22 pasos (John Truby)',
    description:
      'Estructura de 22 pasos de John Truby ("La anatomía de la historia"). ' +
      'Cada paso es un evento clave que hace crecer orgánicamente al héroe y la trama.',
    source: 'builtin',
    stages: [
      {
        key: 'autorrevelacion-necesidad-deseo',
        name: '1. Autorrevelación, necesidad y deseo',
        description:
          'Presentación del marco general de la historia: qué aprenderá el héroe al final (autorrevelación), qué le falta por dentro (necesidad) y qué persigue fuera (deseo).',
        objective: 'Definir el punto de partida psicológico y la meta externa del héroe.',
        guideQuestions: [
          '¿Qué necesita aprender o cambiar tu héroe al final de la historia?',
          '¿Qué le falta internamente al inicio (necesidad psicológica o moral)?',
          '¿Qué objetivo concreto persigue (deseo)?',
        ],
      },
      {
        key: 'fantasma-y-contramundo',
        name: '2. Fantasma y contramundo',
        description:
          'El fantasma es la herida o evento del pasado que atormenta al héroe; el contramundo es el entorno inicial que lo oprime o lo mantiene atrapado.',
        objective: 'Establecer la herida del pasado y el mundo inicial del héroe.',
        guideQuestions: [
          '¿Qué evento pasado marca todavía a tu héroe?',
          '¿Cómo es el mundo en el que vive atrapado al comenzar?',
        ],
      },
      {
        key: 'debilidad-necesidad',
        name: '3. Debilidad/necesidad',
        description:
          'Las fallas internas del héroe (psicológicas y morales) que le impiden tener una vida plena y que la historia deberá sanar.',
        objective: 'Concretar las debilidades que el héroe deberá superar.',
        guideQuestions: [
          '¿Qué defecto psicológico daña al propio héroe?',
          '¿Qué defecto moral daña a los demás?',
          '¿Cómo afectan esas debilidades a su vida cotidiana?',
        ],
      },
      {
        key: 'incitador',
        name: '4. Incitador',
        description:
          'Evento externo que sacude el mundo del héroe y lo empuja a actuar; conecta la necesidad interna con el deseo externo.',
        objective: 'Disparar la acción de la historia.',
        guideQuestions: [
          '¿Qué evento rompe la rutina del héroe?',
          '¿Por qué el héroe no puede ignorar ese evento?',
        ],
      },
      {
        key: 'deseo',
        name: '5. Deseo',
        description:
          'La meta concreta que el héroe se fija tras el incitador; es la columna vertebral de la trama.',
        objective: 'Fijar la meta externa que guiará la acción.',
        guideQuestions: [
          '¿Qué quiere conseguir exactamente el héroe?',
          '¿Qué pasaría si no lo logra?',
        ],
      },
      {
        key: 'aliados',
        name: '6. Aliado(s)',
        description:
          'Personajes que ayudan al héroe en su búsqueda; a menudo encarnan valores o subtramas propias.',
        objective: 'Definir quién acompaña y apoya al héroe.',
        guideQuestions: [
          '¿Quién ayuda al héroe y por qué?',
          '¿Qué conflicto o subtrama aporta cada aliado?',
        ],
      },
      {
        key: 'oponente-misterio',
        name: '7. Oponente/misterio',
        description:
          'El adversario que compite por la misma meta; suele introducirse envuelto en misterio para mantener la tensión.',
        objective: 'Presentar la fuerza que se opone al deseo del héroe.',
        guideQuestions: [
          '¿Quién o qué se opone a la meta del héroe?',
          '¿Qué oculta el oponente que el héroe (y el lector) desconoce?',
        ],
      },
      {
        key: 'oponente-falso-aliado',
        name: '8. Oponente falso/aliado',
        description:
          'Personaje que parece aliado del héroe pero que en realidad trabaja en su contra; su revelación es un golpe de efecto.',
        objective: 'Sembrar una traición o engaño dentro del bando del héroe.',
        guideQuestions: [
          '¿Quién finge apoyar al héroe mientras lo perjudica?',
          '¿Cuándo y cómo se descubre el engaño?',
        ],
      },
      {
        key: 'primera-revelacion-decision',
        name: '9. Primera revelación y decisión',
        description:
          'El héroe recibe información nueva que cambia su comprensión de la situación y toma una decisión que ajusta su rumbo.',
        objective: 'Primer giro: nueva información, nueva decisión.',
        guideQuestions: [
          '¿Qué descubre el héroe que no sabía?',
          '¿Qué decide hacer con esa información?',
        ],
      },
      {
        key: 'plan',
        name: '10. Plan',
        description:
          'La estrategia del héroe para alcanzar su deseo y vencer al oponente; un buen plan suele fallar y obligar a improvisar.',
        objective: 'Definir la estrategia inicial del héroe.',
        guideQuestions: [
          '¿Cuál es el plan del héroe paso a paso?',
          '¿Dónde está el punto débil de ese plan?',
        ],
      },
      {
        key: 'plan-del-oponente-y-contraataque',
        name: '11. Plan del oponente y contraataque',
        description:
          'El oponente también tiene un plan para lograr la misma meta y ejecuta su contraataque principal contra el héroe.',
        objective: 'Mostrar la estrategia rival y su primer golpe fuerte.',
        guideQuestions: [
          '¿Cuál es el plan del oponente para vencer?',
          '¿Cómo contraataca contra el héroe?',
        ],
      },
      {
        key: 'impulso',
        name: '12. Impulso',
        description:
          'Serie de acciones y conflictos en los que héroe y oponente chocan; el héroe suele ir perdiendo terreno.',
        objective: 'Desarrollar el enfrentamiento creciente entre ambos bandos.',
        guideQuestions: [
          '¿Qué golpes intercambian héroe y oponente?',
          '¿Cómo empeora la situación del héroe?',
        ],
      },
      {
        key: 'ataque-del-aliado',
        name: '13. Ataque del aliado',
        description:
          'Un aliado cuestiona el método o los valores del héroe y lo obliga a mirar el coste moral de su conducta.',
        objective: 'Presionar la debilidad interna del héroe desde una voz cercana.',
        guideQuestions: [
          '¿Qué aliado confronta al héroe y qué conducta le reprocha?',
          '¿Por qué esa crítica resulta más difícil de ignorar que un ataque del oponente?',
        ],
      },
      {
        key: 'aparente-derrota',
        name: '14. Aparente derrota',
        description:
          'El punto más bajo del héroe: cree haber perdido definitivamente. Debe sentirse como el final, aunque no lo sea.',
        objective: 'Llevar al héroe a su momento de mayor desventaja.',
        guideQuestions: [
          '¿Cómo pierde el héroe de forma aparentemente definitiva?',
          '¿Qué pierde además de la batalla (confianza, aliados, recursos)?',
        ],
      },
      {
        key: 'segunda-revelacion-decision',
        name: '15. Segunda revelación y decisión',
        description:
          'Tras la derrota, el héroe obtiene nueva información (a menudo sobre el oponente) y decide volver a la lucha con más determinación.',
        objective: 'Dar al héroe un motivo y un medio para levantarse.',
        guideQuestions: [
          '¿Qué descubre el héroe en su peor momento?',
          '¿Qué decisión lo pone de nuevo en marcha?',
        ],
      },
      {
        key: 'revelacion-del-publico',
        name: '16. Revelación del público',
        description:
          'El lector/espectador recibe información que el héroe aún no tiene, generando tensión y expectativa.',
        objective: 'Crear ventaja informativa para el público sobre el héroe.',
        guideQuestions: [
          '¿Qué sabe el lector que el héroe todavía ignora?',
          '¿Cómo aumenta eso la tensión de lo que viene?',
        ],
      },
      {
        key: 'tercera-revelacion-decision',
        name: '17. Tercera revelación y decisión',
        description:
          'El héroe conoce por fin el verdadero poder o plan del oponente y se compromete a fondo, a menudo redoblando su apuesta.',
        objective: 'Último giro informativo antes del clímax.',
        guideQuestions: [
          '¿Qué verdad sobre el oponente descubre el héroe?',
          '¿Qué decide arriesgar a cambio?',
        ],
      },
      {
        key: 'puerta-caida-muerte-inminente',
        name: '18. Puerta, caída, muerte inminente',
        description:
          'El héroe queda acorralado en un espacio cerrado, sufre una caída (literal o simbólica) y enfrenta la posibilidad real de morir.',
        objective: 'Maximizar la presión justo antes de la batalla final.',
        guideQuestions: [
          '¿Dónde queda atrapado o arrinconado el héroe?',
          '¿Qué pérdida o caída sufre justo antes del final?',
        ],
      },
      {
        key: 'batalla',
        name: '19. Batalla',
        description:
          'El conflicto final: héroe y oponente se enfrentan abiertamente y se decide quién logra la meta.',
        objective: 'Resolver por la acción el conflicto central.',
        guideQuestions: [
          '¿Cómo se desarrolla el enfrentamiento final?',
          '¿Qué valores o temas chocan en esa batalla?',
        ],
      },
      {
        key: 'autorrevelacion',
        name: '20. Autorrevelación',
        description:
          'El héroe comprende quién es realmente: reconoce sus errores psicológicos y morales y cambia (o se niega a cambiar, en tragedias).',
        objective: 'Cerrar el arco interno del personaje.',
        guideQuestions: [
          '¿Qué verdad sobre sí mismo acepta el héroe?',
          '¿Cómo cambia su forma de actuar a partir de esa comprensión?',
        ],
      },
      {
        key: 'decision-moral',
        name: '21. Decisión moral',
        description:
          'El héroe demuestra su cambio con un acto: elige entre dos cursos de acción moralmente distintos.',
        objective: 'Probar el cambio del héroe mediante una elección.',
        guideQuestions: [
          '¿Qué elección moral enfrenta el héroe tras su autorrevelación?',
          '¿Qué opción elige y qué dice eso de su transformación?',
        ],
      },
      {
        key: 'nuevo-equilibrio',
        name: '22. Nuevo equilibrio',
        description:
          'El mundo alcanza una nueva normalidad: el deseo se resolvió y la necesidad quedó satisfecha (o su fracaso quedó claro).',
        objective: 'Mostrar el estado final del mundo y de los personajes.',
        guideQuestions: [
          '¿Cómo quedó la vida del héroe y de los demás personajes?',
          '¿Qué cambió permanentemente respecto al inicio?',
        ],
      },
    ],
  },
  {
    id: 'heroe-vogler',
    name: 'El Viaje del Héroe (Vogler)',
    description:
      'Adaptación de Christopher Vogler ("El viaje del escritor") del monomito de Joseph Campbell. ' +
      'Doce etapas que describen tanto el viaje externo como la transformación interna del héroe.',
    source: 'builtin',
    stages: [
      {
        key: 'mundo-ordinario',
        name: '1. Mundo ordinario',
        description:
          'El héroe en su vida cotidiana antes de la aventura. Transformación del personaje: punto de referencia para medir cuánto cambiará.',
        objective: 'Presentar al héroe, su entorno y sus carencias iniciales.',
        guideQuestions: [
          '¿Cómo es la vida normal del héroe antes de la aventura?',
          '¿Qué le falta o qué conflicto latente tiene?',
        ],
      },
      {
        key: 'llamada-a-la-aventura',
        name: '2. Llamada a la aventura',
        description:
          'Un problema, desafío o propuesta irrumpe en el mundo ordinario. Transformación del personaje: primera invitación al cambio.',
        objective: 'Plantear el desafío que sacará al héroe de su rutina.',
        guideQuestions: [
          '¿Qué evento o mensaje llama al héroe a actuar?',
          '¿Qué se pone en juego con esa llamada?',
        ],
      },
      {
        key: 'rechazo-de-la-llamada',
        name: '3. Rechazo de la llamada',
        description:
          'El héroe duda o se niega por miedo, deber o inseguridad. Transformación del personaje: muestra las resistencias internas que deberá vencer.',
        objective: 'Revelar los miedos y ataduras del héroe.',
        guideQuestions: [
          '¿Por qué el héroe duda o se niega a partir?',
          '¿Qué consecuencias tiene su negativa inicial?',
        ],
      },
      {
        key: 'encuentro-con-el-mentor',
        name: '4. Encuentro con el mentor',
        description:
          'Una figura sabia ofrece consejo, entrenamiento o un objeto clave. Transformación del personaje: recibe la confianza o herramienta que le faltaba.',
        objective: 'Dar al héroe la preparación necesaria para cruzar el umbral.',
        guideQuestions: [
          '¿Quién guía al héroe y qué le entrega (consejo, objeto, entrenamiento)?',
          '¿Qué duda del héroe queda resuelta gracias al mentor?',
        ],
      },
      {
        key: 'cruce-del-primer-umbral',
        name: '5. Cruce del primer umbral',
        description:
          'El héroe se compromete y entra al mundo especial de la aventura. Transformación del personaje: punto de no retorno, acepta cambiar.',
        objective: 'Marcar el compromiso definitivo del héroe con la aventura.',
        guideQuestions: [
          '¿Qué acción concreta marca el cruce al mundo nuevo?',
          '¿Qué deja atrás el héroe al cruzar?',
        ],
      },
      {
        key: 'pruebas-aliados-y-enemigos',
        name: '6. Pruebas, aliados y enemigos',
        description:
          'El héroe aprende las reglas del nuevo mundo, hace aliados y enfrenta primeras pruebas. Transformación del personaje: aprendizaje y primeras grietas en sus viejas ideas.',
        objective: 'Explorar el mundo especial y definir bandos.',
        guideQuestions: [
          '¿Qué pruebas iniciales supera el héroe?',
          '¿Quiénes se convierten en aliados y quiénes en enemigos?',
        ],
      },
      {
        key: 'acercamiento-a-la-cueva-mas-profunda',
        name: '7. Acercamiento a la cueva más profunda',
        description:
          'El héroe se prepara para el gran desafío central. Transformación del personaje: confronta sus miedos antes de la prueba mayor.',
        objective: 'Preparar al héroe (y al lector) para la ordalía.',
        guideQuestions: [
          '¿Cómo se prepara el héroe para el desafío central?',
          '¿Qué dudas o temores afloran en este tramo?',
        ],
      },
      {
        key: 'ordalia',
        name: '8. Ordalía',
        description:
          'La crisis central: el héroe enfrenta su mayor miedo o al enemigo principal y "muere" simbólicamente. Transformación del personaje: la vieja identidad muere para que nazca la nueva.',
        objective: 'Llevar al héroe al borde de la derrota o la muerte.',
        guideQuestions: [
          '¿Cuál es la prueba máxima que enfrenta el héroe?',
          '¿Qué parte del viejo héroe "muere" en la ordalía?',
        ],
      },
      {
        key: 'recompensa',
        name: '9. Recompensa',
        description:
          'Tras sobrevivir, el héroe obtiene el premio: un objeto, conocimiento o reconciliación. Transformación del personaje: renace con una nueva fuerza o comprensión.',
        objective: 'Entregar al héroe el fruto de la ordalía.',
        guideQuestions: [
          '¿Qué gana el héroe tras superar la crisis?',
          '¿En qué ha cambiado respecto a antes de la ordalía?',
        ],
      },
      {
        key: 'camino-de-regreso',
        name: '10. Camino de regreso',
        description:
          'El héroe vuelve hacia el mundo ordinario, pero el peligro aún no terminó. Transformación del personaje: debe decidir sostener su cambio bajo presión.',
        objective: 'Reactivar la tensión en el trayecto de vuelta.',
        guideQuestions: [
          '¿Qué obstáculos o persecuciones enfrenta en el regreso?',
          '¿Qué lo motiva a volver y no quedarse en el mundo especial?',
        ],
      },
      {
        key: 'resurreccion',
        name: '11. Resurrección',
        description:
          'El clímax: una última prueba de vida o muerte purifica al héroe. Transformación del personaje: demuestra definitivamente que ya no es el mismo.',
        objective: 'Probar el cambio del héroe en el clímax final.',
        guideQuestions: [
          '¿Cuál es la última gran prueba del héroe?',
          '¿Cómo demuestra que su transformación es real?',
        ],
      },
      {
        key: 'regreso-con-el-elixir',
        name: '12. Regreso con el elixir',
        description:
          'El héroe vuelve al mundo ordinario trayendo algo que beneficia a todos. Transformación del personaje: el cambio interno se traduce en aporte al mundo.',
        objective: 'Cerrar la historia mostrando el beneficio del viaje.',
        guideQuestions: [
          '¿Qué "elixir" (objeto, sabiduría, cambio) trae el héroe de vuelta?',
          '¿Cómo mejora el mundo ordinario gracias a su viaje?',
        ],
      },
    ],
  },
  {
    id: 'tres-actos',
    name: 'Estructura de tres actos',
    description:
      'La estructura clásica occidental: planteamiento, confrontación y resolución. ' +
      'Simple y flexible, sirve como base para casi cualquier historia.',
    source: 'builtin',
    stages: [
      {
        key: 'planteamiento',
        name: 'Acto I. Planteamiento',
        description:
          'Presenta al protagonista, su mundo y el conflicto central. Termina con el primer punto de giro, cuando el héroe se compromete con la aventura.',
        objective: 'Establecer personajes, mundo, tono y el incidente que dispara la trama.',
        guideQuestions: [
          '¿Quién es el protagonista y cómo es su mundo?',
          '¿Qué evento dispara el conflicto principal?',
          '¿Qué decisión lleva al protagonista al Acto II?',
        ],
      },
      {
        key: 'confrontacion',
        name: 'Acto II. Confrontación',
        description:
          'El protagonista enfrenta obstáculos crecientes; las apuestas suben y el punto medio suele cambiar las reglas del juego. Termina en el peor momento del héroe.',
        objective: 'Desarrollar el conflicto con complicaciones y giros crecientes.',
        guideQuestions: [
          '¿Qué obstáculos escalan el conflicto?',
          '¿Qué ocurre en el punto medio que cambia la situación?',
          '¿Cuál es el momento más oscuro antes del Acto III?',
        ],
      },
      {
        key: 'resolucion',
        name: 'Acto III. Resolución',
        description:
          'El clímax resuelve el conflicto central y el desenlace muestra las consecuencias y el nuevo estado de las cosas.',
        objective: 'Resolver el conflicto y cerrar los arcos de los personajes.',
        guideQuestions: [
          '¿Cómo se resuelve el enfrentamiento final?',
          '¿Qué consecuencias quedan para los personajes?',
          '¿Qué imagen o idea final deja la historia?',
        ],
      },
    ],
  },
];

/**
 * Devuelve el template con el id indicado, o undefined si no existe.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getFrameworkTemplate(id) {
  return FRAMEWORK_TEMPLATES.find((t) => t.id === id);
}
