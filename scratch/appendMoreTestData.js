const db = require('../src/db');
const { checkMatches } = require('../src/matchingEngine');

require.cache[require.resolve('../src/whatsappService')] = {
  exports: {
    sendText: async () => { return { success: true }; },
    sendButtons: async () => { return { success: true }; },
    sendList: async () => { return { success: true }; }
  }
};

async function appendData() {
  console.log('--- APPENDING MORE EDGE CASES (PRESERVING EXISTING DATA) ---');

  const LOCATION_DATA = {
    'Aligarh': ['Akrabad', 'Atrauli', 'Bijauli', 'Chandaus', 'Dhanipur', 'Gangiri', 'Gonda', 'Iglas', 'Jawan Sikanderpur', 'Khair', 'Lodha', 'Tappal'],
    'Bulandshahr': ['Agauta', 'Anupshahr', 'Araniya', 'Bhawan Bahadur Nagar', 'Bulandshahr', 'Danpur', 'Dibai', 'Gulaothi', 'Jahangirabad', 'Khurja', 'Lakhaothi', 'Pahasu', 'Shikarpur', 'Sikandrabad', 'Syana', 'Unchagaon'],
    'Gautam Buddha Nagar': ['Bisrakh', 'Dadri', 'Jewar'],
    'Hapur': ['Dhaulana', 'Garh Mukteshwar', 'Hapur', 'Simbhawali'],
    'Mathura': ['Baldeo', 'Chaumuha', 'Chhata', 'Farah', 'Govardhan', 'Mat', 'Mathura', 'Nandgaon', 'Nohjhil', 'Raya']
  };

  function insertUser(phone, name, job, curDist, p1, p2, p3, consent = 1) {
    const blocks = LOCATION_DATA[curDist] || ['Generic'];
    const randomBlock = blocks[Math.floor(Math.random() * blocks.length)];

    db.prepare(`
      INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent, pref_dist_1, pref_dist_2, pref_dist_3) 
      VALUES (?, ?, ?, ?, ?, 11, ?, ?, ?, ?)
    `).run(phone, name, job, curDist, randomBlock, consent, p1 || null, p2 || null, p3 || null);
    
    const uId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(phone).id;
    
    if (p1) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(uId, p1);
    if (p2) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(uId, p2);
    if (p3) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 3)').run(uId, p3);
    
    return uId;
  }

  const newIds = [];

  // EDGE CASE: No Consent (Should NEVER match anyone, even if preferences align perfectly)
  newIds.push(insertUser('910000000091', 'Ghost User (No Consent)', 'AT-Primary', 'Aligarh', 'Mathura', 'Agra', 'Hapur', 0)); 

  // EDGE CASE: Upper Primary Jobs (Should never match with AT-Primary or HM-Primary)
  newIds.push(insertUser('910000000092', 'Teacher Upper', 'AT-Upper', 'Mathura', 'Aligarh', 'Agra', 'Hapur')); 
  newIds.push(insertUser('910000000093', 'Teacher Upper Match', 'AT-Upper', 'Aligarh', 'Mathura', null, null)); 

  // EDGE CASE: HM Upper Jobs
  newIds.push(insertUser('910000000094', 'Headmaster Upper', 'HM-Upper', 'Agra', 'Mathura', 'Hapur', null)); 
  newIds.push(insertUser('910000000095', 'Headmaster Upper Match', 'HM-Upper', 'Mathura', 'Agra', null, null)); 

  // EDGE CASE: Duplicate exact priorities (Testing how SQL handles identical ranks)
  newIds.push(insertUser('910000000096', 'Twin 1 (Same Priority)', 'AT-Primary', 'Aligarh', 'Mathura', 'Agra', 'Hapur')); 
  newIds.push(insertUser('910000000097', 'Twin 2 (Same Priority)', 'AT-Primary', 'Aligarh', 'Mathura', 'Agra', 'Hapur')); 

  // EDGE CASE: Single extreme fallback (Only wants Hapur as #3)
  newIds.push(insertUser('910000000098', 'Extreme Fallback', 'AT-Primary', 'Mathura', null, null, 'Hapur')); 

  // Trigger matches ONLY for the newly appended users
  for (const id of newIds) {
    await checkMatches(id);
  }

  console.log('✅ Successfully appended 8 new extreme edge-case users without deleting previous data!');
}

appendData();
