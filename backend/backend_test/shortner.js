const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Import your custom logging middleware
const loggingMiddleware = require('../loginmiddleware/loginmiddleware');
app.use(loggingMiddleware);

app.use(bodyParser.json());

// In-memory storage for URLs and stats
const urlMapping = {};

// Helper: generate random alphanumeric shortcode
function generateShortcode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Validate shortcode format
function isValidShortcode(code) {
  return /^[a-zA-Z0-9]{4,16}$/.test(code);
}

// Validate URL format
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Get current ISO timestamp
function getIsoNow() {
  return new Date().toISOString();
}

// Endpoint: Create short URL
app.post('/shorturls', (req, res) => {
  let { url, validity, shortcode } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Malformed input: Invalid or missing URL' });
  }

  validity = validity ? parseInt(validity, 10) : 30;
  if (isNaN(validity) || validity < 1 || validity > 43200) {
    return res.status(400).json({ error: 'Malformed input: Invalid validity' });
  }

  // Handle shortcode
  if (shortcode) {
    if (!isValidShortcode(shortcode)) {
      return res.status(400).json({ error: 'Invalid shortcode. Must be alphanumeric and length 4-16.' });
    }
    if (shortcode in urlMapping) {
      return res.status(409).json({ error: 'Shortcode collision. Please choose another.' });
    }
  } else {
    do {
      shortcode = generateShortcode(6);
    } while (shortcode in urlMapping);
  }

  const createdAt = getIsoNow();
  const expiryIso = new Date(Date.now() + validity * 60000).toISOString();

  urlMapping[shortcode] = {
    url,
    createdAt,
    expiresAt: expiryIso,
    clicks: []
  };

  const shortLink = `${req.protocol}://${req.headers.host}/${shortcode}`;
  res.status(201).json({
    shortLink,
    expiry: expiryIso
  });
});

// Endpoint: Redirect short URL and log click
app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const record = urlMapping[shortcode];
  if (!record) {
    return res.status(404).json({ error: 'Non-existent shortcode' });
  }

  if (new Date() > new Date(record.expiresAt)) {
    return res.status(410).json({ error: 'Expired link' });
  }

  // Record click
  record.clicks.push({
    timestamp: getIsoNow(),
    userAgent: req.headers['user-agent'] || '',
    referrer: req.headers['referer'] || ''
  });

  res.redirect(record.url);
});

// Endpoint: Retrieve short URL statistics
app.get('/shorturls/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const record = urlMapping[shortcode];
  if (!record) {
    return res.status(404).json({ error: 'Non-existent shortcode' });
  }

  res.json({
    shortcode,
    originalURL: record.url,
    createdAt: record.createdAt,
    expiry: record.expiresAt,
    clickCount: record.clicks.length,
    clicks: record.clicks
  });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Unexpected server error', details: err.message });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`URL Shortener running at http://localhost:${PORT}`);
});