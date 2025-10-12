// Import Firebase configuration and Authentication Manager
import { getFirebaseConfig } from './config.js';
import AuthManager from './auth.js';

// TextVault Application Class
class TextVault {
    constructor() {
        this.database = null;
        this.authManager = new AuthManager();
        this.currentSession = null;
        this.currentEditingId = null;
        this.notes = {};
        this.filteredNotes = {};
        this.currentView = localStorage.getItem('viewMode') || 'grid';
        this.theme = localStorage.getItem('theme') || 'light';
        this.autoSaveTimer = null;
        this.isDragging = false;
        this.draggedNote = null;
        this.isOffline = !navigator.onLine;
        this.pendingChanges = [];
        
        this.init();
    }

    // Initialize the application
    async init() {
        try {
            console.log('Initializing TextVault...');

            // Initialize Firebase first
            console.log('Initializing Firebase...');
            await this.initFirebase();

            // Initialize authentication manager
            this.authManager.init(this.database);

            // Try to restore session from localStorage
            console.log('Checking for stored session...');
            const hasStoredSession = this.authManager.checkStoredSession();

            if (hasStoredSession) {
                console.log('Found stored session, restoring authentication...');
                this.currentSession = this.authManager.getSessionId();
                await this.initializeApp();
            } else {
                console.log('No stored session found, showing authentication modal...');
                this.showAuthModal();
            }

        } catch (error) {
            console.error('Failed to initialize TextVault:', error);
            this.showNotification('Failed to initialize TextVault. Please check your Firebase configuration.', 'error');
        }
    }

    // Initialize Firebase
    async initFirebase() {
        try {
            const firebaseConfig = getFirebaseConfig();
            firebase.initializeApp(firebaseConfig);
            this.database = firebase.database();
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            throw new Error('Failed to initialize Firebase. Please check your configuration.');
        }
    }

    // Initialize the main application after authentication
    async initializeApp() {
        try {
            console.log('Starting app initialization...');
            
            // Initialize UI
            console.log('Initializing UI...');
            this.initUI();
            
            // Load notes
            console.log('Loading notes...');
            await this.loadNotes();
            
            // Set up real-time listeners
            console.log('Setting up real-time listeners...');
            this.setupRealtimeListeners();
            
            // Set up session persistence
            console.log('Setting up session persistence...');
            this.setupSessionPersistence();
            
            // Hide auth modal and show main container
            console.log('Hiding auth modal...');
            this.hideAuthModal();
            
            console.log('App initialization complete!');
            this.showNotification('TextVault loaded successfully!', 'success');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showNotification('Failed to load your vault. Please try again.', 'error');
        }
    }

    // Initialize Firebase
    async initFirebase() {
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded. Please add Firebase scripts to your HTML.');
            }

            let firebaseConfig;
            try {
                // Try to get Firebase configuration from environment variables
                firebaseConfig = await getFirebaseConfig();
            } catch (envError) {
                console.warn('Environment configuration failed, using demo configuration:', envError.message);
                // Fallback to demo configuration for testing
                firebaseConfig = {
                    apiKey: "demo-api-key",
                    authDomain: "demo-project.firebaseapp.com",
                    databaseURL: "https://demo-project-default-rtdb.firebaseio.com/",
                    projectId: "demo-project",
                    storageBucket: "demo-project.appspot.com",
                    messagingSenderId: "123456789",
                    appId: "1:123456789:web:abcdef123456"
                };
                
                // Show warning to user
                this.showNotification('Using demo mode - data will not persist. Please configure Firebase for production use.', 'warning');
            }

            // Initialize Firebase app
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            // Get database reference
            this.database = firebase.database();
            
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw error;
        }
    }

    // Initialize UI components and event listeners
    initUI() {
        // Apply saved theme
        this.applyTheme();
        
        // Update session display
        this.updateSessionDisplay();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize view
        this.updateViewMode();
        
        // Initialize interactive features
        this.initInteractiveFeatures();
        
        // Set up offline handling
        this.setupOfflineHandling();
    }

    // Set up all event listeners
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add note button
        document.getElementById('addNoteBtn').addEventListener('click', () => {
            this.openNoteModal();
        });

        // Modal controls
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeNoteModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeNoteModal();
        });

        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) {
                this.closeNoteModal();
            }
        });

        // Note form submission
        document.getElementById('noteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNote();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchNotes(e.target.value);
        });

        // View toggle
        document.getElementById('gridViewBtn').addEventListener('click', () => {
            this.setViewMode('grid');
        });

        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.setViewMode('list');
        });

        // Import functionality
        document.getElementById('importBtn').addEventListener('click', () => {
            this.showImportModal();
        });

        // Export functionality
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        // Delete all functionality
        document.getElementById('deleteAllBtn').addEventListener('click', () => {
            this.confirmDeleteAll();
        });

        // Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Confirmation modal
        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        document.getElementById('confirmOk').addEventListener('click', () => {
            this.executeConfirmAction();
        });

        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('confirmModal')) {
                this.closeConfirmModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openNoteModal();
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('searchInput').focus();
                        break;
                    case 's':
                        e.preventDefault();
                        if (document.getElementById('modalOverlay').classList.contains('active')) {
                            this.saveNote();
                        }
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportNotes();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.toggleDashboard();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.closeNoteModal();
                this.closeConfirmModal();
                this.closeDashboard();
            }
        });
        
        // Auto-save for note content
        const noteContent = document.getElementById('noteContent');
        const noteTitle = document.getElementById('noteTitle');
        
        [noteContent, noteTitle].forEach(element => {
            element.addEventListener('input', () => {
                this.scheduleAutoSave();
            });
        });
    }

    // Get session name (now handled by authentication)
    getSessionFromURL() {
        // Legacy method - now handled by authentication
        return null;
    }

    // Update session display in UI
    updateSessionDisplay() {
        const sessionElement = document.getElementById('sessionName');
        if (this.currentSession) {
            sessionElement.textContent = this.currentSession.charAt(0).toUpperCase() + this.currentSession.slice(1) + ' Session';
        } else {
            sessionElement.textContent = 'No Session';
        }
    }

    // Theme management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // View mode management
    setViewMode(mode) {
        this.currentView = mode;
        this.updateViewMode();
        localStorage.setItem('viewMode', mode);
    }

    updateViewMode() {
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        const notesGrid = document.getElementById('notesGrid');

        // Update button states
        gridBtn.classList.toggle('active', this.currentView === 'grid');
        listBtn.classList.toggle('active', this.currentView === 'list');

        // Update grid class
        notesGrid.classList.toggle('list-view', this.currentView === 'list');
    }

    // Firebase operations
    async loadNotes() {
        try {
            this.showLoading(true);
            
            const snapshot = await this.database.ref(`sessions/${this.currentSession}/notes`).once('value');
            const data = snapshot.val();
            
            this.notes = data || {};
            this.filteredNotes = { ...this.notes };
            
            this.renderNotes();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error loading notes:', error);
            this.showNotification('Failed to load notes', 'error');
            this.showLoading(false);
        }
    }

    setupRealtimeListeners() {
        // Listen for changes in the current session
        this.database.ref(`sessions/${this.currentSession}/notes`).on('value', (snapshot) => {
            const data = snapshot.val();
            this.notes = data || {};
            
            // Apply current search filter
            const searchTerm = document.getElementById('searchInput').value;
            if (searchTerm) {
                this.searchNotes(searchTerm);
            } else {
                this.filteredNotes = { ...this.notes };
            }
            
            this.renderNotes();
        });
    }

    async saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();

        if (!title || !content) {
            this.showNotification('Please fill in both title and content', 'warning');
            return;
        }

        try {
            const noteData = {
                title,
                content,
                timestamp: Date.now(),
                lastModified: Date.now()
            };

            let noteRef;
            if (this.currentEditingId) {
                // Update existing note
                noteRef = this.database.ref(`sessions/${this.currentSession}/notes/${this.currentEditingId}`);
                noteData.created = this.notes[this.currentEditingId]?.created || Date.now();
            } else {
                // Create new note
                noteRef = this.database.ref(`sessions/${this.currentSession}/notes`).push();
                noteData.created = Date.now();
            }

            await noteRef.set(noteData);

            this.showNotification(
                this.currentEditingId ? 'Note updated successfully!' : 'Note saved successfully!',
                'success'
            );

            this.closeNoteModal();
            
        } catch (error) {
            console.error('Error saving note:', error);
            this.showNotification('Failed to save note', 'error');
        }
    }

    async deleteNote(noteId) {
        try {
            await this.database.ref(`sessions/${this.currentSession}/notes/${noteId}`).remove();
            this.showNotification('Note deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting note:', error);
            this.showNotification('Failed to delete note', 'error');
        }
    }

    async deleteAllNotes() {
        try {
            await this.database.ref(`sessions/${this.currentSession}/notes`).remove();
            this.showNotification('All notes deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting all notes:', error);
            this.showNotification('Failed to delete notes', 'error');
        }
    }

    // UI operations
    openNoteModal(noteId = null) {
        this.currentEditingId = noteId;
        const modal = document.getElementById('modalOverlay');
        const title = document.getElementById('modalTitle');
        const noteTitle = document.getElementById('noteTitle');
        const noteContent = document.getElementById('noteContent');
        const saveBtn = document.getElementById('saveBtn');

        if (noteId && this.notes[noteId]) {
            // Edit mode
            title.textContent = 'Edit Note';
            noteTitle.value = this.notes[noteId].title;
            noteContent.value = this.notes[noteId].content;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Note';
        } else {
            // Add mode
            title.textContent = 'Add New Note';
            noteTitle.value = '';
            noteContent.value = '';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Note';
        }

        modal.classList.add('active');
        noteTitle.focus();
    }

    closeNoteModal() {
        const modal = document.getElementById('modalOverlay');
        modal.classList.remove('active');
        this.currentEditingId = null;
        
        // Reset form
        document.getElementById('noteForm').reset();
    }

    confirmDeleteAll() {
        if (Object.keys(this.notes).length === 0) {
            this.showNotification('No notes to delete', 'warning');
            return;
        }

        this.showConfirmModal(
            'Delete All Notes',
            'Are you sure you want to delete all notes? This action cannot be undone.',
            () => this.deleteAllNotes()
        );
    }

    showConfirmModal(title, message, action) {
        const modal = document.getElementById('confirmModal');
        const titleElement = document.getElementById('confirmTitle');
        const messageElement = document.getElementById('confirmMessage');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        this.confirmAction = action;
        modal.classList.add('active');
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        modal.classList.remove('active');
        this.confirmAction = null;
    }

    executeConfirmAction() {
        if (this.confirmAction) {
            this.confirmAction();
        }
        this.closeConfirmModal();
    }

    searchNotes(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredNotes = { ...this.notes };
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredNotes = {};
            
            Object.keys(this.notes).forEach(id => {
                const note = this.notes[id];
                if (note.title.toLowerCase().includes(term) || 
                    note.content.toLowerCase().includes(term)) {
                    this.filteredNotes[id] = note;
                }
            });
        }
        
        this.renderNotes();
    }

    renderNotes() {
        const container = document.getElementById('notesGrid');
        const emptyState = document.getElementById('emptyState');
        const noteIds = Object.keys(this.filteredNotes);

        if (noteIds.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Sort notes by last modified (newest first)
        const sortedNotes = noteIds
            .map(id => ({ id, ...this.filteredNotes[id] }))
            .sort((a, b) => (b.lastModified || b.timestamp) - (a.lastModified || a.timestamp));

        container.innerHTML = sortedNotes.map(note => this.createNoteHTML(note)).join('');

        // Add event listeners to note cards
        this.attachNoteEventListeners();
    }

    createNoteHTML(note) {
        const date = new Date(note.lastModified || note.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });

        const truncatedContent = note.content.length > 150 
            ? note.content.substring(0, 150) + '...' 
            : note.content;

        return `
            <div class="note-card" data-note-id="${note.id}" draggable="true">
                <div class="note-header">
                    <div class="drag-handle" title="Drag to reorder">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                    <span class="note-date">${formattedDate}</span>
                </div>
                <div class="note-content">${this.escapeHtml(truncatedContent)}</div>
                <div class="note-actions">
                    <button class="note-action-btn edit" data-action="edit" data-note-id="${note.id}" title="Edit note">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="note-action-btn copy" data-action="copy" data-note-id="${note.id}" title="Copy note">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="note-action-btn delete" data-action="delete" data-note-id="${note.id}" title="Delete note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachNoteEventListeners() {
        // Note card click (for viewing/editing)
        document.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons or drag handle
                if (e.target.closest('.note-actions') || e.target.closest('.drag-handle')) return;
                
                const noteId = card.dataset.noteId;
                this.openNoteModal(noteId);
            });

            // Drag events
            card.addEventListener('dragstart', (e) => {
                this.isDragging = true;
                this.draggedNote = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            card.addEventListener('dragend', (e) => {
                this.isDragging = false;
                card.classList.remove('dragging');
                this.draggedNote = null;
            });
        });

        // Action buttons
        document.querySelectorAll('.note-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const noteId = btn.dataset.noteId;

                if (action === 'edit') {
                    this.openNoteModal(noteId);
                } else if (action === 'delete') {
                    this.confirmDeleteNote(noteId);
                } else if (action === 'copy') {
                    this.copyNote(noteId);
                }
            });
        });
    }

    confirmDeleteNote(noteId) {
        const note = this.notes[noteId];
        if (!note) return;

        this.showConfirmModal(
            'Delete Note',
            `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
            () => this.deleteNote(noteId)
        );
    }

    // Copy note functionality
    async copyNote(noteId) {
        const note = this.notes[noteId];
        if (!note) return;

        try {
            const copiedNote = {
                title: `${note.title} (Copy)`,
                content: note.content,
                timestamp: Date.now(),
                lastModified: Date.now(),
                created: Date.now()
            };

            const noteRef = this.database.ref(`sessions/${this.currentSession}/notes`).push();
            await noteRef.set(copiedNote);

            this.showNotification('Note copied successfully!', 'success');
        } catch (error) {
            console.error('Error copying note:', error);
            this.showNotification('Failed to copy note', 'error');
        }
    }

    // Show export modal with format options
    showExportModal() {
        if (Object.keys(this.notes).length === 0) {
            this.showNotification('No notes to export', 'warning');
            return;
        }

        const modal = this.createExportModal();
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    // Create export modal
    createExportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay export-modal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3><i class="fas fa-download"></i> Export Notes</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="export-options">
                        <h4>Choose Export Format:</h4>
                        <div class="format-grid">
                            <div class="format-option" data-format="json">
                                <div class="format-icon"><i class="fas fa-code"></i></div>
                                <div class="format-info">
                                    <div class="format-name">JSON</div>
                                    <div class="format-desc">Complete data with metadata</div>
                                </div>
                            </div>
                            <div class="format-option" data-format="markdown">
                                <div class="format-icon"><i class="fab fa-markdown"></i></div>
                                <div class="format-info">
                                    <div class="format-name">Markdown</div>
                                    <div class="format-desc">Text format with formatting</div>
                                </div>
                            </div>
                            <div class="format-option" data-format="txt">
                                <div class="format-icon"><i class="fas fa-file-alt"></i></div>
                                <div class="format-info">
                                    <div class="format-name">Plain Text</div>
                                    <div class="format-desc">Simple text format</div>
                                </div>
                            </div>
                            <div class="format-option" data-format="csv">
                                <div class="format-icon"><i class="fas fa-table"></i></div>
                                <div class="format-info">
                                    <div class="format-name">CSV</div>
                                    <div class="format-desc">Spreadsheet compatible</div>
                                </div>
                            </div>
                        </div>
                        <div class="export-actions">
                            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                            <button class="btn btn-primary" id="exportConfirmBtn" disabled>
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }

            const formatOption = e.target.closest('.format-option');
            if (formatOption) {
                // Remove previous selection
                modal.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('selected'));
                // Select current option
                formatOption.classList.add('selected');
                // Enable export button
                modal.querySelector('#exportConfirmBtn').disabled = false;
                
                // Set up export action
                const exportBtn = modal.querySelector('#exportConfirmBtn');
                exportBtn.onclick = () => {
                    this.exportNotes(formatOption.dataset.format);
                    modal.remove();
                };
            }
        });

        return modal;
    }

    // Enhanced export with multiple formats
    exportNotes(format = 'json') {
        if (Object.keys(this.notes).length === 0) {
            this.showNotification('No notes to export', 'warning');
            return;
        }

        try {
            let content, mimeType, extension;
            const notes = Object.keys(this.notes).map(id => ({
                id,
                ...this.notes[id],
                created: new Date(this.notes[id].created || this.notes[id].timestamp).toISOString(),
                lastModified: new Date(this.notes[id].lastModified || this.notes[id].timestamp).toISOString()
            }));

            switch (format) {
                case 'json':
                    const exportData = {
                        session: this.currentSession,
                        exportDate: new Date().toISOString(),
                        notes
                    };
                    content = JSON.stringify(exportData, null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;

                case 'markdown':
                    content = this.generateMarkdown(notes);
                    mimeType = 'text/markdown';
                    extension = 'md';
                    break;

                case 'txt':
                    content = this.generatePlainText(notes);
                    mimeType = 'text/plain';
                    extension = 'txt';
                    break;

                case 'csv':
                    content = this.generateCSV(notes);
                    mimeType = 'text/csv';
                    extension = 'csv';
                    break;

                default:
                    throw new Error('Unsupported export format');
            }

            const dataBlob = new Blob([content], { type: mimeType });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `textvault-${this.currentSession}-${new Date().toISOString().split('T')[0]}.${extension}`;
            link.click();

            this.showNotification(`Notes exported as ${format.toUpperCase()} successfully!`, 'success');
        } catch (error) {
            console.error('Error exporting notes:', error);
            this.showNotification('Failed to export notes', 'error');
        }
    }

    // Generate Markdown format
    generateMarkdown(notes) {
        let content = `# ${this.currentSession} Session Notes\n\n`;
        content += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
        content += `---\n\n`;

        notes.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        notes.forEach(note => {
            content += `## ${note.title}\n\n`;
            content += `*Created: ${new Date(note.created).toLocaleDateString()}*\n`;
            content += `*Modified: ${new Date(note.lastModified).toLocaleDateString()}*\n\n`;
            content += `${note.content}\n\n`;
            content += `---\n\n`;
        });

        return content;
    }

    // Generate Plain Text format
    generatePlainText(notes) {
        let content = `${this.currentSession.toUpperCase()} SESSION NOTES\n`;
        content += `Exported on ${new Date().toLocaleDateString()}\n`;
        content += `${'='.repeat(50)}\n\n`;

        notes.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        notes.forEach((note, index) => {
            content += `${index + 1}. ${note.title}\n`;
            content += `   Created: ${new Date(note.created).toLocaleDateString()}\n`;
            content += `   Modified: ${new Date(note.lastModified).toLocaleDateString()}\n\n`;
            content += `   ${note.content.replace(/\n/g, '\n   ')}\n\n`;
            content += `${'-'.repeat(50)}\n\n`;
        });

        return content;
    }

    // Generate CSV format
    generateCSV(notes) {
        let content = 'Title,Content,Created,Modified,Word Count\n';

        notes.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        notes.forEach(note => {
            const title = `"${note.title.replace(/"/g, '""')}"`;
            const noteContent = `"${note.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            const created = new Date(note.created).toISOString();
            const modified = new Date(note.lastModified).toISOString();
            const wordCount = note.content.split(/\s+/).length;

            content += `${title},${noteContent},${created},${modified},${wordCount}\n`;
        });

        return content;
    }

    // Import functionality
    showImportModal() {
        const modal = this.createImportModal();
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    // Create import modal
    createImportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay import-modal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3><i class="fas fa-upload"></i> Import Notes</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="import-options">
                        <div class="file-drop-zone" id="fileDropZone">
                            <div class="drop-zone-content">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <h4>Drop files here or click to browse</h4>
                                <p>Supports JSON, Markdown, and Text files</p>
                                <input type="file" id="fileInput" accept=".json,.md,.txt" multiple style="display: none;">
                                <button class="btn btn-secondary" onclick="document.getElementById('fileInput').click()">
                                    <i class="fas fa-folder-open"></i> Browse Files
                                </button>
                            </div>
                        </div>
                        <div class="import-actions">
                            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Set up file handling
        const fileInput = modal.querySelector('#fileInput');
        const dropZone = modal.querySelector('#fileDropZone');

        fileInput.addEventListener('change', (e) => {
            this.handleImportFiles(e.target.files);
            modal.remove();
        });

        // Drag and drop functionality
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleImportFiles(e.dataTransfer.files);
            modal.remove();
        });

        return modal;
    }

    // Handle imported files
    async handleImportFiles(files) {
        if (files.length === 0) return;

        let importedCount = 0;
        let errorCount = 0;

        for (const file of files) {
            try {
                const content = await this.readFile(file);
                const notes = await this.parseImportedFile(file, content);
                
                for (const note of notes) {
                    await this.importNote(note);
                    importedCount++;
                }
            } catch (error) {
                console.error(`Error importing ${file.name}:`, error);
                errorCount++;
            }
        }

        if (importedCount > 0) {
            this.showNotification(`Successfully imported ${importedCount} notes!`, 'success');
        }
        if (errorCount > 0) {
            this.showNotification(`Failed to import ${errorCount} files`, 'warning');
        }
    }

    // Read file content
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    // Parse imported file based on type
    async parseImportedFile(file, content) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'json':
                return this.parseJSONImport(content);
            case 'md':
                return this.parseMarkdownImport(content);
            case 'txt':
                return this.parseTextImport(content, file.name);
            default:
                throw new Error(`Unsupported file type: ${extension}`);
        }
    }

    // Parse JSON import
    parseJSONImport(content) {
        const data = JSON.parse(content);
        if (data.notes && Array.isArray(data.notes)) {
            return data.notes.map(note => ({
                title: note.title || 'Untitled',
                content: note.content || '',
                timestamp: Date.now(),
                created: Date.now(),
                lastModified: Date.now()
            }));
        }
        throw new Error('Invalid JSON format');
    }

    // Parse Markdown import
    parseMarkdownImport(content) {
        const notes = [];
        const sections = content.split(/^##\s+/m).slice(1); // Split by ## headers

        sections.forEach(section => {
            const lines = section.split('\n');
            const title = lines[0].trim();
            const contentLines = lines.slice(1).filter(line => 
                !line.match(/^\*Created:/) && !line.match(/^\*Modified:/) && line.trim() !== '---'
            );
            const noteContent = contentLines.join('\n').trim();

            if (title && noteContent) {
                notes.push({
                    title,
                    content: noteContent,
                    timestamp: Date.now(),
                    created: Date.now(),
                    lastModified: Date.now()
                });
            }
        });

        return notes;
    }

    // Parse Text import
    parseTextImport(content, filename) {
        const title = filename.replace(/\.[^/.]+$/, ""); // Remove extension
        return [{
            title,
            content: content.trim(),
            timestamp: Date.now(),
            created: Date.now(),
            lastModified: Date.now()
        }];
    }

    // Import a single note
    async importNote(noteData) {
        const noteRef = this.database.ref(`sessions/${this.currentSession}/notes`).push();
        await noteRef.set(noteData);
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const notesGrid = document.getElementById('notesGrid');
        
        if (show) {
            spinner.style.display = 'flex';
            notesGrid.style.display = 'none';
        } else {
            spinner.style.display = 'none';
            notesGrid.style.display = 'grid';
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        
        notification.className = `notification ${type}`;
        
        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${this.escapeHtml(message)}</span>
        `;

        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Authentication Methods
    showAuthModal() {
        const authOverlay = document.getElementById('authOverlay');
        const mainContainer = document.getElementById('mainContainer');
        
        authOverlay.classList.remove('hidden');
        mainContainer.style.filter = 'blur(5px)';
        mainContainer.style.pointerEvents = 'none';
        
        // Set up auth form event listeners
        this.setupAuthEventListeners();
        
        // Focus on session ID input
        setTimeout(() => {
            document.getElementById('sessionId').focus();
        }, 100);
    }

    hideAuthModal() {
        const authOverlay = document.getElementById('authOverlay');
        const mainContainer = document.getElementById('mainContainer');
        
        authOverlay.classList.add('hidden');
        mainContainer.style.filter = 'none';
        mainContainer.style.pointerEvents = 'auto';
    }

    setupAuthEventListeners() {
        // Auth form submission
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.removeEventListener('submit', this.handleAuthSubmit);
            authForm.addEventListener('submit', this.handleAuthSubmit.bind(this));
        }

        // Password toggle
        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.removeEventListener('click', this.togglePasswordVisibility);
            passwordToggle.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }

        // Enter key handling
        const sessionIdInput = document.getElementById('sessionId');
        const passwordInput = document.getElementById('sessionPassword');
        
        [sessionIdInput, passwordInput].forEach(input => {
            if (input) {
                input.removeEventListener('keydown', this.handleAuthKeydown);
                input.addEventListener('keydown', this.handleAuthKeydown.bind(this));
            }
        });
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const sessionId = document.getElementById('sessionId').value.trim();
        const password = document.getElementById('sessionPassword').value;
        const remember = document.getElementById('rememberSession').checked;
        const submitBtn = document.getElementById('authForm').querySelector('button[type="submit"]');
        
        if (!sessionId || !password) {
            this.showNotification('Please enter both session ID and password', 'warning');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<i class="fas fa-spinner"></i> Authenticating...';
        
        try {
            console.log('Attempting authentication for session:', sessionId);
            const result = await this.authManager.authenticate(sessionId, password, remember);
            console.log('Authentication result:', result);
            
            if (result.success) {
                this.currentSession = result.sessionId;
                console.log('Session set to:', this.currentSession);
                
                // Show success message
                const message = result.isNewSession 
                    ? `New session "${result.sessionId}" created successfully!`
                    : `Welcome back to session "${result.sessionId}"!`;
                
                this.showNotification(message, 'success');
                
                // Initialize the app
                console.log('Initializing app...');
                await this.initializeApp();
                console.log('App initialized successfully');
                
                // Hide auth modal after successful authentication
                this.hideAuthModal();
            }
            
        } catch (error) {
            console.error('Authentication failed:', error);
            this.showNotification(error.message || 'Authentication failed', 'error');
        } finally {
            // Reset button state
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Access Vault';
        }
    }

    handleAuthKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('authForm').dispatchEvent(new Event('submit'));
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('sessionPassword');
        const toggleIcon = document.getElementById('passwordToggle').querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    logout() {
        this.showConfirmModal(
            'Logout',
            'Are you sure you want to logout? You will need to enter your credentials again to access this session.',
            () => {
                this.authManager.logout();
                this.currentSession = null;
                this.notes = {};
                this.filteredNotes = {};
                
                // Clear the notes display
                document.getElementById('notesGrid').innerHTML = '';
                document.getElementById('emptyState').style.display = 'block';
                
                // Reset auth form
                document.getElementById('authForm').reset();
                
                // Show auth modal
                this.showAuthModal();
                
                this.showNotification('Logged out successfully', 'success');
            }
        );
    }

    // Initialize interactive features
    initInteractiveFeatures() {
        // Initialize quick actions
        this.initQuickActions();
    }




    // Initialize quick actions
    initQuickActions() {
        // Quick actions functionality removed for simplicity
    }

    // Set up session persistence and validation
    setupSessionPersistence() {
        // Check session validity periodically
        setInterval(() => {
            if (this.isUserAuthenticated()) {
                this.authManager.validateSession();
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isUserAuthenticated()) {
                // Page became visible, validate session
                this.authManager.validateSession().then(isValid => {
                    if (!isValid) {
                        this.showNotification('Session expired. Please log in again.', 'warning');
                        this.logout();
                    }
                });
            }
        });
    }

    // Set up offline handling
    setupOfflineHandling() {
        // Basic offline detection - simplified for core functionality
        console.log('Offline handling initialized');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Please add Firebase scripts to your HTML.');
        
        // Show error notification
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = 'notification error show';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Firebase SDK not loaded. Please add Firebase scripts to your HTML head section.</span>
        `;
        container.appendChild(notification);
        return;
    }

    // Initialize TextVault
    window.textVault = new TextVault();
});

export default TextVault;
