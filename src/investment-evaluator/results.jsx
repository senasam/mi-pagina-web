import { useState } from "react";
import { formatClp, formatUf } from "../mortgageEngine";
import TechnicalHelp from "../TechnicalHelp";
import { MoneyValue } from "./inputs";

export function VpnFlowTable({ title, flows, discountRate, ufValue, currencyMode }) {
  const presentValue = (flow) => flow.totalUf / Math.pow(1 + discountRate, flow.year);
  const vpnUf = flows.reduce((sum, flow) => sum + presentValue(flow), 0);
  return (
    <div className="vpn-flow-table">
      <h3>{title}</h3>
      <p>El año 0 es la inversión inicial. El valor presente muestra cuánto vale hoy cada flujo después de aplicar la tasa de descuento.</p>
      <div className="table-scroll" tabIndex="0">
        <table>
          <caption>Flujos utilizados para calcular este VPN</caption>
          <thead><tr><th>Año</th><th>Flujo del arriendo</th><th>Venta o continuidad</th><th>Flujo total</th><th>Valor presente</th></tr></thead>
          <tbody>
            {flows.map((flow) => (
              <tr key={flow.year}>
                <th>{flow.year === 0 ? "0 · inversión inicial" : flow.year}</th>
                <td><MoneyValue valueUf={flow.operatingUf} ufValue={ufValue} currencyMode={currencyMode} /></td>
                <td>{flow.terminalUf === 0 ? "—" : <MoneyValue valueUf={flow.terminalUf} ufValue={ufValue} currencyMode={currencyMode} />}</td>
                <td><MoneyValue valueUf={flow.totalUf} ufValue={ufValue} currencyMode={currencyMode} /></td>
                <td><MoneyValue valueUf={presentValue(flow)} ufValue={ufValue} currencyMode={currencyMode} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><th colSpan="4">VPN</th><td><MoneyValue valueUf={vpnUf} ufValue={ufValue} currencyMode={currencyMode} /></td></tr></tfoot>
        </table>
      </div>
    </div>
  );
}

export function Metric({ label, value, moneyUf, ufValue, currencyMode, detail, helpConcept, helpLabel, helpContext, helpExtra }) {
  return (
    <div className="investment-metric">
      <dt>
        <span>{label}</span>
        {helpConcept && (
          <TechnicalHelp
            concept={helpConcept}
            label={helpLabel || `Explicación de ${label}`}
            context={helpContext}
            extra={helpExtra}
          />
        )}
      </dt>
      <dd>
        {moneyUf !== undefined ? (
          <MoneyValue
            valueUf={moneyUf}
            ufValue={ufValue}
            currencyMode={currencyMode}
          />
        ) : (
          value
        )}
      </dd>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export function solverLabel(result, formatter = formatUf) {
  if (result?.status === "converged" && Number.isFinite(result.value))
    return formatter(result.value);
  if (
    result?.status === "multiple-roots-possible" &&
    Number.isFinite(result.value)
  )
    return `${formatter(result.value)} (revisar raíces)`;
  return "Sin solución válida en el rango probado";
}

export function SolverMoneyMetric({ label, result, ufValue, currencyMode }) {
  const solved =
    ["converged", "multiple-roots-possible"].includes(result?.status) &&
    Number.isFinite(result?.value);
  return solved ? (
    <Metric
      label={label}
      moneyUf={result.value}
      ufValue={ufValue}
      currencyMode={currencyMode}
      detail={
        result.status === "multiple-roots-possible"
          ? "Puede haber más de una solución; revisa el flujo."
          : undefined
      }
    />
  ) : (
    <Metric label={label} value="Sin solución válida en el rango probado" />
  );
}

export function ProjectionChart({ rows, ufValue }) {
  const [unit, setUnit] = useState("uf");
  let cumulative = 0;
  const points = rows.map((row) => {
    const previous = cumulative;
    cumulative += row.preTaxCashFlowUf;
    return { year: row.year, change: row.preTaxCashFlowUf, previous, cumulative };
  });
  const values = [0, ...points.flatMap((point) => [point.previous, point.cumulative])];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(maximum - minimum, 1);
  const convert = (value) => unit === "clp" ? value * (ufValue || 0) : value;
  const format = (value) => unit === "clp" ? formatClp(convert(value)) : formatUf(value);
  return (
    <figure
      className="investment-chart"
      aria-labelledby="flow-chart-title flow-chart-desc"
    >
      <figcaption>
        <div className="chart-heading-row">
          <h3 id="flow-chart-title">Cómo se acumula o destruye valor cada año</h3>
          <div className="chart-unit-toggle" aria-label="Unidad del gráfico">
            <button type="button" className={unit === "uf" ? "active" : ""} onClick={() => setUnit("uf")}>UF</button>
            <button type="button" className={unit === "clp" ? "active" : ""} onClick={() => setUnit("clp")} disabled={!ufValue}>Pesos</button>
          </div>
        </div>
        <p id="flow-chart-desc">
          Cada barra parte donde terminó el año anterior. Una subida agrega
          valor al flujo acumulado; una bajada muestra cuánto valor se consume.
        </p>
      </figcaption>
      <div className="waterfall-scroll" tabIndex="0">
        <div className="waterfall-chart" aria-label="Gráfico waterfall del flujo anual acumulado">
        {points.map((point) => {
          const topValue = Math.max(point.previous, point.cumulative);
          const bottomValue = Math.min(point.previous, point.cumulative);
          return (
          <div key={point.year} className="waterfall-year">
            <span className="waterfall-value">{format(point.change)}</span>
            <i
              className={point.change < 0 ? "negative" : "positive"}
              style={{
                bottom: `${((bottomValue - minimum) / span) * 100}%`,
                height: `${Math.max((Math.abs(point.change) / span) * 100, 1.5)}%`,
              }}
              title={`Año ${point.year}: ${format(point.change)}; acumulado ${format(point.cumulative)}`}
            />
            <span className="waterfall-year-label">Año {point.year}</span>
          </div>
        )})}
        </div>
      </div>
      <ul className="chart-legend">
        <li><i /> Agrega valor</li>
        <li><i /> Destruye valor</li>
      </ul>
    </figure>
  );
}

export function SimpleProjectionTable({ rows, saleYear, ufValue, currencyMode }) {
  const money = (value) => (
    <MoneyValue valueUf={value} ufValue={ufValue} currencyMode={currencyMode} />
  );
  return (
    <div className="table-scroll investment-table investment-table--simple" tabIndex="0">
      <table>
        <caption>
          Vista simple de la proyección. Los montos son estimaciones antes de
          impuestos personales y cada uno muestra UF y pesos.
        </caption>
        <thead>
          <tr>
            <th>Año</th>
            <th>Arriendo recibido</th>
            <th>Gastos</th>
            <th>Pago del crédito</th>
            <th>Tú aportas o recibes</th>
            <th>Deuda pendiente</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year} className={row.year === saleYear ? "selected-year" : ""}>
              <th>{row.year}</th>
              <td>{money(row.effectiveIncomeUf)}</td>
              <td>{money(row.operatingExpensesUf + row.capitalExpenditureUf)}</td>
              <td>{money(row.debtServiceUf)}</td>
              <td>
                <span className={row.preTaxCashFlowUf < 0 ? "cash-direction cash-direction--out" : "cash-direction cash-direction--in"}>
                  {row.preTaxCashFlowUf < 0 ? "Aportas " : "Recibes "}
                  {money(Math.abs(row.preTaxCashFlowUf))}
                </span>
              </td>
              <td>{money(row.mortgageBalanceUf)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProjectionTable({ rows, saleYear, ufValue, currencyMode }) {
  const money = (value) => (
    <MoneyValue valueUf={value} ufValue={ufValue} currencyMode={currencyMode} />
  );
  return (
    <div className="table-scroll investment-table" tabIndex="0">
      <table>
        <caption>
          Vista financiera detallada con valores en UF y CLP. La venta es una
          alternativa final y no se suma a la continuidad.
        </caption>
        <thead>
          <tr>
            <th>Año</th>
            <th>Renta potencial</th>
            <th>Vacancia</th>
            <th>Ingreso efectivo</th>
            <th>Gastos operativos</th>
            <th>Ingreso operativo neto</th>
            <th>Deuda</th>
            <th>Gasto de capital</th>
            <th>Flujo</th>
            <th>Valor propiedad</th>
            <th>Saldo deuda</th>
            <th>Comisión prepago</th>
            <th>Venta neta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.year}
              className={row.year === saleYear ? "selected-year" : ""}
            >
              <th>{row.year}</th>
              <td>{money(row.potentialRentUf)}</td>
              <td>{money(row.vacancyLossUf)}</td>
              <td>{money(row.effectiveIncomeUf)}</td>
              <td>{money(row.operatingExpensesUf)}</td>
              <td>{money(row.noiUf)}</td>
              <td>{money(row.debtServiceUf)}</td>
              <td>{money(row.capitalExpenditureUf)}</td>
              <td>{money(row.preTaxCashFlowUf)}</td>
              <td>{money(row.propertyValueUf)}</td>
              <td>{money(row.mortgageBalanceUf)}</td>
              <td>{money(row.prepaymentCostUf)}</td>
              <td>{money(row.netSaleProceedsUf)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


