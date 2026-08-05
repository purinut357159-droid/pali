const express = require('express');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/webhook', (req, res) => {
  res.status(200).send('Pali Tycoon LINE Webhook Server is Active & Live!');
});

// Main LINE Webhook Receiver Endpoint
app.post('/webhook', (req, res) => {
  console.log('Received LINE Webhook payload:', JSON.stringify(req.body, null, 2));

  const events = req.body.events || [];

  // Respond status 200 OK immediately to LINE Developers Console verification
  res.status(200).json({ status: 'ok', eventsCount: events.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Pali Tycoon LINE Webhook Server running on port ${PORT}`);
});
