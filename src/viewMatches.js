const Database = require('better-sqlite3');
const db = new Database('mpp.db');

console.log("====================================================");
console.log("   MPP MUTUAL MATCHING REPORT");
console.log("====================================================\n");

// Fixed column names to match the actual database schema in src/db.js
const matches = db.prepare(`
  SELECT 
    m.matched_at,
    u1.name as user1_name, u1.wa_id as user1_phone, u1.cur_district as user1_dist,
    u2.name as user2_name, u2.wa_id as user2_phone, u2.cur_district as user2_dist
  FROM matches m
  JOIN users u1 ON m.user_a_id = u1.id
  JOIN users u2 ON m.user_b_id = u2.id
`).all();

if (matches.length === 0) {
  console.log("No mutual matches found in the database yet.");
} else {
  matches.forEach((m, i) => {
    console.log(`MATCH #${i+1} [${m.matched_at}]`);
    console.log(`🤝 ${m.user1_name} (${m.user1_phone}) in ${m.user1_dist}`);
    console.log(`   <---> `);
    console.log(`🤝 ${m.user2_name} (${m.user2_phone}) in ${m.user2_dist}`);
    console.log("----------------------------------------------------\n");
  });
}

console.log("Total Matches Found: " + matches.length);
console.log("====================================================");
