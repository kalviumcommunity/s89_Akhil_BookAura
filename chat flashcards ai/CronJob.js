// keepAlive.js
const cron = require('node-cron');
const axios = require('axios');

const BACKEND_URL = 'https://s89-akhil-bookaura.onrender.com'; // replace with your actual Render backend URL

// Ping every 7 minutes to keep backend awake
cron.schedule('*/7 * * * *', async () => {
  try {
    const res = await axios.get(BACKEND_URL);
    console.log(`✅ Keep-alive ping successful: ${res.status}`);
  } catch (err) {
    console.error(`❌ Keep-alive ping failed: ${err.message}`);
  }
});
