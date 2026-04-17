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
            wa_id: 'test_111', name: 'Sumit', job: 'AT-Upper', 
            cur_dist: 'Aligarh', cur_block: 'Khair', pref: 'Mathura' 
        },
        { 
            wa_id: 'test_222', name: 'Amit Singh', job: 'AT-Upper', 
            cur_dist: 'Mathura', cur_block: 'Raya', pref: 'Aligarh' 
        },
        { 
            wa_id: 'test_333', name: 'Neha Sharma', job: 'AT-Primary', 
            cur_dist: 'Gautam Buddha Nagar', cur_block: 'Jewar', pref: 'Hapur' 
        },
        { 
            wa_id: 'test_444', name: 'Vikram Verma', job: 'AT-Primary', 
            cur_dist: 'Hapur', cur_block: 'Simbhawali', pref: 'Gautam Buddha Nagar' 
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
    console.log("✅ SUCCESS: 4 Real Profiles Added!");
    console.log("1. Sumit (Aligarh -> Mathura)");
    console.log("2. Amit (Mathura -> Aligarh) [MUTUAL]");
    console.log("3. Neha (GB Nagar -> Hapur)");
    console.log("4. Vikram (Hapur -> GB Nagar) [MUTUAL]");
    console.log("\nNOW: Open DB Browser for SQLite and click REFRESH!");
    console.log("====================================================");

} catch (err) {
    db.prepare("PRAGMA foreign_keys = ON").run();
    console.error("\n❌ ERROR:", err.message);
}
