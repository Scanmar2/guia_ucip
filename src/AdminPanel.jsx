import { useState, useEffect } from "react";
import { verifyPassword } from "./auth";
import { addDrug, updateDrug, deleteDrug, exportDrugsJSON, getDrugs, getAvailableLetters } from "./db";

const FIELDS = ["name", "presentation", "concentration", "reconstitution", "stability", "admin_time", "observations"];
const LABELS = {
  name: "Nombre",
  presentation: "Presentación",
  concentration: "Concentración",
  reconstitution: "Reconstitución / Dilución",
  stability: "Estabilidad",
  admin_time: "Tiempo de Administración",
  observations: "Observaciones",
};

const EMPTY_DRUG = Object.fromEntries(FIELDS.map(f => [f, ""]));

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  },
  panel: {
    background: "linear-gradient(135deg,#0d1b2a,#111827)",
    border: "1px solid rgba(100,180,255,0.2)",
    borderRadius: 18, width: "100%", maxWidth: 720,
    maxHeight: "90vh", display: "flex", flexDirection: "column",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  },
  header: {
    padding: "20px 24px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexShrink: 0,
  },
  title: { color: "#64b5f6", fontWeight: 700, fontSize: 16, letterSpacing: "0.04em", textTransform: "uppercase" },
  closeBtn: {
    background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8,
    color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer",
    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
  },
  body: { padding: "16px 24px 24px", overflowY: "auto", flex: 1 },
  input: {
    width: "100%", padding: "10px 12px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#e8f0fe", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  textarea: {
    width: "100%", padding: "10px 12px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#e8f0fe", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    resize: "vertical", minHeight: 60,
  },
  label: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "rgba(100,180,255,0.7)", letterSpacing: "0.08em", marginBottom: 5, display: "block" },
  btn: (variant = "primary") => ({
    padding: "10px 18px", borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    background: variant === "primary" ? "linear-gradient(135deg,#1e5799,#2989d8)"
      : variant === "danger" ? "rgba(220,50,50,0.2)"
      : "rgba(255,255,255,0.07)",
    color: variant === "danger" ? "#f87171" : "#e8f0fe",
    border: variant === "danger" ? "1px solid rgba(220,50,50,0.3)" : "1px solid transparent",
  }),
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  fieldGroup: { display: "flex", flexDirection: "column", marginBottom: 12 },
  drugRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px", background: "rgba(255,255,255,0.03)",
    borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)",
    marginBottom: 6, gap: 8,
  },
  drugName: { color: "#e8f0fe", fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  actions: { display: "flex", gap: 6, flexShrink: 0 },
  smallBtn: (variant) => ({
    padding: "5px 10px", borderRadius: 7, border: "none",
    fontSize: 11, fontWeight: 600, cursor: "pointer",
    background: variant === "edit" ? "rgba(100,180,255,0.15)" : "rgba(220,50,50,0.15)",
    color: variant === "edit" ? "#64b5f6" : "#f87171",
  }),
  searchInput: {
    width: "100%", padding: "10px 12px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: "#e8f0fe", fontSize: 13,
    outline: "none", boxSizing: "border-box", marginBottom: 12,
  },
};

// ── Login modal ───────────────────────────────────────────────────────────────
function LoginModal({ onSuccess, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setChecking(true);
    setError("");
    const ok = await verifyPassword(password);
    setChecking(false);
    if (ok) {
      onSuccess();
    } else {
      setError("Contraseña incorrecta");
      setPassword("");
    }
  }

  return (
    <div style={S.overlay}>
      <div style={{ ...S.panel, maxWidth: 360 }}>
        <div style={S.header}>
          <span style={S.title}>🔒 Acceso Admin</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.body}>
          <form onSubmit={handleSubmit}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Contraseña</label>
              <input
                autoFocus
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={S.input}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12, textAlign: "center" }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={checking || !password} style={{ ...S.btn("primary"), width: "100%" }}>
              {checking ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Drug form (add / edit) ────────────────────────────────────────────────────
function DrugForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_DRUG);
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const multiline = ["presentation", "reconstitution", "stability", "observations"];

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ ...S.row, gridTemplateColumns: "1fr" }}>
        <div style={S.fieldGroup}>
          <label style={S.label}>{LABELS.name} *</label>
          <input required value={form.name} onChange={e => set("name", e.target.value)} style={S.input} />
        </div>
      </div>
      <div style={S.row}>
        <div style={S.fieldGroup}>
          <label style={S.label}>{LABELS.concentration}</label>
          <input value={form.concentration} onChange={e => set("concentration", e.target.value)} style={S.input} />
        </div>
        <div style={S.fieldGroup}>
          <label style={S.label}>{LABELS.admin_time}</label>
          <input value={form.admin_time} onChange={e => set("admin_time", e.target.value)} style={S.input} />
        </div>
      </div>
      {multiline.map(f => (
        <div key={f} style={S.fieldGroup}>
          <label style={S.label}>{LABELS[f]}</label>
          <textarea value={form[f]} onChange={e => set(f, e.target.value)} style={S.textarea} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" onClick={onCancel} style={S.btn("secondary")}>Cancelar</button>
        <button type="submit" disabled={saving} style={S.btn("primary")}>
          {saving ? "Guardando..." : initial ? "Guardar cambios" : "Añadir fármaco"}
        </button>
      </div>
    </form>
  );
}

// ── Main admin panel ──────────────────────────────────────────────────────────
export default function AdminPanel({ onClose, onDataChanged }) {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState("list"); // "list" | "add" | "edit"
  const [drugs, setDrugs] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [exporting, setExporting] = useState(false);

  async function loadDrugs(q = "") {
    const data = await getDrugs(q);
    setDrugs(data);
  }

  useEffect(() => {
    if (authed) loadDrugs();
  }, [authed]);

  useEffect(() => {
    if (authed) loadDrugs(searchQ);
  }, [searchQ]);

  async function handleAdd(form) {
    await addDrug(form);
    await loadDrugs(searchQ);
    await onDataChanged();
    setView("list");
  }

  async function handleEdit(form) {
    const { id, ...rest } = form;
    await updateDrug(id, rest);
    await loadDrugs(searchQ);
    await onDataChanged();
    setView("list");
    setEditTarget(null);
  }

  async function handleDelete(drug) {
    await deleteDrug(drug.id);
    await loadDrugs(searchQ);
    await onDataChanged();
    setConfirmDelete(null);
  }

  async function handleExport() {
    setExporting(true);
    await exportDrugsJSON();
    setExporting(false);
  }

  if (!authed) {
    return <LoginModal onSuccess={() => setAuthed(true)} onClose={onClose} />;
  }

  return (
    <div style={S.overlay}>
      <div style={S.panel}>
        {/* Header */}
        <div style={S.header}>
          <span style={S.title}>⚙️ Panel Admin — {drugs.length} fármacos</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleExport} style={S.btn("secondary")} disabled={exporting}>
              {exporting ? "Exportando..." : "⬇ Exportar JSON"}
            </button>
            <button onClick={() => { setView("add"); setEditTarget(null); }} style={S.btn("primary")}>
              + Añadir
            </button>
            <button style={S.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={S.body}>
          {/* Add / Edit form */}
          {(view === "add" || view === "edit") && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#64b5f6", fontWeight: 600, fontSize: 13, marginBottom: 14 }}>
                {view === "add" ? "➕ Nuevo fármaco" : `✏️ Editando: ${editTarget?.name}`}
              </div>
              <DrugForm
                initial={editTarget}
                onSave={view === "add" ? handleAdd : handleEdit}
                onCancel={() => { setView("list"); setEditTarget(null); }}
              />
            </div>
          )}

          {/* Drug list */}
          {view === "list" && (
            <>
              <input
                type="text"
                placeholder="Buscar fármaco..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={S.searchInput}
              />
              {drugs.map(drug => (
                <div key={drug.id} style={S.drugRow}>
                  <span style={S.drugName}>{drug.name}</span>
                  <div style={S.actions}>
                    <button
                      style={S.smallBtn("edit")}
                      onClick={() => { setEditTarget(drug); setView("edit"); }}
                    >Editar</button>
                    <button
                      style={S.smallBtn("delete")}
                      onClick={() => setConfirmDelete(drug)}
                    >Borrar</button>
                  </div>
                </div>
              ))}
              {drugs.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>
                  No se encontraron fármacos
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div style={{ ...S.overlay, zIndex: 1100 }}>
          <div style={{ ...S.panel, maxWidth: 380 }}>
            <div style={S.header}>
              <span style={{ ...S.title, color: "#f87171" }}>⚠️ Confirmar borrado</span>
            </div>
            <div style={{ ...S.body, textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
                ¿Borrar <strong style={{ color: "#e8f0fe" }}>{confirmDelete.name}</strong>?<br />
                Esta acción no se puede deshacer.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button style={S.btn("secondary")} onClick={() => setConfirmDelete(null)}>Cancelar</button>
                <button style={S.btn("danger")} onClick={() => handleDelete(confirmDelete)}>Sí, borrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
