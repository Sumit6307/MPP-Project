const db = require('../src/db');
const { checkMatches } = require('../src/matchingEngine');

// Mock WhatsApp service
require.cache[require.resolve('../src/whatsappService')] = {
  exports: {
    sendText: async () => { return { success: true }; },
    sendButtons: async () => { return { success: true }; },
    sendList: async () => { return { success: true }; }
  }
};

const DISTRICT_LIST = ['Aligarh', 'Bulandshahr', 'Gautam Buddha Nagar', 'Hapur', 'Mathura'];
const LOCATION_DATA = {
  'Aligarh': ['Akrabad', 'Atrauli', 'Bijauli', 'Chandaus', 'Dhanipur', 'Gangiri', 'Gonda', 'Iglas', 'Jawan Sikanderpur', 'Khair', 'Lodha', 'Tappal'],
  'Bulandshahr': ['Agauta', 'Anupshahr', 'Araniya', 'Bhawan Bahadur Nagar', 'Bulandshahr', 'Danpur', 'Dibai', 'Gulaothi', 'Jahangirabad', 'Khurja', 'Lakhaothi', 'Pahasu', 'Shikarpur', 'Sikandrabad', 'Syana', 'Unchagaon'],
  'Gautam Buddha Nagar': ['Bisrakh', 'Dadri', 'Jewar'],
  'Hapur': ['Dhaulana', 'Garh Mukteshwar', 'Hapur', 'Simbhawali'],
  'Mathura': ['Baldeo', 'Chaumuha', 'Chhata', 'Farah', 'Govardhan', 'Mat', 'Mathura', 'Nandgaon', 'Nohjhil', 'Raya']
};
const JOBS = ['AT-Primary', 'HM-Primary', 'AT-Upper', 'HM-Upper'];

async function seedBulk100() {
  console.log('--- SEEDING 100 RANDOMIZED PERMUTATION PROFILES ---');

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const newIds = [];

  for (let i = 1; i <= 100; i++) {
    const wa_id = `919000000${String(i).padStart(3, '0')}`;
    const name = `Bulk User ${i}`;
    const job = getRandom(JOBS);
    const curDist = getRandom(DISTRICT_LIST);
    const blocks = LOCATION_DATA[curDist];
    const curBlock = getRandom(blocks);

    // Pick 1-3 preferences
    const numPrefs = Math.floor(Math.random() * 3) + 1;
    const shuffledDistricts = [...DISTRICT_LIST].sort(() => 0.5 - Math.random());
    const prefs = shuffledDistricts.filter(d => d !== curDist).slice(0, numPrefs);

    const p1 = prefs[0] || null;
    const p2 = prefs[1] || null;
    const p3 = prefs[2] || null;

    db.prepare(`
      INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent, pref_dist_1, pref_dist_2, pref_dist_3) 
      VALUES (?, ?, ?, ?, ?, 11, 1, ?, ?, ?)
    `).run(wa_id, name, job, curDist, curBlock, p1, p2, p3);
    
    const uId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(wa_id).id;
    newIds.push(uId);

    if (p1) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(uId, p1);
    if (p2) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(uId, p2);
    if (p3) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 3)').run(uId, p3);
  }

  console.log('✅ 100 Users Created. Now calculating matches (this may take a few seconds)...');

  // Trigger matches for all new users
  for (const id of newIds) {
    await checkMatches(id);
  }

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalMatches = db.prepare('SELECT COUNT(*) as count FROM matches').get().count;

  console.log(`✅ Bulk Seeding Complete!`);
  console.log(`Total Users in DB: ${totalUsers}`);
  console.log(`Total Matches Found: ${totalMatches}`);
}

seedBulk100();
