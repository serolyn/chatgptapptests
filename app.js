const KEY = 'serolyn-notes';
const $ = sel => document.querySelector(sel);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
function uid() { return Math.random().toString(36).slice(2, 10); }

function render() {
  const container = $('#notes');
  const notes = load().sort((a,b) => b.updated - a.updated);
  if (!notes.length) {
    container.innerHTML = '<div class="empty">Aucune note. Écris au lieu de scroller.</div>';
    return;
  }
  container.innerHTML = notes.map(n => `
    <article class="card" data-id="${n.id}">
      <h3>${escapeHtml(n.title)}</h3>
      <p>${escapeHtml(n.content)}</p>
      <div class="row">
        <button class="edit">Modifier</button>
        <button class="del">Supprimer</button>
      </div>
    </article>
  `).join('');
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

$('#noteForm').addEventListener('submit', e => {
  e.preventDefault();
  const title = $('#title').value.trim();
  const content = $('#content').value.trim();
  if (!title || !content) return;
  const notes = load();
  notes.push({ id: uid(), title, content, updated: Date.now() });
  save(notes);
  e.target.reset();
  render();
});

$('#notes').addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.id;
  if (e.target.classList.contains('del')) {
    const notes = load().filter(n => n.id !== id);
    save(notes); render(); return;
  }
  if (e.target.classList.contains('edit')) {
    const notes = load();
    const ix = notes.findIndex(n => n.id === id);
    if (ix < 0) return;
    const t = prompt('Titre', notes[ix].title);
    if (t === null) return;
    const c = prompt('Contenu', notes[ix].content);
    if (c === null) return;
    notes[ix].title = t; notes[ix].content = c; notes[ix].updated = Date.now();
    save(notes); render(); return;
  }
});

// Export / Import
$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([localStorage.getItem(KEY) || '[]'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'serolyn-notes.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('format');
    save(data);
    render();
  } catch {
    alert('Fichier invalide.');
  } finally {
    e.target.value = '';
  }
});

render();
