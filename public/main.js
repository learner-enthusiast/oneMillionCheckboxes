// main.js
const socket = io();

const TOTAL_CHECKBOXES = 1000000;
const checkboxesDiv = document.getElementById('checkboxes');
const connectedUsersSpan = document.getElementById('connected-users');

// Store checkbox states locally
let checkboxStates = new Uint8Array(TOTAL_CHECKBOXES);

// Render only a portion for performance (virtualization)
const VISIBLE_ROWS = 100; // Show 100 rows at a time
const COLS = 1000; // 1000 columns per row
const VISIBLE_CHECKBOXES = VISIBLE_ROWS * COLS;

function renderCheckboxes(startRow = 0) {
    checkboxesDiv.innerHTML = '';
    for (let i = 0; i < VISIBLE_CHECKBOXES; i++) {
        const idx = startRow * COLS + i;
        if (idx >= TOTAL_CHECKBOXES) break;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.checked = !!checkboxStates[idx];
        checkbox.dataset.idx = idx;
        checkbox.addEventListener('change', (e) => {
            const checked = e.target.checked;
            socket.emit('checkbox-update', { idx, checked });
        });
        checkboxesDiv.appendChild(checkbox);
    }
}

// Listen for state updates from server
socket.on('init', ({ states, users }) => {
    checkboxStates = new Uint8Array(states);
    connectedUsersSpan.textContent = `Connected users: ${users}`;
    renderCheckboxes();
});

socket.on('checkbox-update', ({ idx, checked }) => {
    checkboxStates[idx] = checked ? 1 : 0;
    // Only update if visible
    const checkbox = checkboxesDiv.querySelector(`[data-idx='${idx}']`);
    if (checkbox) checkbox.checked = checked;
});

socket.on('users', (users) => {
    connectedUsersSpan.textContent = `Connected users: ${users}`;
});

// Initial render
renderCheckboxes();
