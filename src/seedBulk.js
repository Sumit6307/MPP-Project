const Database = require('better-sqlite3');
const db = new Database('mpp.db');

console.log("Adding 3 Detailed Profiles for testing...");

try {
    // 1. Temporarily disable foreign keys to allow complete cleanup
    db.prepare("PRAGMA foreign_keys = OFF").run();

    // 2. Clear existing data
    db.prepare("DELETE FROM matches").run();
    db.prepare("DELETE FROM preferences").run();
    db.prepare("DELETE FROM users WHERE wa_id LIKE 'test_%'").run();

    const testUsers = [
        { 
            wa_id: 'test_111', name: 'Amit Sharma', job: 'AT-Primary', 
            cur_dist: 'Lucknow', cur_block: 'Malihabad', pref: 'Kanpur' 
        },
        { 
            wa_id: 'test_222', name: 'Sonia Gupta', job: 'HM-Primary', 
            cur_dist: 'Varanasi', cur_block: 'Kashi', pref: 'Lucknow' 
        },
        { 
            wa_id: 'test_333', name: 'Vikram Singh', job: 'AT-Upper', 
            cur_dist: 'Agra', cur_block: 'Etmadpur', pref: 'Varanasi' 
        },
        { 
            wa_id: 'test_444', name: 'Neha Verma', job: 'AT-Primary', 
            cur_dist: 'Kanpur', cur_block: 'Kalyanpur', pref: 'Lucknow' 
        }
    ];

    testUsers.forEach(u => {
        const res = db.prepare(`
            INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent, language)
            VALUES (?, ?, ?, ?, ?, 11, 1, 'en')
        `).run(u.wa_id, u.name, u.job, u.cur_dist, u.cur_block);

        db.prepare(`
            INSERT INTO preferences (user_id, district_name, priority)
            VALUES (?, ?, 1)
        `).run(res.lastInsertRowid, u.pref);
    });

    // 3. Re-enable foreign keys
    db.prepare("PRAGMA foreign_keys = ON").run();

    console.log("====================================================");
    console.log("✅ SUCCESS: 3 Profiles Added!");
    console.log("1. Amit Sharma (Lucknow -> Kanpur)");
    console.log("2. Sonia Gupta (Varanasi -> Lucknow)");
    console.log("3. Vikram Singh (Agra -> Varanasi)");
    console.log("\nNOW: Open DB Browser for SQLite and click REFRESH!");
    console.log("====================================================");

} catch (err) {
    db.prepare("PRAGMA foreign_keys = ON").run();
    console.error("\n❌ ERROR:", err.message);
}
