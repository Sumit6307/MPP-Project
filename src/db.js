const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../mpp.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    wa_id TEXT UNIQUE,
    name TEXT,
    job_post TEXT,
    cur_district TEXT,
    cur_block TEXT,
    step INTEGER DEFAULT 1,
    language TEXT DEFAULT 'en',
    consent INTEGER DEFAULT 0, -- 0 for No, 1 for Yes
    is_editing INTEGER DEFAULT 0,
    pref_dist_1 TEXT,
    pref_dist_2 TEXT,
    pref_dist_3 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS preferences (
    user_id INTEGER,
    district_name TEXT,
    priority INTEGER,
    PRIMARY KEY (user_id, priority),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS matches (
    user_a_id INTEGER,
    user_b_id INTEGER,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_a_id, user_b_id)
  );
`);

console.log('Database initialized successfully.');

module.exports = db;
