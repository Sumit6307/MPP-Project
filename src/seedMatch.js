const Database = require('better-sqlite3');
const db = new Database('mpp.db');

console.log("Adding Test Data for Matching...");

const fakeUserWaId = "919999999999"; 

// 1. Forceful cleanup
try {
  const usersToDelete = db.prepare("SELECT id FROM users WHERE wa_id = ?").all(fakeUserWaId);
  console.log(`Cleaning up ${usersToDelete.length} existing test records...`);
  
  for (const user of usersToDelete) {
    db.prepare("DELETE FROM matches WHERE user_a_id = ? OR user_b_id = ?").run(user.id, user.id);
    db.prepare("DELETE FROM preferences WHERE user_id = ?").run(user.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  }
} catch (e) {
  console.log("Note: Cleanup encountered an issue, proceeding with Force Insert...");
}

// 2. Force Insert (INSERT OR REPLACE)
// This will replace the user if the wa_id already exists!
const result = db.prepare(`
  INSERT OR REPLACE INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent)
  VALUES (?, 'Raj Kumar', 'HM-Primary', 'Varanasi', 'Sadara', 11, 1)
`).run(fakeUserWaId);

const newUserId = result.lastInsertRowid;

// 3. Set Raj's preference (Using OR REPLACE here too)
db.prepare(`
  INSERT OR REPLACE INTO preferences (user_id, district_name, priority)
  VALUES (?, 'Lucknow', 1)
`).run(newUserId);

console.log("====================================================");
console.log("✅ SUCCESS: Fake User 'Raj' is now in the Database!");
console.log("Scenario Created:");
console.log("   • Name: Raj Kumar");
console.log("   • Current: Varanasi");
console.log("   • Wants: Lucknow");
console.log("\nNOW: Go to WhatsApp and register as Su IN LUCKNOW");
console.log("and select VARANASI as your preference.");
console.log("====================================================");
