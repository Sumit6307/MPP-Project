const db = require('./db');
const { sendText, sendButtons, sendList } = require('./whatsappService');
const { checkMatches } = require('./matchingEngine');

const DISTRICT_LIST = ['Lucknow', 'Aligarh', 'Kanpur', 'Varanasi', 'Agra', 'Meerut', 'Gorakhpur', 'Bareilly', 'Moradabad', 'Prayagraj'];

async function handleIncomingMessage(wa_id, message) {
  let user = db.prepare('SELECT * FROM users WHERE wa_id = ?').get(wa_id);

  if (!user) {
    db.prepare('INSERT INTO users (wa_id, step) VALUES (?, 1)').run(wa_id);
    user = db.prepare('SELECT * FROM users WHERE wa_id = ?').get(wa_id);
  }

  const msgText = message.text?.body?.toLowerCase() || '';
  const buttonId = message.interactive?.button_reply?.id;
  const listId = message.interactive?.list_reply?.id;

  if (msgText === 'start over') {
    db.prepare('UPDATE users SET step = 1, name = NULL, job_post = NULL, cur_district = NULL, cur_block = NULL, consent = 0 WHERE wa_id = ?').run(wa_id);
    db.prepare('DELETE FROM preferences WHERE user_id = ?').run(user.id);
    return sendFrame1(wa_id);
  }

  switch (user.step) {
    case 1: // Welcome & Start
      if (buttonId === 'start_onboarding') {
        db.prepare('UPDATE users SET step = 2 WHERE wa_id = ?').run(wa_id);
        return sendFrame2(wa_id);
      }
      return sendFrame1(wa_id);

    case 2: // Name
      db.prepare('UPDATE users SET name = ?, step = 3 WHERE wa_id = ?').run(message.text.body, wa_id);
      return sendFrame3(wa_id);

    case 3: // Job Post
      if (buttonId) {
        db.prepare('UPDATE users SET job_post = ?, step = 4 WHERE wa_id = ?').run(buttonId, wa_id);
        return sendFrame4(wa_id);
      }
      return sendFrame3(wa_id);

    case 4: // Current District
      if (listId) {
        db.prepare('UPDATE users SET cur_district = ?, step = 5 WHERE wa_id = ?').run(listId, wa_id);
        return sendFrame5(wa_id);
      }
      return sendFrame4(wa_id);

    case 5: // Current Block
      db.prepare('UPDATE users SET cur_block = ?, step = 7 WHERE wa_id = ?').run(message.text.body, wa_id); // Skipping School (Step 6) as per discussion
      return sendFrame7(wa_id);

    case 7: // Pref District 1
      if (listId) {
        db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(user.id, listId);
        db.prepare('UPDATE users SET step = 8 WHERE wa_id = ?').run(wa_id);
        return sendFrame8(wa_id);
      }
      return sendFrame7(wa_id);

    case 8: // Pref District 2
      if (buttonId === 'skip_pref_2') {
        db.prepare('UPDATE users SET step = 10 WHERE wa_id = ?').run(wa_id);
        return sendFrame10(wa_id);
      }
      if (listId) {
        db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(user.id, listId);
        db.prepare('UPDATE users SET step = 9 WHERE wa_id = ?').run(wa_id);
        return sendFrame9(wa_id);
      }
      return sendFrame8(wa_id);

    case 9: // Pref District 3
      if (buttonId === 'skip_pref_3') {
        db.prepare('UPDATE users SET step = 10 WHERE wa_id = ?').run(wa_id);
        return sendFrame10(wa_id);
      }
      if (listId) {
        db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 3)').run(user.id, listId);
        db.prepare('UPDATE users SET step = 10 WHERE wa_id = ?').run(wa_id);
        return sendFrame10(wa_id);
      }
      return sendFrame9(wa_id);

    case 10: // Consent
      if (buttonId === 'yes_agree') {
        db.prepare('UPDATE users SET consent = 1, step = 11 WHERE wa_id = ?').run(wa_id);
        await sendFrame11(wa_id, user.id);
        await checkMatches(user.id);
        return;
      } else if (buttonId === 'no_disagree') {
        return sendText(wa_id, "Registration cannot be completed without consent. Type START OVER if you change your mind.");
      }
      return sendFrame10(wa_id);

    default:
      return sendText(wa_id, "Welcome back! Type VIEW PROFILE or START OVER.");
  }
}

function sendFrame1(to) {
  return sendButtons(to, "Namaste 🙏 Welcome to MPP.\n\nMPP helps employees find candidates in your preferred districts for transfer!\n\nIt takes ~2-3 minutes to set up your profile.", [
    { id: 'start_onboarding', title: 'English' }
  ]);
}

function sendFrame2(to) {
  return sendText(to, "Step 1 of 9\n\nPlease enter your full name.");
}

function sendFrame3(to) {
  return sendButtons(to, "Step 2 of 9\n\nPlease select your job post / designation.", [
    { id: 'AT-Primary', title: 'AT-Primary' },
    { id: 'HM-Primary', title: 'HM-Primary' },
    { id: 'Junior', title: 'Junior' }
  ]);
}

function sendFrame4(to) {
  return sendList(to, "Step 3 of 9", "Select your current district.", "View Districts", [
    { title: "Districts", rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
  ]);
}

function sendFrame5(to) {
  return sendText(to, "Step 4 of 9\n\nEnter your current block.\n(Example: Khair)");
}

function sendFrame7(to) {
  return sendList(to, "Step 6 of 9", "Enter your 1st preferred district for transfer.", "View Districts", [
    { title: "Districts", rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
  ]);
}

function sendFrame8(to) {
  return sendList(to, "Step 7 of 9", "Enter your 2nd preferred district.\n\nOr click SKIP.", "View Districts", [
    { title: "Actions", rows: [{ id: 'skip_2', title: 'SKIP' }] },
    { title: "Districts", rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
  ]);
}

function sendFrame9(to) {
  return sendList(to, "Step 8 of 9", "Enter your 3rd preferred district.\n\nOr click SKIP.", "View Districts", [
    { title: "Actions", rows: [{ id: 'skip_3', title: 'SKIP' }] },
    { title: "Districts", rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
  ]);
}

function sendFrame10(to) {
  return sendButtons(to, "Step 9 of 9\n\nI consent to MPP storing and using my submitted information for profile creation and suggesting mutual transfer matches.", [
    { id: 'yes_agree', title: 'Yes, I agree' },
    { id: 'no_disagree', title: 'No' }
  ]);
}

async function sendFrame11(to, userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const prefs = db.prepare('SELECT district_name FROM preferences WHERE user_id = ? ORDER BY priority').all(userId);
  
  const summary = `✅ Profile created.\n\n*Summary:*\n• Name: ${user.name}\n• Job post: ${user.job_post}\n• Current posting: ${user.cur_district} / ${user.cur_block}\n• Preferred districts: ${prefs.map(p => p.district_name).join(', ')}\n\nWe’ll notify you when relevant matches are available.\n\nCommands: EDIT | START OVER`;
  
  await sendText(to, summary);
}

module.exports = { handleIncomingMessage };
