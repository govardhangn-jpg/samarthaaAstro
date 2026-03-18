const https = require('https');

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: { type: 'api_error', message: 'ANTHROPIC_API_KEY not set in Netlify environment variables. Go to: Site settings → Environment variables → Add ANTHROPIC_API_KEY.' } }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    if (!body.model) body.model = 'claude-sonnet-4-20250514';
    if (!body.max_tokens) body.max_tokens = 800;

    // Use Node.js built-in https to avoid fetch compatibility issues
    const data = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      };
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
          catch (e) { reject(new Error('Invalid JSON from Anthropic: ' + body.slice(0, 200))); }
        });
      });
      req.on('error', reject);
      req.setTimeout(30000, () => { req.destroy(new Error('Request timeout')); });
      req.write(postData);
      req.end();
    });

    return {
      statusCode: data.status,
      headers: cors,
      body: JSON.stringify(data.data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: { type: 'server_error', message: err.message } }),
    };
  }
};
