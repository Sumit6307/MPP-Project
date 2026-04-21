const db = require('../src/db');

function seedDemoData() {
  console.log('--- SEEDING CLIENT DEMO DATA ---');

  const demoUsers = [
    {
      wa_id: '918888000001',
      name: 'Anjali Sharma',
      job_post: 'AT-Primary',
      cur_district: 'Mathura',
      cur_block: 'Mat',
      lang: 'en',
      prefs: ['Hapur', 'Aligarh', 'Bulandshahr']
    },
    {
      wa_id: '918888000002',
      name: 'Vivek Kumar',
      job_post: 'AT-Primary',
      cur_district: 'Hapur',
      cur_block: 'Dhaulana',
      lang: 'hi',
      prefs: ['Mathura', 'Gautam Buddha Nagar', '']
    },
    {
      wa_id: '918888000003',
      name: 'Sunita Devi',
      job_post: 'HM-Primary',
      cur_district: 'Aligarh',
      cur_block: 'Iglas',
      lang: 'en',
      prefs: ['Bulandshahr', '', '']
    }
  ];

  demoUsers.forEach(u => {
    // Clean if exists
    db.prepare('DELETE FROM users WHERE wa_id = ?').run(u.wa_id);
    
    // Insert into main users table (including visual pref_dist columns)
    db.prepare(`
      INSERT INTO users (
        wa_id, name, job_post, cur_district, cur_block, step, language, consent, 
        pref_dist_1, pref_dist_2, pref_dist_3
      ) VALUES (?, ?, ?, ?, ?, 11, ?, 1, ?, ?, ?)
    `).run(
      u.wa_id, u.name, u.job_post, u.cur_district, u.cur_block, u.lang,
      u.prefs[0] || null, 
      u.prefs[1] || null, 
      u.prefs[2] || null
    );

    // Get the generated ID
    const user = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(u.wa_id);

    // Insert backend preferences into the separate logic table
    db.prepare('DELETE FROM preferences WHERE user_id = ?').run(user.id);
    u.prefs.forEach((dist, index) => {
      if (dist) {
        db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, ?)').run(user.id, dist, index + 1);
      }
    });

  });

  console.log('✅ Successfully seeded 3 dummy users for the client demo!');
  console.log('Open mpp.db and view the \"users\" table to see Anjali, Vivek, and Sunita with their full preference columns populated.');
}

seedDemoData();
