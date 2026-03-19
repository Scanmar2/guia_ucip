import Dexie from 'dexie';

// Define the database schema
const db = new Dexie('GuiaUCIP');

db.version(1).stores({
  drugs: '++id, name, presentation, concentration, reconstitution, stability, admin_time, observations',
});

/**
 * Seed the database from the JSON file if it's empty.
 * Called once on app startup.
 */
export async function initDatabase() {
  const count = await db.drugs.count();
  if (count > 0) return;

  const response = await fetch(`${import.meta.env.BASE_URL}drugs.json`);
  const drugs = await response.json();
  await db.drugs.bulkAdd(drugs);
}

/**
 * Return all drugs, optionally filtered by name or presentation.
 * @param {string} query - search string (empty = all)
 * @param {string} letter - first-letter filter (empty = all)
 * @returns {Promise<Array>}
 */
export async function getDrugs(query = '', letter = '') {
  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  let results = await db.drugs.toArray();

  if (letter) {
    results = results.filter((d) =>
      d.name.toUpperCase().startsWith(letter)
    );
  }

  if (query.trim()) {
    const q = normalize(query.trim());
    results = results.filter(
      (d) =>
        normalize(d.name).includes(q) ||
        normalize(d.presentation || '').includes(q)
    );
  }

  return results;
}

/**
 * Return all distinct first letters present in the drugs table.
 * @returns {Promise<string[]>}
 */
export async function getAvailableLetters() {
  const drugs = await db.drugs.toArray();
  const letters = [...new Set(drugs.map((d) => d.name[0].toUpperCase()))];
  return letters.sort();
}

// ── CRUD (admin only) ────────────────────────────────────────────────────────

export async function addDrug(drug) {
  return db.drugs.add(drug);
}

export async function updateDrug(id, changes) {
  return db.drugs.update(id, changes);
}

export async function deleteDrug(id) {
  return db.drugs.delete(id);
}

/**
 * Export the full drugs table as a downloadable JSON file.
 * Use this to update public/drugs.json and redeploy.
 */
export async function exportDrugsJSON() {
  const all = await db.drugs.toArray();
  // Strip internal Dexie id before exporting
  const clean = all.map(({ id, ...rest }) => rest);
  const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'drugs.json';
  a.click();
  URL.revokeObjectURL(url);
}

export default db;
