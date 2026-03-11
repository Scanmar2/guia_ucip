import { useState, useMemo, useRef, useEffect } from "react";


// Data loaded dynamically


const LABELS = {
  presentation: "Presentación",
  concentration: "Concentración",
  reconstitution: "Reconstitución / Dilución",
  stability: "Estabilidad",
  admin_time: "Tiempo de Administración",
  observations: "Observaciones"
};

const ICONS = {
  presentation: "💊",
  concentration: "⚗️",
  reconstitution: "🧪",
  stability: "🕐",
  admin_time: "⏱️",
  observations: "📋"
};

function DrugCard({ drug, isOpen, onToggle }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isOpen && ref.current) {
      setTimeout(() => ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
    }
  }, [isOpen]);

  const fields = ["presentation","concentration","reconstitution","stability","admin_time","observations"];

  return (
    <div ref={ref} style={{
      background: isOpen ? "linear-gradient(135deg,#0d1b2a,#1b2838 60%,#1a1a2e)" : "#131c2b",
      borderRadius: 14,
      border: isOpen ? "1px solid rgba(100,180,255,0.25)" : "1px solid rgba(255,255,255,0.05)",
      transition: "all 0.3s ease",
      overflow: "hidden",
      boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)" : "0 2px 8px rgba(0,0,0,0.2)"
    }}>
      <div onClick={onToggle} style={{
        padding: "16px 20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        userSelect: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#1e5799,#2989d8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
            boxShadow: "0 2px 8px rgba(30,87,153,0.3)"
          }}>💉</div>
          <span style={{
            color: "#e8f0fe", fontSize: 15, fontWeight: 600,
            letterSpacing: "0.02em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>{drug.name}</span>
        </div>
        <div style={{
          color: "rgba(255,255,255,0.4)", fontSize: 18,
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.3s ease", flexShrink: 0, marginLeft: 8
        }}>▾</div>
      </div>

      {isOpen && (
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {fields.map(f => (
            <div key={f} style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 10,
              padding: "12px 14px",
              border: "1px solid rgba(255,255,255,0.04)"
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                color: "rgba(100,180,255,0.7)", letterSpacing: "0.08em",
                marginBottom: 6, display: "flex", alignItems: "center", gap: 6
              }}>
                <span>{ICONS[f]}</span>{LABELS[f]}
              </div>
              <div style={{
                fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.55
              }}>{drug[f]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [letterFilter, setLetterFilter] = useState(null);
  const [showAbbrev, setShowAbbrev] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "drugs.json")
      .then(r => r.json())
      .then(data => { setDrugs(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = drugs;
    if (letterFilter) {
      list = list.filter(d => {
        const first = d.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")[0].toUpperCase();
        return first === letterFilter;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      list = list.filter(d => {
        const name = d.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const pres = d.presentation.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return name.includes(q) || pres.includes(q);
      });
    }
    return list;
  }, [search, letterFilter, drugs]);

  const letters = useMemo(() => {
    const s = new Set();
    drugs.forEach(d => {
      const c = d.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")[0].toUpperCase();
      s.add(c);
    });
    return [...s].sort();
  }, [drugs]);

  if (loading) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#0a0e17 0%,#0d1520 40%,#111827 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI',system-ui,-apple-system,sans-serif",
      color: "rgba(255,255,255,0.5)", fontSize: 16
    }}>Cargando fármacos...</div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#0a0e17 0%,#0d1520 40%,#111827 100%)",
      fontFamily: "'Segoe UI',system-ui,-apple-system,sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#0d1b2a 0%,#1b2838 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "24px 20px 20px",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(20px)"
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h1 style={{
              margin: 0, fontSize: 20, fontWeight: 700,
              background: "linear-gradient(135deg,#64b5f6,#42a5f5,#90caf9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "0.02em"
            }}>Guía IV — UCIP</h1>
            <p style={{
              margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.05em", textTransform: "uppercase"
            }}>Administración parenteral · {drugs.length} fármacos</p>
          </div>

          {/* Search */}
          <div style={{
            position: "relative", marginBottom: 12
          }}>
            <div style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.3)", fontSize: 16, pointerEvents: "none"
            }}>🔍</div>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setLetterFilter(null); }}
              placeholder="Buscar fármaco..."
              style={{
                width: "100%", padding: "12px 40px 12px 42px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, color: "#e8f0fe", fontSize: 14,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "rgba(100,180,255,0.3)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            {search && (
              <div onClick={() => { setSearch(""); inputRef.current?.focus(); }} style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14,
                width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%", background: "rgba(255,255,255,0.08)"
              }}>✕</div>
            )}
          </div>

          {/* Letter bar */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center"
          }}>
            <div
              onClick={() => setLetterFilter(null)}
              style={{
                padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
                background: !letterFilter ? "rgba(100,180,255,0.2)" : "rgba(255,255,255,0.04)",
                color: !letterFilter ? "#64b5f6" : "rgba(255,255,255,0.4)",
                border: !letterFilter ? "1px solid rgba(100,180,255,0.3)" : "1px solid transparent"
              }}
            >Todos</div>
            {letters.map(l => (
              <div key={l} onClick={() => { setLetterFilter(letterFilter === l ? null : l); setSearch(""); }}
                style={{
                  padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s", minWidth: 20, textAlign: "center",
                  background: letterFilter === l ? "rgba(100,180,255,0.2)" : "rgba(255,255,255,0.04)",
                  color: letterFilter === l ? "#64b5f6" : "rgba(255,255,255,0.4)",
                  border: letterFilter === l ? "1px solid rgba(100,180,255,0.3)" : "1px solid transparent"
                }}
              >{l}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Drug list */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "16px 16px 60px" }}>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 12,
          padding: "0 4px"
        }}>
          {filtered.length} {filtered.length === 1 ? "fármaco encontrado" : "fármacos encontrados"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((d, i) => (
            <DrugCard
              key={d.name}
              drug={d}
              isOpen={openId === d.name}
              onToggle={() => setOpenId(openId === d.name ? null : d.name)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "rgba(255,255,255,0.3)", fontSize: 14
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            No se encontraron fármacos
          </div>
        )}

        {/* Abbreviations button */}
        <div
          onClick={() => setShowAbbrev(!showAbbrev)}
          style={{
            marginTop: 24,
            background: "#131c2b",
            borderRadius: 14,
            border: showAbbrev ? "1px solid rgba(100,180,255,0.25)" : "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer",
            overflow: "hidden",
            transition: "all 0.3s ease"
          }}
        >
          <div style={{
            padding: "16px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            userSelect: "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg,#e94560,#c23152)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
                boxShadow: "0 2px 8px rgba(233,69,96,0.3)"
              }}>📖</div>
              <span style={{
                color: "#e8f0fe", fontSize: 15, fontWeight: 600, letterSpacing: "0.02em"
              }}>Abreviaturas</span>
            </div>
            <div style={{
              color: "rgba(255,255,255,0.4)", fontSize: 18,
              transform: showAbbrev ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease"
            }}>▾</div>
          </div>

          {showAbbrev && (
            <div onClick={e => e.stopPropagation()} style={{
              padding: "0 20px 20px",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8
            }}>
              {[
                ["API", "Agua para inyección"],
                ["G5%", "Glucosa 5%"],
                ["IM", "Administración vía intramuscular"],
                ["PL", "Proteger de la luz"],
                ["SC", "Administración vía subcutánea"],
                ["SF", "Salino fisiológico"],
                ["TA", "Temperatura ambiente"],
                ["VF", "Volumen final"],
                ["PC", "Perfusión continua"],
                ["RH", "Restricción hídrica"],
                ["vc", "Vía central"],
                ["vp", "Vía periférica"],
              ].map(([abbr, meaning]) => (
                <div key={abbr} style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  border: "1px solid rgba(255,255,255,0.04)"
                }}>
                  <span style={{
                    color: "#64b5f6", fontWeight: 700, fontSize: 13
                  }}>{abbr}</span>
                  <span style={{
                    color: "rgba(255,255,255,0.6)", fontSize: 12, marginLeft: 8
                  }}>{meaning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
