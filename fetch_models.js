const https = require('https');
const fs = require('fs');

let apiKey = '';
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/EXPO_PUBLIC_GROQ_API_KEY=(.*)/);
if (match) apiKey = match[1].trim();

const body = JSON.stringify({
  model: 'qwen/qwen3.6-27b',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'describe' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' } }
    ]
  }]
});

const options = {
  hostname: 'api.groq.com',
  path: '/openai/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.write(body);
req.end();
