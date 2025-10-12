# TextVault - Secure Text Storage

A beautiful, modern web application for securely storing and managing your text notes using Firebase Realtime Database. Features a stunning neumorphic + glassmorphic design with dark/light mode support.

## ✨ Features

### 🔐 Security & Authentication
- **Session-based authentication** with secure password hashing
- **Remember session** option for convenience
- **Environment variables** for secure Firebase configuration
- **Automatic session validation** and management

### 📝 Note Management
- **Real-time synchronization** with Firebase Realtime Database
- **Rich text editing** with formatting toolbar (bold, italic, lists, links, code)
- **Auto-save functionality** with draft support
- **Drag-and-drop reordering** of notes
- **Copy notes** with one click
- **Search functionality** to quickly find your notes
- **Grid/List view** options for different viewing preferences

### 📊 Data Visualization
- **Interactive dashboard** with statistics and charts
- **Notes activity tracking** with streak counters
- **Visual charts** showing notes over time
- **Recent activity** timeline

### 🔄 Import/Export
- **Multiple export formats**: JSON, Markdown, Plain Text, CSV
- **Drag-and-drop import** for files
- **Bulk import** support for multiple files
- **Format-specific parsing** for different file types

### 🎨 User Experience
- **Modern UI/UX** with neumorphic and glassmorphic design elements
- **Dark/Light mode** toggle for comfortable viewing
- **Responsive design** that works on all devices
- **Smooth animations** and interactive effects
- **Keyboard shortcuts** for power users
- **Real-time notifications** for all actions
- **Offline support** with sync when back online

## 🚀 Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to **Project Settings > General > Your apps**
4. Click "Add app" and select the web platform
5. Copy your Firebase configuration object

### 2. Secure Configuration with Environment Variables

1. Open the `.env` file in your project
2. Replace the placeholder values with your actual Firebase config:

```env
FIREBASE_API_KEY=your-actual-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-app-id
```

**🔒 Security Benefits:**
- Firebase keys are stored in `.env` file (not committed to version control)
- Automatic validation of configuration
- Support for different environments (development/production)
- Build-time environment variable replacement for production

### 3. Enable Realtime Database

1. In Firebase Console, go to **Realtime Database**
2. Click "Create Database"
3. Choose your location
4. Start in **test mode** for development (update rules later for production)

### 4. Deploy

#### Option A: Local Development
```bash
# Start development server
npm run dev
# or
python -m http.server 8080
```

#### Option B: Production Build
```bash
# Build for production (replaces env vars)
npm run build

# Serve production build
npm run build:prod
```

#### Option C: Deploy to Vercel
1. Upload your project files to a GitHub repository
2. Connect your GitHub repo to [Vercel](https://vercel.com)
3. Add your Firebase environment variables in Vercel's dashboard
4. Deploy with one click!

#### Option D: Deploy to Netlify
1. Build your project: `npm run build`
2. Drag and drop the `dist/` folder to [Netlify](https://netlify.com)
3. Or connect your GitHub repo and set build command to `npm run build`

## 🎯 Usage

### Basic Operations

- **Add Note**: Click the "Add Note" button or press `Ctrl+N`
- **Edit Note**: Click on any note card or use the edit button
- **Delete Note**: Click the trash icon on any note
- **Search**: Use the search bar or press `Ctrl+F`
- **Switch Views**: Toggle between grid and list view
- **Export**: Download all your notes as a JSON file
- **Theme Toggle**: Switch between light and dark modes

### Sessions

TextVault organizes your notes into sessions (like categories). You can switch between sessions by changing the URL hash:

- `yoursite.com/#work` - Work session
- `yoursite.com/#personal` - Personal session  
- `yoursite.com/#ideas` - Ideas session

### Keyboard Shortcuts

- `Ctrl+N` - Add new note
- `Ctrl+F` - Focus search bar
- `Ctrl+S` - Save note (when editing)
- `Escape` - Close modals

## 🔧 Customization

### Themes

The app supports custom themes through CSS variables. You can modify the color scheme in `styles.css`:

```css
:root {
    --primary-color: #6366f1;
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* ... more variables */
}
```

### Database Structure

Notes are stored in Firebase with this structure:

```json
{
  "sessions": {
    "sessionName": {
      "notes": {
        "noteId": {
          "title": "Note Title",
          "content": "Note content...",
          "created": 1234567890,
          "lastModified": 1234567890,
          "timestamp": 1234567890
        }
      }
    }
  }
}
```

## 🔒 Security

### Development Rules (Current)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Production Rules (Recommended)
```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "notes": {
          "$noteId": {
            ".validate": "newData.hasChildren(['title', 'content', 'timestamp'])"
          }
        }
      }
    }
  }
}
```

## 📱 Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Styling**: Custom CSS with CSS Grid, Flexbox, and CSS Variables
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)

## 📄 File Structure

```
textVault/
├── index.html          # Main HTML structure
├── demo.html           # Standalone demo (no Firebase required)
├── styles.css          # All styling and themes
├── script.js           # Application logic and Firebase integration
├── config.js           # Secure Firebase configuration loader
├── env-loader.js       # Environment variables loader
├── build.js            # Production build script
├── .env                # Environment variables (DO NOT COMMIT)
├── .gitignore          # Git ignore file (includes .env)
├── package.json        # NPM configuration and scripts
└── README.md           # This file
```

## 🔐 Security Features

### Environment Variables Protection
- **`.env` file**: Stores sensitive Firebase keys securely
- **`.gitignore`**: Prevents accidental commit of sensitive data
- **Validation**: Automatic validation of Firebase configuration
- **Build-time replacement**: Environment variables replaced during production build

### Best Practices Implemented
- ✅ No hardcoded API keys in source code
- ✅ Environment-specific configurations
- ✅ Secure production builds
- ✅ Git ignore for sensitive files
- ✅ Configuration validation
- ✅ Error handling for missing credentials

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎨 Design Credits

- Neumorphic design inspired by modern UI trends
- Glassmorphic effects for a contemporary look
- Color palette optimized for accessibility and aesthetics

