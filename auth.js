// Authentication and Session Management Module
class AuthManager {
    constructor() {
        this.database = null;
        this.currentSessionId = null;
        this.isAuthenticated = false;
        this.sessionData = null;
        this.rememberSession = false;
        
        // Encryption key for password hashing (in production, use a proper crypto library)
        this.saltRounds = 12;
    }

    // Initialize authentication manager with Firebase database
    init(database) {
        this.database = database;
        this.checkStoredSession();
    }

    // Check if there's a stored session in localStorage
    checkStoredSession() {
        const storedSession = localStorage.getItem('textVault_session');
        const storedRemember = localStorage.getItem('textVault_remember');
        
        if (storedSession && storedRemember === 'true') {
            try {
                const sessionData = JSON.parse(storedSession);
                if (sessionData.sessionId && sessionData.passwordHash && sessionData.expiry > Date.now()) {
                    this.currentSessionId = sessionData.sessionId;
                    this.sessionData = sessionData;
                    this.isAuthenticated = true;
                    this.rememberSession = true;
                    return true;
                }
            } catch (error) {
                console.error('Error parsing stored session:', error);
                this.clearStoredSession();
            }
        }
        return false;
    }

    // Store session data in localStorage
    storeSession(sessionId, passwordHash, remember = false) {
        if (remember) {
            const sessionData = {
                sessionId,
                passwordHash,
                expiry: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
            };
            localStorage.setItem('textVault_session', JSON.stringify(sessionData));
            localStorage.setItem('textVault_remember', 'true');
        }
    }

    // Clear stored session data
    clearStoredSession() {
        localStorage.removeItem('textVault_session');
        localStorage.removeItem('textVault_remember');
    }

    // Simple hash function for password (in production, use bcrypt or similar)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'textVault_salt_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Authenticate user with session ID and password
    async authenticate(sessionId, password, remember = false) {
        if (!this.database) {
            throw new Error('Database not initialized');
        }

        if (!sessionId || !password) {
            throw new Error('Session ID and password are required');
        }

        // Sanitize session ID (remove special characters, limit length)
        const sanitizedSessionId = sessionId.toLowerCase()
            .replace(/[^a-z0-9_-]/g, '')
            .substring(0, 50);

        if (sanitizedSessionId.length < 3) {
            throw new Error('Session ID must be at least 3 characters long and contain only letters, numbers, hyphens, and underscores');
        }

        try {
            const passwordHash = await this.hashPassword(password);
            
            // Check if session exists
            const sessionRef = this.database.ref(`sessions/${sanitizedSessionId}/auth`);
            const snapshot = await sessionRef.once('value');
            const existingAuth = snapshot.val();

            if (existingAuth) {
                // Session exists, verify password
                if (existingAuth.passwordHash !== passwordHash) {
                    throw new Error('Invalid password for this session');
                }
                
                // Update last access time
                await sessionRef.update({
                    lastAccess: Date.now(),
                    accessCount: (existingAuth.accessCount || 0) + 1
                });
            } else {
                // Create new session
                await sessionRef.set({
                    passwordHash,
                    created: Date.now(),
                    lastAccess: Date.now(),
                    accessCount: 1,
                    sessionId: sanitizedSessionId
                });
            }

            // Set authentication state
            this.currentSessionId = sanitizedSessionId;
            this.isAuthenticated = true;
            this.rememberSession = remember;
            this.sessionData = {
                sessionId: sanitizedSessionId,
                passwordHash,
                created: existingAuth?.created || Date.now(),
                lastAccess: Date.now()
            };

            // Store session if remember is checked
            if (remember) {
                this.storeSession(sanitizedSessionId, passwordHash, true);
            }

            return {
                success: true,
                sessionId: sanitizedSessionId,
                isNewSession: !existingAuth
            };

        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    // Logout user and clear session
    logout() {
        this.currentSessionId = null;
        this.isAuthenticated = false;
        this.sessionData = null;
        this.rememberSession = false;
        this.clearStoredSession();
    }

    // Get current session ID
    getSessionId() {
        return this.currentSessionId;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated && this.currentSessionId;
    }

    // Get session statistics
    async getSessionStats() {
        if (!this.isAuthenticated || !this.database) {
            return null;
        }

        try {
            const authRef = this.database.ref(`sessions/${this.currentSessionId}/auth`);
            const notesRef = this.database.ref(`sessions/${this.currentSessionId}/notes`);
            
            const [authSnapshot, notesSnapshot] = await Promise.all([
                authRef.once('value'),
                notesRef.once('value')
            ]);

            const authData = authSnapshot.val();
            const notesData = notesSnapshot.val();

            return {
                sessionId: this.currentSessionId,
                created: authData?.created || Date.now(),
                lastAccess: authData?.lastAccess || Date.now(),
                accessCount: authData?.accessCount || 0,
                noteCount: notesData ? Object.keys(notesData).length : 0
            };
        } catch (error) {
            console.error('Error getting session stats:', error);
            return null;
        }
    }

    // Validate session periodically
    async validateSession() {
        if (!this.isAuthenticated || !this.database) {
            return false;
        }

        try {
            const sessionRef = this.database.ref(`sessions/${this.currentSessionId}/auth`);
            const snapshot = await sessionRef.once('value');
            const sessionAuth = snapshot.val();

            if (!sessionAuth) {
                // Session was deleted
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    // Change session password
    async changePassword(currentPassword, newPassword) {
        if (!this.isAuthenticated || !this.database) {
            throw new Error('Not authenticated');
        }

        const currentHash = await this.hashPassword(currentPassword);
        const newHash = await this.hashPassword(newPassword);

        // Verify current password
        const sessionRef = this.database.ref(`sessions/${this.currentSessionId}/auth`);
        const snapshot = await sessionRef.once('value');
        const authData = snapshot.val();

        if (!authData || authData.passwordHash !== currentHash) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        await sessionRef.update({
            passwordHash: newHash,
            passwordChanged: Date.now()
        });

        // Update stored session if remembered
        if (this.rememberSession) {
            this.storeSession(this.currentSessionId, newHash, true);
        }

        return true;
    }
}

// Export the AuthManager class
export default AuthManager;
