const fs = require('fs/promises');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'notes.json');
const DEFAULT_DB_STATE = { lastId: 0, notes: [] };

async function ensureDbFile() {
  try {
    await fs.access(DB_FILE);
  } catch (_) {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB_STATE, null, 2), 'utf-8');
  }
}

async function loadDb() {
  await ensureDbFile();
  const raw = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}

async function saveDb(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

async function getAllNotes() {
  const db = await loadDb();
  return db.notes;
}

async function getNoteById(id) {
  const db = await loadDb();
  return db.notes.find((note) => note.id === id) || null;
}

async function getNoteByTitle(title) {
  const db = await loadDb();
  return db.notes.find((note) => note.title === title) || null;
}

async function createNote({ title, content }) {
  if (!title || !content) {
    throw new Error('TITLE_CONTENT_REQUIRED');
  }

  const db = await loadDb();
  const duplicateTitle = db.notes.some((note) => note.title === title);
  if (duplicateTitle) {
    throw new Error('TITLE_EXISTS');
  }

  const timestamp = new Date().toISOString();
  const note = {
    id: db.lastId + 1,
    title,
    content,
    created: timestamp,
    changed: timestamp,
  };

  db.lastId = note.id;
  db.notes.push(note);
  await saveDb(db);
  return note;
}

async function updateNote(id, { title, content }) {
  if (!title && !content) {
    throw new Error('NOTHING_TO_UPDATE');
  }

  const db = await loadDb();
  const note = db.notes.find((n) => n.id === id);
  if (!note) {
    throw new Error('NOT_FOUND');
  }

  if (title && title !== note.title) {
    const titleExists = db.notes.some((n) => n.title === title && n.id !== id);
    if (titleExists) {
      throw new Error('TITLE_EXISTS');
    }
    note.title = title;
  }

  if (content) {
    note.content = content;
  }

  note.changed = new Date().toISOString();
  await saveDb(db);
  return note;
}

async function deleteNote(id) {
  const db = await loadDb();
  const index = db.notes.findIndex((n) => n.id === id);

  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  db.notes.splice(index, 1);
  await saveDb(db);
}

module.exports = {
  getAllNotes,
  getNoteById,
  getNoteByTitle,
  createNote,
  updateNote,
  deleteNote,
};

