
const cron = require('node-cron');
const axios = require('axios');

const BACKEND_URL = 'https://s89-akhil-bookaura-3.onrender.com';
const HEALTH_ENDPOINT = `${BACKEND_URL}/health`; // Use the health check endpoint

cron.schedule('*/7 * * * *', async () => {
  try {
    console.log(`🔄 Sending keep-alive ping to: ${HEALTH_ENDPOINT}`);
    const res = await axios.get(HEALTH_ENDPOINT, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'BookAura-KeepAlive-CronJob'
      }
    });
    console.log(`✅ Keep-alive ping successful: ${res.status} - ${res.data?.message || 'OK'}`);
  } catch (err) {
    console.error(`❌ Keep-alive ping to /health failed: ${err.message}`);

    // Try fallback to root endpoint
    try {
      console.log(`🔄 Trying fallback ping to root: ${BACKEND_URL}`);
      const fallbackRes = await axios.get(BACKEND_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'BookAura-KeepAlive-CronJob-Fallback'
        }
      });
      console.log(`✅ Fallback ping successful: ${fallbackRes.status} - ${fallbackRes.data?.message || 'OK'}`);
    } catch (fallbackErr) {
      console.error(`❌ Fallback ping also failed: ${fallbackErr.message}`);
      if (fallbackErr.response) {
        console.error(`   Response status: ${fallbackErr.response.status}`);
        console.error(`   Response data: ${JSON.stringify(fallbackErr.response.data)}`);
      }
    }
  }
});

console.log('Cron job started to keep the server awake every 7 minutes');
console.log(`📍 Ping target: ${HEALTH_ENDPOINT}`);

