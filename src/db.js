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

export default db;
