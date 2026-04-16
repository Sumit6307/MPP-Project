require('dotenv').config();
const axios = require('axios');

const VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${VERSION}/${process.env.PHONE_NUMBER_ID}`;
const TOKEN = process.env.WHATSAPP_TOKEN;


async function sendText(to, text) {
  try {
    const response = await axios.post(`${BASE_URL}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text }
    }, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    return response.data;
  } catch (err) {
    console.error('Error sending text:', err.response?.data || err.message);
  }
}


async function sendButtons(to, bodyText, buttons) {
  try {
    const response = await axios.post(`${BASE_URL}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map((b, i) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title }
          }))
        }
      }
    }, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    return response.data;
  } catch (err) {
    console.error('Error sending buttons:', err.response?.data || err.message);
  }
}


async function sendList(to, headerText, bodyText, buttonText, sections) {
  try {
    const response = await axios.post(`${BASE_URL}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonText,
          sections: sections
        }
      }
    }, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    return response.data;
  } catch (err) {
    console.error('Error sending list:', err.response?.data || err.message);
  }
}

module.exports = { sendText, sendButtons, sendList };
