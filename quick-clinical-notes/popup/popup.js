'use strict';

const noteInput = document.getElementById('noteInput');
const saveBtn = document.getElementById('saveBtn');
const insertBtn = document.getElementById('insertBtn');
const newPatientBtn = document.getElementById('newPatientBtn');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const status = document.getElementById('status');

function timestamp() {
  return new Date().toLocaleString();
}

function getNotes() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ notes: [] }, (res) => {
      resolve(res.notes);
    });
  });
}

function setNotes(notes) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ notes }, resolve);
  });
}

// SAVE NOTE
saveBtn.addEventListener('click', async () => {
  const text = noteInput.value.trim();
  if (!text) return;

  const notes = await getNotes();
  notes.push(`[${timestamp()}]\n${text}\n`);
  await setNotes(notes);

  noteInput.value = '';
  status.textContent = 'Saved';
  setTimeout(() => (status.textContent = ''), 1000);
});

// INSERT INTO ACTIVE FIELD
insertBtn.addEventListener('click', async () => {
  const notes = await getNotes();
  if (!notes.length) return;

  const content = notes.join('\n');
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [content],
    func: (text) => {
      const el = document.activeElement;
      if (!el) return;

      // Textarea / input
      if (
        el.tagName === 'TEXTAREA' ||
        (el.tagName === 'INPUT' && el.type === 'text')
      ) {
        el.value += (el.value ? '\n' : '') + text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }

      // Rich text editors
      if (el.isContentEditable) {
        el.innerText += (el.innerText ? '\n' : '') + text;
      }
    }
  });

  status.textContent = 'Inserted';
  setTimeout(() => (status.textContent = ''), 1000);
});

// NEW PATIENT (CLEAR NOTES)
newPatientBtn.addEventListener('click', async () => {
  await setNotes([]);
  noteInput.value = '';
  status.textContent = 'New patient started';
  setTimeout(() => (status.textContent = ''), 1200);
});

// COPY ALL NOTES
copyBtn.addEventListener('click', async () => {
  const notes = await getNotes();
  await navigator.clipboard.writeText(notes.join('\n'));
  status.textContent = 'Copied';
  setTimeout(() => (status.textContent = ''), 1000);
});

// EXPORT NOTES
exportBtn.addEventListener('click', async () => {
  const notes = await getNotes();
  const blob = new Blob([notes.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'clinical-notes.txt';
  a.click();

  URL.revokeObjectURL(url);
});
