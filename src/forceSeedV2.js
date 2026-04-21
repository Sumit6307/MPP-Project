const db = require('./db');

function seed() {
  console.log('--- SEEDING PHASE 1 TEST DATA ---');
  
  // Clean target test user (Suo)
  const targetWaId = '919999999999';
  db.prepare('DELETE FROM users WHERE wa_id = ?').run(targetWaId);
  db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, language, consent) VALUES (?, ?, ?, ?, ?, 11, ?, 1)')
    .run(targetWaId, 'Suo', 'HM-Primary', 'Bulandshahr', 'Danpur', 'en');
  
  const userA = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(targetWaId);
  db.prepare('DELETE FROM preferences WHERE user_id = ?').run(userA.id);
  db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(userA.id, 'Hapur');
  db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(userA.id, 'Aligarh');

  // Create 3 Partners who match Suo
  const partners = [
    { name: 'Raj (Match 1)', wa: '911111111111', dist: 'Hapur', block: 'Garh', want: 'Bulandshahr' },
    { name: 'Amit (Match 2)', wa: '912222222222', dist: 'Aligarh', block: 'Khair', want: 'Bulandshahr' },
    { name: 'Vijay (Match 3)', wa: '913333333333', dist: 'Hapur', block: 'Simbhawali', want: 'Bulandshahr' }
  ];

  partners.forEach(p => {
    db.prepare('DELETE FROM users WHERE wa_id = ?').run(p.wa);
    db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, language, consent) VALUES (?, ?, ?, ?, ?, 11, ?, 1)')
      .run(p.wa, p.name, 'HM-Primary', p.dist, p.block, 'hi');
    
    const u = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(p.wa);
    db.prepare('DELETE FROM preferences WHERE user_id = ?').run(u.id);
    db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(u.id, p.want);

    // Record the match in matches table (simulating checkMatches)
    db.prepare('INSERT OR IGNORE INTO matches (user_a_id, user_b_id) VALUES (?, ?)').run(userA.id, u.id);
  });

  console.log('✅ Seeded 3 Mutual Matches for "Suo" (Hapur/Aligarh)');
}

seed();
