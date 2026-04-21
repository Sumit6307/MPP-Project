const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../mpp.db');
const db = new Database(dbPath);

console.log('Dropping existing tables...');
db.exec(`
  DROP TABLE IF EXISTS matches;
  DROP TABLE IF EXISTS preferences;
  DROP TABLE IF EXISTS users;
`);

console.log('Creating fresh tables with correct primary keys...');

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wa_id TEXT UNIQUE,
    name TEXT,
    job_post TEXT,
    cur_district TEXT,
    cur_block TEXT,
    step INTEGER DEFAULT 1,
    language TEXT DEFAULT 'en',
    consent INTEGER DEFAULT 0,
    is_editing INTEGER DEFAULT 0,
    pref_dist_1 TEXT,
    pref_dist_2 TEXT,
    pref_dist_3 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE preferences (
    user_id INTEGER,
    district_name TEXT,
    priority INTEGER,
    PRIMARY KEY (user_id, priority),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE matches (
    user_a_id INTEGER,
    user_b_id INTEGER,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_a_id, user_b_id),
    FOREIGN KEY(user_a_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(user_b_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('✅ Database repaired successfully!');
db.close();
