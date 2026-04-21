const db = require('../src/db');
const { checkMatches, getUserMatches } = require('../src/matchingEngine');

// Mock WhatsApp to avoid crash
require.cache[require.resolve('../src/whatsappService')] = {
  exports: {
    sendText: async () => { return { success: true }; },
    sendButtons: async () => { return { success: true }; },
    sendList: async () => { return { success: true }; }
  }
};

async function testPermutations() {
  console.log('--- EXHAUSTIVE LOGIC & PERMUTATION TEST ---');

  // Full Database Clean
  db.prepare('DELETE FROM matches').run();
  db.prepare('DELETE FROM preferences').run();
  db.prepare('DELETE FROM users').run();

  function insertUser(wa_id, name, curDist, prefs) {
    db.prepare('INSERT INTO users (wa_id, name, job_post, cur_district, cur_block, step, consent) VALUES (?, ?, ?, ?, ?, 11, 1)')
      .run(wa_id, name, 'AT', curDist, 'BlockA');
    const uId = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(wa_id).id;
    prefs.forEach((p, idx) => {
      db.prepare('INSERT INTO preferences (user_id, district_name, priority) VALUES (?, ?, ?)')
        .run(uId, p, idx + 1);
    });
    return uId;
  }

  // Primary Subject
  const suoId = insertUser('919999999999', 'Primary User', 'Mathura', ['Aligarh', 'Agra', 'Noida']);

  // Edge Case 1: Perfect #1 to #1 match
  const p1 = insertUser('911111111111', 'Partner A (#1 for #1)', 'Aligarh', ['Mathura', 'Delhi', 'Pune']);

  // Edge Case 2: My #1, Their #3
  const p2 = insertUser('912222222222', 'Partner B (#1 for #3)', 'Aligarh', ['Delhi', 'Pune', 'Mathura']);

  // Edge Case 3: My #2, Their #2
  const p3 = insertUser('913333333333', 'Partner C (#2 for #2)', 'Agra', ['Delhi', 'Mathura', 'Pune']);

  // Edge Case 4: My #3, Their #1
  const p4 = insertUser('914444444444', 'Partner D (#3 for #1)', 'Noida', ['Mathura', 'Delhi', 'Pune']);

  // Edge Case 5: Same as Case 1, different person to verify secondary sorting
  const p5 = insertUser('915555555555', 'Partner E (#1 for #2)', 'Aligarh', ['Delhi', 'Mathura', 'Pune']);

  // Trigger cross-matching
  for (let uId of [suoId, p1, p2, p3, p4, p5]) {
    await checkMatches(uId);
  }

  // Display Output
  console.log('\n--- VERIFYING RESULTS FOR PRIMARY USER (MATHURA) ---');
  console.log('Should show: 5 matches total, properly sorted by My Choice (Aligarh=1, Agra=2, Noida=3) AND Their Choice (1, 2, 3)');
  
  const result = await getUserMatches(suoId, 'en');
  console.log('\\n' + result);

  if (result.includes('Partner A') && result.includes('Partner B') && result.includes('Partner C') && result.includes('Partner D') && result.includes('Partner E')) {
    console.log('✅ ALL PERMUTATIONS DISCOVERED SUCCESSFULLY!');
    
    // Sort verification checks based on textual position in output string
    const posA = result.indexOf('Partner A'); // Aligarh (#1), Mathura (#1)
    const posE = result.indexOf('Partner E'); // Aligarh (#1), Mathura (#2)
    const posB = result.indexOf('Partner B'); // Aligarh (#1), Mathura (#3)
    const posC = result.indexOf('Partner C'); // Agra (#2), Mathura (#2)
    const posD = result.indexOf('Partner D'); // Noida (#3), Mathura (#1)

    if (posA < posE && posE < posB && posB < posC && posC < posD) {
      console.log('✅ SECONDARY SORTING LAYER IS MATHEMATICALLY PERFECT!');
    } else {
      console.log('❌ SECONDARY SORTING FAILED ORDER.');
    }
  } else {
    console.log('❌ MISSING A PERMUTATION MATCH.');
  }
}

testPermutations();
