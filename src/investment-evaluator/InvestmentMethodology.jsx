export default function InvestmentMethodology() {
  return (
    <section className="investment-methodology investment-methodology--inline">
      <div className="section-title">
        <p className="eyebrow">Antes de probar otros supuestos</p>
        <h2>Cómo funciona el cálculo y qué no considera</h2>
        <p>
          Revisa esta explicación si quieres entender qué hay detrás de los
          resultados. El contenido técnico permanece cerrado por defecto.
        </p>
      </div>
      <details className="methodology-details">
        <summary>Ver explicación técnica y límites</summary>
        <div className="method-grid">
          <article>
            <h3>Adquisición</h3>
            <p>
              El capital inicial suma pie, gastos del comprador, corretaje,
              preparación y reservas. No presume que el crédito financie esos
              conceptos.
            </p>
          </article>
          <article>
            <h3>Operación</h3>
            <p>
              La renta potencial se ajusta por ocupación. El ingreso operativo
              neto descuenta egresos operativos, pero excluye crédito y gastos
              de capital.
            </p>
          </article>
          <article>
            <h3>Financiamiento</h3>
            <p>
              Cada año suma pagos reales del calendario hipotecario compartido.
              Después del vencimiento, el servicio de deuda es cero.
            </p>
          </article>
          <article>
            <h3>Salida</h3>
            <p>
              La venta neta descuenta deuda y costos de salida una sola vez. La
              comisión de prepago puede estimarse automáticamente o reemplazarse
              por el monto certificado por el banco.
            </p>
          </article>
          <article>
            <h3>Continuidad</h3>
            <p>
              Valora el ingreso operativo neto posterior con una perpetuidad
              creciente. Exige que el retorno alternativo expresado como UF +
              tasa sea mayor que el crecimiento perpetuo.
            </p>
          </article>
          <article>
            <h3>Valor presente y tasas de retorno</h3>
            <p>
              El valor presente neto usa el retorno de tu mejor alternativa. La
              tasa interna de retorno puede no existir o tener múltiples
              soluciones; su versión modificada explicita financiamiento y
              reinversión.
            </p>
          </article>
        </div>
      </details>
    </section>
  );
}

export function InvestmentReference() {
  return (
    <section className="investment-reference" aria-label="Conceptos y límites de la simulación">
      <details className="financial-glossary">
        <summary>Ver glosario completo de siglas y conceptos</summary>
        <dl>
          <div><dt>UF</dt><dd>Unidad de Fomento. Unidad reajustable usada habitualmente en operaciones inmobiliarias chilenas.</dd></div>
          <div><dt>CLP</dt><dd>Pesos chilenos.</dd></div>
          <div><dt>NOI</dt><dd>Ingreso operativo neto: ingreso efectivo menos gastos de operación, antes del crédito y los gastos de capital.</dd></div>
          <div><dt>VPN</dt><dd>Valor presente neto: valor de todos los flujos comparados con la rentabilidad de tu mejor alternativa.</dd></div>
          <div><dt>TIR</dt><dd>Tasa interna de retorno: tasa que hace que el valor presente neto sea cero.</dd></div>
          <div><dt>MIRR</dt><dd>Tasa interna de retorno modificada: variante que explicita cómo se financian y reinvierten los flujos.</dd></div>
          <div><dt>DSCR</dt><dd>Cobertura del servicio de deuda: cuántas veces el ingreso operativo neto cubre los pagos del crédito.</dd></div>
          <div><dt>CAPEX</dt><dd>Gasto de capital: desembolso relevante para renovar o reponer componentes del inmueble.</dd></div>
          <div><dt>Retorno sobre efectivo</dt><dd>Flujo anual dividido por el capital que aportaste inicialmente.</dd></div>
        </dl>
      </details>

      <section className="legal-note" aria-labelledby="legal-note-title">
        <h2 id="legal-note-title">Aviso importante</h2>
        <p className="legal-note__summary">
          Esta herramienta es una simulación referencial con fines informativos
          y educacionales. No constituye asesoría financiera, legal, tributaria,
          contable ni inmobiliaria. Puede tener errores y sus resultados deben
          verificarse antes de tomar una decisión. No reemplaza la evaluación de un banco.
        </p>
        <p className="legal-note__date"><strong>Última revisión:</strong> 18 de julio de 2026.</p>
        <details className="legal-note__details">
          <summary>Leer aviso legal completo</summary>
          <section>
            <h3>Aviso importante</h3>
            <p>
              La presente herramienta constituye una simulación referencial,
              elaborada con fines exclusivamente informativos y educacionales.
              Los resultados que entrega pueden contener supuestos,
              aproximaciones, omisiones o eventuales errores, por lo que no
              necesariamente reflejan la situación particular de cada usuario
              ni las condiciones efectivamente aplicables al caso concreto.
            </p>
            <p>
              En consecuencia, la información proporcionada no constituye
              asesoría financiera, legal, tributaria, contable ni inmobiliaria,
              ni reemplaza en caso alguno la revisión profesional especializada,
              la evaluación de una institución financiera, ni el análisis
              particular que corresponda según las circunstancias del usuario,
              del crédito y del inmueble. Toda decisión adoptada sobre la base de
              esta simulación es de exclusiva responsabilidad del usuario.
            </p>
          </section>
          <section>
            <h3>Alcance y limitaciones</h3>
            <p>
              Los cálculos presentados tienen carácter meramente estimativo. El
              tratamiento tributario, los costos asociados, las condiciones de
              financiamiento y demás variables relevantes dependen de la
              situación particular del usuario, del inmueble y de la normativa
              aplicable en Chile, por lo que deberán ser verificados directamente
              con fuentes oficiales o con un asesor competente.
            </p>
            <p>
              La comisión por prepago se calcula de forma automática conforme a
              la{" "}<a href="https://www.bcn.cl/leychile/navegar?idNorma=29438&idParte=8101667" target="_blank" rel="noreferrer">Ley N.º 18.010</a>{" "}
              y su aplicación puede variar según las características específicas
              del crédito. Para determinar el monto exacto, deberá solicitarse al
              banco respectivo el certificado de liquidación correspondiente. La{" "}
              <a href="https://www.cmfchile.cl/educa/621/w3-article-27382.html" target="_blank" rel="noreferrer">Comisión para el Mercado Financiero</a>{" "}
              publicará o mantendrá disponibles, según corresponda, las reglas
              aplicables.
            </p>
            <p>
              Los valores expresados en pesos chilenos se calculan utilizando la
              UF vigente a la fecha de la simulación y no incorporan proyecciones
              sobre su evolución futura. Asimismo, la simulación no considera,
              entre otros factores, impuestos personales, modificaciones en la
              tasa de interés, contingencias legales, daños materiales,
              dificultades de venta, renegociaciones, mora, ni otros eventos
              sobrevinientes o no previstos.
            </p>
            <p>
              La información tributaria incorporada por el usuario no constituye,
              por sí sola, una determinación o conclusión legal o tributaria.
            </p>
          </section>
        </details>
      </section>
      <p className="investment-reference__guide">
        <a className="text-button" href="/aprende/finanzas-personales/evaluar-inversion-inmobiliaria">
          Leer la guía completa, casos ficticios y fórmulas
        </a>
      </p>
    </section>
  );
}
