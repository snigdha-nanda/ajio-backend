const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  try {
    // load the JSON spec from docs/openapi.json
    const specPath = path.join(__dirname, '..', 'docs', 'openapi.json');
    const raw = fs.readFileSync(specPath, 'utf-8');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      },
      body: raw
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not load API documentation.' })
    };
  }
};
