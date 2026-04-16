const Database = require('better-sqlite3');
const db = new Database('mpp.db');

console.log("====================================================");
console.log("   MPP FORCE TEST DATA SEEDER (v3)");
console.log("====================================================\n");

const fakeUserWaId = "919999999999"; 

try {
    // 1. Temporarily disable foreign keys to allow complete cleanup
    db.prepare("PRAGMA foreign_keys = OFF").run();
    console.log(">>> DATABASE UNLOCKED.");

    // 2. Wipe ALL old test data
    console.log(">>> CLEANING UP ALL TEST RECORDS...");
    db.prepare("DELETE FROM matches WHERE user_a_id IN (SELECT id FROM users WHERE wa_id = ?)").run(fakeUserWaId);
    db.prepare("DELETE FROM matches WHERE user_b_id IN (SELECT id FROM users WHERE wa_id = ?)").run(fakeUserWaId);
    db.prepare("DELETE FROM preferences WHERE user_id IN (SELECT id FROM users WHERE wa_id = ?)").run(fakeUserWaId);
    db.prepare("DELETE FROM users WHERE wa_id = ?").run(fakeUserWaId);

    // 3. Insert fresh 'Raj'
    console.log(">>> INSERTING FAKE PARTNER 'RAJ'...");
    const result = db.prepare(`
        INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent)
        VALUES (?, 'Raj Kumar', 'HM-Primary', 'Varanasi', 'Sadara', 11, 1)
    `).run(fakeUserWaId);

    const newUserId = result.lastInsertRowid;

    db.prepare(`
        INSERT INTO preferences (user_id, district_name, priority)
        VALUES (?, 'Lucknow', 1)
    `).run(newUserId);

    // 4. Re-enable foreign keys
    db.prepare("PRAGMA foreign_keys = ON").run();
    console.log(">>> DATABASE LOCKED & SECURED.");

    console.log("\n====================================================");
    console.log("✅ SUCCESS: 'Raj' is now waiting for you in Varanasi!");
    console.log("====================================================");
    console.log("NOW: Go to WhatsApp and register as Su in LUCKNOW");
    console.log("and select VARANASI as your preference.");
    console.log("====================================================");

} catch (err) {
    db.prepare("PRAGMA foreign_keys = ON").run();
    console.error("\n❌ ERROR:", err.message);
}
