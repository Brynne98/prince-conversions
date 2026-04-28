// app.jsx — Air Fryer Converter prototype
// Warm kitchen aesthetic: cream / terracotta / cocoa / sage

const C = {
  cream: '#FAF5EC',
  creamDeep: '#F2EADB',
  paper: '#FFFBF3',
  ink: '#2A1F18',
  ink70: 'rgba(42,31,24,0.70)',
  ink50: 'rgba(42,31,24,0.50)',
  ink30: 'rgba(42,31,24,0.28)',
  ink10: 'rgba(42,31,24,0.10)',
  ink06: 'rgba(42,31,24,0.06)',
  terracotta: '#C2562E',
  terracottaDeep: '#A8451F',
  terracottaSoft: '#EFD9CC',
  sage: '#7A8F6E',
  sageSoft: '#DDE5D4',
  butter: '#E9B85B',
  divider: 'rgba(42,31,24,0.08)',
};

const FONT_UI = '-apple-system, "SF Pro Text", system-ui, sans-serif';
const FONT_DISP = '"Fraunces", "SF Pro Display", -apple-system, serif';

// ─────────────────────────────────────────────────────────────
// Conversion logic
// Standard rule of thumb:
//   Oven → Air fryer:  −25°F (−15°C), −20% time
//   Air fryer → Oven:  +25°F (+15°C), +25% time   (1/0.8 = 1.25)
// Always shake/flip halfway, single layer, min 5 min.
// ─────────────────────────────────────────────────────────────
function convertOvenToAirFryer(temp, unit, time) {
  const tempDelta = unit === 'F' ? 25 : 15;
  const newTemp = Math.max(unit === 'F' ? 200 : 95, Math.round((temp - tempDelta) / 5) * 5);
  const newTime = Math.max(5, Math.round(time * 0.8));
  return { temp: newTemp, time: newTime };
}
function convertAirFryerToOven(temp, unit, time) {
  const tempDelta = unit === 'F' ? 25 : 15;
  const newTemp = Math.min(unit === 'F' ? 500 : 260, Math.round((temp + tempDelta) / 5) * 5);
  const newTime = Math.max(5, Math.round(time * 1.25));
  return { temp: newTemp, time: newTime };
}
function convert(temp, unit, time, direction) {
  return direction === 'air-to-oven'
    ? convertAirFryerToOven(temp, unit, time)
    : convertOvenToAirFryer(temp, unit, time);
}
function fToC(f) { return Math.round(((f - 32) * 5) / 9 / 5) * 5; }
function cToF(c) { return Math.round((c * 9 / 5 + 32) / 5) * 5; }

// ─────────────────────────────────────────────────────────────
// Icons (stroke, monoline)
// ─────────────────────────────────────────────────────────────
const Icon = {
  Plus: ({ s = 18, c = C.ink }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  Minus: ({ s = 18, c = C.ink }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  Bookmark: ({ s = 18, c = C.ink, fill = 'none' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
      <path d="M6 4h12v17l-6-4-6 4V4z" stroke={c} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
  List: ({ s = 22, c = C.ink }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h10" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Gear: ({ s = 22, c = C.ink }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8"/>
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" stroke={c} strokeWidth="1.6"/>
    </svg>
  ),
  Back: ({ s = 22, c = C.ink }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M14 6l-6 6 6 6" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Close: ({ s = 22, c = C.ink }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  Search: ({ s = 18, c = C.ink50 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6" stroke={c} strokeWidth="2"/>
      <path d="M20 20l-4-4" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Trash: ({ s = 18, c = C.ink70 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 7h14M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-7 0v12a2 2 0 002 2h6a2 2 0 002-2V7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Flame: ({ s = 18, c = C.terracotta }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  Clock: ({ s = 18, c = C.terracotta }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/>
      <path d="M12 7v5l3 2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  Arrow: ({ s = 16, c = C.ink50 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14m-5-5l5 5-5 5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Status bar (mini, dark glyphs on cream)
// ─────────────────────────────────────────────────────────────
function StatusBar() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '21px 36px 0', height: 54, boxSizing: 'border-box',
      pointerEvents: 'none',
    }}>
      <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 17, color: C.ink }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={C.ink}/>
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={C.ink}/>
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={C.ink}/>
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={C.ink}/>
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={C.ink} strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="16" height="9" rx="2" fill={C.ink}/>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stepper — large +/- around a numeric value
// ─────────────────────────────────────────────────────────────
function Stepper({ value, onChange, step, min = 0, max = 999, suffix, big = false }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const btn = (icon, fn) => (
    <button onClick={fn} style={{
      width: 44, height: 44, borderRadius: 22, border: 'none',
      background: C.paper, boxShadow: `0 1px 2px ${C.ink10}, inset 0 0 0 0.5px ${C.ink10}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
    }}>{icon}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      {btn(<Icon.Minus s={20} c={C.ink} />, dec)}
      <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
        <span style={{
          fontFamily: FONT_DISP, fontWeight: 500,
          fontSize: big ? 88 : 64, lineHeight: 1, color: C.ink,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em',
        }}>{value}</span>
        {suffix && (
          <span style={{
            fontFamily: FONT_DISP, fontWeight: 400,
            fontSize: big ? 36 : 28, color: C.ink50, letterSpacing: '-0.02em',
          }}>{suffix}</span>
        )}
      </div>
      {btn(<Icon.Plus s={20} c={C.ink} />, inc)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Segmented control (e.g., °F / °C)
// ─────────────────────────────────────────────────────────────
function Segmented({ options, value, onChange, compact = false }) {
  const idx = options.findIndex(o => o.value === value);
  return (
    <div style={{
      position: 'relative', display: 'inline-flex',
      background: C.ink06, borderRadius: 999, padding: 3,
    }}>
      <div style={{
        position: 'absolute', top: 3, bottom: 3,
        left: `calc(3px + ${idx} * ((100% - 6px) / ${options.length}))`,
        width: `calc((100% - 6px) / ${options.length})`,
        background: C.paper, borderRadius: 999,
        boxShadow: `0 1px 3px ${C.ink10}, 0 0 0 0.5px ${C.ink10}`,
        transition: 'left 180ms cubic-bezier(0.3,0.7,0.4,1)',
      }} />
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          position: 'relative', zIndex: 1, border: 'none', background: 'transparent',
          padding: compact ? '6px 14px' : '8px 18px', cursor: 'pointer',
          fontFamily: FONT_UI, fontSize: compact ? 13 : 14, fontWeight: 600,
          color: o.value === value ? C.ink : C.ink50,
          letterSpacing: '-0.01em',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ad slot placeholder — labeled, on-brand
// ─────────────────────────────────────────────────────────────
function AdSlot({ height = 64, label = 'Ad · 320×50 banner', native = false, style = {} }) {
  if (native) {
    return (
      <div style={{
        background: C.creamDeep, borderRadius: 18, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12, position: 'relative',
        border: `1px dashed ${C.ink30}`,
        ...style,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `repeating-linear-gradient(45deg, ${C.ink10}, ${C.ink10} 4px, transparent 4px, transparent 8px)` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, color: C.ink }}>Sponsored</div>
          <div style={{ fontFamily: FONT_UI, fontSize: 11, color: C.ink50, marginTop: 2 }}>Native ad placement · in-feed</div>
        </div>
        <span style={{ fontFamily: FONT_UI, fontSize: 10, color: C.ink50, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Ad</span>
      </div>
    );
  }
  return (
    <div style={{
      height, background: `repeating-linear-gradient(135deg, ${C.creamDeep}, ${C.creamDeep} 8px, ${C.cream} 8px, ${C.cream} 16px)`,
      border: `1px dashed ${C.ink30}`, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11,
      color: C.ink50, letterSpacing: '0.04em',
      ...style,
    }}>{label}</div>
  );
}

Object.assign(window, {
  C, FONT_UI, FONT_DISP,
  convertOvenToAirFryer, convertAirFryerToOven, convert, fToC, cToF,
  Icon, StatusBar, Stepper, Segmented, AdSlot,
});
