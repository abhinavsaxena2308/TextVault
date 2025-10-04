import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// rest of your existing script.js logic

// Elements
const textArea = document.getElementById('textArea');
const sessionModal = document.getElementById('sessionModal');
const joinBtn = document.getElementById('joinBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const sessionNameDisplay = document.getElementById('sessionName');

let sessionID = "", sessionPass = "", textRef;
let isUpdating = false;

// 🔹 Join Session
joinBtn.addEventListener('click', () => {
  const id = document.getElementById('sessionID').value.trim();
  const pass = document.getElementById('sessionPass').value.trim();
  if (!id || !pass) return alert("Enter both Session ID and Password");
  startSession(id, pass);
});

// 🔹 Create New Session
newSessionBtn.addEventListener('click', async () => {
  if (sessionID && sessionPass && textArea.value.trim()) {
    await saveCurrentSession();
    alert("✅ Previous session data saved successfully!");
  }

  // Clear text area & reopen modal
  textArea.value = "";
  sessionModal.style.display = 'flex';
  sessionNameDisplay.textContent = "No session";
});

// 🔹 Save Button
saveBtn.addEventListener('click', () => {
  if (!sessionID) return alert("Join or create a session first!");
  saveCurrentSession().then(() => alert("💾 Saved successfully!"));
});

// 🔹 Share Button
shareBtn.addEventListener('click', () => {
  if (!sessionID) return alert("Join or create a session first!");
  const shareInfo = `Session ID: ${sessionID}\nPassword: ${sessionPass}`;
  navigator.clipboard.writeText(shareInfo);
  alert("📋 Copied session details to clipboard!");
});

// 🔹 Start Session
function startSession(id, pass) {
  sessionID = id;
  sessionPass = pass;
  sessionNameDisplay.textContent = `Session: ${id}`;
  sessionModal.style.display = 'none';
  textRef = ref(db, `sessions/${sessionID}_${sessionPass}`);

  onValue(textRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val().text || "";
      if (!isUpdating) textArea.value = data;
    }
  });
}

// 🔹 Save Function
async function saveCurrentSession() {
  if (!textRef) return;
  await set(textRef, { text: textArea.value });
}
