const db = require('../src/db');
const { checkMatches } = require('../src/matchingEngine');

// Mock WhatsApp service so we don't send 50 messages during seeding
require.cache[require.resolve('../src/whatsappService')] = {
  exports: {
    sendText: async () => { return { success: true }; },
    sendButtons: async () => { return { success: true }; },
    sendList: async () => { return { success: true }; }
  }
};

async function seedData() {
  console.log('--- SEEDING 15 COMPREHENSIVE EDGE-CASE PROFILES ---');

  // Clean the database completely
  db.prepare('DELETE FROM matches').run();
  db.prepare('DELETE FROM preferences').run();
  db.prepare('DELETE FROM users').run();

  const LOCATION_DATA = {
    'Aligarh': ['Akrabad', 'Atrauli', 'Bijauli', 'Chandaus', 'Dhanipur', 'Gangiri', 'Gonda', 'Iglas', 'Jawan Sikanderpur', 'Khair', 'Lodha', 'Tappal'],
    'Bulandshahr': ['Agauta', 'Anupshahr', 'Araniya', 'Bhawan Bahadur Nagar', 'Bulandshahr', 'Danpur', 'Dibai', 'Gulaothi', 'Jahangirabad', 'Khurja', 'Lakhaothi', 'Pahasu', 'Shikarpur', 'Sikandrabad', 'Syana', 'Unchagaon'],
    'Gautam Buddha Nagar': ['Bisrakh', 'Dadri', 'Jewar'],
    'Hapur': ['Dhaulana', 'Garh Mukteshwar', 'Hapur', 'Simbhawali'],
    'Mathura': ['Baldeo', 'Chaumuha', 'Chhata', 'Farah', 'Govardhan', 'Mat', 'Mathura', 'Nandgaon', 'Nohjhil', 'Raya']
  };

  function insertUser(phone, name, job, curDist, p1, p2, p3) {
    const blocks = LOCATION_DATA[curDist] || ['Generic'];
    const randomBlock = blocks[Math.floor(Math.random() * blocks.length)];

    db.prepare(`
      INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent, pref_dist_1, pref_dist_2, pref_dist_3) 
      VALUES (?, ?, ?, ?, ?, 11, 1, ?, ?, ?)
    `).run(phone, name, job, curDist, randomBlock, p1 || null, p2 || null, p3 || null);
    
    const uId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(phone).id;
    
    if (p1) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(uId, p1);
    if (p2) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(uId, p2);
    if (p3) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 3)').run(uId, p3);
    
    return uId;
  }

  const ids = [];

  // -------------------------------------------------------------------------
  // TARGET PROFILE TO TEST AGAINST
  // If you create a profile on WhatsApp with:
  // Job: AT-Primary
  // Current: Mathura
  // Prefs: 1. Aligarh, 2. Agra, 3. Hapur
  // You will match with these specifically designed users!
  // -------------------------------------------------------------------------

  // GROUP 1: ALIGARH (Matches Your #1 Choice)
  // These should appear FIRST in your list, sorted by THEIR priority for you.
  ids.push(insertUser('910000000001', 'Rahul (Perfect #1)', 'AT-Primary', 'Aligarh', 'Mathura', 'Delhi', 'Pune')); 
  ids.push(insertUser('910000000002', 'Sneha (Also #1)', 'AT-Primary', 'Aligarh', 'Mathura', 'Noida', 'Agra')); 
  ids.push(insertUser('910000000003', 'Neha (Your #1, Their #2)', 'AT-Primary', 'Aligarh', 'Agra', 'Mathura', 'Delhi')); 
  ids.push(insertUser('910000000004', 'Sanjay (Your #1, Their #3)', 'AT-Primary', 'Aligarh', 'Hapur', 'Agra', 'Mathura')); 
  
  // EDGE CASE: One-way match (They are in Aligarh, but they don't want Mathura!)
  ids.push(insertUser('910000000005', 'Pooja (NO MATCH - One Way)', 'AT-Primary', 'Aligarh', 'Noida', 'Delhi', 'Hapur')); 
  
  // EDGE CASE: Job Mismatch
  ids.push(insertUser('910000000006', 'Vikram (NO MATCH - HM)', 'HM-Primary', 'Aligarh', 'Mathura', 'Delhi', 'Agra')); 

  // GROUP 2: AGRA (Matches Your #2 Choice)
  // These should appear AFTER Aligarh.
  ids.push(insertUser('910000000007', 'Amit (Your #2, Their #1)', 'AT-Primary', 'Agra', 'Mathura', 'Delhi', 'Pune')); 
  ids.push(insertUser('910000000008', 'Sunita (Your #2, Their #2)', 'AT-Primary', 'Agra', 'Delhi', 'Mathura', 'Pune')); 

  // GROUP 3: HAPUR (Matches Your #3 Choice)
  // These should appear LAST in your list.
  ids.push(insertUser('910000000009', 'Vijay (Your #3, Their #1)', 'AT-Primary', 'Hapur', 'Mathura', 'Delhi', 'Pune')); 
  ids.push(insertUser('910000000010', 'Kiran (Your #3, Their #3)', 'AT-Primary', 'Hapur', 'Delhi', 'Noida', 'Mathura')); 

  // -------------------------------------------------------------------------
  // GROUP 4: RANDOM NOISE DATA (Should never match you)
  // -------------------------------------------------------------------------
  ids.push(insertUser('910000000011', 'Rakesh (Noise)', 'AT-Primary', 'Noida', 'Delhi', 'Pune', 'Agra')); 
  ids.push(insertUser('910000000012', 'Suresh (Noise)', 'AT-Primary', 'Delhi', 'Noida', 'Agra', 'Pune')); 
  ids.push(insertUser('910000000013', 'Geeta (Noise HM)', 'HM-Primary', 'Bulandshahr', 'Aligarh', 'Agra', 'Noida')); 
  ids.push(insertUser('910000000014', 'Anil (Noise AT)', 'AT-Primary', 'Hapur', 'Agra', 'Delhi', 'Noida')); 
  
  // EDGE CASE: Empty Preferences (User only filled Pref 1 and skipped 2 & 3)
  ids.push(insertUser('910000000015', 'Kavita (Only 1 Pref)', 'AT-Primary', 'Gautam Buddha Nagar', 'Mathura', null, null)); 

  // Trigger matches for everyone to populate the matches table
  for (const id of ids) {
    await checkMatches(id);
  }

  console.log('✅ Successfully seeded 15 test users covering every edge case!');
  console.log('------------------------------------------------------------');
  console.log('TO TEST ALL PERMUTATIONS ON WHATSAPP:');
  console.log('1. Type START OVER on WhatsApp');
  console.log('2. Set Job Post to: AT-Primary');
  console.log('3. Set Current District to: Mathura');
  console.log('4. Set Pref 1 to: Aligarh');
  console.log('5. Set Pref 2 to: Agra');
  console.log('6. Set Pref 3 to: Hapur');
  console.log('7. After finishing, type VIEW MATCHES');
  console.log('------------------------------------------------------------');
  console.log('You should perfectly see 9 matches, sorted exactly by priority rules,');
  console.log('while ignoring the job mismatches, one-way matches, and noise data!');
}

seedData();
