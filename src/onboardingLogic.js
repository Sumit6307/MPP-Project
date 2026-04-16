const db = require('./db');
const { sendText, sendButtons, sendList } = require('./whatsappService');
const { checkMatches } = require('./matchingEngine');

const DISTRICT_LIST = ['Lucknow', 'Aligarh', 'Kanpur', 'Varanasi', 'Agra'];

const MESSAGES = {
  en: {
    welcome: "Namaste 🙏 Welcome to MPP.\n\nMPP helps employees find candidates in your preferred districts for transfer!\n\nIt takes ~2-3 minutes to set up your profile.",
    lang_select: "Please select your language.",
    name: "Step 1 of 9\n\nPlease enter your full name.",
    job: "Step 2 of 9\n\nPlease select your job post / designation.",
    curr_dist: "Step 3 of 9\n\nSelect your current district.",
    curr_block: "Step 4 of 9\n\nEnter your current block.\n(Example: Khair)",
    pref_1: "Step 5 of 9\n\nEnter your 1st preferred district for transfer.",
    pref_2: "Step 6 of 9\n\nEnter your 2nd preferred district.\n\nOr click SKIP.",
    pref_3: "Step 7 of 9\n\nEnter your 3rd preferred district.\n\nOr click SKIP.",
    consent: "Step 8 of 9\n\nI consent to MPP storing and using my submitted information for profile creation and suggesting mutual transfer matches.",
    agree: "Yes, I agree",
    disagree: "No",
    skip: "SKIP",
    view_dist: "View Districts",
    dist_label: "Districts",
    opt_label: "Options",
    summary_head: "Step 9 of 9\n\n✅ Profile created.",
    match_found: "🤝 MATCH FOUND!",
    commands: "Commands: EDIT | START OVER"
  },
  hi: {
    welcome: "नमस्ते 🙏 MPP में आपका स्वागत है।\n\nMPP कर्मचारियों को उनके पसंदीदा जिलों में स्थानांतरण के लिए उम्मीदवार खोजने में मदद करता है!\n\nप्रोफ़ाइल बनाने में ~2-3 मिनट लगते हैं।",
    lang_select: "कृपया अपनी भाषा चुनें।",
    name: "चरण 1/9\n\nकृपया अपना पूरा नाम लिखें।",
    job: "चरण 2/9\n\nकृपया अपना पद / पदनाम चुनें।",
    curr_dist: "चरण 3/9\n\nअपना वर्तमान जिला चुनें।",
    curr_block: "चरण 4/9\n\nअपना वर्तमान ब्लॉक लिखें।\n(उदाहरण: खैर)",
    pref_1: "चरण 5/9\n\nस्थानांतरण के लिए अपना पहला पसंदीदा जिला चुनें।",
    pref_2: "चरण 6/9\n\nअपना दूसरा पसंदीदा जिला चुनें।\n\nया 'छोड़ें' (SKIP) पर क्लिक करें।",
    pref_3: "चरण 7/9\n\nअपना तीसरा पसंदीदा जिला चुनें।\n\nया 'छोड़ें' (SKIP) पर क्लिक करें।",
    consent: "चरण 8/9\n\nमैं MPP को प्रोफ़ाइल बनाने और स्थानांतरण हेतु जानकारी साझा करने की अनुमति देता हूँ।",
    agree: "हाँ, मैं सहमत हूँ",
    disagree: "नहीं",
    skip: "छोड़ें (SKIP)",
    view_dist: "जिले देखें",
    dist_label: "जिले",
    opt_label: "विकल्प",
    summary_head: "चरण 9/9\n\n✅ प्रोफाइल बन गई है।",
    match_found: "🤝 मैच मिल गया!",
    commands: "कमांड: EDIT | START OVER"
  }
};
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
    db.prepare('UPDATE users SET step = 1, name = NULL, job_post = NULL, cur_district = NULL, cur_block = NULL, consent = 0, language = \'en\' WHERE wa_id = ?').run(wa_id);
    db.prepare('DELETE FROM preferences WHERE user_id = ?').run(user.id);
    return sendFrame1(wa_id);
  }

  const lang = user.language || 'en';
  const textBody = message.text?.body || '';

  switch (user.step) {
    case 1: // Welcome & Language Selection
      if (buttonId === 'en' || buttonId === 'hi') {
        db.prepare('UPDATE users SET language = ?, step = 2 WHERE wa_id = ?').run(buttonId, wa_id);
        return sendFrame2(wa_id, buttonId);
      }
      return sendFrame1(wa_id);

    case 2: // Enter Name
      if (!textBody) return sendFrame2(wa_id, lang);
      db.prepare('UPDATE users SET name = ?, step = 3 WHERE wa_id = ?').run(textBody, wa_id);
      return sendFrame3(wa_id, lang);

    case 3: // Select Designation
      if (listId) {
        db.prepare('UPDATE users SET job_post = ?, step = 4 WHERE wa_id = ?').run(listId, wa_id);
        return sendFrame4(wa_id, lang);
      }
      return sendFrame3(wa_id, lang);

    case 4: // Select Current District
      if (listId) {
        db.prepare('UPDATE users SET cur_district = ?, step = 5 WHERE wa_id = ?').run(listId, wa_id);
        return sendFrame5(wa_id, lang);
      }
      return sendFrame4(wa_id, lang);

    case 5: // Enter Current Block
      if (!textBody) return sendFrame5(wa_id, lang);
      db.prepare('UPDATE users SET cur_block = ?, step = 7 WHERE wa_id = ?').run(textBody, wa_id);
      return sendFrame7(wa_id, lang);

    case 7: // Preferred District 1
      if (listId) {
        db.prepare('INSERT OR REPLACE INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(user.id, listId);
        db.prepare('UPDATE users SET step = 8 WHERE wa_id = ?').run(wa_id);
        return sendFrame8(wa_id, lang);
      }
      return sendFrame7(wa_id, lang);

    case 8: // Preferred District 2
      if (buttonId === 'skip_pref_2' || listId === 'skip_pref_2') {
        db.prepare('UPDATE users SET step = 10 WHERE wa_id = ?').run(wa_id);
        return sendFrame10(wa_id, lang);
      }
      if (listId) {
        db.prepare('INSERT OR REPLACE INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(user.id, listId);
        db.prepare('UPDATE users SET step = 9 WHERE wa_id = ?').run(wa_id);
        return sendFrame9(wa_id, lang);
      }
      return sendFrame8(wa_id, lang);

    case 9: // Preferred District 3
      if (buttonId === 'skip_pref_3' || listId === 'skip_pref_3') {
        db.prepare('UPDATE users SET step = 10 WHERE wa_id = ?').run(wa_id);
        return sendFrame10(wa_id, lang);
      }
      if (listId) {
        db.prepare('INSERT OR REPLACE INTO preferences (user_id, district_name, priority) VALUES (?, ?, 3)').run(user.id, listId);
        db.prepare('UPDATE users SET step = 10 WHERE wa_id = ?').run(wa_id);
        return sendFrame10(wa_id, lang);
      }
      return sendFrame9(wa_id, lang);

    case 10: // Consent & Confirmation
      if (buttonId === 'yes_agree') {
        db.prepare('UPDATE users SET consent = 1, step = 11 WHERE wa_id = ?').run(wa_id);
        await sendFrame11(wa_id, lang);
        await checkMatches(user.id);
        return;
      } else if (buttonId === 'no_disagree') {
        const msg = lang === 'hi' ? "सहमति के बिना पंजीकरण पूरा नहीं किया जा सकता। यदि आप विचार बदलते हैं तो START OVER टाइप करें।" : "Registration cannot be completed without consent. Type START OVER if you change your mind.";
        return sendText(wa_id, msg);
      }
      return sendFrame10(wa_id, lang);

    default:
      const defaultMsg = lang === 'hi' ? "नमस्ते! अपनी प्रोफ़ाइल देखने के लिए VIEW PROFILE लिखें या शुरू से शुरू करने के लिए START OVER टाइप करें।" : "Welcome back! Type VIEW PROFILE or START OVER.";
      return sendText(wa_id, defaultMsg);
  }
}

function sendFrame1(to) {
  return sendButtons(to, MESSAGES.en.welcome, [
    { id: 'en', title: 'English' },
    { id: 'hi', title: 'हिंदी (Hindi)' }
  ]);
}

function sendFrame2(to, lang) {
  return sendText(to, MESSAGES[lang].name);
}

function sendFrame3(to, lang) {
  const categories = [
    { id: 'AT-Primary', title: 'AT-Primary' },
    { id: 'HM-Primary', title: 'HM-Primary' },
    { id: 'AT-Upper', title: 'AT-Upper' },
    { id: 'HM-Upper', title: 'HM-Upper' }
  ];
  return sendList(to, null, MESSAGES[lang].job, "View Categories", [
    { title: "Designations", rows: categories }
  ]);
}

function sendFrame4(to, lang) {
  return sendList(to, null, MESSAGES[lang].curr_dist, MESSAGES[lang].view_dist, [
    { title: MESSAGES[lang].dist_label, rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
  ]);
}

function sendFrame5(to, lang) {
  return sendText(to, MESSAGES[lang].curr_block);
}

function sendFrame7(to, lang) {
  return sendList(to, null, MESSAGES[lang].pref_1, MESSAGES[lang].view_dist, [
    { title: MESSAGES[lang].dist_label, rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
  ]);
}

function sendFrame8(to, lang) {
  const rows = [
    { id: 'skip_pref_2', title: MESSAGES[lang].skip },
    ...DISTRICT_LIST.map(d => ({ id: d, title: d }))
  ];
  return sendList(to, null, MESSAGES[lang].pref_2, MESSAGES[lang].view_dist, [
    { title: MESSAGES[lang].opt_label, rows: rows }
  ]);
}

function sendFrame9(to, lang) {
  const rows = [
    { id: 'skip_pref_3', title: MESSAGES[lang].skip },
    ...DISTRICT_LIST.map(d => ({ id: d, title: d }))
  ];
  return sendList(to, null, MESSAGES[lang].pref_3, MESSAGES[lang].view_dist, [
    { title: MESSAGES[lang].opt_label, rows: rows }
  ]);
}

function sendFrame10(to, lang) {
  return sendButtons(to, MESSAGES[lang].consent, [
    { id: 'yes_agree', title: MESSAGES[lang].agree },
    { id: 'no_disagree', title: MESSAGES[lang].disagree }
  ]);
}

async function sendFrame11(to, lang) {
  const user = db.prepare('SELECT * FROM users WHERE wa_id = ?').get(to);
  if (!user) return;
  const prefs = db.prepare('SELECT district_name FROM preferences WHERE user_id = ? ORDER BY priority').all(user.id);
  
  // Check for existing matches to show a special badge
  const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches WHERE user_a_id = ? OR user_b_id = ?').get(user.id, user.id)?.count || 0;
  const matchBadge = matchCount > 0 ? `\n\n*${MESSAGES[lang].match_found} (${matchCount})*` : "";

  const labels = lang === 'hi' ? 
    { name: 'नाम', job: 'पद', posting: 'वर्तमान तैनाती', prefs: 'पसंदीदा जिले' } :
    { name: 'Name', job: 'Job post', posting: 'Current posting', prefs: 'Preferred districts' };

  const summary = `${MESSAGES[lang].summary_head}${matchBadge}\n\n*Summary:*\n• ${labels.name}: ${user.name}\n• ${labels.job}: ${user.job_post}\n• ${labels.posting}: ${user.cur_district} / ${user.cur_block}\n• ${labels.prefs}: ${prefs.map(p => p.district_name).join(', ')}\n\n${MESSAGES[lang].commands}`;
  
  console.log(`Sending Summary to ${to}...`);
  await sendText(to, summary);
}

module.exports = { handleIncomingMessage };
