const express = require('express');
const dotenv = require('dotenv');
const app = express();
dotenv.config();

app.use(express.static('public')); // your HTML/CSS/JS files in /public

// endpoint to serve config
app.get('/config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    window.firebaseConfig = {
      apiKey: "${process.env.FIREBASE_API_KEY}",
      authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
      databaseURL: "${process.env.FIREBASE_DATABASE_URL}",
      projectId: "${process.env.FIREBASE_PROJECT_ID}",
      storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
      messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
      appId: "${process.env.FIREBASE_APP_ID}"
    };
  `);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
