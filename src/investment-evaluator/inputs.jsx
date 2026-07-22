import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { formatClp, formatUf } from "../mortgageEngine";
import TechnicalHelp from "../TechnicalHelp";
import { formatNumericInput, normalizeNumericInput } from "../chileanNumberInput";
import { asNumber } from "./config";

export function Input({
  id,
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = "any",
  help,
  helpConcept,
}) {
  const [sliderLocked, setSliderLocked] = useState(true);
  const isPercentage = String(unit || "").startsWith("%");
  const sliderMin = Number.isFinite(asNumber(min)) ? asNumber(min) : 0;
  const sliderMax = Number.isFinite(asNumber(max)) ? asNumber(max) : 100;
  const percentageValue = Math.min(sliderMax, Math.max(sliderMin, asNumber(value) || 0));
  const percentageDisplayValue =
    percentageValue === asNumber(value) ? value : percentageValue;
  const hasUnitStepper =
    !isPercentage && ["UF", "año", "años"].includes(String(unit || ""));
  const numericValue = Number.isFinite(asNumber(value)) ? asNumber(value) : 0;
  const numericMin = Number.isFinite(asNumber(min)) ? asNumber(min) : null;
  const numericMax = Number.isFinite(asNumber(max)) ? asNumber(max) : null;
  const adjust = (delta) => {
    const next = numericValue + delta;
    onChange(
      Math.min(
        numericMax ?? Number.POSITIVE_INFINITY,
        Math.max(numericMin ?? Number.NEGATIVE_INFINITY, next),
      ),
    );
  };
  const standardInput = (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      data-min={min}
      data-max={max}
      data-step={step}
      value={formatNumericInput(value)}
      onChange={(event) => onChange(normalizeNumericInput(event.target.value))}
      data-private="true"
    />
  );
  return (
    <div className="investment-field">
      <div className="investment-field__label-row">
        <label htmlFor={id}>
          {label}
          {unit ? ` (${unit})` : ""}
        </label>
        {helpConcept && <TechnicalHelp concept={helpConcept} label={`Explicación de ${label}`} />}
      </div>
      {isPercentage ? (
        <div className="percentage-slider">
          <input
            id={id}
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={step === "any" ? "0.01" : step}
            value={percentageValue}
            aria-valuetext={`${formatNumericInput(percentageDisplayValue)}%`}
            onChange={(event) => onChange(event.target.value)}
            disabled={sliderLocked}
            data-private="true"
          />
          <output htmlFor={id}>
            {formatNumericInput(percentageDisplayValue)}%
          </output>
          <button
            type="button"
            className={`slider-lock ${sliderLocked ? "slider-lock--locked" : "slider-lock--unlocked"}`}
            onClick={() => setSliderLocked((locked) => !locked)}
            aria-pressed={!sliderLocked}
            aria-label={`${sliderLocked ? "Desbloquear" : "Bloquear"} ${label}`}
            title={sliderLocked ? "Desbloquear slider" : "Bloquear slider"}
          >
            {sliderLocked ? <Lock size={17} /> : <Unlock size={17} />}
            <span className="sr-only">{sliderLocked ? "Desbloquear" : "Bloquear"}</span>
          </button>
        </div>
      ) : hasUnitStepper ? (
        <div className="numeric-stepper">
          <button
            type="button"
            onClick={() => adjust(-1)}
            disabled={numericMin != null && numericValue <= numericMin}
            aria-label={`Disminuir ${label} en 1 ${unit}`}
          >
            −
          </button>
          {standardInput}
          <button
            type="button"
            onClick={() => adjust(1)}
            disabled={numericMax != null && numericValue >= numericMax}
            aria-label={`Aumentar ${label} en 1 ${unit}`}
          >
            +
          </button>
        </div>
      ) : standardInput}
      {help && <small>{help}</small>}
    </div>
  );
}

export function MoneyInput({
  id,
  label,
  valueUf,
  onChangeUf,
  currencyMode,
  ufValue,
  min = 0,
  help,
  helpConcept,
}) {
  const validUf = valueUf !== "" && Number.isFinite(asNumber(valueUf));
  const primaryValue =
    valueUf === ""
      ? ""
      : currencyMode === "clp" && ufValue > 0
        ? Number((asNumber(valueUf) * ufValue).toFixed(0))
        : valueUf;
  const secondary =
    validUf && ufValue > 0
      ? currencyMode === "clp"
        ? formatUf(asNumber(valueUf))
        : formatClp(asNumber(valueUf) * ufValue)
      : null;
  const change = (raw) => {
    if (raw === "") return onChangeUf("");
    const parsed = asNumber(raw);
    onChangeUf(
      currencyMode === "clp" && ufValue > 0 ? parsed / ufValue : parsed,
    );
  };
  const numericUfValue = Number.isFinite(asNumber(valueUf))
    ? asNumber(valueUf)
    : 0;
  const minimumUf = Number.isFinite(asNumber(min)) ? asNumber(min) : 0;
  const moneyInput = (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      data-min={min}
      value={formatNumericInput(primaryValue)}
      onChange={(event) => change(normalizeNumericInput(event.target.value))}
      data-private="true"
    />
  );
  return (
    <div className="investment-field money-field">
      <div className="investment-field__label-row">
        <label htmlFor={id}>
          {label} ({currencyMode === "clp" ? "CLP" : "UF"})
        </label>
        {helpConcept && <TechnicalHelp concept={helpConcept} label={`Explicación de ${label}`} />}
      </div>
      {currencyMode === "uf" ? (
        <div className="numeric-stepper">
          <button
            type="button"
            onClick={() => onChangeUf(Math.max(minimumUf, numericUfValue - 1))}
            disabled={numericUfValue <= minimumUf}
            aria-label={`Disminuir ${label} en 1 UF`}
          >
            −
          </button>
          {moneyInput}
          <button
            type="button"
            onClick={() => onChangeUf(numericUfValue + 1)}
            aria-label={`Aumentar ${label} en 1 UF`}
          >
            +
          </button>
        </div>
      ) : moneyInput}
      {secondary && (
        <small className="money-equivalent">Equivale a {secondary}</small>
      )}
      {help && <small>{help}</small>}
    </div>
  );
}

export function Select({
  id,
  label,
  value,
  onChange,
  children,
  help,
  className = "",
}) {
  return (
    <div className="investment-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      {help && <small>{help}</small>}
    </div>
  );
}

export function MoneyValue({ valueUf, ufValue, currencyMode = "uf" }) {
  if (!Number.isFinite(valueUf)) return <span>—</span>;
  const primary =
    currencyMode === "clp" && ufValue > 0
      ? formatClp(valueUf * ufValue)
      : formatUf(valueUf);
  const secondary =
    currencyMode === "clp"
      ? formatUf(valueUf)
      : ufValue > 0
        ? formatClp(valueUf * ufValue)
        : null;
  return (
    <span className="dual-money">
      <span>{primary}</span>
      {secondary && <small>{secondary}</small>}
    </span>
  );
}

