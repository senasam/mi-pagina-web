export default function ChordTimeline({ events = [], currentTime = 0, onSeek }) {
  if (!events.length) return null;
  const activeIndex = events.findIndex((event) => currentTime >= event.start && currentTime < event.end);
  const index = activeIndex >= 0 ? activeIndex : currentTime >= events.at(-1).end ? events.length - 1 : 0;
  const current = events[index] || events[0];
  return <section className="chord-view" aria-labelledby="chord-title"><div className="chord-current"><span>{events[index - 1]?.chord || "—"}</span><div><small>Acorde actual</small><strong id="chord-title">{current.chord}</strong><small>{Math.round((current.confidence || 0) * 100)}% de confianza</small></div><span>{events[index + 1]?.chord || "—"}</span></div><div className="chord-timeline">{events.map((event, eventIndex) => <button type="button" key={`${event.start}-${event.chord}`} className={eventIndex === index ? "is-current" : ""} onClick={() => onSeek(event.start)} title={`${event.start.toFixed(1)}–${event.end.toFixed(1)} s`}><strong>{event.chord}</strong><small>{event.start.toFixed(1)} s</small></button>)}</div></section>;
}
