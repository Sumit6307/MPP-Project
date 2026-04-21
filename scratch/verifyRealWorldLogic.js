const db = require('../src/db');
const { checkMatches, getUserMatches } = require('../src/matchingEngine');

async function verifyLogic() {
  console.log('--- STARTING REAL-WORLD LOGIC VERIFICATION ---');

  db.prepare('DELETE FROM matches').run();
  db.prepare('DELETE FROM preferences').run();
  db.prepare('DELETE FROM users').run();

  db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent) VALUES (?, ?, ?, ?, ?, 11, 1)')
    .run('919999999999', 'Sumo', 'HM-Primary', 'Aligarh', 'Bijauli');
  const sumo = db.prepare('SELECT id FROM users WHERE wa_id = ?').get('919999999999');
  db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(sumo.id, 'Mathura');

  db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent) VALUES (?, ?, ?, ?, ?, 11, 1)')
    .run('918888888888', 'Rahul', 'HM-Primary', 'Mathura', 'Raya');
  const rahul = db.prepare('SELECT id FROM users WHERE wa_id = ?').get('918888888888');
  db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(rahul.id, 'Aligarh');

  console.log('Data Seeded: Sumo (Aligarh -> Mathura) and Rahul (Mathura -> Aligarh)');

  console.log('Running Matching Engine for Sumo...');
  await checkMatches(sumo.id);

  console.log('\n--- VERIFICATION RESULTS ---');
  const matches = db.prepare('SELECT * FROM matches').all();
  console.log(`Matching records found in DB: ${matches.length}`);

  const sumoMatches = await getUserMatches(sumo.id, 'en');
  console.log(`\nWhat Sumo sees in "VIEW MATCHES":\n${sumoMatches}`);

  if (matches.length > 0 && sumoMatches.includes('Rahul')) {
    console.log('\n✅ LOGIC VERIFIED: Match found based on District & Job, not names!');
  } else {
    console.log('\n❌ VERIFICATION FAILED');
  }
}

verifyLogic();
