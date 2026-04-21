const db = require('../src/db');
const { checkMatches, getUserMatches } = require('../src/matchingEngine');

async function verifySort() {
  console.log('--- STARTING SECONDARY SORT VERIFICATION ---');

  // Clean data
  db.prepare('DELETE FROM matches').run();
  db.prepare('DELETE FROM preferences').run();
  db.prepare('DELETE FROM users').run();

  // Primary User: Suo
  // Current: Mathura | Wants: Aligarh (#1)
  db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent) VALUES (?, ?, ?, ?, ?, 11, 1)')
    .run('919999999999', 'Suo', 'HM', 'Mathura', 'Mat');
  const suoId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get('919999999999').id;
  db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(suoId, 'Aligarh');

  // Competitor 1: Rahul (Wants Mathura as #3)
  db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent) VALUES (?, ?, ?, ?, ?, 11, 1)')
    .run('918888888883', 'Rahul (Rank 3)', 'HM', 'Aligarh', 'Khair');
  const rahulId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get('918888888883').id;
  db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 3)').run(rahulId, 'Mathura');

  // Competitor 2: Amit (Wants Mathura as #1)
  db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent) VALUES (?, ?, ?, ?, ?, 11, 1)')
    .run('918888888881', 'Amit (Rank 1)', 'HM', 'Aligarh', 'Iglas');
  const amitId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get('918888888881').id;
  db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 1)').run(amitId, 'Mathura');

  // Competitor 3: Vijay (Wants Mathura as #2)
  db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent) VALUES (?, ?, ?, ?, ?, 11, 1)')
    .run('918888888882', 'Vijay (Rank 2)', 'HM', 'Aligarh', 'Atrauli');
  const vijayId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get('918888888882').id;
  db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, 2)').run(vijayId, 'Mathura');

  // Trigger matches
  await checkMatches(suoId);

  // Validate sorting
  console.log('\\n[TEST EN] Match Display Output for Suo:');
  console.log(await getUserMatches(suoId, 'en'));
  
  console.log('\\n[TEST HI] Match Display Output for Suo:');
  console.log(await getUserMatches(suoId, 'hi'));

}

verifySort();
