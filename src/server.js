require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { handleIncomingMessage } = require('./onboardingLogic');

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.get('/', (req, res) => {
  res.send('MPP Server is LIVE! Reachable via the tunnel.');
});

app.get('/webhook', (req, res) => {
  console.log('Incoming Webhook Verification Request...');
  console.log('Query:', req.query);

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      console.error('❌ VERIFICATION_FAILED: Token mismatch');
      console.log('Expected:', VERIFY_TOKEN);
      console.log('Received:', token);
      res.sendStatus(403);
    }
  } else {
    console.error('❌ VERIFICATION_FAILED: Missing mode or token');
    res.sendStatus(400);
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const message = body.entry[0].changes[0].value.messages[0];
      const wa_id = message.from;

      try {
        await handleIncomingMessage(wa_id, message);
      } catch (err) {
        console.error('Error handling message:', err);
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ SUCCESS: Server is running on port ${PORT}`);
  console.log(`🔗 Webhook URL: (Check your NEW ngrok URL) + /webhook`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ ERROR: Port ${PORT} is already in use.`);
    console.error(`Please stop any other running servers and try again.`);
  } else {
    console.error(`❌ ERROR: Failed to start server:`, err.message);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL ERROR (Uncaught):', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 CRITICAL ERROR (Unhandled Rejection):', reason);
  process.exit(1);
});
