// script.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const textArea = document.getElementById('textArea');
const tabsContainer = document.getElementById('tabs');
const newTabBtn = document.getElementById('newTabBtn');
const sessionModal = document.getElementById('sessionModal');
const joinBtn = document.getElementById('joinBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
// const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const sessionNameDisplay = document.getElementById('sessionName');

let sessionID = '', sessionPass = '';
let tabs = {};
let activeTab = null;
let tabsRef = null;
let unsubscribeTabsListener = null;
let localEditing = false;
let saveTimer = null;

/* Helpers */
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function backupKeyForCurrentSession() { return sessionID && sessionPass ? `textvault_backup_${sessionID}_${sessionPass}` : null; }

/* Tabs */
function renderTabs() {
  tabsContainer.innerHTML = "";
  const keys = Object.keys(tabs || {});
  if (!keys.length) {
    const placeholder = document.createElement('div');
    placeholder.className = 'tab';
    placeholder.textContent = 'No tabs yet';
    placeholder.style.opacity = '0.5';
    tabsContainer.appendChild(placeholder);
    return;
  }
  for (const id of keys) {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab' + (id === activeTab ? ' active' : '');
    tabEl.textContent = tabs[id].title || 'Untitled';
    tabEl.onclick = () => setActiveTab(id);
    tabsContainer.appendChild(tabEl);
  }
}

function setActiveTab(tabId) {
  if (activeTab && tabs[activeTab]) tabs[activeTab].text = textArea.value;
  activeTab = tabId;
  textArea.value = tabs[tabId]?.text || "";
  renderTabs();
}

function createTab(title = null) {
  if (!sessionID) return alert("Join or create a session first!");
  const tabId = generateId();
  const idx = Object.keys(tabs).length + 1;
  tabs[tabId] = { title: title || `Tab ${idx}`, text: "" };
  renderTabs();
  setActiveTab(tabId);
  saveAllTabs().catch(console.warn);
}

/* Firebase */
async function saveAllTabs() {
  if (activeTab && tabs[activeTab]) tabs[activeTab].text = textArea.value;
  const backupKey = backupKeyForCurrentSession();
  try {
    if (!tabsRef) { if (backupKey) localStorage.setItem(backupKey, JSON.stringify(tabs)); return; }
    await set(tabsRef, tabs);
    if (backupKey) localStorage.setItem(backupKey, JSON.stringify(tabs));
  } catch (err) { if (backupKey) localStorage.setItem(backupKey, JSON.stringify(tabs)); console.error(err); }
}

async function startSession(id, pass) {
  if (unsubscribeTabsListener) { try { unsubscribeTabsListener(); } catch {} unsubscribeTabsListener=null; }
  sessionID = id; sessionPass = pass;
  sessionNameDisplay.textContent = `Session: ${id}`;
  sessionModal.style.display = 'none';
  tabsRef = ref(db, `sessions/${sessionID}_${sessionPass}/tabs`);

  unsubscribeTabsListener = onValue(tabsRef, snapshot => {
    const remoteTabs = snapshot.exists() ? snapshot.val() : {};
    if (localEditing && activeTab && tabs[activeTab]) {
      const merged = { ...remoteTabs }; merged[activeTab] = tabs[activeTab]; tabs = merged;
    } else tabs = remoteTabs || {};

    if (!snapshot.exists() || Object.keys(tabs).length === 0) {
      const backup = backupKeyForCurrentSession() ? localStorage.getItem(backupKeyForCurrentSession()) : null;
      if (backup) tabs = JSON.parse(backup);
      set(tabsRef, tabs).catch(console.warn);
    }

    renderTabs();
    if (!activeTab && Object.keys(tabs).length>0) setActiveTab(Object.keys(tabs)[0]);
    else if(activeTab && tabs[activeTab] && !localEditing) textArea.value = tabs[activeTab].text || "";
  });
}

/* Events */
joinBtn.addEventListener('click', () => {
  const id = document.getElementById('sessionID').value.trim();
  const pass = document.getElementById('sessionPass').value.trim();
  if (!id || !pass) return alert("Enter both Session ID and Password");
  startSession(id, pass);
});

newSessionBtn.addEventListener('click', async () => {
  if (sessionID && tabsRef) await saveAllTabs();
  
  // Reset session state
  sessionID = '';
  sessionPass = '';
  tabsRef = null;
  tabs = {};
  activeTab = null;
  textArea.value = '';
  sessionNameDisplay.textContent = "No session";

  // Clear modal inputs
  document.getElementById('sessionID').value = '';
  document.getElementById('sessionPass').value = '';

  // Show modal
  sessionModal.style.display = 'flex';
});


newTabBtn.addEventListener('click', () => createTab());
saveBtn.addEventListener('click', async () => { await saveAllTabs(); alert("💾 All tabs saved!"); });
// shareBtn.addEventListener('click', () => {
//   navigator.clipboard.writeText(`Session ID: ${sessionID}\nPassword: ${sessionPass}`).then(()=>alert("📋 Session details copied!"));
// });

textArea.addEventListener('input', () => {
  if (!activeTab) createTab();
  localEditing = true;
  if (activeTab && tabs[activeTab]) tabs[activeTab].text = textArea.value;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{ saveAllTabs().finally(()=>{ localEditing=false }); },800);
});

window.addEventListener('beforeunload', () => { 
  const backup = backupKeyForCurrentSession(); 
  if (backup) localStorage.setItem(backup, JSON.stringify(tabs)); 
});
