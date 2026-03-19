import { useState, useRef, useEffect, useCallback } from "react";
import { initDatabase, getDrugs, getAvailableLetters } from "./db";
import AdminPanel from "./AdminPanel";

const LABELS = {
  presentation: "Presentación",
  concentration: "Concentración",
  reconstitution: "Reconstitución / Dilución",
  stability: "Estabilidad",
  admin_time: "Tiempo de Administración",
  observations: "Observaciones",
};

const ICONS = {
  presentation: "💊",
  concentration: "⚗️",
  reconstitution: "🧪",
  stability: "🕐",
  admin_time: "⏱️",
  observations: "📋",
};

// Colour palette for drug initials — cycles through 8 hues
const LETTER_COLORS = [
  ["#1e5799", "#2989d8"],
  ["#1a6b3a", "#27a85a"],
  ["#6b1a4e", "#a8277e"],
  ["#7a3a0d", "#c75f1a"],
  ["#1a4e6b", "#278aa8"],
  ["#4e1a6b", "#7e27a8"],
  ["#6b4e1a", "#a88227"],
  ["#1a6b6b", "#27a8a8"],
];

function letterColor(name) {
  const idx = (name.charCodeAt(0) - 65) % LETTER_COLORS.length;
  return LETTER_COLORS[Math.abs(idx)] || LETTER_COLORS[0];
}

// Highlight occurrences of `query` inside `text`
function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const normalize = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const nText = normalize(text);
  const nQuery = normalize(query.trim());
  if (!nQuery || !nText.includes(nQuery)) return <>{text}</>;

  const parts = [];
  let cursor = 0;
  let idx;
  while ((idx = nText.indexOf(nQuery, cursor)) !== -1) {
    if (idx > cursor) parts.push({ t: text.slice(cursor, idx), hi: false });
    parts.push({ t: text.slice(idx, idx + nQuery.length), hi: true });
    cursor = idx + nQuery.length;
  }
  if (cursor < text.length) parts.push({ t: text.slice(cursor), hi: false });

  return (
    <>
      {parts.map((p, i) =>
        p.hi ? (
          <mark
            key={i}
            style={{
              background: "rgba(100,180,255,0.35)",
              color: "#e8f0fe",
              borderRadius: 3,
              padding: "0 1px",
            }}
          >
            {p.t}
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        )
      )}
    </>
  );
}

// Spinner for loading screen
function Spinner() {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "3px solid rgba(100,180,255,0.15)",
          borderTopColor: "#64b5f6",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div
        style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, letterSpacing: "0.04em" }}
      >
        Cargando fármacos…
      </div>
    </div>
  );
}

// Copy drug info to clipboard and show brief feedback
function CopyButton({ drug }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e) {
    e.stopPropagation();
    const fields = ["presentation", "concentration", "reconstitution", "stability", "admin_time", "observations"];
    const lines = [`${drug.name}\n`];
    fields.forEach((f) => {
      if (drug[f]) lines.push(`${LABELS[f]}: ${drug[f]}`);
    });
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar información"
      style={{
        background: copied ? "rgba(39,168,90,0.2)" : "rgba(255,255,255,0.06)",
        border: copied ? "1px solid rgba(39,168,90,0.4)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        color: copied ? "#4ade80" : "rgba(255,255,255,0.45)",
        fontSize: 12,
        fontWeight: 600,
        padding: "5px 10px",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.2s",
        letterSpacing: "0.02em",
        fontFamily: "inherit",
      }}
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

function DrugCard({ drug, isOpen, onToggle, search }) {
  const ref = useRef(null);
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  // Measure natural height so we can animate to it
  useEffect(() => {
    if (!bodyRef.current) return;
    if (isOpen) {
      setHeight(bodyRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  // Scroll into view when opened
  useEffect(() => {
    if (isOpen && ref.current) {
      setTimeout(() => ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" }), 260);
    }
  }, [isOpen]);

  const fields = ["presentation", "concentration", "reconstitution", "stability", "admin_time", "observations"];
  const filledFields = fields.filter((f) => drug[f]);
  const [c1, c2] = letterColor(drug.name);

  return (
    <div
      ref={ref}
      style={{
        background: isOpen ? "linear-gradient(135deg,#0d1b2a,#1b2838 60%,#1a1a2e)" : "#131c2b",
        borderRadius: 14,
        border: isOpen ? "1px solid rgba(100,180,255,0.25)" : "1px solid rgba(255,255,255,0.05)",
        transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        overflow: "hidden",
        boxShadow: isOpen
          ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          userSelect: "none",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          {/* Letter avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg,${c1},${c2})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "rgba(255,255,255,0.9)",
              flexShrink: 0,
              boxShadow: `0 2px 8px ${c1}55`,
              letterSpacing: 0,
            }}
          >
            {drug.name[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "#e8f0fe",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <Highlight text={drug.name} query={search} />
            </div>
            {drug.presentation && (
              <div
                style={{
                  color: "rgba(255,255,255,0.38)",
                  fontSize: 11,
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {drug.presentation}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isOpen && <CopyButton drug={drug} />}
          <div
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 18,
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
              lineHeight: 1,
            }}
          >
            ▾
          </div>
        </div>
      </div>

      {/* Animated body */}
      <div
        style={{
          maxHeight: height,
          overflow: "hidden",
          transition: "max-height 0.28s ease",
        }}
      >
        <div ref={bodyRef} style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filledFields.map((f) => (
            <div
              key={f}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: "10px 14px",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "rgba(100,180,255,0.65)",
                  letterSpacing: "0.08em",
                  marginBottom: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>{ICONS[f]}</span>
                {LABELS[f]}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
                {drug[f]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [totalDrugs, setTotalDrugs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [letterFilter, setLetterFilter] = useState(null);
  const [showAbbrev, setShowAbbrev] = useState(false);
  const [abbrevHeight, setAbbrevHeight] = useState(0);
  const abbrevBodyRef = useRef(null);
  const [filtered, setFiltered] = useState([]);
  const [letters, setLetters] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [titleClicks, setTitleClicks] = useState(0);
  const titleClickTimer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initDatabase()
      .then(() => getAvailableLetters())
      .then((ls) => { setLetters(ls); return getDrugs(); })
      .then((data) => { setFiltered(data); setTotalDrugs(data.length); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, []);

  useEffect(() => {
    if (loading) return;
    getDrugs(search, letterFilter || "").then(setFiltered);
  }, [search, letterFilter, loading]);

  // Animate abbreviations panel
  useEffect(() => {
    if (!abbrevBodyRef.current) return;
    setAbbrevHeight(showAbbrev ? abbrevBodyRef.current.scrollHeight : 0);
  }, [showAbbrev]);

  const handleDataChanged = useCallback(async () => {
    const [ls, data] = await Promise.all([
      getAvailableLetters(),
      getDrugs(search, letterFilter || ""),
    ]);
    setLetters(ls);
    setFiltered(data);
    setTotalDrugs((await getDrugs()).length);
  }, [search, letterFilter]);

  function handleTitleClick() {
    setTitleClicks((n) => {
      const next = n + 1;
      clearTimeout(titleClickTimer.current);
      if (next >= 5) { setShowAdmin(true); return 0; }
      titleClickTimer.current = setTimeout(() => setTitleClicks(0), 3000);
      return next;
    });
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg,#0a0e17 0%,#0d1520 40%,#111827 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI',system-ui,-apple-system,sans-serif",
        }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0a0e17 0%,#0d1520 40%,#111827 100%)",
        fontFamily: "'Segoe UI',system-ui,-apple-system,sans-serif",
      }}
    >
      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} onDataChanged={handleDataChanged} />
      )}

      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(135deg,#0d1b2a 0%,#1b2838 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "22px 20px 16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h1
              onClick={handleTitleClick}
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                background: "linear-gradient(135deg,#64b5f6,#42a5f5,#90caf9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.02em",
                cursor: "default",
                userSelect: "none",
              }}
            >
              Guía IV — UCIP
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Administración parenteral · {totalDrugs} fármacos
            </p>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)",
                fontSize: 15,
                pointerEvents: "none",
              }}
            >
              🔍
            </div>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setLetterFilter(null); }}
              placeholder="Buscar fármaco…"
              style={{
                width: "100%",
                padding: "12px 40px 12px 42px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                color: "#e8f0fe",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(100,180,255,0.3)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            {search && (
              <div
                onClick={() => { setSearch(""); inputRef.current?.focus(); }}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  fontSize: 13,
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                ✕
              </div>
            )}
          </div>

          {/* Letter bar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            <div
              onClick={() => setLetterFilter(null)}
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: !letterFilter ? "rgba(100,180,255,0.2)" : "rgba(255,255,255,0.04)",
                color: !letterFilter ? "#64b5f6" : "rgba(255,255,255,0.4)",
                border: !letterFilter ? "1px solid rgba(100,180,255,0.3)" : "1px solid transparent",
              }}
            >
              Todos
            </div>
            {letters.map((l) => (
              <div
                key={l}
                onClick={() => { setLetterFilter(letterFilter === l ? null : l); setSearch(""); }}
                style={{
                  padding: "4px 8px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  minWidth: 20,
                  textAlign: "center",
                  background: letterFilter === l ? "rgba(100,180,255,0.2)" : "rgba(255,255,255,0.04)",
                  color: letterFilter === l ? "#64b5f6" : "rgba(255,255,255,0.4)",
                  border: letterFilter === l ? "1px solid rgba(100,180,255,0.3)" : "1px solid transparent",
                }}
              >
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Drug list ── */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "16px 16px 60px" }}>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 12,
            padding: "0 4px",
          }}
        >
          {filtered.length} {filtered.length === 1 ? "fármaco encontrado" : "fármacos encontrados"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((d) => (
            <DrugCard
              key={d.id ?? d.name}
              drug={d}
              isOpen={openId === (d.id ?? d.name)}
              onToggle={() => setOpenId(openId === (d.id ?? d.name) ? null : (d.id ?? d.name))}
              search={search}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "rgba(255,255,255,0.3)",
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            No se encontraron fármacos
          </div>
        )}

        {/* ── Abbreviations ── */}
        <div
          onClick={() => setShowAbbrev(!showAbbrev)}
          style={{
            marginTop: 24,
            background: "#131c2b",
            borderRadius: 14,
            border: showAbbrev ? "1px solid rgba(100,180,255,0.25)" : "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer",
            overflow: "hidden",
            transition: "border-color 0.3s ease",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#e94560,#c23152)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(233,69,96,0.3)",
                }}
              >
                📖
              </div>
              <span style={{ color: "#e8f0fe", fontSize: 14, fontWeight: 600 }}>
                Abreviaturas
              </span>
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 18,
                transform: showAbbrev ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
                lineHeight: 1,
              }}
            >
              ▾
            </div>
          </div>

          {/* Animated abbreviations body */}
          <div
            style={{
              maxHeight: abbrevHeight,
              overflow: "hidden",
              transition: "max-height 0.28s ease",
            }}
          >
            <div
              ref={abbrevBodyRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "0 16px 16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                ["API", "Agua para inyección"],
                ["G5%", "Glucosa 5%"],
                ["IM", "Vía intramuscular"],
                ["PL", "Proteger de la luz"],
                ["SC", "Vía subcutánea"],
                ["SF", "Salino fisiológico"],
                ["TA", "Temperatura ambiente"],
                ["VF", "Volumen final"],
                ["PC", "Perfusión continua"],
                ["RH", "Restricción hídrica"],
                ["vc", "Vía central"],
                ["vp", "Vía periférica"],
              ].map(([abbr, meaning]) => (
                <div
                  key={abbr}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span style={{ color: "#64b5f6", fontWeight: 700, fontSize: 13 }}>{abbr}</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginLeft: 8 }}>
                    {meaning}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
