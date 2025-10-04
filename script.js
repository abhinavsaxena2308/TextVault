import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 🔥 Replace this config with your Firebase project’s config
const firebaseConfig = {
  
  apiKey: "AIzaSyBDmJmzMUuhwI12hyGgYTDp9lV27WGw6Zc",
  authDomain: "textvault-b7755.firebaseapp.com",
  projectId: "textvault-b7755",
  storageBucket: "textvault-b7755.firebasestorage.app",
  messagingSenderId: "150242976241",
  appId: "1:150242976241:web:244dfa85048db46c7a6450",
  measurementId: "G-2TFHBFW14C"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Elements
const textArea = document.getElementById('textArea');
const sessionModal = document.getElementById('sessionModal');
const joinBtn = document.getElementById('joinBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const shareBtn = document.getElementById('shareBtn');
const sessionNameDisplay = document.getElementById('sessionName');

let sessionID = "", sessionPass = "", textRef;
let isUpdating = false;
let typingTimer;

// Join session manually
joinBtn.addEventListener('click', () => {
  const id = document.getElementById('sessionID').value.trim();
  const pass = document.getElementById('sessionPass').value.trim();
  if (!id || !pass) return alert("Enter both Session ID and Password");
  startSession(id, pass);
});

// Auto-generate new session
newSessionBtn.addEventListener('click', () => {
  const id = "session-" + Math.random().toString(36).substring(2, 8);
  const pass = Math.random().toString(36).substring(2, 8);
  startSession(id, pass, true);
});

// Start or join session logic
function startSession(id, pass, created = false) {
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

  if (created) {
    alert(`✅ New session created!\nSession ID: ${id}\nPassword: ${pass}\n\nShare this info to collaborate.`);
  }
}

// Auto-save on typing
textArea.addEventListener('input', () => {
  if (!textRef) return;
  isUpdating = true;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    set(textRef, { text: textArea.value });
    isUpdating = false;
  }, 400);
});

// Share session info
shareBtn.addEventListener('click', () => {
  if (!sessionID) return alert("Join or create a session first!");
  const shareInfo = `Session ID: ${sessionID}\nPassword: ${sessionPass}`;
  navigator.clipboard.writeText(shareInfo);
  alert("📋 Copied session details to clipboard!");
});
