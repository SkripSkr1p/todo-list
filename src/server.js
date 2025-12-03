const express = require('express');
const {
  getAllNotes,
  getNoteById,
  getNoteByTitle,
  createNote,
  updateNote,
  deleteNote,
} = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

app.get('/notes', async (req, res) => {
  try {
    const notes = await getAllNotes();
    if (!notes.length) {
      return res.status(404).json({ message: 'No notes found' });
    }
    return res.status(200).json(notes);
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected error' });
  }
});

app.get('/note/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!isPositiveInteger(id)) {
    return res.status(404).json({ message: 'Note not found' });
  }

  try {
    const note = await getNoteById(id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected error' });
  }
});

app.get('/note/read/:title', async (req, res) => {
  const { title } = req.params;
  try {
    const note = await getNoteByTitle(title);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected error' });
  }
});

app.post('/note', async (req, res) => {
  const { title, content } = req.body;
  try {
    const note = await createNote({ title, content });
    return res.status(201).json(note);
  } catch (error) {
    if (['TITLE_CONTENT_REQUIRED', 'TITLE_EXISTS'].includes(error.message)) {
      return res.status(409).json({ message: 'Cannot create note' });
    }
    return res.status(500).json({ message: 'Unexpected error' });
  }
});

app.put('/note/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!isPositiveInteger(id)) {
    return res.status(409).json({ message: 'Cannot update note' });
  }

  const { title, content } = req.body;
  try {
    await updateNote(id, { title, content });
    return res.sendStatus(204);
  } catch (error) {
    if (['NOTHING_TO_UPDATE', 'TITLE_EXISTS', 'NOT_FOUND'].includes(error.message)) {
      return res.status(409).json({ message: 'Cannot update note' });
    }
    return res.status(500).json({ message: 'Unexpected error' });
  }
});

app.delete('/note/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!isPositiveInteger(id)) {
    return res.status(409).json({ message: 'Cannot delete note' });
  }

  try {
    await deleteNote(id);
    return res.sendStatus(204);
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(409).json({ message: 'Cannot delete note' });
    }
    return res.status(500).json({ message: 'Unexpected error' });
  }
});

app.listen(PORT, () => {
  console.log(`Notes service listening on port ${PORT}`);
});

