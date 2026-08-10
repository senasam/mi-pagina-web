export const DESIGN_TABS = [
  ['resumen', 'Resumen'], ['brujula', 'Brújula'], ['inicio', 'Inicio'],
  ['personajes', 'Personajes'], ['arcos', 'Arcos'], ['tramas', 'Tramas'],
  ['capitulos', 'Capítulos'], ['escenas', 'Escenas'],
  ['tema', 'Tema'],
  ['estructura', 'Estructura'], ['herramientas', 'Herramientas'], ['diagnostico', 'Diagnóstico'],
];

export default function DesignTabs({ active, onChange }) {
  return <nav className="studio-design-tabs" aria-label="Secciones del diseño narrativo">
    {DESIGN_TABS.map(([id, label]) => <button type="button" key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)}>{label}</button>)}
  </nav>;
}
