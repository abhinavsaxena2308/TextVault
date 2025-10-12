const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    const env = {};
    
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;
            
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                env[key.trim()] = value;
            }
        }
    }
    
    return env;
}

// Create production config file
function createProductionConfig(env) {
    const configTemplate = `// Firebase Configuration for Production
// This file is auto-generated during build process

const firebaseConfig = {
    apiKey: "${env.FIREBASE_API_KEY || 'your-api-key-here'}",
    authDomain: "${env.FIREBASE_AUTH_DOMAIN || 'your-project-id.firebaseapp.com'}",
    databaseURL: "${env.FIREBASE_DATABASE_URL || 'https://your-project-id-default-rtdb.firebaseio.com/'}",
    projectId: "${env.FIREBASE_PROJECT_ID || 'your-project-id'}",
    storageBucket: "${env.FIREBASE_STORAGE_BUCKET || 'your-project-id.appspot.com'}",
    messagingSenderId: "${env.FIREBASE_MESSAGING_SENDER_ID || 'your-sender-id'}",
    appId: "${env.FIREBASE_APP_ID || 'your-app-id'}"
};

// Validate configuration
function validateConfig() {
    const required = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = required.filter(key => 
        !firebaseConfig[key] || firebaseConfig[key].includes('your-') || firebaseConfig[key].includes('placeholder')
    );

    if (missing.length > 0) {
        console.error('⚠️ Firebase configuration incomplete:', missing);
        throw new Error('Firebase configuration is missing or contains placeholder values.');
    }
}

// Initialize and validate
validateConfig();

// Export for use in modules
export { firebaseConfig };

// For backwards compatibility
export async function getFirebaseConfig() {
    return firebaseConfig;
}
`;

    return configTemplate;
}

// Main build function
function build() {
    console.log('🚀 Building TextVault for production...');
    
    // Create build directory
    const buildDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    
    // Load environment variables
    const env = loadEnvFile();
    console.log('📦 Loading environment variables...');
    
    // Create production config
    const prodConfig = createProductionConfig(env);
    fs.writeFileSync(path.join(buildDir, 'config.js'), prodConfig);
    console.log('✅ Created production config.js');
    
    // Copy other files
    const filesToCopy = ['index.html', 'styles.css', 'script.js', 'demo.html', 'package.json'];
    
    for (const file of filesToCopy) {
        const srcPath = path.join(__dirname, file);
        const destPath = path.join(buildDir, file);
        
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied ${file}`);
        }
    }
    
    // Update HTML to not use env-loader in production
    const indexPath = path.join(buildDir, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    indexContent = indexContent.replace(
        '<script type="module" src="env-loader.js"></script>',
        '<!-- env-loader not needed in production -->'
    );
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Updated index.html for production');
    
    console.log('🎉 Build completed! Files are in the dist/ directory');
    console.log('📁 Deploy the contents of the dist/ directory to your hosting service');
}

// Run build if called directly
if (require.main === module) {
    build();
}

module.exports = { build, loadEnvFile, createProductionConfig };
