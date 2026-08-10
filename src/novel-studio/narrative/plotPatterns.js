/**
 * Plantillas de patrones de trama (basadas en las "20 tramas maestras" de Ronald B. Tobias).
 * Lógica pura, sin dependencias de React.
 *
 * Convención: los templates son INMUTABLES. Quien cree una instancia
 * a partir de un template debe copiarlo (structuredClone o similar).
 *
 * Nota: solo se rellenan los campos con consenso claro en la teoría narrativa
 * (definition, typicalConflict, typicalArc, goal, opposition, stakes).
 * Los campos midpoint, climax, resolution, variants y warnings quedan
 * vacíos a propósito: la arquitectura permite completarlos después.
 */

const VACIO = {
  midpoint: '',
  climax: '',
  resolution: '',
  variants: [],
  warnings: [],
};

export const PLOT_PATTERN_TEMPLATES = [
  {
    id: 'busqueda',
    name: 'Búsqueda',
    definition:
      'El protagonista emprende un viaje para encontrar un objeto, persona o lugar, y el verdadero hallazgo suele ser la transformación interior.',
    typicalConflict:
      'El héroe y sus acompañantes contra los obstáculos del camino y contra sus propias limitaciones.',
    typicalArc:
      'El héroe parte en busca de algo externo y, tras las pruebas del viaje, descubre que lo esencial era interno: madura o cambia su escala de valores.',
    goal: 'Encontrar el objeto, persona o lugar buscado.',
    opposition: 'Los obstáculos del viaje, los guardianes del objeto y las dudas internas del héroe.',
    stakes: 'Sin el objeto de la búsqueda, algo valioso se perderá (el hogar, la paz, la propia identidad del héroe).',
    incitingIncident: 'Surge la necesidad o el encargo de encontrar algo y el héroe acepta partir.',
    ...VACIO,
  },
  {
    id: 'aventura',
    name: 'Aventura',
    definition:
      'El protagonista sale al mundo en busca de experiencias y fortuna; el viaje mismo es la recompensa, más que un objeto concreto.',
    typicalConflict:
      'El héroe contra los peligros y maravillas de un mundo desconocido.',
    typicalArc:
      'El héroe sale motivado por la curiosidad o la ambición, encadena peripecias y regresa (o no) transformado por la experiencia.',
    goal: 'Vivir la aventura: explorar, conquistar, hacer fortuna.',
    opposition: 'Los peligros del entorno, rivales por el mismo premio y los límites del propio héroe.',
    stakes: 'La fortuna, la gloria o la supervivencia del héroe; a veces algo que dejó en casa.',
    incitingIncident: 'El héroe decide (o se ve obligado a) abandonar su vida conocida y lanzarse al mundo.',
    ...VACIO,
  },
  {
    id: 'persecucion',
    name: 'Persecución',
    definition:
      'Alguien huye de un perseguidor; la tensión nace de la carrera misma y de la simpatía que el autor decida generar hacia perseguidor o perseguido.',
    typicalConflict:
      'Perseguidor contra perseguido: uno intenta atrapar, el otro escapar.',
    typicalArc:
      'La distancia entre ambos se estrecha y se ensancha hasta el enfrentamiento o la captura final.',
    goal: 'Atrapar al fugitivo (o escapar del perseguidor, según el punto de vista).',
    opposition: 'El bando contrario de la persecución y los obstáculos del terreno.',
    stakes: 'La libertad o la vida del perseguido; la justicia o el deber del perseguidor.',
    incitingIncident: 'Comienza la huida: el perseguido escapa y el perseguidor sale tras él.',
    ...VACIO,
  },
  {
    id: 'rescate',
    name: 'Rescate',
    definition:
      'El protagonista debe liberar a una víctima de un captor; a diferencia de la persecución, el choque entre rescatador y captor es el centro.',
    typicalConflict:
      'Rescatador contra captor, con la víctima como premio (y a menudo como personaje con agencia propia).',
    typicalArc:
      'El rescatador localiza a la víctima, enfrenta al captor y consuma (o fracasa) la liberación.',
    goal: 'Liberar a la víctima y devolverla a salvo.',
    opposition: 'El captor y las defensas que rodean a la víctima.',
    stakes: 'La vida o la libertad de la víctima; a menudo también la del rescatador.',
    incitingIncident: 'La víctima es capturada o se descubre su cautiverio.',
    ...VACIO,
  },
  {
    id: 'huida',
    name: 'Huida',
    definition:
      'El protagonista, inocente o culpable, escapa de un castigo o de una amenaza; la trama vive de la tensión entre la culpabilidad y la persecución.',
    typicalConflict:
      'El fugitivo contra quienes lo persiguen y contra las consecuencias de su propio pasado.',
    typicalArc:
      'El fugitivo escapa, es acorralado una y otra vez, y finalmente se enfrenta a su destino: redención, captura o liberación.',
    goal: 'Escapar del castigo o de la amenaza y alcanzar la seguridad.',
    opposition: 'Los perseguidores y el peso de la culpa o la injusticia que motiva la fuga.',
    stakes: 'La libertad, la vida o la inocencia del fugitivo.',
    incitingIncident: 'El protagonista es condenado, acusado o amenazado y decide huir.',
    ...VACIO,
  },
  {
    id: 'venganza',
    name: 'Venganza',
    definition:
      'El protagonista busca justicia por cuenta propia contra quien le hizo un daño, a él o a los suyos.',
    typicalConflict:
      'El vengador contra el culpable del agravio; también el vengador contra su propia degradación moral.',
    typicalArc:
      'El agravio enciende la obsesión, el vengador se acerca a su objetivo y debe decidir hasta dónde llegar: consumar la venganza o renunciar a ella.',
    goal: 'Castigar al responsable del agravio.',
    opposition: 'El culpable y sus defensas; la ley; las dudas morales del propio vengador.',
    stakes: 'La justicia y el honor del vengador; a menudo, su propia humanidad.',
    incitingIncident: 'Se comete el agravio (real o percibido) que exige reparación.',
    ...VACIO,
  },
  {
    id: 'enigma',
    name: 'Enigma (acertijo)',
    definition:
      'El protagonista debe resolver un misterio o acertijo, a menudo bajo presión de tiempo o con la vida en juego.',
    typicalConflict:
      'El ingenio del héroe contra el planteador del enigma o contra la complejidad del misterio.',
    typicalArc:
      'El héroe recibe el desafío, recopila pistas, falla y aprende, hasta dar con la solución.',
    goal: 'Resolver el enigma o descifrar el misterio.',
    opposition: 'Quien plantea el acertijo, las pistas falsas y el límite de tiempo o de recursos.',
    stakes: 'La vida, la libertad o una recompensa extraordinaria dependen de la solución.',
    incitingIncident: 'Se plantea el enigma o se descubre el misterio que hay que resolver.',
    ...VACIO,
  },
  {
    id: 'rivalidad',
    name: 'Rivalidad',
    definition:
      'Dos personajes compiten por el mismo objetivo: poder, amor, reconocimiento o supervivencia.',
    typicalConflict:
      'Protagonista contra rival: dos fuerzas comparables que persiguen lo mismo y no pueden ganar ambas.',
    typicalArc:
      'La competencia escala desde la provocación inicial hasta el enfrentamiento decisivo que define al vencedor.',
    goal: 'Superar al rival y obtener el objeto de la disputa.',
    opposition: 'El rival, con recursos y determinación comparables a los del protagonista.',
    stakes: 'El objetivo disputado y, con él, el estatus, el amor o la supervivencia del perdedor.',
    incitingIncident: 'Ambos personajes fijan su deseo en el mismo objetivo y la competencia se declara.',
    ...VACIO,
  },
  {
    id: 'desvalido',
    name: 'El desvalido',
    definition:
      'Un protagonista en clara desventaja (el "underdog") se enfrenta a un adversario mucho más poderoso.',
    typicalConflict:
      'El desvalido contra el favorito: la fuerza, el poder o el sistema contra la voluntad y el ingenio.',
    typicalArc:
      'El desvalido sufre la superioridad del adversario, encuentra su ventaja inesperada y compite con posibilidades reales al final.',
    goal: 'Vencer o resistir frente a un adversario muy superior.',
    opposition: 'El adversario poderoso y todo lo que lo hace favorito (recursos, estatus, aliados).',
    stakes: 'La dignidad, la supervivencia o la causa que el desvalido representa.',
    incitingIncident: 'El desvalido entra en conflicto con el poderoso o acepta el desafío desigual.',
    ...VACIO,
  },
  {
    id: 'tentacion',
    name: 'Tentación',
    definition:
      'El protagonista es seducido por algo que desea pero que sabe (o intuye) que le hará daño.',
    typicalConflict:
      'El héroe contra su propio deseo: la tentación externa encarna un conflicto interno.',
    typicalArc:
      'El héroe cede gradualmente a la tentación, sufre sus consecuencias y debe elegir entre hundirse o renunciar y redimirse.',
    goal: 'Resistir la tentación (o, tras caer, liberarse de ella).',
    opposition: 'El tentador o la tentación misma, y la debilidad interna del héroe.',
    stakes: 'La integridad, las relaciones o el alma del protagonista.',
    incitingIncident: 'Aparece la oferta tentadora que promete satisfacer un deseo profundo del héroe.',
    ...VACIO,
  },
  {
    id: 'metamorfosis',
    name: 'Metamorfosis',
    definition:
      'El protagonista se transforma literalmente en otro ser (animal, monstruo, otra persona) y la trama explora esa condición.',
    typicalConflict:
      'El transformado contra su nueva naturaleza y contra quienes lo rechazan o lo causaron.',
    typicalArc:
      'La transformación ocurre, el héroe aprende a vivir (o a luchar) con ella y busca revertirla o aceptarla.',
    goal: 'Revertir la transformación o aprender a vivir con la nueva forma.',
    opposition: 'La causa de la metamorfosis (maldición, ciencia, azar) y la sociedad que rechaza al transformado.',
    stakes: 'La identidad y la humanidad del protagonista; sus vínculos con los demás.',
    incitingIncident: 'Ocurre la transformación que cambia la naturaleza del protagonista.',
    ...VACIO,
  },
  {
    id: 'transformacion',
    name: 'Transformación',
    definition:
      'El protagonista cambia profundamente como persona a lo largo de la historia; a diferencia de la metamorfosis, el cambio es interior.',
    typicalConflict:
      'El héroe contra sus propios defectos y contra las circunstancias que lo empujan a cambiar.',
    typicalArc:
      'Una crisis expone los defectos del héroe; el proceso de cambio avanza con avances y retrocesos hasta la transformación final.',
    goal: 'Atravesar el proceso de cambio y emerger como una persona distinta.',
    opposition: 'Los viejos hábitos y miedos del héroe, y quienes se benefician de que no cambie.',
    stakes: 'La vida interior del héroe: sus relaciones, su futuro y su sentido de sí mismo.',
    incitingIncident: 'Una crisis o encuentro revela que el héroe ya no puede seguir siendo quien es.',
    ...VACIO,
  },
  {
    id: 'maduracion',
    name: 'Maduración',
    definition:
      'Historia de paso a la adultez: el protagonista pierde la inocencia y aprende una verdad dolorosa sobre el mundo.',
    typicalConflict:
      'El joven protagonista contra las certezas heredadas y las primeras experiencias duras de la vida adulta.',
    typicalArc:
      'El protagonista parte de la inocencia, enfrenta una experiencia que la quiebra y alcanza una comprensión más madura (y a menudo agridulce).',
    goal: 'Comprender el mundo adulto y encontrar el propio lugar en él.',
    opposition: 'Las ilusiones de la infancia, la autoridad y las experiencias que niegan esas ilusiones.',
    stakes: 'La inocencia del protagonista y la clase de adulto en que se convertirá.',
    incitingIncident: 'Una experiencia o revelación pone en crisis la visión infantil del mundo.',
    ...VACIO,
  },
  {
    id: 'amor',
    name: 'Amor',
    definition:
      'Dos personas se enamoran y la trama sigue los obstáculos que deben superar para estar juntos.',
    typicalConflict:
      'Los amantes contra los obstáculos internos (miedos, heridas, incompatibilidades) y externos (circunstancias, terceros) que los separan.',
    typicalArc:
      'Encuentro, acercamiento, crisis que separa y resolución: unión o separación definitiva.',
    goal: 'Que los amantes superen los obstáculos y consumen su unión.',
    opposition: 'Las barreras externas y los defectos o miedos internos de cada amante.',
    stakes: 'La felicidad de ambos: el amor verdadero ganado o perdido para siempre.',
    incitingIncident: 'Los dos personajes se conocen y nace la atracción o el vínculo inicial.',
    ...VACIO,
  },
  {
    id: 'amor-prohibido',
    name: 'Amor prohibido',
    definition:
      'Los amantes pertenecen a mundos que la sociedad, la familia o la ley declaran incompatibles.',
    typicalConflict:
      'Los amantes contra la fuerza social (familia, clase, religión, ley) que prohíbe su unión.',
    typicalArc:
      'El amor nace a pesar de la prohibición, crece en secreto o a la vista, y la presión externa obliga a un desenlace trágico o triunfal.',
    goal: 'Vivir el amor a pesar de la prohibición.',
    opposition: 'La autoridad o convención que prohíbe la unión y quienes la hacen cumplir.',
    stakes: 'El amor mismo y, con frecuencia, la vida, el honor o el lugar de los amantes en su comunidad.',
    incitingIncident: 'Los amantes se conocen y se enamoran pese a la barrera que los separa.',
    ...VACIO,
  },
  {
    id: 'sacrificio',
    name: 'Sacrificio',
    definition:
      'El protagonista renuncia a algo profundamente valioso por un ideal, una persona o un deber mayor.',
    typicalConflict:
      'El héroe dividido entre su deseo personal y el deber o ideal que exige la renuncia.',
    typicalArc:
      'La necesidad del sacrificio se impone, el héroe lucha con el precio y finalmente paga (o elude) el coste, con consecuencias definitivas.',
    goal: 'Cumplir el deber o ideal que exige renunciar a algo esencial.',
    opposition: 'El deseo personal del héroe y quienes le ofrecen una salida más fácil.',
    stakes: 'Lo que se sacrifica (vida, amor, felicidad) y la causa por la que se sacrifica.',
    incitingIncident: 'Surge la situación que exige al héroe elegir entre su deseo y su deber.',
    ...VACIO,
  },
  {
    id: 'descubrimiento',
    name: 'Descubrimiento',
    definition:
      'El protagonista descubre una verdad oculta —sobre el mundo, sobre otros o sobre sí mismo— que lo cambia todo.',
    typicalConflict:
      'El héroe contra el secreto: quienes lo ocultan y la resistencia del propio héroe a aceptar la verdad.',
    typicalArc:
      'Una anomalía despierta la sospecha, la investigación revela capas de verdad y el descubrimiento final redefine la vida del héroe.',
    goal: 'Descubrir la verdad oculta y decidir qué hacer con ella.',
    opposition: 'Quienes protegen el secreto y la negación interna del héroe.',
    stakes: 'La identidad, las creencias o la seguridad del héroe; a veces la de muchos más.',
    incitingIncident: 'Algo no encaja: una pista o anomalía revela que hay un secreto.',
    ...VACIO,
  },
  {
    id: 'exceso',
    name: 'Exceso (locura)',
    definition:
      'El protagonista se entrega a un exceso —ambición, obsesión, adicción— que lo empuja más allá de los límites de lo razonable.',
    typicalConflict:
      'El héroe contra su propia compulsión y contra quienes intentan detenerlo.',
    typicalArc:
      'El exceso comienza como placer o ambición legítima, se vuelve compulsión, arrastra al héroe al borde del abismo y termina en caída o en recuperación.',
    goal: 'Satisfacer el impulso (y, en el mejor caso, liberarse de él antes de la destrucción).',
    opposition: 'La propia compulsión del héroe y las personas que sufren o combaten sus efectos.',
    stakes: 'La cordura, la vida y los vínculos del protagonista.',
    incitingIncident: 'El héroe cruza la primera línea: prueba el exceso que lo atrapará.',
    ...VACIO,
  },
  {
    id: 'ascension',
    name: 'Ascensión',
    definition:
      'El protagonista sube desde una posición baja hacia el poder, la riqueza o el éxito, y la trama examina el precio de esa subida.',
    typicalConflict:
      'El héroe contra los obstáculos de la escala social y contra las concesiones morales que exige cada peldaño.',
    typicalArc:
      'El héroe parte de abajo, asciende con esfuerzo y astucia, y en la cima debe enfrentar lo que sacrificó (o en quién se convirtió) para llegar.',
    goal: 'Alcanzar el poder, la riqueza o la posición deseada.',
    opposition: 'Los rivales en la escala, las barreras de clase y los dilemas morales del ascenso.',
    stakes: 'El éxito perseguido y la integridad o los afectos que el héroe arriesga para lograrlo.',
    incitingIncident: 'El héroe vislumbra la posibilidad de ascender y da el primer paso.',
    ...VACIO,
  },
  {
    id: 'caida',
    name: 'Caída',
    definition:
      'El protagonista desciende desde una posición alta hacia la ruina, por un error, un defecto o una fuerza superior.',
    typicalConflict:
      'El héroe contra las fuerzas que lo derriban y contra el defecto propio que hace posible la caída.',
    typicalArc:
      'El héroe disfruta de una posición elevada, comete el error o cede al defecto que lo condena, y cae peldaño a peldaño hasta la ruina (o, rara vez, la redención).',
    goal: 'Conservar la posición (y, una vez perdida, sobrevivir o redimirse).',
    opposition: 'El defecto trágico del héroe, sus enemigos y las consecuencias acumuladas de sus actos.',
    stakes: 'Todo lo que el héroe tiene: estatus, fortuna, familia, vida.',
    incitingIncident: 'El héroe, en lo alto, comete el acto o revela el defecto que iniciará su caída.',
    ...VACIO,
  },
];

/**
 * Devuelve el patrón de trama con el id indicado, o undefined si no existe.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getPlotPatternTemplate(id) {
  return PLOT_PATTERN_TEMPLATES.find((t) => t.id === id);
}
