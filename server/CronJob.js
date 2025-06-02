
const cron = require('node-cron');
const axios = require('axios');

const BACKEND_URL = 'https://s89-akhil-bookaura-3.onrender.com'; 


cron.schedule('*/7 * * * *', async () => {
  try {
    const res = await axios.get(BACKEND_URL);
    console.log(`✅ Keep-alive ping successful: ${res.status}`);
  } catch (err) {
    console.error(`❌ Keep-alive ping failed: ${err.message}`);
  }
});

console.log('Cron job started to keep the server awake every 7 minutes');

