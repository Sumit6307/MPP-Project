const db = require('../src/db');

async function runAnalytics() {
  console.log('--- CLIENT ANALYTICS REQUEST ---');
  
  // 1. SEED SPECIFIC DATA FOR THIS QUERY
  console.log('Seeding data: Users currently in Gautam Buddha Nagar who want Mathura...');
  
  // Clean DB for clear analytics
  db.prepare('DELETE FROM matches').run();
  db.prepare('DELETE FROM preferences').run();
  db.prepare('DELETE FROM users').run();

  function insertUser(phone, name, job, curDist, p1, p2, p3) {
    db.prepare(`
      INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent, pref_dist_1, pref_dist_2, pref_dist_3) 
      VALUES (?, ?, ?, ?, 'TestBlock', 11, 1, ?, ?, ?)
    `).run(phone, name, job, curDist, p1 || null, p2 || null, p3 || null);
    
    const uId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(phone).id;
    if (p1) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(uId, p1);
    if (p2) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(uId, p2);
    if (p3) db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 3)').run(uId, p3);
  }

  // Priority 1
  insertUser('910000000101', 'Ankit (Priority 1)', 'AT-Primary', 'Gautam Buddha Nagar', 'Mathura', 'Delhi', 'Agra');
  insertUser('910000000102', 'Priya (Priority 1)', 'HM-Primary', 'Gautam Buddha Nagar', 'Mathura', 'Aligarh', 'Hapur');

  // Priority 2
  insertUser('910000000103', 'Rohan (Priority 2)', 'AT-Primary', 'Gautam Buddha Nagar', 'Delhi', 'Mathura', 'Agra');

  // Priority 3
  insertUser('910000000104', 'Simran (Priority 3)', 'AT-Primary', 'Gautam Buddha Nagar', 'Aligarh', 'Hapur', 'Mathura');

  // NOISE: Not in Gautam Buddha Nagar (Should not appear)
  insertUser('910000000105', 'Noise (Wrong District)', 'AT-Primary', 'Aligarh', 'Mathura', 'Delhi', 'Agra');
  
  // NOISE: In Gautam Buddha Nagar but doesn't want Mathura (Should not appear)
  insertUser('910000000106', 'Noise (Wrong Pref)', 'AT-Primary', 'Gautam Buddha Nagar', 'Aligarh', 'Delhi', 'Agra');


  // 2. THE SQL QUERY THE CLIENT ASKED FOR
  console.log('\n--- RUNNING SQL QUERY ---');
  
  const query = `
    SELECT 
      u.name, 
      u.wa_id as phone, 
      u.job_post, 
      p.priority as mathura_priority 
    FROM users u
    JOIN preferences p ON u.id = p.user_id
    WHERE u.cur_district = 'Gautam Buddha Nagar' 
    AND p.district_name = 'Mathura'
    ORDER BY p.priority ASC;
  `;

  console.log('Query String:');
  console.log(query);

  const results = db.prepare(query).all();
  
  console.log('\n--- ANALYTICS RESULT ---');
  console.table(results);
}

runAnalytics();
