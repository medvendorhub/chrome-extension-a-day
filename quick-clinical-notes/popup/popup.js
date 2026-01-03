'use strict';

const noteInput = document.getElementById('noteInput');
const saveBtn = document.getElementById('saveBtn');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const status = document.getElementById('status');

function getTimestamp() {
    const now = new Date();
    return now.toLocaleString();
}

function getAllNotes() {
    return new Promise((resolve) => {
        chrome.storage.local.get({ notes: [] }, (result) => {
            resolve(result.notes);
        });
    });
}

function saveNotes(notes) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ notes }, resolve);
    });
}

saveBtn.addEventListener('click', async () => {
    const text = noteInput.value.trim();
    if (!text) return;

    const notes = await getAllNotes();
    notes.push(`[${getTimestamp()}]\n${text}\n`);

    await saveNotes(notes);
    noteInput.value = '';
    status.textContent = 'Saved';
    setTimeout(() => (status.textContent = ''), 1000);
});

copyBtn.addEventListener('click', async () => {
    const notes = await getAllNotes();
    const combined = notes.join('\n');

    await navigator.clipboard.writeText(combined);
    status.textContent = 'Copied to clipboard';
    setTimeout(() => (status.textContent = ''), 1000);
});

exportBtn.addEventListener('click', async () => {
    const notes = await getAllNotes();
    const blob = new Blob([notes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinical-notes.txt';
    a.click();

    URL.revokeObjectURL(url);
});

