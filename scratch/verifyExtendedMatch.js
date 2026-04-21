const db = require('../src/db');
const { getUserMatches } = require('../src/matchingEngine');

require.cache[require.resolve('../src/whatsappService')] = {
  exports: {
    sendText: async (to, text) => { console.log(`[OUTBOUND TEXT]: ${text.substring(0, 50)}...`); return { success: true }; }
  }
};

async function test(wa_id, lang) {
  console.log(`\n--- VERIFYING EXTENDED MATCH DETAILS (${lang.toUpperCase()}) ---`);
  
  const user = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(wa_id);
  if (!user) {
    console.log('❌ USER NOT FOUND');
    process.exit(1);
  }
  const userId = user.id;

  const matchesText = await getUserMatches(userId, lang); 
  console.log(`Matches Output:\n${matchesText}`);

  const requiredFields = lang === 'hi' ? ['पद', 'पसंद'] : ['Post', 'Preference'];
  
  let passed = true;
  requiredFields.forEach(f => {
    if (!matchesText.includes(f)) {
      console.log(`❌ ${lang.toUpperCase()} Missing Field: ${f}`);
      passed = false;
    }
  });

  if (passed) {
    console.log(`✅ ${lang.toUpperCase()} EXTENDED DETAILS: SUCCESS`);
  } else {
    process.exit(1);
  }
}

async function main() {
  require('../src/forceSeedV2'); 
  await test('919999999999', 'en');
  await test('919999999999', 'hi');
  console.log('\n✨✨ EXTENDED MATCH VERIFICATION PASSED! ✨✨');
}

main();
