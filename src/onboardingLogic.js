const db = require('./db');
const { sendText, sendButtons, sendList } = require('./whatsappService');
const { checkMatches, getUserMatches } = require('./matchingEngine');

const DISTRICT_LIST = ['Aligarh', 'Bulandshahr', 'Gautam Buddha Nagar', 'Hapur', 'Mathura'];

const LOCATION_DATA = {
  'Aligarh': ['Akrabad', 'Atrauli', 'Bijauli', 'Chandaus', 'Dhanipur', 'Gangiri', 'Gonda', 'Iglas', 'Jawan Sikanderpur', 'Khair', 'Lodha', 'Tappal'],
  'Bulandshahr': ['Agauta', 'Anupshahr', 'Araniya', 'Bhawan Bahadur Nagar', 'Bulandshahr', 'Danpur', 'Dibai', 'Gulaothi', 'Jahangirabad', 'Khurja', 'Lakhaothi', 'Pahasu', 'Shikarpur', 'Sikandrabad', 'Syana', 'Unchagaon'],
  'Gautam Buddha Nagar': ['Bisrakh', 'Dadri', 'Jewar'],
  'Hapur': ['Dhaulana', 'Garh Mukteshwar', 'Hapur', 'Simbhawali'],
  'Mathura': ['Baldeo', 'Chaumuha', 'Chhata', 'Farah', 'Govardhan', 'Mat', 'Mathura', 'Nandgaon', 'Nohjhil', 'Raya']
};

const MESSAGES = {
  en: {
    welcome: "Namaste 🙏 Welcome to MPP.\n\nMPP helps employees find candidates in your preferred districts for transfer!\n\nIt takes ~2-3 minutes to set up your profile.",
    lang_select: "Please select your language.",
    name: "Step 1 of 9\n\nPlease enter your full name.",
    job: "Step 2 of 9\n\nPlease select your job post / designation.",
    curr_dist: "Step 3 of 9\n\nSelect your current district.",
    curr_block: "Step 4 of 9\n\nEnter your current block.\n(Example: Khair)",
    pref_1: "Step 5 of 9\n\nEnter your 1st preferred district for transfer.",
    pref_2: "Step 6 of 9\n\nWould you like to add a 2nd preferred district for transfer?",
    pref_3: "Step 7 of 9\n\nWould you like to add a 3rd preferred district for transfer?",
    add_dist: "Select District",
    consent: "Step 8 of 9\n\nI consent to MPP storing and using my submitted information for profile creation and suggesting mutual transfer matches.",
    agree: "Yes, I agree",
    disagree: "No",
    skip: "SKIP",
    view_dist: "View Districts",
    dist_label: "Districts",
    opt_label: "Options",
    summary_head: "Step 9 of 9\n\n✅ Profile created.",
    match_found: "🤝 MATCH FOUND!",
    commands: "Commands: EDIT | START OVER",
    view_blocks: "View Blocks",
    block_label: "Blocks",
    see_more: "See More Blocks...",
    back: "Go Back",
    none_selected: "None selected"
  },
  hi: {
    welcome: "नमस्ते 🙏 MPP में आपका स्वागत है।\n\nMPP कर्मचारियों को उनके पसंदीदा जिलों में स्थानांतरण के लिए उम्मीदवार खोजने में मदद करता है!\n\nप्रोफ़ाइल बनाने में ~2-3 मिनट लगते हैं।",
    lang_select: "कृपया अपनी भाषा चुनें।",
    name: "चरण 1/9\n\nकृपया अपना पूरा नाम लिखें।",
    job: "चरण 2/9\n\nकृपया अपना पद / पदनाम चुनें।",
    curr_dist: "चरण 3/9\n\nअपना वर्तमान जिला चुनें।",
    curr_block: "चरण 4/9\n\nअपना वर्तमान ब्लॉक चुनें।",
    pref_1: "चरण 5/9\n\nस्थानांतरण के लिए अपना पहला पसंदीदा जिला चुनें।",
    pref_2: "चरण 6/9\n\nक्या आप स्थानांतरण के लिए दूसरा पसंदीदा जिला जोड़ना चाहते हैं?",
    pref_3: "चरण 7/9\n\nक्या आप स्थानांतरण के लिए तीसरा पसंदीदा जिला जोड़ना चाहते हैं?",
    add_dist: "जिला चुनें",
    consent: "चरण 8/9\n\nमैं MPP को प्रोफ़ाइल बनाने और स्थानांतरण हेतु जानकारी साझा करने की अनुमति देता हूँ।",
    agree: "हाँ, मैं सहमत हूँ",
    disagree: "नहीं",
    skip: "छोड़ें (SKIP)",
    view_dist: "जिले देखें",
    dist_label: "जिले",
    opt_label: "विकल्प",
    summary_head: "चरण 9/9\n\n✅ प्रोफाइल बन गई है।",
    match_found: "🤝 मैच मिल गया!",
    commands: "कमांड: EDIT | START OVER",
    view_blocks: "ब्लॉक देखें",
    block_label: "ब्लॉक",
    see_more: "अगले ब्लॉक देखें...",
    back: "पीछे जाएं",
    none_selected: "कोई नहीं"
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

  if (msgText === 'start over' || buttonId === 'start_over') {
    db.prepare('UPDATE users SET step = 1, name = NULL, job_post = NULL, cur_district = NULL, cur_block = NULL, consent = 0, language = \'en\' WHERE wa_id = ?').run(wa_id);
    db.prepare('DELETE FROM preferences WHERE user_id = ?').run(user.id);
    return sendFrame1(wa_id);
  }

  if (msgText === 'edit' || buttonId === 'edit') {
    db.prepare('UPDATE users SET step = 1 WHERE wa_id = ?').run(wa_id);
    const msg = user.language === 'hi' ? "प्रोफ़ाइल संपादन शुरू हो गया है। कृपया अपने विवरण फिर से दर्ज करें।" : "Profile editing started. Please re-enter your details.";
    await sendText(wa_id, msg);
    return sendFrame1(wa_id);
  }

  if (buttonId === 'view_matches') {
    const matchesText = await getUserMatches(user.id, user.language);
    return sendText(wa_id, matchesText);
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
        return sendFrame5(wa_id, lang, listId, 0);
      }
      return sendFrame4(wa_id, lang);

    case 5: // Select Current Block
      if (listId) {
        if (listId.startsWith('more_blocks_')) {
          const page = parseInt(listId.split('_')[2]);
          return sendFrame5(wa_id, lang, user.cur_district, page);
        }
        db.prepare('UPDATE users SET cur_block = ?, step = 7 WHERE wa_id = ?').run(listId, wa_id);
        return sendFrame7(wa_id, lang);
      }
      return sendFrame5(wa_id, lang, user.cur_district, 0);

    case 7: // Preferred District 1
      if (listId) {
        db.prepare('INSERT OR REPLACE INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(user.id, listId);
        db.prepare('UPDATE users SET step = 8 WHERE wa_id = ?').run(wa_id);
        return sendFrame8(wa_id, lang);
      }
      return sendFrame7(wa_id, lang);

    case 8: // Preferred District 2 (Ask/Select)
      if (buttonId === 'skip_pref_2') {
        db.prepare('UPDATE users SET step = 9 WHERE wa_id = ?').run(wa_id);
        return sendFrame9(wa_id, lang);
      }
      if (buttonId === 'select_pref_2') {
        return sendFrame8b(wa_id, lang);
      }
      if (listId) {
        db.prepare('INSERT OR REPLACE INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(user.id, listId);
        db.prepare('UPDATE users SET step = 9 WHERE wa_id = ?').run(wa_id);
        return sendFrame9(wa_id, lang);
      }
      return sendFrame8(wa_id, lang);

    case 9: // Preferred District 3 (Ask/Select)
      if (buttonId === 'skip_pref_3') {
        db.prepare('UPDATE users SET step = 10 WHERE wa_id = ?').run(wa_id);
        return sendFrame10(wa_id, lang);
      }
      if (buttonId === 'select_pref_3') {
        return sendFrame9b(wa_id, lang);
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

function sendFrame5(to, lang, district, page = 0) {
  const blocks = LOCATION_DATA[district] || [];
  const pageSize = 9;
  const start = page * pageSize;
  const end = start + pageSize;
  const slice = blocks.slice(start, end);
  
  const rows = slice.map(b => ({ id: b, title: b }));
  
  if (blocks.length > end) {
    rows.push({ id: `more_blocks_${page + 1}`, title: MESSAGES[lang].see_more });
  }
  
  if (page > 0) {
    rows.unshift({ id: `more_blocks_${page - 1}`, title: MESSAGES[lang].back });
  }

  return sendList(to, null, MESSAGES[lang].curr_block, MESSAGES[lang].view_blocks, [
    { title: MESSAGES[lang].block_label, rows: rows }
  ]);
}

function sendFrame7(to, lang) {
  return sendList(to, null, MESSAGES[lang].pref_1, MESSAGES[lang].view_dist, [
    { title: MESSAGES[lang].dist_label, rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
  ]);
}

function sendFrame8(to, lang) {
  return sendButtons(to, MESSAGES[lang].pref_2, [
    { id: 'select_pref_2', title: MESSAGES[lang].add_dist },
    { id: 'skip_pref_2', title: MESSAGES[lang].skip }
  ]);
}

function sendFrame8b(to, lang) {
  return sendList(to, null, MESSAGES[lang].pref_2, MESSAGES[lang].view_dist, [
    { title: MESSAGES[lang].dist_label, rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
  ]);
}

function sendFrame9(to, lang) {
  return sendButtons(to, MESSAGES[lang].pref_3, [
    { id: 'select_pref_3', title: MESSAGES[lang].add_dist },
    { id: 'skip_pref_3', title: MESSAGES[lang].skip }
  ]);
}

function sendFrame9b(to, lang) {
  return sendList(to, null, MESSAGES[lang].pref_3, MESSAGES[lang].view_dist, [
    { title: MESSAGES[lang].dist_label, rows: DISTRICT_LIST.map(d => ({ id: d, title: d })) }
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

  const prefsFormatted = prefs.length > 0 ? prefs.map(p => p.district_name).join(', ') : MESSAGES[lang].none_selected;

  const summaryTitle = lang === 'hi' ? 'विवरण' : 'Summary';
  const summary = `${MESSAGES[lang].summary_head}${matchBadge}\n\n*${summaryTitle}:*\n• ${labels.name}: ${user.name}\n• ${labels.job}: ${user.job_post}\n• ${labels.posting}: ${user.cur_district} / ${user.cur_block}\n• ${labels.prefs}: ${prefsFormatted}`;
  
  console.log(`Sending Dashboard to ${to}...`);
  const labelsDashboard = lang === 'hi' ?
    { edit: 'संशोधन करें (EDIT)', start: 'शुरू करें', matches: 'मैच देखें' } :
    { edit: 'EDIT', start: 'START OVER', matches: 'VIEW MATCHES' };

  await sendButtons(to, summary, [
    { id: 'edit', title: labelsDashboard.edit },
    { id: 'start_over', title: labelsDashboard.start },
    { id: 'view_matches', title: labelsDashboard.matches }
  ]);
}

module.exports = { handleIncomingMessage };
