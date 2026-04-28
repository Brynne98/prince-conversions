// screens.jsx — Converter, SavedList, SaveModal, Settings

const FOOD_PRESETS = [
  { id: 'fries', name: 'Fries', emoji: '🍟', tempF: 425, time: 25 },
  { id: 'chicken', name: 'Chicken wings', emoji: '🍗', tempF: 400, time: 35 },
  { id: 'salmon', name: 'Salmon', emoji: '🐟', tempF: 400, time: 18 },
  { id: 'veg', name: 'Roast veg', emoji: '🥕', tempF: 425, time: 22 },
  { id: 'bacon', name: 'Bacon', emoji: '🥓', tempF: 400, time: 12 },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', tempF: 425, time: 14 },
];

// ─────────────────────────────────────────────────────────────
// Converter screen
// ─────────────────────────────────────────────────────────────
function ConverterScreen({ unit, setUnit, ovenTemp, setOvenTemp, ovenTime, setOvenTime, direction, setDirection, onOpenSaved, onOpenSettings, onSave }) {
  const result = convert(ovenTemp, unit, ovenTime, direction);
  const tempStep = unit === 'F' ? 25 : 10;
  const tempMin = unit === 'F' ? 200 : 95;
  const tempMax = unit === 'F' ? 500 : 260;

  const isOvenToAir = direction === 'oven-to-air';
  const sourceLabel = isOvenToAir ? 'Oven recipe' : 'Air fryer recipe';
  const targetLabel = isOvenToAir ? 'Air fryer' : 'Oven';
  const tempDeltaLabel = isOvenToAir
    ? `−${unit === 'F' ? '25°F' : '15°C'} · −20% time`
    : `+${unit === 'F' ? '25°F' : '15°C'} · +25% time`;

  const applyPreset = (p) => {
    const t = unit === 'F' ? p.tempF : fToC(p.tempF);
    setOvenTemp(t);
    setOvenTime(p.time);
    if (!isOvenToAir) setDirection('oven-to-air');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.cream }}>
      {/* Top bar */}
      <div style={{
        padding: '70px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onOpenSaved} style={{
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: C.paper, boxShadow: `0 1px 2px ${C.ink10}, inset 0 0 0 0.5px ${C.ink10}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><Icon.List s={20} /></button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: FONT_UI, fontSize: 11, fontWeight: 600, color: C.terracotta, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Convert</div>
          <div style={{ fontFamily: FONT_DISP, fontSize: 17, fontWeight: 500, color: C.ink, marginTop: 2 }}>
            {isOvenToAir ? 'Oven → Air fryer' : 'Air fryer → Oven'}
          </div>
        </div>

        <button onClick={onOpenSettings} style={{
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: C.paper, boxShadow: `0 1px 2px ${C.ink10}, inset 0 0 0 0.5px ${C.ink10}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><Icon.Gear s={19} /></button>
      </div>

      {/* Direction toggle */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'center' }}>
        <Segmented
          options={[
            { value: 'oven-to-air', label: 'Oven → Air fryer' },
            { value: 'air-to-oven', label: 'Air fryer → Oven' },
          ]}
          value={direction}
          onChange={setDirection}
        />
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 16px' }}>
        {/* Source card */}
        <div style={{
          background: C.paper, borderRadius: 24, padding: '18px 20px 22px',
          boxShadow: `0 1px 2px ${C.ink06}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: C.terracottaSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.Flame s={14} c={C.terracottaDeep} />
              </div>
              <span style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, color: C.ink70, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{sourceLabel}</span>
            </div>
            <Segmented compact options={[{ value: 'F', label: '°F' }, { value: 'C', label: '°C' }]} value={unit} onChange={(u) => {
              if (u === unit) return;
              setOvenTemp(u === 'F' ? cToF(ovenTemp) : fToC(ovenTemp));
              setUnit(u);
            }} />
          </div>

          <div style={{ marginTop: 18 }}>
            <Stepper value={ovenTemp} onChange={setOvenTemp} step={tempStep} min={tempMin} max={tempMax} suffix={'°' + unit} />
          </div>
          <div style={{ height: 1, background: C.divider, margin: '18px -4px' }} />
          <Stepper value={ovenTime} onChange={setOvenTime} step={1} min={1} max={240} suffix="min" />
        </div>

        {/* Arrow / flip */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
          <button onClick={() => setDirection(isOvenToAir ? 'air-to-oven' : 'oven-to-air')} style={{
            width: 36, height: 36, borderRadius: 18, background: C.cream, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `inset 0 0 0 1px ${C.ink10}`, cursor: 'pointer',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-5-5l5 5 5-5" stroke={C.terracotta} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Air fryer result card — tinted */}
        <div style={{
          background: `linear-gradient(180deg, ${C.terracotta} 0%, #B14E29 100%)`,
          borderRadius: 24, padding: '22px 20px 24px',
          color: '#FFF7EE', boxShadow: `0 8px 24px rgba(194,86,46,0.22)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, color: 'rgba(255,247,238,0.85)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{targetLabel}</span>
            <span style={{ fontFamily: FONT_UI, fontSize: 11, color: 'rgba(255,247,238,0.6)' }}>{tempDeltaLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FONT_DISP, fontWeight: 500, fontSize: 64, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{result.temp}<span style={{ fontSize: 30, fontWeight: 400, opacity: 0.75 }}>°{unit}</span></div>
              <div style={{ fontFamily: FONT_UI, fontSize: 12, color: 'rgba(255,247,238,0.7)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Temperature</div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,247,238,0.2)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FONT_DISP, fontWeight: 500, fontSize: 64, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{result.time}<span style={{ fontSize: 30, fontWeight: 400, opacity: 0.75 }}> min</span></div>
              <div style={{ fontFamily: FONT_UI, fontSize: 12, color: 'rgba(255,247,238,0.7)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Time</div>
            </div>
          </div>

          <button onClick={onSave} style={{
            marginTop: 20, width: '100%', height: 48, borderRadius: 14, border: 'none',
            background: 'rgba(255,247,238,0.18)', color: '#FFF7EE',
            fontFamily: FONT_UI, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}>
            <Icon.Bookmark s={16} c="#FFF7EE" /> Save this conversion
          </button>
        </div>

        {/* Presets */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, color: C.ink50, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Quick presets</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FOOD_PRESETS.map(p => (
              <button key={p.id} onClick={() => applyPreset(p)} style={{
                background: C.paper, border: 'none', borderRadius: 999,
                padding: '8px 14px 8px 10px', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: FONT_UI, fontSize: 13, fontWeight: 500, color: C.ink,
                boxShadow: `inset 0 0 0 0.5px ${C.ink10}`, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 14 }}>{p.emoji}</span>{p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Banner ad — under result */}
        <div style={{ marginTop: 22 }}>
          <AdSlot label="Ad · 320×50 banner" />
        </div>

        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Saved list screen
// ─────────────────────────────────────────────────────────────
function SavedScreen({ items, onClose, onDelete, unit }) {
  const [query, setQuery] = React.useState('');
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

  // Insert native ad after every 5 items
  const rendered = [];
  filtered.forEach((it, i) => {
    rendered.push({ kind: 'item', it });
    if ((i + 1) % 5 === 0) rendered.push({ kind: 'ad', i });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.cream }}>
      <div style={{ padding: '70px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: C.paper, boxShadow: `0 1px 2px ${C.ink10}, inset 0 0 0 0.5px ${C.ink10}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><Icon.Back s={20} /></button>
        <div style={{ fontFamily: FONT_UI, fontSize: 16, fontWeight: 600, color: C.ink }}>My Recipes</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: FONT_DISP, fontSize: 32, fontWeight: 500, color: C.ink, letterSpacing: '-0.02em' }}>Saved</div>
        <div style={{ fontFamily: FONT_UI, fontSize: 14, color: C.ink50, marginTop: 2 }}>{items.length} {items.length === 1 ? 'recipe' : 'recipes'}</div>

        <div style={{
          marginTop: 16, background: C.paper, borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40,
          boxShadow: `inset 0 0 0 0.5px ${C.ink10}`,
        }}>
          <Icon.Search />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes" style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontFamily: FONT_UI, fontSize: 15, color: C.ink,
          }} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 24px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🥘</div>
            <div style={{ fontFamily: FONT_DISP, fontSize: 20, fontWeight: 500, color: C.ink }}>Nothing saved yet</div>
            <div style={{ fontFamily: FONT_UI, fontSize: 14, color: C.ink50, marginTop: 6, lineHeight: 1.45 }}>
              Convert a recipe and tap “Save” to keep<br/>your perfect time and temperature.
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rendered.map((r, idx) => r.kind === 'ad'
            ? <AdSlot key={`ad-${idx}`} native />
            : <SavedRow key={r.it.id} item={r.it} unit={unit} onDelete={() => onDelete(r.it.id)} />
          )}
        </div>
      </div>

      {/* Sticky bottom banner */}
      <div style={{ padding: '8px 20px 38px', background: C.cream }}>
        <AdSlot label="Ad · 320×50 sticky banner" height={56} />
      </div>
    </div>
  );
}

function SavedRow({ item, unit, onDelete }) {
  // Items now store both oven + air fryer values, in their saved unit
  const conv = (val) => item.unit === unit ? val : (unit === 'F' ? cToF(val) : fToC(val));
  const ovenT = conv(item.ovenTemp);
  const airT = conv(item.afTemp);
  return (
    <div style={{
      background: C.paper, borderRadius: 18, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: `0 1px 2px ${C.ink06}`,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: C.terracottaSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        flexShrink: 0,
      }}>{item.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_UI, fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
        <div style={{ fontFamily: FONT_UI, fontSize: 12, color: C.ink50, marginTop: 3, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: C.creamDeep, padding: '2px 7px', borderRadius: 6,
            fontWeight: 600, color: C.ink70,
          }}>Oven {ovenT}°{unit} · {item.ovenTime}m</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: C.terracottaSoft, padding: '2px 7px', borderRadius: 6,
            fontWeight: 600, color: C.terracottaDeep,
          }}>Air {airT}°{unit} · {item.afTime}m</span>
        </div>
        {item.note && (
          <div style={{ fontFamily: FONT_UI, fontSize: 12, color: C.sage, marginTop: 4, fontStyle: 'italic' }}>“{item.note}”</div>
        )}
      </div>
      <button onClick={onDelete} style={{
        width: 32, height: 32, borderRadius: 16, border: 'none', background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}><Icon.Trash s={16} /></button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Save modal — bottom sheet
// ─────────────────────────────────────────────────────────────
function SaveSheet({ visible, onClose, onSave, draft, setDraft, ovenValues, airValues, unit, direction }) {
  const EMOJI_OPTS = [
    '🍟','🍗','🐟','🥕','🥓','🍕','🥖','🥔','🧆','🍪','🥩','🌽',
    '🍞','🥐','🥯','🧀','🍳','🥞','🧇','🍔','🌭','🌮','🌯','🥙',
    '🥗','🍝','🍜','🍲','🦐','🦞','🍤','🦀','🥟','🍣','🍱','🍙',
    '🥦','🍆','🍅','🥑','🌶️','🥒','🫑','🍄','🧅','🧄','🍠','🥜',
    '🍎','🍌','🍓','🫐','🍑','🍒','🍐','🍊','🍰','🧁','🥧','🍩',
  ];
  const valid = draft.name.trim().length > 0 && draft.emoji.trim().length > 0;
  const isOvenToAir = direction === 'oven-to-air';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: visible ? 'rgba(42,31,24,0.45)' : 'rgba(42,31,24,0)',
        transition: 'background 220ms ease',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: C.cream, borderRadius: '24px 24px 0 0',
        padding: '12px 20px 28px',
        transform: `translateY(${visible ? '0%' : '100%'})`,
        transition: 'transform 280ms cubic-bezier(0.32,0.72,0.26,1)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        maxHeight: '88%', overflow: 'auto',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.ink30, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: C.ink70, fontFamily: FONT_UI, fontSize: 15, cursor: 'pointer', padding: 0 }}>Cancel</button>
          <span style={{ fontFamily: FONT_UI, fontSize: 16, fontWeight: 600, color: C.ink }}>Save recipe</span>
          <button onClick={() => valid && onSave()} disabled={!valid} style={{
            border: 'none', background: 'transparent',
            color: valid ? C.terracotta : C.ink30,
            fontFamily: FONT_UI, fontSize: 15, fontWeight: 600,
            cursor: valid ? 'pointer' : 'default', padding: 0,
          }}>Save</button>
        </div>

        {/* Name + emoji preview */}
        <div style={{
          background: C.paper, borderRadius: 16, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: `inset 0 0 0 0.5px ${C.ink10}`,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: C.terracottaSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>{draft.emoji || '🍽️'}</div>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Recipe name"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: FONT_UI, fontSize: 16, color: C.ink, fontWeight: 500,
            }}
          />
        </div>

        {/* Custom emoji entry */}
        <div style={{
          marginTop: 10, background: C.paper, borderRadius: 16, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `inset 0 0 0 0.5px ${C.ink10}`,
        }}>
          <span style={{ fontFamily: FONT_UI, fontSize: 13, color: C.ink50, fontWeight: 500, flexShrink: 0 }}>Custom emoji</span>
          <input
            value={draft.emoji}
            onChange={(e) => {
              // Cap at first emoji-like glyph (1–2 codepoints w/ ZWJ tolerated)
              const v = [...e.target.value].slice(0, 4).join('');
              setDraft({ ...draft, emoji: v });
            }}
            placeholder="Paste any emoji"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: FONT_UI, fontSize: 18, color: C.ink, textAlign: 'right',
            }}
          />
        </div>

        {/* Emoji grid */}
        <div style={{ marginTop: 10, background: C.paper, borderRadius: 16, padding: '10px 6px', boxShadow: `inset 0 0 0 0.5px ${C.ink10}`, maxHeight: 196, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2 }}>
            {EMOJI_OPTS.map(e => (
              <button key={e} onClick={() => setDraft({ ...draft, emoji: e })} style={{
                height: 36, borderRadius: 10, border: 'none',
                background: draft.emoji === e ? C.terracottaSoft : 'transparent',
                fontSize: 20, cursor: 'pointer',
              }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginTop: 10, background: C.paper, borderRadius: 16, padding: '12px 14px', boxShadow: `inset 0 0 0 0.5px ${C.ink10}` }}>
          <input
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="Notes — e.g. shake at 10 min, single layer"
            style={{
              width: '100%', border: 'none', background: 'transparent', outline: 'none',
              fontFamily: FONT_UI, fontSize: 14, color: C.ink, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Both values stored */}
        <div style={{
          marginTop: 12, padding: '12px 14px', borderRadius: 14,
          background: C.terracottaSoft, color: C.terracottaDeep,
          fontFamily: FONT_UI, fontSize: 13,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Saving both</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span><b>Oven</b> {ovenValues.temp}°{unit} · {ovenValues.time} min</span>
            <span style={{ opacity: 0.5 }}>↔</span>
            <span><b>Air fryer</b> {airValues.temp}°{unit} · {airValues.time} min</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings sheet
// ─────────────────────────────────────────────────────────────
function SettingsSheet({ visible, onClose, unit, setUnit }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: visible ? 'rgba(42,31,24,0.45)' : 'rgba(42,31,24,0)',
        transition: 'background 220ms ease',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: C.cream, borderRadius: '24px 24px 0 0',
        padding: '12px 20px 32px',
        transform: `translateY(${visible ? '0%' : '100%'})`,
        transition: 'transform 280ms cubic-bezier(0.32,0.72,0.26,1)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.ink30, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: FONT_DISP, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-0.01em' }}>Settings</span>
          <button onClick={onClose} style={{ border: 'none', background: C.ink06, width: 30, height: 30, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon.Close s={16} c={C.ink70} />
          </button>
        </div>

        <SettingsRow label="Default temperature unit">
          <Segmented compact options={[{ value: 'F', label: '°F' }, { value: 'C', label: '°C' }]} value={unit} onChange={setUnit} />
        </SettingsRow>
        <SettingsRow label="Conversion model" detail="−25°F / −20% time" />
        <SettingsRow label="Notifications" detail="Off" />
        <SettingsRow label="Remove ads" detail="Pro · $2.99" />
        <SettingsRow label="About" detail="v1.0.0" isLast />

        <div style={{ marginTop: 20 }}>
          <AdSlot label="Ad · 320×50 banner" />
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ label, detail, children, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 4px',
      borderBottom: isLast ? 'none' : `0.5px solid ${C.divider}`,
      gap: 12,
    }}>
      <span style={{ fontFamily: FONT_UI, fontSize: 15, color: C.ink, fontWeight: 500 }}>{label}</span>
      {children || <span style={{ fontFamily: FONT_UI, fontSize: 14, color: C.ink50 }}>{detail}</span>}
    </div>
  );
}

Object.assign(window, {
  FOOD_PRESETS, ConverterScreen, SavedScreen, SaveSheet, SettingsSheet,
});
