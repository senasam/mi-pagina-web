// Feriados legales de Chile para convertir días hábiles de feriado en días corridos.
// Funciones puras: no dependen de la UI ni de la fecha actual.
import { holidayParams } from "./legalParams.js";

const pad = (value) => String(value).padStart(2, "0");
const utc = (year, month, day) => new Date(Date.UTC(year, month - 1, day));
export const isoDate = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const shift = (date, days) => new Date(date.getTime() + days * 86400000);

// Algoritmo anónimo gregoriano (Meeus/Jones/Butcher) para el Domingo de Resurrección.
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

// Ley 19.668: martes, miércoles o jueves → lunes de esa semana; viernes → lunes siguiente.
function mondayRule(date) {
  const weekday = date.getUTCDay();
  if (weekday >= 2 && weekday <= 4) return shift(date, 1 - weekday);
  if (weekday === 5) return shift(date, 3);
  return date;
}

// Ley 20.299: si el 31 de octubre es martes se traslada al viernes anterior; si es miércoles, al viernes siguiente.
function reformationRule(date) {
  const weekday = date.getUTCDay();
  if (weekday === 2) return shift(date, -4);
  if (weekday === 3) return shift(date, 2);
  return date;
}

export function chileanHolidays(year) {
  const list = holidayParams.fixed.map(({ md, label, fuenteId }) => ({ date: `${year}-${md}`, label, fuenteId }));
  const easter = easterSunday(year);
  list.push({ date: isoDate(shift(easter, -2)), label: "Viernes Santo", fuenteId: "ley-2977" });
  list.push({ date: isoDate(shift(easter, -1)), label: "Sábado Santo", fuenteId: "ley-2977" });
  list.push({ date: isoDate(mondayRule(utc(year, 6, 29))), label: "San Pedro y San Pablo", fuenteId: "ley-19668" });
  list.push({ date: isoDate(mondayRule(utc(year, 10, 12))), label: "Encuentro de Dos Mundos", fuenteId: "ley-19668" });
  if (year >= 2008) list.push({ date: isoDate(reformationRule(utc(year, 10, 31))), label: "Iglesias Evangélicas y Protestantes", fuenteId: "ley-20299" });
  const solstice = holidayParams.solsticioInvierno[year];
  if (solstice) list.push({ date: `${year}-${solstice}`, label: "Día Nacional de los Pueblos Indígenas", fuenteId: "ley-21357" });
  if (utc(year, 9, 17).getUTCDay() === 1) list.push({ date: `${year}-09-17`, label: "Fiestas Patrias (lunes 17)", fuenteId: "ley-20215" });
  if (utc(year, 9, 20).getUTCDay() === 5) list.push({ date: `${year}-09-20`, label: "Fiestas Patrias (viernes 20)", fuenteId: "ley-20215" });
  holidayParams.extraordinarios.filter((item) => item.date.startsWith(`${year}-`)).forEach((item) => list.push(item));
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

const holidayCache = new Map();
export function isChileanHoliday(dateIso) {
  const year = Number(dateIso.slice(0, 4));
  if (!holidayCache.has(year)) holidayCache.set(year, new Set(chileanHolidays(year).map((item) => item.date)));
  return holidayCache.get(year).has(dateIso);
}

// Art. 69 CT y Dictamen 7549/314: el sábado es inhábil para el feriado.
export function isVacationBusinessDay(dateIso) {
  const weekday = new Date(`${dateIso}T00:00:00Z`).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !isChileanHoliday(dateIso);
}

// Cuenta los días hábiles desde el día siguiente al término y agrega los sábados, domingos y festivos intermedios.
// La fracción de día hábil se suma al final sin agregar inhábiles adicionales (criterio DT).
export function businessToCalendarDays(endDateIso, businessDays) {
  const whole = Math.floor(businessDays + 1e-9);
  const fraction = Math.max(0, businessDays - whole);
  let cursor = new Date(`${endDateIso}T00:00:00Z`);
  let counted = 0;
  let calendar = 0;
  const skipped = [];
  while (counted < whole) {
    cursor = shift(cursor, 1);
    calendar += 1;
    const iso = isoDate(cursor);
    if (isVacationBusinessDay(iso)) counted += 1;
    else skipped.push(iso);
  }
  return { calendarDays: calendar + fraction, inhabilDays: skipped.length, lastDate: whole > 0 ? isoDate(cursor) : endDateIso, skipped };
}
