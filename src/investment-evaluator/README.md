# Arquitectura del evaluador inmobiliario

La ruta pública sigue entrando por `../InvestmentEvaluatorPage.jsx`. Ese archivo
orquesta el estado, obtiene indicadores y arma el modelo financiero; la interfaz
está separada para que un cambio localizado no requiera leer toda la herramienta.

## Dónde hacer cada cambio

- `config.js`: valores iniciales, constantes de página y formateadores propios.
- `inputs.jsx`: campos numéricos, monetarios, selectores y conversión UF/CLP.
- `InvestmentForm.jsx`: captura de supuestos y configuración del escenario.
- `DecisionSummary.jsx`: conclusión, riesgos, condiciones y próximos pasos.
- `results.jsx`: métricas, tablas VPN, proyección anual y gráfico.
- `InvestmentResults.jsx`: composición de resultados, sensibilidad y escenarios.
- `InvestmentMethodology.jsx`: glosario, metodología, límites y textos legales.
- `../investmentEngine.js`: fórmulas de operación anual y comparación financiera.
- `../preOperationalEngine.js`: etapa previa al primer arriendo de propiedades nuevas.

## Reglas de extensión

1. Una fórmula nueva debe vivir en un motor y tener una prueba unitaria; los
   componentes solo presentan resultados.
2. Un campo reutilizable pertenece a `inputs.jsx`; un bloque exclusivo del
   formulario pertenece a `InvestmentForm.jsx`.
3. Un indicador nuevo se calcula en la página/orquestador (o en un hook dedicado
   si necesita estado) y se entrega a la vista mediante `model`.
4. Los valores financieros no se guardan en URL, almacenamiento local ni eventos
   de analítica.
5. Después de un cambio, ejecutar `npm test` y `npm run build`.

La prueba de integración concatena estos módulos deliberadamente: verifica el
contrato completo sin obligar a concentrar textos e implementación en un archivo.
