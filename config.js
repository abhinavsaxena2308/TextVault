function getFirebaseConfig() {
    const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    // Validate configuration
    const requiredVars = ['apiKey', 'authDomain', 'projectId', 'appId'];
    const missingVars = requiredVars.filter(key => !config[key] || config[key].includes('your-'));
    
    if (missingVars.length > 0) {
        console.error('⚠️ Missing or invalid Firebase configuration. Please check your .env file.');
        console.error('Missing or invalid variables:', missingVars);
        throw new Error('Firebase configuration is missing or contains placeholder values. Please update your .env file with actual Firebase credentials.');
    }

    return config;
}

// For backwards compatibility, create a promise-based config
const firebaseConfig = getFirebaseConfig();
export { firebaseConfig, getFirebaseConfig };
